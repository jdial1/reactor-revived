"""Build the Reactor Revived part pack: ten drawn shapes to 75 sprites.

    python docs/build_revived_pack.py

Ten 16x16 grids are the whole of the hand-drawn input. Everything else is
derived here, which is the point: the packs we surveyed all failed on coherence
because 75 sprites drawn separately never agree with each other about light,
weight or palette. Deriving them from one set of shapes and one palette makes
that impossible by construction.

    54 components  = 9 shapes x 6 tiers   (tier colour + tier hardware)
    21 fuel cells  = 1 rod  x 7 fuels x 3 pack sizes

The palette, the light source, the derived outline and the tier ramp are all
lifted from www/js/sprites.js so this pack and the generated one are siblings.

The vent is not drawn but generated: its blades are laid out in polar
coordinates with the angle taken modulo 90 degrees, so the four-fold symmetry
the fan animation needs is structural rather than something to check for. The
tile spins this sprite about its own centre at 166%, and a hub that is off
centre or asymmetric visibly wobbles.
"""

import json
import math
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from install_art_packs import load_manifest  # noqa: E402  (manifest merge, not overwrite)
from optimize_art import rewrite             # noqa: E402  (verified-lossless repack)

GRID = 16
SCALE = 2          # painted as 2x2 blocks, so the files are 32x32, as sprites.js does
OUT = "www/parts"
PACK = "revived"

# ---- palette, from www/js/sprites.js ---------------------------------------
OUTLINE = (7, 9, 12)
STEEL = [(92, 101, 111), (147, 157, 168)]
SHADOW = [(51, 58, 66)] * 2
SHINE = [(200, 208, 216), (238, 243, 247)]
TIER_DARK = [(58, 66, 75), (73, 82, 92)]
TIER_HUE = [None, (45, 78), (105, 58), (215, 68), (0, 62), (275, 68)]
HEAT, COOLANT = (25, 88), (196, 85)
FUEL_HUE = {"uranium": 96, "plutonium": 40, "thorium": 172, "seaborgium": 210,
            "dolorium": 268, "nefastium": 330, "protium": 186}

# Which categories carry a function colour instead of a tier one in their core.
CORE = {"vent": HEAT, "heat_exchanger": HEAT, "heat_inlet": HEAT, "heat_outlet": HEAT,
        "coolant_cell": COOLANT, "particle_accelerator": (275, 68)}

# The filename stem each category uses, matching knockoffStyle() in www/js/art.js.
STEM = {"vent": "vent", "heat_exchanger": "exchanger", "heat_inlet": "inlet",
        "heat_outlet": "outlet", "coolant_cell": "coolant_cell", "reflector": "reflector",
        "capacitor": "capacitor", "reactor_plating": "plating",
        "particle_accelerator": "accelerator"}


