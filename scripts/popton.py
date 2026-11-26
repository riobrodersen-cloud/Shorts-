"""Poppiger Ton für Teaser-Shorts (selbst synthetisiert, lizenzfrei):
Stimme etwas schneller + Pop-Beat (Kick, Clap, Hats, Bass, Akkord-Stabs) mit starkem Ducking unter der Stimme
+ dezente Effekte. Schreibt public/herzhirn/folge01/short<n>_pop.json (Zeitmarken) und short<n>_mix.mp3.
Aufruf: python3 scripts/popton.py <n>"""
import json, subprocess, sys, wave
import numpy as np

SR = 44100
n = sys.argv[1]
TEMPO = 1.10
BPM = 118
ENDE_RUHE = 0.8
rng = np.random.default_rng(int(n) * 7)
base = f"public/herzhirn/folge01/short{n}"

# ---------- Stimme beschleunigen, Zeitmarken anpassen ----------
z = json.load(open(base + ".json"))
for l in z["zeilen"]:
    l["start"] = round(l["start"] / TEMPO, 3); l["ende"] = round(l["ende"] / TEMPO, 3)
z["dauer"] = round(z["dauer"] / TEMPO, 3)
json.dump(z, open(base + "_pop.json", "w"), ensure_ascii=False, indent=1)
roh = subprocess.run(["ffmpeg", "-v", "error", "-i", base + ".mp3", "-af", f"atempo={TEMPO},highpass=f=70", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], check=True, capture_output=True).stdout
stimme = np.frombuffer(roh, np.int16).astype(np.float32) / 32768
DAUER = z["dauer"] + ENDE_RUHE
N = int(DAUER * SR)
stimme = np.pad(stimme, (0, max(0, N - len(stimme))))[:N]
stimme /= np.abs(stimme).max() + 1e-9

def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); m = np.ones_like(f)
    if lo: m *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: m *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))

def hz(m): return 440 * 2 ** ((m - 69) / 12)

def kick():
    t = np.arange(int(0.3 * SR)) / SR
    f = 50 + 110 * np.exp(-t * 35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)

def clap():
    m = int(0.18 * SR); t = np.arange(m) / SR
    x = fft_filter(rng.normal(0, 1, m), 900, 6000)
    env = np.exp(-t * 26) * (1 + 0.6 * ((t % 0.012) < 0.006) * (t < 0.03))
    return x / np.abs(x).max() * env

def hat(lang=False):
    m = int((0.09 if lang else 0.035) * SR); t = np.arange(m) / SR
    x = fft_filter(rng.normal(0, 1, m), 7000, None)
    return x / np.abs(x).max() * np.exp(-t * (30 if lang else 90))

def pluck(note, dur=0.32):
    t = np.arange(int(dur * SR)) / SR; f = hz(note); s = np.zeros_like(t)
    for k in range(1, 9):
        s += np.sin(2 * np.pi * f * k * t + k) / k * np.exp(-t * (6 + k * 3))
    return s * np.minimum(1, t / 0.003)

def bass(note, dur):
    t = np.arange(int(dur * SR)) / SR; f = hz(note)
    s = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t)
    return s * np.minimum(1, t / 0.01) * np.exp(-t * 3)

