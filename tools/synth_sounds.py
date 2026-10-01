"""Synthesise the sell bar's and the plant computer's clacks.

The Soul Interview asks for presses that are "tactile mechanical double click
industrial slow": two stages, a click and then a clack, with weight, in metal
("clanking", beside the teal and orange plating). The old sell sound had the
weight but rattled into four or five uneven, boomy hits, which made it clunky
on the most-pressed control in the game; and a phone, which plays next to
nothing under 300 Hz, kept only its edge. These are single clacks: a short body
for weight, a few damped metal modes where a phone speaker plays, the knock of
the strike, and nothing left ringing. Each is written several times with a
little jitter, the way no two presses of one switch sound quite alike, and the
game cycles through them (www/js/audio.js).

    python3 tools/synth_sounds.py                    # the game's clack-* and latch-*
    python3 tools/synth_sounds.py --candidates DIR   # every candidate, for listening

Deterministic: the same seed writes the same files.
"""
import numpy as np, wave, os

SR = 22050
OUT = os.path.join(os.path.dirname(__file__), "..", "www", "audio")
rng = np.random.default_rng(1983)

def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def clack(body, modes, noise=0.3, length=0.2, jitter=0.0):
    """One mechanical clack: a short body for weight, a few damped metal modes,
    and the knock of the strike. Each mode is (frequency, amplitude, decay in s).
    `jitter` nudges every frequency and decay a little, the way no two presses
    of one switch are quite the same."""
    t = np.arange(int(SR * length)) / SR
    j = lambda v, k=1.0: v * (1 + rng.uniform(-jitter, jitter) * k)
    f, a, d = body
    y = a * np.sin(2 * np.pi * j(f) * t) * np.exp(-t / j(d, 2))
    for f, a, d in modes:
        y += a * np.sin(2 * np.pi * j(f) * t + rng.uniform(0, 0.5)) * np.exp(-t / j(d, 2))
    y += noise * lowpass(rng.standard_normal(len(t)), 4000) * np.exp(-t / 0.0025)
    attack = int(SR * 0.001)
    y[:attack] *= np.linspace(0, 1, attack)
    return lowpass(y, 5000)


# Candidates for the sell bar's clack, after the key's click. Industrial, one
# clean hit, damped so nothing rings: the old coin rattled into four or five
# uneven, boomy hits, and that was what made it clunky.
CANDIDATES = {
    # A contactor pulling in: a solid metal chunk with a short body.
    "contactor": dict(body=(180, 0.8, 0.035), modes=[(780, 0.5, 0.045), (1240, 0.35, 0.030), (1910, 0.18, 0.018), (2870, 0.07, 0.009)]),
    # The money drums: a counter wheel's pawl dropping into its detent.
    "counter": dict(body=(240, 0.5, 0.020), modes=[(1050, 0.45, 0.022), (1620, 0.30, 0.015), (2480, 0.12, 0.008)], noise=0.35),
    # A heavy Bakelite toggle snapping over: drier, less metal.
    "toggle": dict(body=(300, 0.4, 0.015), modes=[(1400, 0.40, 0.012), (2200, 0.20, 0.008)], noise=0.5),
    # A lever latching home: lower and heavier, with the metal on top.
    "latch": dict(body=(120, 1.0, 0.060), modes=[(520, 0.5, 0.060), (830, 0.35, 0.040), (1310, 0.20, 0.025)]),
}


def bakelite_click():
    """The first stage: a key going down, a small dry tick of plastic."""
    t = np.arange(int(SR * 0.04)) / SR
    hiss = lowpass(rng.standard_normal(len(t)), 3500) - lowpass(rng.standard_normal(len(t)), 900)
    y = 0.6 * hiss * np.exp(-t / 0.0012)
    y += 0.3 * np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.005) + 0.15 * np.sin(2 * np.pi * 2900 * t) * np.exp(-t / 0.003)
    return y


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


if __name__ == "__main__":
    import sys
    if sys.argv[1:2] == ["--candidates"]:
        # Every candidate, five presses each, for the sound board.
        OUT = sys.argv[2]
        os.makedirs(OUT, exist_ok=True)
        for name, spec in CANDIDATES.items():
            for k in range(1, 6):
                write(f"{name}-{k}", clack(**spec, jitter=0.04))
        write("bakelite-click", bakelite_click())
        sys.exit()
    # The game's: the sell bar's clack, five presses of one contactor.
    for k in range(1, 6):
        write(f"clack-{k}", clack(**CANDIDATES["contactor"], jitter=0.04))
    # The plant computer's: a lever latching home, heavier, four presses.
    for k in range(1, 5):
        write(f"latch-{k}", clack(**CANDIDATES["latch"], jitter=0.04))