def hsl(h, s, light):
    """The hsl(h s% l%) the stylesheet and sprites.js both use."""
    s, light = s / 100, light / 100
    c = (1 - abs(2 * light - 1)) * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = light - c / 2
    r, g, b = [(c, x, 0), (x, c, 0), (0, c, x), (0, x, c), (x, 0, c), (c, 0, x)][int(h // 60) % 6]
    return tuple(round((v + m) * 255) for v in (r, g, b))


def shades(hue_sat):
    """A dark and a light shade of one hue, as shades() does in sprites.js."""
    h, s = hue_sat
    return [hsl(h, s, 42), hsl(h, s, 62)]


# ---- the vent, generated so its symmetry cannot drift -----------------------

def fan(hub=1.5, outer=4.9, sweep=58, skew=13):
    """A four-bladed fan. The blade test reads the angle modulo 90 degrees, so
    the sprite is identical under a quarter turn however the radii are tuned."""
    c = (GRID - 1) / 2
    rows = []
    for y in range(GRID):
        line = ""
        for x in range(GRID):
            r = math.hypot(x - c, y - c)
            if r > 7.0:
                line += "."
            elif r > 6.1:
                line += "S"      # housing rim
            elif r > 5.4:
                line += "T"      # the band that carries the tier
            elif r > outer:
                line += "D"      # the recess the blades turn in
            elif r <= hub:
                line += "S"      # hub
            else:
                a = (math.degrees(math.atan2(y - c, x - c)) - skew * (r - hub)) % 90
                line += "S" if a < sweep else "D"
        rows.append(line)
    return rows


# ---- the nine drawn shapes -------------------------------------------------
# `.` transparent, S steel, D dark steel, H highlight, T tier band,
# C core (function colour), L core highlight. The outline is never drawn: it is
# derived from any empty cell touching a painted one, as spriteFor() does.

SHAPES = {
    "vent": fan(),
    "heat_exchanger": [
        "................", "................", "......SSSS......", "......STTS......",
        "......STTS......", "..SSSSSDDSSSSS..", "..STTTDDDDTTTS..", "..STTDSSSSDTTS..",
        "..STTDSSSSDTTS..", "..STTTDDDDTTTS..", "..SSSSSDDSSSSS..", "......STTS......",
        "......STTS......", "......SSSS......", "................", "................",
    ],
    "heat_inlet": [
        "................", "..SSSSSSSSSSSS..", "..SDDDDDDDDDDS..", "..SDTTTTTTTTDS..",
        "...SSTTTTTTSS...", "....SSTTTTSS....", ".....SSTTSS.....", ".....STTTTS.....",
        ".....STTTTS.....", ".....STTTTS.....", ".....SDDDDS.....", ".....STTTTS.....",
        ".....SSSSSS.....", "................", "................", "................",
    ],
    "coolant_cell": [
        "................", "...SSSSSSSSSS...", "..SSTTTTTTTTSS..", "..STDDDDDDDDTS..",
        "..STDCCCCCCDTS..", "..STDCCLCCCDTS..", "..STDCCCCCCDTS..", "..STDCCCCCCDTS..",
        "..STDCCCCCCDTS..", "..STDCCCCCCDTS..", "..STDDDDDDDDTS..", "..SSTTTTTTTTSS..",
        "...SSSSSSSSSS...", "................", "................", "................",
    ],
    "reflector": [
        "................", "....SSSSSSSS....", "...STTTTTTTTS...", "..STTHHHHHHTTS..",
        ".STTHHHHHHHHTTS.", ".STHHHHHHHHHHTS.", ".STHHHHHHHHHHTS.", ".STHHHHHHHHHHTS.",
        ".STHHHHHHHHHHTS.", ".STTHHHHHHHHTTS.", "..STTHHHHHHTTS..", "...STTTTTTTTS...",
        "....SSSSSSSS....", "................", "................", "................",
    ],
    "capacitor": [
        "................", "....SS....SS....", "....SS....SS....", "..SSSSSSSSSSSS..",
        "..STTTTTTTTTTS..", "..STDDDDDDDDTS..", "..STSHHHHHHSTS..", "..STSHHHHHHSTS..",
        "..STSHHHHHHSTS..", "..STSHHHHHHSTS..", "..STDDDDDDDDTS..", "..STTTTTTTTTTS..",
        "..SSSSSSSSSSSS..", "................", "................", "................",
    ],
    "reactor_plating": [
        "................", "..SSSSSSSSSSSS..", "..STTTTTTTTTTS..", "..STHDSSSSDHTS..",
        "..STDSSSSSSDTS..", "..STSSSSSSSSTS..", "..STSSSSSSSSTS..", "..STSSSSSSSSTS..",
        "..STSSSSSSSSTS..", "..STDSSSSSSDTS..", "..STHDSSSSDHTS..", "..STTTTTTTTTTS..",
        "..SSSSSSSSSSSS..", "................", "................", "................",
    ],
    "particle_accelerator": [
        "................", "......SSSS......", ".....STTTTS.....", "...STSDDDDSTS...",
        "..STSDDCCDDSTS..", ".STSDCLLLLCDSTS.", ".STDCCCCCCCCDTS.", ".STDCCCCCCCCDTS.",
        ".STSDCLLLLCDSTS.", "..STSDDCCDDSTS..", "...STSDDDDSTS...", ".....STTTTS.....",
        "......SSSS......", "................", "................", "................",
    ],
}
# An outlet is an inlet upside down; drawing it twice would only let them drift.
SHAPES["heat_outlet"] = SHAPES["heat_inlet"][::-1]

FUEL_ROD = [
    "................", "................", "......SSSS......", "......SDDS......",
    "......SCLS......", "......SCCS......", "......SCLS......", "......SCCS......",
    "......SCLS......", "......SCCS......", "......SCLS......", "......SDDS......",
    "......SSSS......", "................", "................", "................",
]


# ---- tier hardware, from TIER_TRIM in sprites.js ---------------------------

def trim(tier):
    """The cells the tier's hardware occupies. Laid under the body, so a part
    is recognisable by shape as well as by colour."""
    cells = set()
    box = lambda x0, y0, x1, y1: {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)}
    if tier == 2:                                   # rails down both sides
        cells |= box(0, 4, 1, 11) | box(14, 4, 15, 11)
    elif tier == 3:                                 # corner brackets
        for x0, y0 in ((0, 0), (11, 0), (0, 11), (11, 11)):
            cells |= box(x0, y0, x0 + 4, y0 + 1) | box(x0 + (0 if x0 == 0 else 3), y0, x0 + (1 if x0 == 0 else 4), y0 + 4)
    elif tier == 4:                                 # a containment ring
        c = (GRID - 1) / 2
        cells |= {(x, y) for x in range(GRID) for y in range(GRID)
                  if 6.4 <= math.hypot(x - c, y - c) <= 7.4}
    elif tier == 5:                                 # louvres across the face
        cells |= box(0, 0, 15, 1) | box(0, 7, 15, 8) | box(0, 14, 15, 15)
    elif tier == 6:                                 # a full cage
        cells |= {(x, y) for x in range(GRID) for y in range(GRID)
                  if not (2 <= x <= 13 and 2 <= y <= 13)}
    return cells


def paint(rows, tier, core, extra_trim=True):
    """One 16x16 grid of material letters to a 32x32 RGBA image."""
    tier_shade = TIER_DARK if tier == 1 else shades(TIER_HUE[tier - 1])
    palette = {"S": STEEL, "D": SHADOW, "H": SHINE, "T": tier_shade,
               "C": core, "L": [core[1], (255, 255, 255)]}

    material = {}
    if extra_trim:
        for x, y in trim(tier):
            material[(x, y)] = "T"          # hardware first, so the body sits on top
    for y in range(GRID):
        for x in range(GRID):
            ch = rows[y][x]
            if ch != ".":
                material[(x, y)] = ch

    im = Image.new("RGBA", (GRID * SCALE, GRID * SCALE), (0, 0, 0, 0))
    px = im.load()
    def put(x, y, rgb):
        for j in range(SCALE):
            for i in range(SCALE):
                px[x * SCALE + i, y * SCALE + j] = (*rgb, 255)

    for (x, y), ch in material.items():
        # One light source at the top left, exactly as sprites.js does it.
        put(x, y, palette[ch][1 if x + y < GRID - 1 else 0])
    for y in range(GRID):
        for x in range(GRID):
            if (x, y) in material:
                continue
            if any((x + a, y + b) in material for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                put(x, y, OUTLINE)
    return im


# ---- fuel cells: one rod, three layouts, seven hues ------------------------

def rod_layout(count):
    """The rod placed once, twice or four times inside the 16x16 box."""
    rod = [list(r) for r in FUEL_ROD]
    if count == 1:
        return ["".join(r) for r in rod]

    # Columns 6..9 hold the rod; lift that 4-wide strip out and re-place it.
    strip = [[rod[y][x] for x in range(6, 10)] for y in range(GRID)]
    out = [["." for _ in range(GRID)] for _ in range(GRID)]

    def stamp(ox, oy, rowsrc):
        for y, line in enumerate(rowsrc):
            for x, ch in enumerate(line):
                if ch != "." and 0 <= oy + y < GRID and 0 <= ox + x < GRID:
                    out[oy + y][ox + x] = ch

    if count == 2:
        stamp(3, 0, strip)
        stamp(9, 0, strip)
    else:
        # Half-height rods for the quad: keep both caps, drop the middle.
        short = strip[2:6] + strip[9:13]
        stamp(3, 0, short)
        stamp(9, 0, short)
        stamp(3, 8, short)
        stamp(9, 8, short)
    return ["".join(r) for r in out]


def build():
    dst = f"{OUT}/{PACK}"
    os.makedirs(dst, exist_ok=True)
    names = []

    for category, rows in SHAPES.items():
        for tier in range(1, 7):
            core = shades(CORE.get(category, TIER_HUE[tier - 1] or (210, 6)))
            paint(rows, tier, core).save(f"{dst}/{STEM[category]}_{tier}.png")
            names.append(f"{STEM[category]}_{tier}")

    for i, (fuel, hue) in enumerate(FUEL_HUE.items(), start=1):
        for count in (1, 2, 4):
            stem = f"xcell_1_{count}" if fuel == "protium" else f"cell_{i}_{count}"
            # A cell's colour is its element, and its tier is its pack size, so
            # no tier hardware here - the layout already says which one it is.
            paint(rod_layout(count), 1, shades((hue, 70)), extra_trim=False).save(f"{dst}/{stem}.png")
            names.append(stem)

    return sorted(names)


def main():
    names = build()
    saved = [rewrite(f"{OUT}/{PACK}/{n}.png") for n in names]
    print(f"{PACK}: {len(names)} sprites, "
          f"{sum(a for a, _ in saved) // 1024} KB packed down to {sum(b for _, b in saved) // 1024} KB")

    manifest = load_manifest()
    manifest[PACK] = names
    with open(f"{OUT}/packs.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, separators=(",", ":"))
    print("packs:", list(manifest))


if __name__ == "__main__":
    main()
