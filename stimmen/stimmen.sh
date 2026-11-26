#!/usr/bin/env bash
# Startet stimmen.py in einer eigenen Python-Umgebung (.venv); legt sie beim ersten Aufruf an.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/.venv"
if [ ! -x "$VENV/bin/python" ] || ! "$VENV/bin/python" -c "import piper" 2>/dev/null; then
  echo "Richte Piper TTS ein (einmalig) ..." >&2
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q --disable-pip-version-check -r "$ROOT/stimmen/requirements.txt"
fi
if [ "${1:-}" = "pruefen" ]; then
  shift
  if ! "$VENV/bin/python" -c "import faster_whisper" 2>/dev/null; then
    echo "Richte Prüfwerkzeuge ein (einmalig: Whisper) ..." >&2
    "$VENV/bin/pip" install -q --disable-pip-version-check -r "$ROOT/stimmen/requirements-pruefen.txt"
  fi
  exec "$VENV/bin/python" "$ROOT/stimmen/pruefen.py" "$@"
fi
exec "$VENV/bin/python" "$ROOT/stimmen/stimmen.py" "$@"
