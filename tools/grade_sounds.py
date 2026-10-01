"""Grade the game's sounds for pleasantness, as a phone plays them.

Each cue, rendered by tools/render_cues.mjs, is put through a model of a phone
speaker (next to nothing under 300 Hz) and measured: sharpness (Zwicker-style,
on the Bark scale), the share of energy over 2 kHz, the high ring still sounding
60 ms after the hit, the peak level, and the length. A soft, warm, short tok
scores 100; the README's Sound section has the grades.

    python3 tools/grade_sounds.py --dir <renders> place sell coin ...
"""
import numpy as np, sys, json, os
SR = 44100
def bark(f): return 13*np.arctan(0.00076*f) + 3.5*np.arctan((f/7500)**2)
def phone(x):
    # A phone's speaker: next to nothing under 300 Hz, rolling off from 450 Hz
    # down (a 4th-order high-pass), and little above 12 kHz.
    n = 1 << int(np.ceil(np.log2(len(x) + 1)))
    X = np.fft.rfft(x, n)
    f = np.fft.rfftfreq(n, 1/SR)
    hp = 1 / np.sqrt(1 + (450/np.maximum(f, 1))**8)
    lp = 1 / np.sqrt(1 + (f/12000)**4)
    return np.fft.irfft(X*hp*lp, n)[:len(x)]
def analyse(x):
    x = np.asarray(x, dtype=np.float64)
    full_peak = np.max(np.abs(x)) + 1e-12
    x = phone(x)
    audible = 20*np.log10((np.max(np.abs(x)) + 1e-12) / full_peak)
    peak = np.max(np.abs(x)) + 1e-12
    env = np.convolve(np.abs(x), np.ones(441)/441, mode="same")
    above = np.where(env > peak * 10**(-40/20))[0]
    dur = (above[-1] - above[0]) / SR if len(above) else 0
    start = above[0] if len(above) else 0
    seg = x[start:start + int(SR*0.6)]
    n = 1 << int(np.ceil(np.log2(max(len(seg), 2048))))
    spec = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), n))**2
    f = np.fft.rfftfreq(n, 1/SR)
    E = spec.sum() + 1e-20
    centroid = (spec*f).sum()/E
    hf2 = spec[f > 2000].sum()/E
    hf4 = spec[f > 4000].sum()/E
    z = bark(np.maximum(f, 1))
    g = np.where(z < 16, 1.0, 0.066*np.exp(0.171*z))
    sharp = 0.11 * (spec*g*z).sum()/E
    # The ring: high band energy still sounding 60 ms after the hit, against the whole.
    late = x[start + int(SR*0.06): start + int(SR*0.6)]
    if len(late) > 256:
        nl = 1 << int(np.ceil(np.log2(len(late))))
        sl = np.abs(np.fft.rfft(late*np.hanning(len(late)), nl))**2
        fl = np.fft.rfftfreq(nl, 1/SR)
        ring = sl[fl > 2000].sum() / E * (n/nl)
    else:
        ring = 0.0
    rms = 20*np.log10(np.sqrt(np.mean(seg[:int(SR*0.1)]**2)) + 1e-9)
    pk = 20*np.log10(peak)
    attack = (np.argmax(np.abs(x)) - start) / SR * 1000
    return dict(audible=audible, dur=dur, centroid=centroid, hf2=hf2, hf4=hf4, sharp=sharp, ring=ring, rms=rms, peak=pk, attack_ms=attack)
def score(m):
    # 100 is a soft, warm, short tok as a phone plays it. Points off for
    # sharpness, energy over 2 kHz, the ring still sounding after 60 ms, a peak
    # that stands out from the rest (over -18 dBFS through the phone), and a
    # long tail on something pressed often.
    s = (100 - 60*max(0, m["sharp"] - 0.4) - 120*m["hf2"] - 2.0*max(0, m["peak"] + 18)
         - 300*m["ring"] - 20*max(0, m["dur"] - 0.3))
    return max(0, min(100, s))
def grade(s): return "A" if s >= 85 else "B" if s >= 70 else "C" if s >= 55 else "D" if s >= 40 else "F"
args = sys.argv[1:]
if args[:1] == ["--dir"]:
    os.chdir(args[1])
    args = args[2:]
names = args
rows = []
for nm in names:
    x = np.fromfile(f"{nm}.f32", dtype=np.float32)
    m = analyse(x); sc = score(m)
    rows.append((nm, m, sc))
print(f"{'cue':14} {'grade':5} {'score':>5} {'sharp':>6} {'centroid':>8} {'>2k':>5} {'>4k':>5} {'ring':>6} {'peak':>6} {'dur':>5} {'left':>6}")
for nm, m, sc in rows:
    print(f"{nm:14} {grade(sc):5} {sc:5.0f} {m['sharp']:6.2f} {m['centroid']:8.0f} {m['hf2']:5.2f} {m['hf4']:5.2f} {m['ring']:6.3f} {m['peak']:6.1f} {m['dur']:5.2f} {m['audible']:6.1f}")
