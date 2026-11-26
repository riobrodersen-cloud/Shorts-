"""Erzeugt eine Aquarellpapier-Textur (selbst berechnet, keine fremden Assets).
Ausgabe: public/herzhirn/texturen/papier.png (Graustufen, hell ~ weiß, zum Multiplizieren)
         public/herzhirn/texturen/koernung.png (Pigment-Körnung, für soft-light)"""
import numpy as np
from PIL import Image, ImageFilter

W, H = 1920, 1080
rng = np.random.default_rng(7)

def value_noise(scale, w=W, h=H):
    gw, gh = int(w / scale) + 2, int(h / scale) + 2
    g = rng.random((gh, gw)).astype(np.float32)
    img = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255.0

# Fraktales Rauschen: grobe Wolkigkeit + feine Faser-Struktur
fbm = sum(value_noise(s) * a for s, a in [(240, .35), (90, .25), (30, .18), (9, .12), (3, .10)])
fbm = (fbm - fbm.min()) / (fbm.max() - fbm.min())
grain = rng.normal(0, 1, (H, W)).astype(np.float32)
grain = np.asarray(Image.fromarray(((grain * 30) + 128).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7)), dtype=np.float32) / 255.0 - 0.5

# Kaltgepresstes Papier: kleine Mulden (helle Tupfer) und Fasern
paper = 0.955 + (fbm - 0.5) * 0.06 + grain * 0.05
fib = Image.new("L", (W, H), 0)
from PIL import ImageDraw
d = ImageDraw.Draw(fib)
for _ in range(900):
    x, y = rng.random() * W, rng.random() * H
    ang = rng.random() * np.pi
    L = 6 + rng.random() * 30
    pts = []
    for t in np.linspace(0, 1, 6):
        pts.append((x + np.cos(ang) * L * t + rng.normal(0, 1.2), y + np.sin(ang) * L * t + rng.normal(0, 1.2)))
    d.line(pts, fill=int(25 + rng.random() * 40), width=1)
fib = np.asarray(fib.filter(ImageFilter.GaussianBlur(0.6)), dtype=np.float32) / 255.0
paper = paper - fib * 0.12
Image.fromarray((paper.clip(0, 1) * 255).astype(np.uint8)).save("public/herzhirn/texturen/papier.png", optimize=True)

# Pigment-Körnung: mittelgrau (128 = neutral bei soft-light)
gran = value_noise(4) * .5 + value_noise(14) * .3 + value_noise(60) * .2
gran = (gran - gran.mean()) / gran.std()
Image.fromarray((128 + gran * 22).clip(0, 255).astype(np.uint8)).save("public/herzhirn/texturen/koernung.png", optimize=True)
print("ok")
