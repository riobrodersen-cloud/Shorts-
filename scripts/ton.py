"""Herzhirn – Musik und Sounddesign, komplett selbst synthetisiert (numpy), daher lizenzfrei.
Erzeugt public/herzhirn/folge01/atmo.mp3 (Musik + Geräusche, unter der Stimme abgesenkt).
Aufruf: python3 scripts/ton.py kurzfilme/herzhirn/folge-01-limerenz out/frames.json
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np

SR = 44100
rng = np.random.default_rng(11)
ordner = Path(sys.argv[1])
shots = json.load(open(sys.argv[2]))
zeiten = json.loads((ordner / "ton" / "zeiten.json").read_text())
Z = {z["id"]: z for z in zeiten["zeilen"]}
DAUER = shots[-1]["bis"] / 30
N = int(DAUER * SR) + SR
musik = np.zeros((N, 2))
fx = np.zeros((N, 2))

def shot(name):
    return next(s for s in shots if s["name"].startswith(name))

def t_von(name): return shot(name)["von"] / 30
def t_bis(name): return shot(name)["bis"] / 30

# ---------------- Werkzeuge ----------------
def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))

def hall(x, sek=2.4, nass=0.3):
    n = int(sek * SR)
    ir = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 7, n))
    ir = fft_filter(ir, hi=5000)
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n
    y = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[: len(x)]
    return x * (1 - nass) + y * nass

def hz(note):  # MIDI -> Hz
    return 440 * 2 ** ((note - 69) / 12)

def platz(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(sig) <= 0: return
    sig = sig[: max(0, len(buf) - i)]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * gain * l * 1.41
    buf[i:i + len(sig), 1] += sig * gain * r * 1.41

def klavier(note, dauer=2.5, vel=0.6):
    n = int(dauer * SR); t = np.arange(n) / SR; f = hz(note)
    s = np.zeros(n)
    for k, a in enumerate([1, 0.5, 0.28, 0.16, 0.09, 0.05], 1):
        s += a * np.sin(2 * np.pi * f * k * (1 + 0.0004 * k * k) * t) * np.exp(-t * (1.1 + k * 0.7))
    s += 0.3 * rng.normal(0, 1, n) * np.exp(-t * 60)  # Anschlag
    att = np.minimum(1, t / 0.004)
    return s * att * vel * 0.35

def flaeche(noten, dauer, vel=0.25):
    n = int(dauer * SR); t = np.arange(n) / SR
    env = np.minimum(1, t / 1.2) * np.minimum(1, (dauer - t) / 1.5)
    s = np.zeros(n)
    for no in noten:
        for d in (-0.07, 0.07):
            f = hz(no) * (1 + d / 100)
            s += np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.2 * t)) * 0.6 + 0.2 * np.sin(2 * np.pi * 2 * f * t)
    return s * env * vel / len(noten)

# Akkorde als MIDI-Noten (Bass, dann Akkordtöne)
AKT1 = [[50, 62, 65, 69, 72], [46, 58, 62, 65, 69], [41, 57, 60, 64, 67], [48, 55, 60, 64, 69]]        # Dm9 Bbmaj7 Fmaj7 C6
HELL = [[53, 60, 65, 69, 72], [48, 60, 64, 67, 71], [45, 57, 60, 64, 67], [50, 57, 62, 65, 69]]        # F C Am Dm – heller
SPANN = [[45, 57, 60, 64], [43, 55, 60, 64], [41, 57, 60, 65], [40, 56, 59, 64]]                      # Am Am/G F E
TROST = [[48, 60, 64, 67, 72], [47, 59, 62, 67, 71], [45, 57, 60, 64, 69], [41, 57, 60, 65, 69]]       # C G/B Am7 Fmaj7
NEBEL = [[45, 57, 59, 64], [40, 56, 59, 62]]                                                          # Am(add9) E7

def abschnitt(t0, t1, akkorde, bpm, muster="arp", vel=0.55, hoch=0):
    takt = 60 / bpm * 4
    t = t0; i = 0
    while t < t1 - 0.3:
        ak = akkorde[i % len(akkorde)]
        rest = min(takt, t1 - t)
        platz(musik, flaeche(ak[1:], rest + 1.0, 0.18), t, pan=0)
        platz(musik, klavier(ak[0] - 12 + 12, 3.0, 0.5), t, pan=-0.2)
        if muster == "arp":
            folge = ak[1:] + [ak[2] + 12, ak[3] + 12]
            for k in range(8):
                if t + k * takt / 8 < t1 - 0.2:
                    platz(musik, klavier(folge[k % len(folge)] + hoch, 2.2, vel * (0.8 + 0.2 * (k % 2 == 0))), t + k * takt / 8, pan=0.25 * np.sin(k))
        elif muster == "puls":
            for k in range(4):
                if t + k * takt / 4 < t1 - 0.2:
                    platz(musik, klavier(ak[0], 1.2, vel), t + k * takt / 4, pan=-0.1)
            for k in (1, 3):
                platz(musik, klavier(ak[-1] + 12 + hoch, 1.6, vel * 0.6), t + k * takt / 4 + takt / 8, pan=0.3)
        elif muster == "ruhig":
            for k, no in enumerate(ak[1:]):
                platz(musik, klavier(no + 12, 3.0, vel * 0.7), t + k * takt / 4, pan=0.2 * (k - 1.5))
        t += takt; i += 1

# ---------------- Musik: ein Wechsel pro Akt ----------------
t_p1 = t_von("Flug durchs Auge"); t_p2 = t_von("Handy – schreibt"); t_p2b = t_von("Wolke zieht auf")
t_strudel = t_von("Gedankenschleife"); t_stille = t_von("Stille – Gesicht"); t_trost = t_von("Sonnenaufgang innen")
t_foto = t_von("Foto")
abschnitt(0.0, t_p1, AKT1, 76, "arp", 0.42)                       # Akt 1: sehnsüchtig, warm
abschnitt(t_p1, t_p2 + 0.4, HELL, 84, "arp", 0.5, hoch=12)        # Phase 1: hell, glitzernd
# Phase 2: Musik setzt kurz aus (bei "schreibt ..."), dann Spannung
abschnitt(t_p2b, t_strudel, SPANN, 92, "puls", 0.5)
abschnitt(t_strudel, t_stille, SPANN, 120, "arp", 0.5)           # Gedankenschleife: schneller
abschnitt(t_trost, t_foto, TROST, 72, "ruhig", 0.6)               # Trost: warm, Dur
abschnitt(t_foto, DAUER, NEBEL, 66, "ruhig", 0.45)                # Brücke: grünlich, offen
# harte Stille am Höhepunkt: alles nach t_stille bis Trost ausblenden
a, b = int(t_stille * SR), int(t_trost * SR)
musik[a:b] = 0
musik = hall(musik.T[0], 2.8, 0.35)[:, None] * [1, 0] + hall(musik.T[1], 2.9, 0.35)[:, None] * [0, 1]
musik[a:b] *= 0

# ---------------- Geräusche ----------------
def vibration(d=0.9):
    n = int(d * SR); t = np.arange(n) / SR
    puls = ((t % 0.45) < 0.3).astype(float)
    s = (np.sin(2 * np.pi * 155 * t) + 0.5 * np.sign(np.sin(2 * np.pi * 155 * t)) * 0.3) * puls
    s += 0.3 * fft_filter(rng.normal(0, 1, n), 2000, 6000) * puls
    return s * 0.5

def glitzer(d=1.6, dichte=26):
    n = int(d * SR); s = np.zeros(n)
    for _ in range(dichte):
        f = rng.uniform(2400, 6000); dur = rng.uniform(0.08, 0.35); m = int(dur * SR)
        t = np.arange(m) / SR
        p = np.sin(2 * np.pi * f * t) * np.exp(-t * 18) * rng.uniform(0.3, 1)
        i = int(rng.uniform(0, d - dur) * SR); s[i:i + m] += p
    return s * 0.25

def herzschlag(bpm=70, d=2.0, laut=1.0):
    n = int(d * SR); s = np.zeros(n); per = 60 / bpm
    def thump(f0, amp):
        m = int(0.18 * SR); t = np.arange(m) / SR
        return np.sin(2 * np.pi * (f0 * t - 20 * t * t)) * np.exp(-t * 22) * amp
    t = 0.0
    while t < d - 0.3:
        for off, f0, a in ((0, 58, 1.0), (0.22, 50, 0.7)):
            th = thump(f0, a); i = int((t + off) * SR); s[i:i + len(th)] += th[: max(0, n - i)]
        t += per
    return s * laut

def vogel(d=3.0, anzahl=5):
    n = int(d * SR); s = np.zeros(n)
    for _ in range(anzahl):
        t0 = rng.uniform(0, d - 0.5)
        for k in range(rng.integers(2, 5)):
            m = int(0.07 * SR); t = np.arange(m) / SR
            f0 = rng.uniform(3000, 4800)
            p = np.sin(2 * np.pi * (f0 * t + rng.uniform(4000, 9000) * t * t * (1 if k % 2 else -1))) * np.sin(np.pi * t / t[-1])
            i = int((t0 + k * 0.09) * SR); s[i:i + m] += p[: max(0, n - i)] * 0.3
    return s

def rauschen(d, lo, hi, mod=0.2):
    n = int(d * SR); x = fft_filter(rng.normal(0, 1, n), lo, hi)
    t = np.arange(n) / SR
    env = 0.7 + 0.3 * np.sin(2 * np.pi * mod * t + rng.uniform(0, 6))
    x = x / (np.std(x) + 1e-9)
    fade = np.minimum(1, np.minimum(t / 0.6, (d - t) / 0.6))
    return x * env * fade

def whoosh(d=1.4):
    n = int(d * SR); x = rng.normal(0, 1, n); t = np.arange(n) / SR
    out = np.zeros(n); seg = 2048
    for i in range(0, n, seg):
        c = 300 + 3000 * (i / n)
        out[i:i + seg] = fft_filter(x[i:i + seg], c * 0.6, c * 1.6)[: len(out[i:i + seg])]
    return out / (np.std(out) + 1e-9) * np.sin(np.pi * t / d) ** 2 * 0.4

def donner(d=3.0):
    n = int(d * SR); t = np.arange(n) / SR
    x = fft_filter(rng.normal(0, 1, n), 20, 250)
    return x / np.std(x) * np.exp(-t * 1.3) * np.minimum(1, t / 0.05) * 0.6

def tick(d, per=1.0):
    n = int(d * SR); s = np.zeros(n); m = int(0.01 * SR)
    klick = rng.normal(0, 1, m) * np.exp(-np.arange(m) / m * 6)
    for k in range(int(d / per)):
        i = int(k * per * SR); s[i:i + m] += klick * (0.5 if k % 2 else 0.35)
    return s * 0.4

def ratsche(d=1.5):
    n = int(d * SR); s = np.zeros(n); m = int(0.006 * SR)
    t = 0.0
    while t < d - 0.05:
        i = int(t * SR); s[i:i + m] += rng.normal(0, 1, m) * 0.5; t += 0.045 + 0.03 * t / d
    return fft_filter(s, 800, 6000)

def pinsel(d=0.8):
    n = int(d * SR); t = np.arange(n) / SR
    return fft_filter(rng.normal(0, 1, n), 1500, 7000) * np.sin(np.pi * t / d) * 0.18

def ab(name): return t_von(name)
def lang(name): return t_bis(name) - t_von(name)

# Hook
platz(fx, vibration(), 0.25, 0.8, 0.1)
platz(fx, rauschen(lang("Zimmer – 47×") + lang("Gesicht im Handylicht"), 80, 400, 0.05), 0, 0.03)  # Raumton
platz(fx, glitzer(1.8), ab("Auge – goldenes Glitzern"), 0.9, 0.2)
platz(fx, whoosh(1.2), ab("Innenwelt – Blick ins Tal") - 0.4, 0.8)
for nm in ("Innenwelt – Blick ins Tal", "Innenwelt – Strudel-Teaser", "Dopamin-Flut", "Wolke zieht auf", "Wetter + Spielautomat", "Serotonin-See sinkt", "Gedankenschleife", "Sonnenaufgang innen", "Grüner Nebel"):
    platz(fx, rauschen(lang(nm) + 0.6, 180, 1400, 0.3), ab(nm), 0.06, -0.2)   # Wasser
    platz(fx, rauschen(lang(nm) + 0.6, 60, 500, 0.1), ab(nm), 0.04, 0.3)     # Wind
# Mika & Situation
platz(fx, rauschen(lang("Gartenparty"), 300, 2500, 0.8), ab("Gartenparty"), 0.05)  # Stimmengewirr
for k in range(6):
    m = int(0.12 * SR); t = np.arange(m) / SR
    platz(fx, np.sin(2 * np.pi * rng.uniform(2800, 4200) * t) * np.exp(-t * 40) * 0.2, ab("Gartenparty") + rng.uniform(0.5, lang("Gartenparty") - 0.5), 0.6, rng.uniform(-0.6, 0.6))
platz(fx, vogel(lang("Gartenparty"), 4), ab("Gartenparty"), 0.35, 0.4)
platz(fx, vogel(lang("Fahrrad – jedes Lied"), 5), ab("Fahrrad – jedes Lied"), 0.4, -0.3)
platz(fx, rauschen(lang("Fahrrad – jedes Lied"), 100, 900, 0.6), ab("Fahrrad – jedes Lied"), 0.05)
platz(fx, vibration(0.6), ab("Handy – fünfmal gelesen") + 0.05, 0.7)
platz(fx, rauschen(lang("Bus – online"), 40, 300, 0.4), ab("Bus – online"), 0.12)  # Busbrummen
platz(fx, herzschlag(70, 1.2, 1.4), ab("Bus – online") + 1.1, 1.0)
for nm in ("Titel Limerenz", "Titel Tennov", "Titel Besessenheit"):
    platz(fx, pinsel(0.9), ab(nm) + 0.2, 1.0, 0.2)
# Phase 1
platz(fx, whoosh(1.8), ab("Flug durchs Auge"), 1.0)
platz(fx, vibration(0.9), ab("Dopamin-Flut") + 0.9, 0.8)
platz(fx, glitzer(3.0, 60), ab("Dopamin-Flut") + 1.4, 1.0, -0.1)
platz(fx, rauschen(lang("Hirnscanner"), 200, 900, 2.0), ab("Hirnscanner"), 0.03)  # Scanner-Summen
platz(fx, glitzer(1.5, 20), ab("Hirnscanner") + lang("Hirnscanner") * 0.5, 0.7)
# Phase 2
platz(fx, rauschen(lang("Wolke zieht auf"), 50, 300, 0.1), ab("Wolke zieht auf"), 0.1)
platz(fx, ratsche(1.6), ab("Wetter + Spielautomat") + 0.4, 0.5, 0.5)
platz(fx, donner(3.0), ab("Wetter + Spielautomat") + lang("Wetter + Spielautomat") * 0.62, 0.9)
platz(fx, rauschen(lang("Wetter + Spielautomat") * 0.4, 1500, 8000, 3), ab("Wetter + Spielautomat") + lang("Wetter + Spielautomat") * 0.6, 0.1)  # Regen
d = lang("Körper – Herz + Magen")
platz(fx, herzschlag(70, d / 2, 1.2), ab("Körper – Herz + Magen"), 1.0)
platz(fx, herzschlag(118, d / 2, 1.3), ab("Körper – Herz + Magen") + d / 2, 1.0)
platz(fx, vibration(0.6), ab("Körper – Herz + Magen") + 0.3, 0.6)
platz(fx, tick(lang("Nacht – 3:12")), ab("Nacht – 3:12"), 1.0)
# Phase 3: Strudel rauscht immer lauter, dann abrupt Stille
n = int(lang("Gedankenschleife") * SR)
platz(fx, rauschen(lang("Gedankenschleife"), 100, 2500, 1.5) * np.linspace(0.3, 1.6, n)[:len(rauschen(lang("Gedankenschleife"), 100, 2500, 1.5))], ab("Gedankenschleife"), 0.15)
# Trost
platz(fx, vogel(lang("Zimmer im Morgenlicht") + lang("Handy umdrehen") + lang("Fenster öffnen") + lang("Lächeln"), 12), ab("Zimmer im Morgenlicht"), 0.4, 0.5)
platz(fx, rauschen(2.0, 80, 600, 0.2), ab("Fenster öffnen"), 0.1)  # Luftzug
platz(fx, glitzer(2.0, 10), ab("Sonnenaufgang innen") + 1.0, 0.5)
# Brücke: grüner Nebel – dumpfes Wehen
platz(fx, rauschen(lang("Grüner Nebel"), 40, 220, 0.15), ab("Grüner Nebel"), 0.12)

# harte Stille: auch Geräusche weg (nur ganz leiser Raumton)
fx[a:b] *= 0.0
platz(fx, rauschen((b - a) / SR, 80, 300, 0.05), t_stille, 0.012)

# ---------------- Mischen: Musik unter der Stimme absenken (Ducking) ----------------
stimme_wav = "out/stimme_tmp.wav"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "public/herzhirn/folge01/voiceover.mp3", "-ac", "1", "-ar", str(SR), stimme_wav], check=True)
import wave
with wave.open(stimme_wav) as w:
    v = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
v = np.pad(np.abs(v), (0, max(0, N - len(v))))[:N]
blk = SR // 20
env = np.repeat([v[i:i + blk].max() if i < N else 0 for i in range(0, N, blk)], blk)[:N]
env = np.convolve(env, np.ones(SR // 4) / (SR // 4), mode="same")
duck = 1 - 0.45 * np.clip(env / 0.15, 0, 1)

musik /= (np.abs(musik).max() + 1e-9)
fx /= (np.abs(fx).max() + 1e-9)
mix = musik * 0.22 * duck[:, None] + fx * 0.32
mix /= max(1.0, np.abs(mix).max() / 0.9)
pcm = (mix * 32767).astype(np.int16)
with wave.open("out/atmo.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "out/atmo.wav", "-b:a", "192k", "public/herzhirn/folge01/atmo.mp3"], check=True)
print("atmo fertig", round(DAUER, 1), "s")