def setz(buf, sig, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    sig = sig[: len(buf) - i]; buf[i:i + len(sig)] += sig * g

FOLGEN = {"1": [[48, 60, 64, 67], [43, 59, 62, 67], [45, 60, 64, 69], [41, 60, 65, 69]],   # C G Am F – hell
          "2": [[45, 60, 64, 69], [41, 60, 65, 69], [48, 60, 64, 67], [43, 59, 62, 67]],   # Am F C G – spannend
          "3": [[41, 60, 65, 69], [48, 60, 64, 67], [45, 60, 64, 69], [43, 59, 62, 67]]}   # F C Am G
akk = FOLGEN[n]
beat = 60 / BPM
drums = np.zeros(N); musik = np.zeros(N)
ende_beat = z["zeilen"][-1]["start"]  # beim Schluss: Drums aus, nur Akkord klingt
b = 0
while b * beat < DAUER:
    t = b * beat
    a = akk[(b // 4) % 4]
    vorspann = b < 4  # erster Takt: nur Hats + Stabs (Aufbau)
    if t < ende_beat:
        if not vorspann:
            setz(drums, kick(), t, 0.9)
            if b % 2 == 1: setz(drums, clap(), t, 0.45)
        setz(drums, hat(), t + beat / 2, 0.18)
        setz(drums, hat(b % 4 == 3), t, 0.12)
        if not vorspann:
            setz(musik, bass(a[0] - 12, beat * 0.9), t, 0.55)
            setz(musik, bass(a[0] - 12, beat * 0.4), t + beat * 0.5, 0.35)
        for k, no in enumerate(a[1:]):
            setz(musik, pluck(no + 12), t + beat / 2, 0.16)
        if b % 2 == 0:
            setz(musik, pluck(a[1 + (b // 2) % 3] + 24, 0.25), t + beat * 0.75, 0.10)
    b += 1
# Schlussakkord
t0 = ende_beat
for no in akk[0]:
    tt = np.arange(int(2.2 * SR)) / SR
    setz(musik, np.sin(2 * np.pi * hz(no + 12) * tt) * np.exp(-tt * 1.6) * 0.25, t0)
setz(drums, clap(), t0, 0.5); setz(drums, kick(), t0, 0.9)

# ---------- dezente Effekte ----------
fx = np.zeros(N)
def swish(d=0.35):
    m = int(d * SR); t = np.arange(m) / SR
    x = fft_filter(rng.normal(0, 1, m), 1500, 8000)
    return x / np.abs(x).max() * np.sin(np.pi * t / d) ** 2
def glitzer(d=1.2, k=14):
    s = np.zeros(int(d * SR))
    for _ in range(k):
        m = int(0.2 * SR); t = np.arange(m) / SR
        p = np.sin(2 * np.pi * rng.uniform(2500, 5500) * t) * np.exp(-t * 20)
        i = int(rng.uniform(0, d - 0.2) * SR); s[i:i + m] += p
    return s / np.abs(s).max()
def vibration(d=0.7):
    t = np.arange(int(d * SR)) / SR
    return np.sin(2 * np.pi * 155 * t) * ((t % 0.35) < 0.22)
def herz(d=1.5, bpm=110):
    s = np.zeros(int(d * SR)); t = 0
    while t < d - 0.3:
        for off, a in ((0, 1), (0.2, 0.7)):
            m = int(0.16 * SR); tt = np.arange(m) / SR
            th = np.sin(2 * np.pi * (60 * tt - 25 * tt * tt)) * np.exp(-tt * 24) * a
            i = int((t + off) * SR); s[i:i + m] += th[: len(s) - i]
        t += 60 / bpm
    return s

Z = {l["id"]: l for l in z["zeilen"]}
for l in z["zeilen"][1:]:
    setz(fx, swish(), l["start"] - 0.15, 0.10)
if n == "1":
    setz(fx, vibration(), 0.05, 0.25); setz(fx, glitzer(1.4), Z["c"]["start"], 0.18)
if n == "2":
    setz(fx, vibration(), 0.05, 0.25); setz(fx, glitzer(1.2), Z["b"]["start"], 0.18)
if n == "3":
    setz(fx, herz(Z["c"]["ende"] - Z["b"]["start"]), Z["b"]["start"], 0.35); setz(fx, glitzer(1.2), Z["c"]["start"], 0.15)

# ---------- Ducking + Mix ----------
blk = SR // 50
env = np.repeat([np.abs(stimme[i:i + blk]).max() for i in range(0, N, blk)], blk)[:N]
env = np.convolve(env, np.ones(SR // 8) / (SR // 8), mode="same")
duck = 1 - 0.55 * np.clip(env / 0.08, 0, 1)
bett = (drums * 0.55 + musik * 0.6)
bett /= np.abs(bett).max() + 1e-9
mix = stimme * 0.9 + bett * 0.22 * duck + fx * 0.5 * (1 - 0.3 * np.clip(env / 0.08, 0, 1))
mix /= max(1.0, np.abs(mix).max() / 0.95)
with wave.open("out/popmix.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "out/popmix.wav", "-af", "loudnorm=I=-14:TP=-1.5:LRA=7", "-ac", "2", "-ar", "48000", "-b:a", "192k", base + "_mix.mp3"], check=True)
print(f"short{n}: {DAUER:.1f} s")
