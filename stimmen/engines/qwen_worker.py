#!/usr/bin/env python3
"""Worker für Qwen3-TTS (Apache-2.0). Liest Aufträge als JSON von stdin, schreibt WAV-Dateien.

Auftrag: {"modus": "sprecher"|"entwurf"|"figur", "text", "ausgabe", "sprache"?,
          "sprecher"?, "anweisung"?, "beschreibung"?, "referenz"?, "referenz_text"?}
Läuft in .venvs/qwen (wird von stimmen.py aufgerufen).
"""
import json
import os
import sys
import time

os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
import soundfile as sf  # noqa: E402
import torch  # noqa: E402
from qwen_tts import Qwen3TTSModel  # noqa: E402

GROESSE = os.environ.get("QWEN_GROESSE", "1.7B")
MODELLE = {"sprecher": f"Qwen/Qwen3-TTS-12Hz-{GROESSE}-CustomVoice",
           "entwurf": "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign",  # nur in 1.7B verfügbar
           "figur": f"Qwen/Qwen3-TTS-12Hz-{GROESSE}-Base"}
SPRACHEN = {"de": "German", "en": "English", "fr": "French", "es": "Spanish", "it": "Italian",
            "pt": "Portuguese", "ru": "Russian", "ja": "Japanese", "ko": "Korean", "zh": "Chinese"}

torch.set_num_threads(os.cpu_count() or 4)
auftraege = json.load(sys.stdin)
for modus in ("sprecher", "entwurf", "figur"):
    meine = [a for a in auftraege if a["modus"] == modus]
    if not meine:
        continue
    m = Qwen3TTSModel.from_pretrained(MODELLE[modus], device_map="cpu", dtype=torch.float32)
    prompts = {}
    for a in meine:
        sprache = SPRACHEN.get(a.get("sprache", "de"), a.get("sprache", "German"))
        t0 = time.time()
        if modus == "sprecher":
            wavs, sr = m.generate_custom_voice(text=a["text"], speaker=a["sprecher"], language=sprache,
                                               instruct=a.get("anweisung") or None)
        elif modus == "entwurf":
            wavs, sr = m.generate_voice_design(text=a["text"], instruct=a["beschreibung"], language=sprache)
        else:
            key = a["referenz"]
            if key not in prompts:
                prompts[key] = m.create_voice_clone_prompt(ref_audio=a["referenz"], ref_text=a["referenz_text"])
            wavs, sr = m.generate_voice_clone(text=a["text"], language=sprache, voice_clone_prompt=prompts[key])
        sf.write(a["ausgabe"], wavs[0], sr)
        print(f"    qwen/{modus}: {len(wavs[0]) / sr:.1f}s Audio in {time.time() - t0:.0f}s", file=sys.stderr, flush=True)
    del m
