"""Erzeugt eine deutsche SRT aus den Zeitmarken der Sprachausgabe (eine Zeile = ein Untertitel,
lange Sätze werden an Satzzeichen geteilt; max. 2 Zeilen à 42 Zeichen).
Aufruf: python3 scripts/srt.py <zeiten.json> <ausgabe.srt>"""
import json, re, sys

z = json.load(open(sys.argv[1]))

def ts(s):
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"

def umbrechen(t, breite=42):
    w = t.split(); zeilen = [""]
    for x in w:
        if len(zeilen[-1]) + len(x) + 1 > breite and zeilen[-1]:
            zeilen.append(x)
        else:
            zeilen[-1] = (zeilen[-1] + " " + x).strip()
    return zeilen

bloecke = []
for l in z["zeilen"]:
    text = l["text"].strip()
    for a, b in (("siebenundvierzig Mal", "47-mal"), ("neunzehnhundertneunundsiebzig", "1979")):
        text = text.replace(a, b)
    teile = [text]
    if len(text) > 84:
        teile = [p.strip() for p in re.split(r"(?<=[,–:])\s+", text) if p.strip()]
        # wieder zu Blöcken ≤ 84 Zeichen zusammenfassen
        zus = [""]
        for p in teile:
            if len(zus[-1]) + len(p) + 1 > 84 and zus[-1]:
                zus.append(p)
            else:
                zus[-1] = (zus[-1] + " " + p).strip()
        teile = zus
    gesamt = sum(len(p) for p in teile)
    t = l["start"]
    for p in teile:
        d = (l["ende"] - l["start"]) * len(p) / gesamt
        bloecke.append((t, t + d, "\n".join(umbrechen(p))))
        t += d

with open(sys.argv[2], "w", encoding="utf-8") as f:
    for i, (a, b, txt) in enumerate(bloecke, 1):
        f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{txt}\n\n")
print(len(bloecke), "Untertitel")
