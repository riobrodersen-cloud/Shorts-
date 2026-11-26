#!/usr/bin/env python3
"""Kostenlose KI-Stimmen (offline auf der CPU) – ohne ElevenLabs-Credits.

Drei Systeme, Stimme wird mit Präfix gewählt:
  qwen:Ryan              Qwen3-TTS (Apache-2.0) – am natürlichsten, langsam (~5x Echtzeit)
  figur:erzaehler        eigene Qwen-Figur (aus stimmen/figuren/, immer gleiche Stimme)
  pocket:vera            Kyutai Pocket TTS (CC-BY-4.0) – sehr natürlich, schnell (~2x Echtzeit), 25 Stimmen
  de_DE-thorsten-high    Piper (MIT) – schnell, aber roboterhaft

Befehle:
  liste   [--sprache de]                         Stimmen anzeigen
  sprich  "Text" -s STIMME [-a ANWEISUNG] -o out.wav|.mp3
  skript  skript.json -o out.wav|.mp3            mehrere Zeilen/Stimmen -> eine Audiodatei + Zeitmarken (.json)
  figur   NAME -b "Beschreibung der Stimme"      neue feste Figurenstimme entwerfen (Qwen VoiceDesign)
  proben  [--sprache de] [-o ordner]             Hörproben der Piper-Stimmen
  pruefen DATEI...                               Qualitätsprüfung (siehe pruefen.py)
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile
import urllib.request
import wave
from pathlib import Path

HIER = Path(__file__).resolve().parent
ROOT = HIER.parent
BASIS_URL = "https://huggingface.co/rhasspy/piper-voices/resolve/main/"
MODELL_DIR = Path(os.environ.get("STIMMEN_MODELLE", HIER / "modelle"))
FIGUREN_DIR = HIER / "figuren"
VENVS = ROOT / ".venvs"
TORCH_CPU = "https://download.pytorch.org/whl/cpu"
ZIEL_RATE = 44100  # Ausgabe-Samplerate (Video-Standard)
PROBE_TEXT = {
    "de": "Hallo! So klinge ich. Diese Stimme ist kostenlos und läuft komplett offline.",
    "en": "Hello! This is how I sound. This voice is free and runs completely offline.",
}
FIGUR_TEXT = ("Hallo, schön, dass du da bist. Heute erzähle ich dir eine spannende Geschichte, "
              "und ich verspreche dir, am Ende wirst du staunen.")

QWEN_SPRECHER = {  # Qwen3-TTS CustomVoice; jede Stimme spricht alle 10 Sprachen
    "Ryan": "männlich, dynamisch, rhythmisch (Englisch nativ)",
    "Aiden": "männlich, sonnig, klare Mitten (Englisch nativ)",
    "Serena": "weiblich, warm, sanft (Chinesisch nativ)",
    "Vivian": "weiblich, hell, etwas kantig (Chinesisch nativ)",
    "Uncle_Fu": "männlich, älter, tief und weich (Chinesisch nativ)",
    "Dylan": "männlich, jung, klar (Peking-Dialekt nativ)",
    "Eric": "männlich, lebhaft (Sichuan-Dialekt nativ)",
    "Ono_Anna": "weiblich, verspielt, leicht (Japanisch nativ)",
    "Sohee": "weiblich, warm, emotional (Koreanisch nativ)",
}
# Ohne "cosette" (Expresso) und "jean" (EARS): deren Aufnahmen sind nur nicht-kommerziell lizenziert.
POCKET_STIMMEN = ["alba", "anna", "azelma", "bill_boerst", "caro_davy", "charles", "daan", "eponine",
                  "estelle", "eve", "fantine", "george", "giovanni", "jane", "javert", "juergen", "lola",
                  "marius", "mary", "michael", "paul", "peter_yearsley", "rafael", "stuart_bell", "vera"]
POCKET_SPRACHE = {"de": "german_24l", "en": "english", "fr": "french_24l", "es": "spanish_24l",
                  "it": "italian_24l", "pt": "portuguese_24l", "nl": "dutch_24l"}


# ---------------------------------------------------------------- Hilfen

def laden(url: str, ziel: Path) -> None:
    ziel.parent.mkdir(parents=True, exist_ok=True)
    tmp = ziel.with_suffix(ziel.suffix + ".part")
    print(f"  lade {url.removeprefix(BASIS_URL)} ...", file=sys.stderr)
    with urllib.request.urlopen(url, timeout=120) as r, open(tmp, "wb") as f:
        while block := r.read(1 << 20):
            f.write(block)
    tmp.rename(ziel)


def zu_pcm(datei: str, tempo: float = 1.0) -> bytes:
    """Beliebige Audiodatei -> 16-bit-Mono-PCM mit ZIEL_RATE (optional Tempo ändern, Tonhöhe bleibt)."""
    filt = ["-af", f"atempo={tempo}"] if abs(tempo - 1.0) > 1e-3 else []
    return subprocess.run(["ffmpeg", "-v", "error", "-i", datei, *filt, "-ac", "1", "-ar", str(ZIEL_RATE),
                           "-f", "s16le", "-"], check=True, capture_output=True).stdout


def speichern(pcm: bytes, ziel: str) -> None:
    Path(ziel).parent.mkdir(parents=True, exist_ok=True)
    if ziel.lower().endswith(".wav"):
        with wave.open(ziel, "wb") as w:
            w.setnchannels(1), w.setsampwidth(2), w.setframerate(ZIEL_RATE)
            w.writeframes(pcm)
    else:  # mp3, m4a, ... per FFmpeg
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(ZIEL_RATE), "-ac", "1", "-i", "-",
                        *(["-b:a", "192k"] if ziel.lower().endswith((".mp3", ".m4a", ".aac")) else []), ziel],
                       input=pcm, check=True)
    print(f"-> {ziel} ({len(pcm) / 2 / ZIEL_RATE:.2f}s)", file=sys.stderr)


def stille(sek: float) -> bytes:
    return b"\x00\x00" * int(sek * ZIEL_RATE)


def venv_python(name: str) -> str:
    """Python der eigenen Umgebung für qwen/pocket; legt sie beim ersten Gebrauch an."""
    py = VENVS / name / "bin" / "python"
    if not py.exists():
        print(f"Richte {name} ein (einmalig, einige Minuten) ...", file=sys.stderr)
        subprocess.run([sys.executable, "-m", "venv", str(VENVS / name)], check=True)
        subprocess.run([str(py), "-m", "pip", "install", "-q", "--disable-pip-version-check", "--extra-index-url",
                        TORCH_CPU, "-r", str(HIER / "engines" / f"requirements-{name}.txt")], check=True)
    return str(py)


def worker(system: str, auftraege: list[dict]) -> None:
    """Startet den Worker eines Systems; zeigt nur Fortschrittszeilen, bei Fehlern die volle Ausgabe."""
    proc = subprocess.Popen([venv_python(system), str(HIER / "engines" / f"{system}_worker.py")],
                            stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    proc.stdin.write(json.dumps(auftraege))
    proc.stdin.close()
    log = []
    for zeile in proc.stderr:
        log.append(zeile)
        if zeile.startswith(f"    {system}/"):
            print(zeile, end="", file=sys.stderr)
    if proc.wait() != 0:
        sys.exit("".join(log[-40:]) + f"\n{system}-Worker fehlgeschlagen (Code {proc.returncode}).")


# ---------------------------------------------------------------- Piper

def katalog() -> dict:
    datei = MODELL_DIR / "voices.json"
    if not datei.exists():
        laden(BASIS_URL + "voices.json", datei)
    return json.loads(datei.read_text())


def piper_laden(key: str, _cache: dict = {}):
    if key in _cache:
        return _cache[key]
    kat = katalog()
    if key not in kat:
        treffer = [k for k in kat if key.lower() in k.lower()]
        sys.exit(f"Unbekannte Stimme '{key}'." + (f" Meintest du: {', '.join(treffer[:8])}?" if treffer else
                 " Siehe: stimmen liste"))
    for pfad in kat[key]["files"]:
        if pfad.endswith((".onnx", ".onnx.json")):
            ziel = MODELL_DIR / Path(pfad).name
            if not ziel.exists():
                laden(BASIS_URL + pfad, ziel)
    from piper import PiperVoice
    v = PiperVoice.load(str(MODELL_DIR / f"{key}.onnx"))
    _cache[key] = (v, kat[key])
    return _cache[key]


def sprecher_id(info: dict, sprecher) -> int | None:
    if sprecher is None or sprecher == "":
        return None
    mapping = info.get("speaker_id_map") or {}
    # Zahl (in JSON) = Index 0..n-1; Text = Sprechername (z. B. "angry" oder MLS-Kennung "2422")
    if not isinstance(sprecher, int) and str(sprecher) in mapping:
        return mapping[str(sprecher)]
    try:
        sid = int(sprecher)
    except ValueError:
        sys.exit(f"Sprecher '{sprecher}' gibt es bei {info['key']} nicht. Möglich: {', '.join(list(mapping)[:20])}")
    if sid >= info["num_speakers"]:
        sys.exit(f"{info['key']} hat nur {info['num_speakers']} Sprecher (0..{info['num_speakers'] - 1}).")
    return sid


def piper_pcm(z: dict) -> bytes:
    from piper import SynthesisConfig
    voice, info = piper_laden(z["stimme"])
    cfg = SynthesisConfig(speaker_id=sprecher_id(info, z.get("sprecher")), length_scale=1.0 / z.get("tempo", 1.0))
    with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
        with wave.open(tmp.name, "wb") as w:
            voice.synthesize_wav(z["text"], w, syn_config=cfg)
        return zu_pcm(tmp.name)


# ---------------------------------------------------------------- Stimmen auflösen und erzeugen

def auftrag(z: dict, ausgabe: str) -> tuple[str, dict]:
    """Zeile -> (system, worker-auftrag)."""
    stimme, sprache = z["stimme"], z.get("sprache", "de")
    if stimme.startswith("qwen:"):
        name = stimme.split(":", 1)[1]
        passend = {k.lower(): k for k in QWEN_SPRECHER}
        if name.lower() not in passend:
            sys.exit(f"Qwen-Sprecher '{name}' gibt es nicht. Möglich: {', '.join(QWEN_SPRECHER)}")
        return "qwen", {"modus": "sprecher", "sprecher": passend[name.lower()], "anweisung": z.get("anweisung"),
                        "text": z["text"], "sprache": sprache, "ausgabe": ausgabe}
    if stimme.startswith("figur:"):
        name = stimme.split(":", 1)[1]
        ref = FIGUREN_DIR / f"{name}.wav"
        if not ref.exists():
            vorhanden = ", ".join(p.stem for p in FIGUREN_DIR.glob("*.wav")) or "keine"
            sys.exit(f"Figur '{name}' gibt es nicht (vorhanden: {vorhanden}). Anlegen mit: stimmen figur {name} -b '...'")
        info = json.loads(ref.with_suffix(".json").read_text())
        return "qwen", {"modus": "figur", "referenz": str(ref), "referenz_text": info["text"],
                        "text": z["text"], "sprache": sprache, "ausgabe": ausgabe}
    if stimme.startswith(("pocket:", "pocket-schnell:")):
        art, name = stimme.split(":", 1)
        if name not in POCKET_STIMMEN:
            sys.exit(f"Pocket-Stimme '{name}' gibt es nicht. Möglich: {', '.join(POCKET_STIMMEN)}")
        psprache = POCKET_SPRACHE.get(sprache, sprache)
        if art == "pocket-schnell":
            psprache = psprache.removesuffix("_24l")
        return "pocket", {"stimme": name, "sprache": psprache, "text": z["text"], "ausgabe": ausgabe}
    return "piper", {}


def erzeugen(zeilen: list[dict]) -> list[bytes]:
    """Alle Zeilen erzeugen (pro System ein Durchlauf, damit jedes Modell nur einmal geladen wird)."""
    ergebnis: list[bytes | None] = [None] * len(zeilen)
    with tempfile.TemporaryDirectory() as tmp:
        gruppen: dict[str, list[tuple[int, dict]]] = {}
        for i, z in enumerate(zeilen):
            system, a = auftrag(z, f"{tmp}/{i}.wav")
            gruppen.setdefault(system, []).append((i, a))
        for system, liste in gruppen.items():
            print(f"  {system}: {len(liste)} Zeile(n)", file=sys.stderr)
            if system == "piper":
                for i, _ in liste:
                    ergebnis[i] = piper_pcm(zeilen[i])
                continue
            worker(system, [a for _, a in liste])
            for i, a in liste:
                ergebnis[i] = zu_pcm(a["ausgabe"], zeilen[i].get("tempo", 1.0))
    return ergebnis  # type: ignore[return-value]


# ---------------------------------------------------------------- Befehle

def cmd_liste(a):
    print("== Qwen3-TTS (am natürlichsten, langsam) – Stimme 'qwen:NAME', optional Anweisung -a")
    for k, v in QWEN_SPRECHER.items():
        print(f"  qwen:{k:<38} {v}")
    figuren = sorted(FIGUREN_DIR.glob("*.json"))
    print("\n== Eigene Figuren (Qwen, feste Stimme) – Stimme 'figur:NAME'")
    for f in figuren:
        print(f"  figur:{f.stem:<37} {json.loads(f.read_text())['beschreibung']}")
    if not figuren:
        print("  (noch keine – anlegen mit: stimmen figur NAME -b 'Beschreibung')")
    print("\n== Pocket TTS (sehr natürlich, schnell) – Stimme 'pocket:NAME' (Deutsch, Englisch, Französisch, ...)")
    print("  " + ", ".join(POCKET_STIMMEN))
    print("\n== Piper (schnell, roboterhaft)")
    kat = katalog()
    zeilen = [x for x in kat.values() if not a.sprache or x["language"]["code"].lower().startswith(a.sprache.lower())]
    for x in sorted(zeilen, key=lambda x: x["key"]):
        sp = x["num_speakers"]
        namen = list(x.get("speaker_id_map") or {})
        extra = f"  Sprecher: {', '.join(namen)}" if 1 < sp <= 12 else (f"  ({sp} Sprecher, -p 0..{sp - 1})" if sp > 1 else "")
        print(f"  {x['key']:<42} {x['language']['name_english']:<12} {x['quality']:<7}{extra}")


def cmd_sprich(a):
    text = Path(a.datei).read_text() if a.datei else a.text
    if not text:
        sys.exit("Kein Text angegeben.")
    z = {"text": text.strip(), "stimme": a.stimme, "sprecher": a.sprecher, "tempo": a.tempo,
         "anweisung": a.anweisung, "sprache": a.sprache}
    speichern(erzeugen([z])[0], a.ausgabe)


def cmd_skript(a):
    """skript.json: {"stimme", "pause", "sprache"?, "zeilen": [{"text", "stimme"?, "anweisung"?, "tempo"?, "pause"?, "id"?}]}"""
    s = json.loads(Path(a.skript).read_text())
    zeilen = []
    for i, z in enumerate(s["zeilen"]):
        z = {k: s[k] for k in ("stimme", "sprecher", "tempo", "sprache", "anweisung") if k in s} | z
        if not z.get("stimme"):
            sys.exit(f"Zeile {i}: keine Stimme angegeben (weder in der Zeile noch global).")
        zeilen.append(z)
    teile = erzeugen(zeilen)
    pcm, marken, t = bytearray(), [], 0.0
    for i, (z, teil) in enumerate(zip(zeilen, teile)):
        dauer = len(teil) / 2 / ZIEL_RATE
        marken.append({"id": z.get("id", i), "text": z["text"], "stimme": z["stimme"], "sprecher": z.get("sprecher"),
                       "start": round(t, 3), "ende": round(t + dauer, 3)})
        pause = z.get("pause", s.get("pause", 0.4))
        pcm += teil + stille(pause)
        t += dauer + pause
    speichern(bytes(pcm), a.ausgabe)
    zeit_datei = str(Path(a.ausgabe).with_suffix(".json"))
    Path(zeit_datei).write_text(json.dumps({"dauer": round(t, 3), "zeilen": marken}, ensure_ascii=False, indent=2))
    print(f"-> {zeit_datei} (Zeitmarken für Untertitel/Animation)", file=sys.stderr)


def cmd_figur(a):
    """Entwirft eine Stimme per Beschreibung und speichert sie als feste Figur (Referenzaufnahme)."""
    FIGUREN_DIR.mkdir(parents=True, exist_ok=True)
    ref = FIGUREN_DIR / f"{a.name}.wav"
    if ref.exists() and not a.ueberschreiben:
        sys.exit(f"Figur '{a.name}' gibt es schon. Mit --ueberschreiben neu entwerfen.")
    text = a.text or FIGUR_TEXT
    with tempfile.TemporaryDirectory() as tmp:
        auftraege = [{"modus": "entwurf", "beschreibung": a.beschreibung, "text": text, "sprache": a.sprache,
                      "ausgabe": f"{tmp}/{i}.wav"} for i in range(a.varianten)]
        worker("qwen", auftraege)
        # Beste Variante wählen: zuerst korrekt ausgesprochen (Whisper), dann am natürlichsten (UTMOS).
        # Die Referenz muss genau den gespeicherten Text sprechen, sonst klont Qwen ungenau.
        sys.path.insert(0, str(HIER))
        from pruefen import Ohr, Utmos, audio_laden, wer
        u, ohr = Utmos(), Ohr("small", a.sprache)
        noten = []
        for x in auftraege:
            w = audio_laden(x["ausgabe"])
            fehler, mos = wer(text, ohr(w)), u(w)
            print(f"  Variante {Path(x['ausgabe']).stem}: MOS {mos:.2f}, Wortfehler {fehler:.0%}", file=sys.stderr)
            noten.append((fehler > 0.0, -mos, x["ausgabe"]))
        if all(n[0] for n in noten):
            print("  Warnung: keine Variante fehlerfrei ausgesprochen – nimm ggf. --varianten 5", file=sys.stderr)
        gewaehlt = min(noten)[2]
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", gewaehlt, "-ac", "1", "-ar", "24000", str(ref)], check=True)
    ref.with_suffix(".json").write_text(json.dumps({"beschreibung": a.beschreibung, "text": text, "sprache": a.sprache},
                                                   ensure_ascii=False, indent=2))
    print(f"-> Figur gespeichert: {ref} – nutzen mit -s figur:{a.name}", file=sys.stderr)


def cmd_proben(a):
    kat = katalog()
    for x in sorted(kat.values(), key=lambda x: x["key"]):
        if not x["language"]["code"].lower().startswith(a.sprache.lower()):
            continue
        text = a.text or PROBE_TEXT.get(x["language"]["family"], PROBE_TEXT["en"])
        sprecher = list(x.get("speaker_id_map") or {})[:a.max_sprecher] if x["num_speakers"] > 1 else [None]
        for sp in sprecher:
            name = x["key"] + (f"__{sp}" if sp is not None else "")
            speichern(piper_pcm({"text": text, "stimme": x["key"], "sprecher": sp}), str(Path(a.ausgabe) / f"{name}.mp3"))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="befehl", required=True)

    q = sub.add_parser("liste", help="verfügbare Stimmen anzeigen")
    q.add_argument("--sprache", "-l", default="de", help="Filter für Piper, z. B. de, en_US ('' = alle)")
    q.set_defaults(f=cmd_liste)

    q = sub.add_parser("sprich", help="Text vorlesen")
    q.add_argument("text", nargs="?", default="")
    q.add_argument("--datei", "-f", help="Text aus Datei lesen")
    q.add_argument("--stimme", "-s", default="figur:erzaehler")
    q.add_argument("--anweisung", "-a", help="nur qwen:… – Sprechweise, z. B. 'sehr aufgeregt' oder 'flüsternd'")
    q.add_argument("--sprecher", "-p", help="nur Piper-Mehrsprecher-Modelle")
    q.add_argument("--tempo", "-t", type=float, default=1.0, help="1.0 = normal, 1.2 = schneller")
    q.add_argument("--sprache", default="de", help="de, en, fr, es, it, pt, ...")
    q.add_argument("--ausgabe", "-o", default="out/stimme.wav")
    q.set_defaults(f=cmd_sprich)

    q = sub.add_parser("skript", help="Skript (JSON) mit mehreren Stimmen vertonen")
    q.add_argument("skript")
    q.add_argument("--ausgabe", "-o", default="out/skript.wav")
    q.set_defaults(f=cmd_skript)

    q = sub.add_parser("figur", help="neue feste Figurenstimme entwerfen (Qwen VoiceDesign)")
    q.add_argument("name")
    q.add_argument("--beschreibung", "-b", required=True, help="z. B. 'älterer Mann, rau, brummig, langsam'")
    q.add_argument("--text", help="Referenzsatz (Standard: neutraler Erzählsatz)")
    q.add_argument("--sprache", default="de")
    q.add_argument("--varianten", type=int, default=3, help="so viele Entwürfe erzeugen, den natürlichsten behalten")
    q.add_argument("--ueberschreiben", action="store_true")
    q.set_defaults(f=cmd_figur)

    q = sub.add_parser("proben", help="Hörproben der Piper-Stimmen erzeugen")
    q.add_argument("--sprache", "-l", default="de")
    q.add_argument("--text")
    q.add_argument("--max-sprecher", type=int, default=3, help="bei Mehrsprecher-Modellen (Standard 3)")
    q.add_argument("--ausgabe", "-o", default="out/stimmproben")
    q.set_defaults(f=cmd_proben)

    a = p.parse_args()
    a.f(a)


if __name__ == "__main__":
    main()
