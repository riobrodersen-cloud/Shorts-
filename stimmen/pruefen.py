#!/usr/bin/env python3
"""Automatische Qualitätsprüfung für erzeugte Stimmen ("Ohren" für Claude).

Pro Audiodatei (oder pro Skriptzeile, wenn eine Zeitmarken-.json daneben liegt):
  - Natürlichkeit: UTMOS22 (MOS-Schätzung 1–5, trainiert auf Hörtests; >4 sehr natürlich, <3 roboterhaft)
  - Verständlichkeit: Whisper transkribiert, Wortfehlerrate (WER) gegen den Solltext
  - Technik: Länge, Pegel, Übersteuerung
  - optional Spektrogramm als PNG (--spektrogramm), z. B. um Brummen/Metallklang zu sehen

Aufruf:
  stimmen.sh pruefen out/stimmproben/*.mp3 --text "Hallo! So klinge ich ..."
  stimmen.sh pruefen out/voiceover.mp3            # nutzt out/voiceover.json (Skript-Zeitmarken)
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np

# Normaler HTTP-Download statt Xet-Protokoll (cas-server.xethub.hf.co ist im Netzwerk nicht freigegeben)
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")

MODELL_DIR = Path(__file__).resolve().parent / "modelle"
UTMOS_URL = "https://huggingface.co/TigreGotico/utmos-onnx/resolve/main/utmos22_strong.onnx"
SR = 16000


def audio_laden(pfad: str) -> np.ndarray:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", pfad, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


class Utmos:
    def __init__(self):
        datei = MODELL_DIR / "utmos22_strong.onnx"
        if not datei.exists():
            print("  lade UTMOS-Modell (411 MB, einmalig) ...", file=sys.stderr)
            datei.parent.mkdir(parents=True, exist_ok=True)
            urllib.request.urlretrieve(UTMOS_URL, datei.with_suffix(".part"))
            datei.with_suffix(".part").rename(datei)
        import onnxruntime as ort
        self.s = ort.InferenceSession(str(datei), providers=["CPUExecutionProvider"])

    def __call__(self, wav: np.ndarray) -> float:
        return float(self.s.run(None, {"wave": wav[None, :].astype(np.float32)})[0][0])


class Ohr:
    def __init__(self, modell: str, sprache: str):
        from faster_whisper import WhisperModel
        self.m = WhisperModel(modell, device="cpu", compute_type="int8", download_root=str(MODELL_DIR / "whisper"))
        self.sprache = sprache

    def __call__(self, wav: np.ndarray) -> str:
        segs, _ = self.m.transcribe(wav, language=self.sprache, beam_size=5, vad_filter=False)
        return " ".join(s.text.strip() for s in segs).strip()


def woerter(t: str) -> list[str]:
    return re.findall(r"[\wäöüß]+", t.lower().replace("-", ""))  # "Standard-Erzähler" == "Standarderzähler"


def wer(soll: str, ist: str) -> float:
    a, b = woerter(soll), woerter(ist)
    d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(b) + 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] != b[j - 1]))
    return d[len(b)] / max(len(a), 1)


def stimmhoehe(w: np.ndarray) -> float | None:
    """Median-Grundton (Hz) per Autokorrelation – grobes Maß für tief/hoch (Männer ~85–155, Frauen ~165–255)."""
    rahmen, schritt, lo, hi = int(0.04 * SR), int(0.01 * SR), SR // 400, SR // 60
    pegel = np.sqrt(np.mean(w ** 2)) if len(w) else 0
    werte = []
    for i in range(0, len(w) - rahmen, schritt):
        x = w[i:i + rahmen] - w[i:i + rahmen].mean()
        if np.sqrt(np.mean(x ** 2)) < 0.5 * pegel:
            continue
        ac = np.correlate(x, x, "full")[rahmen - 1:]
        if ac[0] <= 0:
            continue
        lag = lo + int(np.argmax(ac[lo:hi]))
        if ac[lag] / ac[0] > 0.5:
            werte.append(SR / lag)
    return float(np.median(werte)) if len(werte) > 10 else None


def klanghelligkeit(w: np.ndarray) -> float:
    """Spektraler Schwerpunkt (Hz) bis 8 kHz – höher = heller/klarer, niedriger = dunkler/dumpfer."""
    spek = np.abs(np.fft.rfft(w * np.hanning(len(w)))) if len(w) else np.zeros(2)
    f = np.fft.rfftfreq(len(w), 1 / SR) if len(w) else np.zeros(2)
    return float((f * spek).sum() / max(spek.sum(), 1e-9))


def urteil(mos: float, w: float | None) -> str:
    if w is not None and w > 0.25:
        return "SCHLECHT verständlich"
    if mos >= 4.0:
        return "sehr natürlich"
    if mos >= 3.5:
        return "gut"
    if mos >= 3.0:
        return "okay, leicht synthetisch"
    return "roboterhaft"


def spektrogramm(pfad: str, ziel: Path) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pfad, "-lavfi",
                    "showspectrumpic=s=1200x400:legend=1:fscale=lin:color=intensity", str(ziel)], check=True)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("dateien", nargs="+")
    p.add_argument("--text", help="Solltext (für die Verständlichkeitsprüfung)")
    p.add_argument("--sprache", default="de")
    p.add_argument("--whisper", default="small", help="tiny|base|small|medium (größer = genauer, langsamer)")
    p.add_argument("--ohne-whisper", action="store_true", help="nur Natürlichkeit messen (schneller)")
    p.add_argument("--spektrogramm", action="store_true", help="PNG neben jede Datei legen")
    p.add_argument("--json", help="Ergebnisse zusätzlich als JSON speichern")
    a = p.parse_args()

    utmos = Utmos()
    ohr = None if a.ohne_whisper else Ohr(a.whisper, a.sprache)
    ergebnisse = []

    for datei in a.dateien:
        wav = audio_laden(datei)
        marken = Path(datei).with_suffix(".json")
        teile = []
        if marken.exists() and not a.text:
            for z in json.loads(marken.read_text())["zeilen"]:
                teile.append((f"{Path(datei).name}#{z['id']} ({z['stimme']}{'/' + str(z['sprecher']) if z.get('sprecher') is not None else ''})",
                              wav[int(z["start"] * SR):int(z["ende"] * SR)], z["text"]))
        else:
            teile.append((Path(datei).name, wav, a.text))

        for name, w, soll in teile:
            r = {"name": name, "dauer": round(len(w) / SR, 2), "mos": round(utmos(w), 2),
                 "spitze_db": round(float(20 * np.log10(max(np.abs(w).max(), 1e-9))), 1),
                 "pegel_db": round(float(20 * np.log10(max(np.sqrt(np.mean(w ** 2)), 1e-9))), 1),
                 "stimmhoehe_hz": (lambda f: round(f) if f else None)(stimmhoehe(w)),
                 "helligkeit_hz": round(klanghelligkeit(w))}
            if ohr:
                r["gehoert"] = ohr(w)
                if soll:
                    r["wer"] = round(wer(soll, r["gehoert"]), 2)
            r["urteil"] = urteil(r["mos"], r.get("wer"))
            if r["spitze_db"] > -0.1:
                r["urteil"] += ", übersteuert"
            ergebnisse.append(r)
            wer_txt = f"  WER {r['wer']:.0%}" if "wer" in r else ""
            hoehe = f"{r['stimmhoehe_hz']} Hz" if r["stimmhoehe_hz"] else "?"
            print(f"{r['mos']:4.2f}  {r['urteil']:<26}{wer_txt:<10} Höhe {hoehe:<7} Hell {r['helligkeit_hz']:>4} Hz  {r['name']}")
            if ohr:
                print(f"      gehört: {r['gehoert']}")
        if a.spektrogramm:
            spektrogramm(datei, Path(datei).with_suffix(".spektrogramm.png"))

    if len(ergebnisse) > 1:
        print("\nRangliste (Natürlichkeit):")
        for r in sorted(ergebnisse, key=lambda r: -r["mos"]):
            print(f"  {r['mos']:4.2f}  {r['name']}")
    if a.json:
        Path(a.json).write_text(json.dumps(ergebnisse, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
