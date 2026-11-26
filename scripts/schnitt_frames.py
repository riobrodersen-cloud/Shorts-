"""Liest die Schnittliste aus Film.tsx + Zeitmarken und gibt pro Einstellung den Mittel-Frame aus (JSON).
Aufruf: python3 scripts/schnitt_frames.py kurzfilme/herzhirn/folge-01-limerenz > out/frames.json"""
import json, re, sys
from pathlib import Path

ordner = Path(sys.argv[1])
film = (ordner / "Film.tsx").read_text()
z = json.loads((ordner / "ton" / "zeiten.json").read_text())
zeilen = {l["id"]: l for l in z["zeilen"]}
FPS, ABSPANN = 30, float(re.search(r"ABSPANN_SEK = (\d+)", film).group(1))
gesamt = round((z["dauer"] + ABSPANN) * FPS)

eintraege = []
for m in re.finditer(r'\{ name: "([^"]+)", von: (.+?), inhalt', film):
    name, von = m.group(1), m.group(2).strip()
    if von == "0":
        f = 0
    else:
        mm = re.match(r'([se])\("([^"]+)"(?:, ([-\d.]+))?\)', von)
        art, zid, v = mm.group(1), mm.group(2), float(mm.group(3) or 0)
        f = round((zeilen[zid]["start" if art == "s" else "ende"] + v) * FPS)
    eintraege.append({"name": name, "von": f})
for i, e in enumerate(eintraege):
    bis = eintraege[i + 1]["von"] if i + 1 < len(eintraege) else gesamt
    e["bis"] = bis
    e["frame"] = e["von"] + int((bis - e["von"]) * 0.6)
print(json.dumps(eintraege, ensure_ascii=False, indent=1))
