"""Stage 0 of adopting Kenney art: look at it before committing to it.

Builds eight sample parts out of Kenney's CC0 Tiny Factory tiles in two
treatments - the art as drawn, and the art remapped onto this game's palette -
installs both as selectable packs, and writes a sheet comparing them with the
shipped Reactor Revival art at the three sizes the game actually draws parts at.

    python docs/kenney_spike.py

Nothing here is meant to survive. The point is to answer one question - which
treatment, if either - and the compositor for the real 75-sprite pack is built
from whichever half of `recolour` wins.

Source zips are downloaded by hand into docs/reference/kenney/ (gitignored).
"""

import io
import json
import os
import zipfile

from PIL import Image

REF = "docs/reference/kenney"
OUT = "www/parts"
SIZE = 64  # 4x a 16px tile: sharp at the 72px board tile, sharp at the 31px dock

# ---- this game's palette, lifted from www/js/sprites.js ---------------------
OUTLINE = (7, 9, 12)
STEEL = [(92, 101, 111), (147, 157, 168)]
SHADOW = (51, 58, 66)
TIER_DARK = [(58, 66, 75), (73, 82, 92)]
TIER_HUE = [None, (45, 78), (105, 58), (215, 68), (0, 62), (275, 68)]
HEAT = (25, 88)
COOLANT = (196, 85)
FUEL_URANIUM = (96, 70)


