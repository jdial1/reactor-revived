"""Synthesise the sell bar's and the plant computer's sounds.

The old sell sound was clunky: nine-tenths of its weight under 250 Hz, and with
the key's click ahead of it, four or five hits in a row on the most-pressed
control in the game - and on a phone, which plays next to nothing under 300 Hz,
all that was left of it was its edge. The sell bar's tally is one soft mallet
note on a wooden bar instead: its body between 390 and 800 Hz, where a phone
speaker lives, a three-millisecond attack, no low thump and no second hit. The
plant computer's key is a heavier wooden tok, a clack on purpose. Each family is
a set of variants on a pentatonic scale, cycled at play time (www/js/audio.js),
so a run of taps is a run of different notes that agree rather than one sound
repeated.

    python3 tools/synth_sounds.py    # writes www/audio/tally-*.wav and key-*.wav

Deterministic: the same seed writes the same files.
"""
import numpy as np, wave, os

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "www", "audio")
rng = np.random.default_rng(1983)

# Pentatonic, so any two in a row agree with each other.
NOTE = {"G3": 196.0, "A3": 220.0, "C4": 261.6, "D4": 293.7, "E4": 329.6,
        "G4": 392.0, "A4": 440.0, "C5": 523.3, "D5": 587.3, "E5": 659.3, "G5": 784.0}


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


def mallet(f0, length=0.26, decay=0.085):
    """One soft mallet on a wooden bar: light and round, a single hit.

    A marimba bar's modes sit at 1 : 3.93 : 9.2; the upper two die within a
    few tens of milliseconds, so what stays is a short, warm note.
    """
    t = np.arange(int(SR * length)) / SR
    y = np.zeros_like(t)
    for ratio, amp, d in ((1.0, 1.0, decay), (3.93, 0.22, decay * 0.28), (9.2, 0.05, decay * 0.09)):
        if f0 * ratio < SR / 2.2:
            y += amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t / d)
    # The mallet touching the bar: a breath of noise, gone in two milliseconds.
    y += 0.05 * lowpass(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.002)
    attack = int(SR * 0.003)
    y[:attack] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, attack))
    return lowpass(y, 4000)


def write(name, y, level=1.0):
    # -3 dBFS, less `level`: the game sets the overall loudness.
    y = y / (np.max(np.abs(y)) + 1e-9) * 0.7 * level
    tail = int(SR * 0.012)
    y[-tail:] *= np.linspace(1, 0, tail)
    pcm = (y * 32767).astype("<i2")
    with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# The sell bar: one light mallet note, six of them on a pentatonic scale. A
# phone is louder the higher the note, about 4.5 dB an octave here, so the
# higher notes are written quieter to come out level.
for k, n in enumerate(["E4", "G4", "A4", "C5", "D5", "E5"], 1):
    write(f"tally-{k}", mallet(NOTE[n]), level=(NOTE["E4"] / NOTE[n]) ** 0.75)

# The plant computer's clack: one heavier key going home, lower and drier.
for k, n in enumerate(["C4", "D4", "E4", "A3"], 1):
    write(f"key-{k}", tok(NOTE[n], decay=0.06, bright=0.6, thump=0.6, grit=0.18, length=0.3))
