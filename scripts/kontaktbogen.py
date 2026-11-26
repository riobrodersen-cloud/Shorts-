"""Baut Kontaktbögen aus out/storyboard/*.png mit Nummer, Name und Zeit."""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
frames = json.load(open(sys.argv[1])); ordner = Path(sys.argv[2]); aus = sys.argv[3]
bilder = sorted(ordner.glob("[0-9][0-9].png"))
W, H, COLS, PRO = 640, 360, 3, 12
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20) if Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf").exists() else ImageFont.load_default()
for b in range(0, len(bilder), PRO):
    teil = bilder[b:b + PRO]
    rows = (len(teil) + COLS - 1) // COLS
    bogen = Image.new("RGB", (COLS * (W + 12) + 12, rows * (H + 46) + 12), "#f6ead6")
    d = ImageDraw.Draw(bogen)
    for i, p in enumerate(teil):
        x = 12 + (i % COLS) * (W + 12); y = 12 + (i // COLS) * (H + 46)
        bogen.paste(Image.open(p).convert("RGB").resize((W, H)), (x, y + 34))
        e = frames[b + i]
        d.text((x, y + 6), f"{b+i+1:02d}  {e['von']/30:5.1f}s  {e['name']}", fill="#4a2240", font=font)
    bogen.save(f"{aus}-{b // PRO + 1}.jpg", quality=88)
    print(f"{aus}-{b // PRO + 1}.jpg")
