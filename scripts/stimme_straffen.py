"""Setzt die Erzählstimme neu zusammen: einzelne Zeilen ersetzen, Tempo leicht anheben, Pausen kürzen.
Ausnahmen (langsame Kernsätze, Stille-Moment) bleiben unverändert. Schreibt voiceover.mp3/.json neu
und legt das Original als voiceover_roh.* ab.
Aufruf: python3 scripts/stimme_straffen.py <skript.json> <ordner_mit_voiceover> [id=datei.wav ...]"""
import json, shutil, subprocess, sys, wave
from pathlib import Path
import numpy as np

SR = 24000
TEMPO = 1.0
PAUSE_FAKTOR = 1.25
LANGSAM = {"hoe1", "hoe2"}  # Höhepunkt: Tempo bleibt
FESTE_PAUSE = {"p3e": 1.5, "hoe1": 0.6, "hoe2": 1.0, "tr6": 1.9}  # Stille vor/nach dem Höhepunkt bleibt spürbar

skript = json.load(open(sys.argv[1]))
ordner = Path(sys.argv[2])
ersatz = dict(a.split("=", 1) for a in sys.argv[3:])
roh_mp3, roh_json = ordner / "voiceover_roh.mp3", ordner / "voiceover_roh.json"
if not roh_mp3.exists():
    shutil.copy(ordner / "voiceover.mp3", roh_mp3)
    shutil.copy(ordner / "voiceover.json", roh_json)
marken = json.load(open(roh_json))

def lade(pfad, tempo=1.0, start=None, ende=None):
    cmd = ["ffmpeg", "-v", "error"]
    if start is not None:
        cmd += ["-ss", f"{start:.3f}", "-to", f"{ende:.3f}"]
    cmd += ["-i", str(pfad), "-ac", "1", "-ar", str(SR)]
    if abs(tempo - 1) > 1e-3:
        cmd += ["-af", f"atempo={tempo}"]
    cmd += ["-f", "s16le", "-"]
    return np.frombuffer(subprocess.run(cmd, check=True, capture_output=True).stdout, dtype=np.int16)

def leise_raender(x, schwelle=300):
    idx = np.where(np.abs(x) > schwelle)[0]
    if len(idx) == 0: return x
    a = max(0, idx[0] - int(0.03 * SR)); b = min(len(x), idx[-1] + int(0.08 * SR))
    return x[a:b]

pausen = {z["id"]: z.get("pause", skript["pause"]) for z in skript["zeilen"]}
teile, neue_marken, t = [], [], 0.0
for m in marken["zeilen"]:
    tempo = 1.0 if m["id"] in LANGSAM else TEMPO
    if m["id"] in ersatz:
        x = lade(ersatz[m["id"]], tempo)
    else:
        x = lade(roh_mp3, tempo, m["start"], m["ende"])
    x = leise_raender(x)
    # weiche Blenden gegen Klicks
    f = min(len(x) // 4, int(0.01 * SR))
    x = x.astype(np.float32); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    d = len(x) / SR
    neue_marken.append({**m, "start": round(t, 3), "ende": round(t + d, 3)})
    p = FESTE_PAUSE.get(m["id"], max(0.18, pausen[m["id"]] * PAUSE_FAKTOR))
    teile += [x, np.zeros(int(p * SR), np.float32)]
    t += d + p

pcm = np.concatenate(teile).clip(-32767, 32767).astype(np.int16)
tmp = ordner / "voiceover_tmp.wav"
with wave.open(str(tmp), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
# Lautheit auf YouTube-Niveau für Sprache (ca. -16 LUFS)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(tmp), "-af", "loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "44100", "-b:a", "192k", str(ordner / "voiceover.mp3")], check=True)
tmp.unlink()
json.dump({"dauer": round(t, 3), "zeilen": neue_marken}, open(ordner / "voiceover.json", "w"), ensure_ascii=False, indent=2)
print("neue Dauer", round(t, 1), "s")
