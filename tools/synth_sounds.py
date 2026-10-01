"""Synthesise the sell bar's and the plant computer's sounds.

The impacts from Kenney's pack were chosen for depth, and on a desk speaker
they are; but a phone plays next to nothing under 300 Hz, so on a phone what is
left of a deep impact is its edge, and the coin was all edge - bright, loud and
the same every time, on the most-pressed control in the game. These are made
for where the game is played: a small wooden tok, its body between 400 and 1500
Hz where a phone speaker lives, a soft two-millisecond attack, nothing much over
2.5 kHz, and a low thump under it for a desk speaker. Each family is a set of
variants on a pentatonic scale, cycled at play time (www/js/audio.js), so a run
of taps is a run of different, consonant toks rather than one clink repeated.

    python3 tools/synth_sounds.py    # writes www/audio/tally-*.wav and key-*.wav

Deterministic: the same seed writes the same files.
"""
import numpy as np, wave, os

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "www", "audio")
rng = np.random.default_rng(1983)

# Pentatonic, so any two in a row agree with each other.
NOTE = {"G3": 196.0, "A3": 220.0, "C4": 261.6, "D4": 293.7, "E4": 329.6,
        "G4": 392.0, "A4": 440.0, "C5": 523.3, "D5": 587.3, "E5": 659.3}


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def tok(f0, length=0.28, decay=0.05, bright=1.0, thump=0.45, grit=0.12):
    """One wooden tok: three inharmonic modes, a soft attack, a low thump."""
    t = np.arange(int(SR * length)) / SR
    y = np.zeros_like(t)
    # A wood block's modes sit at roughly 1 : 2.57 : 4.2, each dying faster.
    for ratio, amp, d in ((1.0, 1.0, decay), (2.57, 0.32 * bright, decay * 0.42), (4.18, 0.10 * bright, decay * 0.22)):
        if f0 * ratio > SR / 2.2:
            continue
        y += amp * np.sin(2 * np.pi * f0 * ratio * t + rng.uniform(0, 0.4)) * np.exp(-t / d)
    # The knock itself: a breath of noise, low-passed so it is felt not heard.
    y += grit * lowpass(rng.standard_normal(len(t)), 2200) * np.exp(-t / 0.004)
    # Under it, for a desk speaker or headphones: the drum turning.
    y += thump * np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.045)
    attack = int(SR * 0.002)
    y[:attack] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, attack))
    return lowpass(y, 3200)


def place(into, at, sound, gain=1.0):
    i = int(SR * at)
    into[i:i + len(sound)] += gain * sound[: len(into) - i]


def write(name, y):
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.7  # -3 dBFS: the game sets the level
    tail = int(SR * 0.012)
    y[-tail:] *= np.linspace(1, 0, tail)
    pcm = (y * 32767).astype("<i2")
    with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# The sell bar: the money drums turning over, a tok and a softer one settling
# just after it, a step down the scale.
TALLY = [("C5", "A4"), ("D5", "C5"), ("A4", "G4"), ("D5", "A4"), ("C5", "G4"), ("G4", "E4")]
for k, (a, b) in enumerate(TALLY, 1):
    y = np.zeros(int(SR * 0.3))
    place(y, 0.0, tok(NOTE[a], decay=0.045))
    place(y, rng.uniform(0.038, 0.052), tok(NOTE[b], decay=0.04, thump=0.2), gain=0.5)
    write(f"tally-{k}", y)

# The plant computer's clack: one heavier key going home, lower and drier.
for k, n in enumerate(["C4", "D4", "E4", "A3"], 1):
    write(f"key-{k}", tok(NOTE[n], decay=0.06, bright=0.6, thump=0.6, grit=0.18, length=0.3))