def hsl(h, s, l):
    """The same hsl(h s% l%) the stylesheet and sprites.js use."""
    s, l = s / 100, l / 100
    c = (1 - abs(2 * l - 1)) * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = l - c / 2
    r, g, b = [(c, x, 0), (x, c, 0), (0, c, x), (0, x, c), (x, 0, c), (c, 0, x)][int(h // 60) % 6]
    return tuple(round((v + m) * 255) for v in (r, g, b))


def shades(hue_sat):
    """A dark and a light shade of one hue, as `shades()` does in sprites.js."""
    h, s = hue_sat
    return [hsl(h, s, 42), hsl(h, s, 62)]


# ---- the sample set --------------------------------------------------------
# Chosen to expose every failure mode: the most-seen sprite, the fan-spin
# centring test at two tiers, a function colour, a flat body that could read as
# a blob at 17px, an almost-all-steel part, and the one category no other pack
# has. (name, source tile index, accent, tier)
SAMPLES = [
    ("cell_1_1", 126, FUEL_URANIUM, None),   # a canister, the closest thing to a fuel rod
    ("vent_1", 114, None, 1),                # a cog: centred and 4-fold, so the fan can spin it
    ("vent_4", 114, None, 4),
    ("exchanger_3", 104, HEAT, 3),           # a pipe cross
    ("capacitor_2", 84, None, 2),            # a panel of indicator lights
    ("plating_5", 22, None, 5),              # a bolted plate
    ("coolant_cell_1", 68, COOLANT, 1),      # a tank, seen from above
    ("accelerator_1", 91, None, 1),          # a ring valve
]


def strip_background(im):
    """Kenney tiles are scenery, not icons - most sit on an opaque backdrop.

    The backdrop is flooded away from the edges rather than replaced globally,
    so a pixel of the same colour inside the machine survives.
    """
    im = im.copy()
    px = im.load()
    w, h = im.size
    corners = [px[0, 0], px[w - 1, 0], px[0, h - 1], px[w - 1, h - 1]]
    bg = max(set(corners), key=corners.count)
    if bg[3] < 128 or corners.count(bg) < 3:
        return im  # already cut out, or no consistent backdrop to remove

    near = lambda c: sum(abs(a - b) for a, b in zip(c[:3], bg[:3])) <= 24 and c[3] >= 128
    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    seen = set()
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and 0 <= y < h) or not near(px[x, y]):
            continue
        seen.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return im


def tiles(pack, size):
    """Every square tile of `size` in a Kenney zip, in name order."""
    z = zipfile.ZipFile(f"{REF}/{pack}.zip")
    out = []
    for n in sorted(x for x in z.namelist() if x.lower().endswith(".png")):
        im = Image.open(io.BytesIO(z.read(n))).convert("RGBA")
        if im.size == (size, size):
            out.append(im)
    return out


def accent_for(tier, accent):
    """A part's colour: its function if it has one, otherwise its tier."""
    if accent:
        return shades(accent)
    if tier == 1 or tier is None:
        return TIER_DARK
    return shades(TIER_HUE[tier - 1])


def recolour(src, tier, accent):
    """Kenney's tile in this game's colours, with this game's outline.

    Kenney draws with its own dark outline and a warm, saturated body. The
    remap keeps the *shape* and throws away the palette: saturated pixels
    become the part's function or tier colour, grey pixels become steel, the
    original outline is dropped, and the hard outline is re-derived the way
    spriteFor() does - any empty pixel touching a painted one.
    """
    w, h = src.size
    px = src.load()
    body = accent_for(tier, accent)

    # Luminance of every opaque pixel, to split shadow from body from highlight.
    lums = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a >= 128:
                lums.append(0.299 * r + 0.587 * g + 0.114 * b)
    if not lums:
        return src.copy()
    lo, hi = min(lums), max(lums)
    span = max(hi - lo, 1)

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dst = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            t = (lum - lo) / span
            # Kenney's own outline is the darkest band - drop it and re-derive.
            if t < 0.18:
                continue
            mx, mn = max(r, g, b), min(r, g, b)
            saturated = (mx - mn) / max(mx, 1) > 0.30
            ramp = body if saturated else STEEL
            dst[x, y] = (*(SHADOW if t < 0.42 and not saturated else ramp[t >= 0.72]), 255)

    # The derived outline, exactly as sprites.js does it.
    painted = [[dst[x, y][3] > 0 for y in range(h)] for x in range(w)]
    for y in range(h):
        for x in range(w):
            if painted[x][y]:
                continue
            if any(0 <= x + dx < w and 0 <= y + dy < h and painted[x + dx][y + dy]
                   for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                dst[x, y] = (*OUTLINE, 255)
    return out


def mark_tier(im, tier):
    """A tier-coloured frame.

    Raw Kenney tiles carry no tier of their own, so without this all six vents
    would be the same picture. Both treatments get it, so the comparison is
    about the body art and not about which one happens to show a tier.
    """
    if not tier or tier < 2:
        return im
    c = (*shades(TIER_HUE[tier - 1])[1], 255)
    px = im.load()
    w, h = im.size
    for i in range(w):
        for x, y in ((i, 0), (i, h - 1), (0, i), (w - 1, i)):
            px[x, y] = c
    return im


def build(treatment):
    """The eight samples, as one pack directory. Returns the names written."""
    factory = tiles("tiny-factory", 16)
    dst = f"{OUT}/{treatment}"
    os.makedirs(dst, exist_ok=True)
    names = []
    for name, index, accent, tier in SAMPLES:
        src = strip_background(factory[index])
        art = src.copy() if treatment == "kenney_raw" else recolour(src, tier, accent)
        art = mark_tier(art, tier)
        art.resize((SIZE, SIZE), Image.NEAREST).save(f"{dst}/{name}.png")
        names.append(name)
    return names


def sheet(path):
    """Revival against both treatments, at the sizes the game draws parts at."""
    scales = [(17, "17px  locked tier"), (31, "31px  dock"), (72, "72px  board tile")]
    rows = [("revival", "Reactor Revival (shipped)"), ("kenney_raw", "Kenney, as drawn"),
            ("kenney_steel", "Kenney, this game's palette")]
    pad, label_w, gap = 14, 210, 10

    width = label_w + len(SAMPLES) * (72 + gap) + pad
    height = pad + sum(28 + len(rows) * (s + gap) + 18 for s, _ in scales)
    img = Image.new("RGB", (width, height), (11, 13, 16))
    from PIL import ImageDraw
    d = ImageDraw.Draw(img)

    y = pad
    for scale, caption in scales:
        d.text((pad, y), caption, fill=(200, 211, 222))
        y += 24
        for pack, label in rows:
            d.text((pad, y + scale // 2 - 6), label, fill=(123, 135, 148))
            for i, (name, *_ ) in enumerate(SAMPLES):
                f = f"{OUT}/{pack}/{name}.png"
                x = label_w + i * (72 + gap)
                # The tile the part is actually drawn on, from app.css.
                d.rectangle([x - 3, y - 3, x + scale + 2, y + scale + 2],
                            fill=(15, 19, 24), outline=(38, 46, 57))
                if os.path.exists(f):
                    img.paste(Image.open(f).convert("RGBA").resize((scale, scale), Image.NEAREST),
                              (x, y), Image.open(f).convert("RGBA").resize((scale, scale), Image.NEAREST))
            y += scale + gap
        y += 18
    img.save(path)
    return img.size


def main():
    manifest_path = f"{OUT}/packs.json"
    with open(manifest_path, encoding="utf-8") as f:
        manifest = json.load(f)  # revival stays first: a test checks the order

    for treatment in ("kenney_raw", "kenney_steel"):
        manifest[treatment] = build(treatment)
        print(f"{treatment}: {len(manifest[treatment])} samples")

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, separators=(",", ":"))
    print("packs:", list(manifest))

    out = f"{REF}/spike-sheet.png"
    print("sheet:", out, sheet(out))


if __name__ == "__main__":
    main()
