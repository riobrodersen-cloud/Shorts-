#!/usr/bin/env python3
"""Worker für Kyutai Pocket TTS (Code MIT, Gewichte CC-BY-4.0). JSON-Aufträge von stdin -> WAV.

Auftrag: {"text", "stimme", "ausgabe", "sprache"? ("german_24l"), }
Läuft in .venvs/pocket (wird von stimmen.py aufgerufen).
"""
import json
import os
import sys
import time

os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
import scipy.io.wavfile  # noqa: E402
from pocket_tts import TTSModel  # noqa: E402

auftraege = json.load(sys.stdin)
modelle, zustaende = {}, {}
for a in auftraege:
    sprache = a.get("sprache", "german_24l")
    if sprache not in modelle:
        modelle[sprache] = TTSModel.load_model(language=sprache)
    m = modelle[sprache]
    key = (sprache, a["stimme"])
    if key not in zustaende:
        zustaende[key] = m.get_state_for_audio_prompt(a["stimme"])
    t0 = time.time()
    audio = m.generate_audio(zustaende[key], a["text"])
    scipy.io.wavfile.write(a["ausgabe"], m.sample_rate, audio.numpy())
    print(f"    pocket/{a['stimme']}: {len(audio) / m.sample_rate:.1f}s Audio in {time.time() - t0:.0f}s",
          file=sys.stderr, flush=True)
