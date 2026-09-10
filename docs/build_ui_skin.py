"""Cut a UI skin out of Buch's CC0 sci-fi interface sheet.

    python docs/build_ui_skin.py

Reactor Knockoff, this game's parent, drew its buttons from "Sci-fi User
Interface Elements" by Buch on OpenGameArt (CC0). The sheet is a mockup of one
window rather than a kit, so the pieces have to be cut out of it, and it is
drawn in lilac and teal - which would look like a different game bolted onto
this one. So only the *shape* is taken: every colour is remapped onto this
project's own steel ramp by brightness, which keeps Buch's bevels and loses his
palette.

Output is www/ui/*.png, used by CSS border-image. Three pieces earn their
place: a button, a panel, and a frame for the meters. Buch's fill bar does not:
this game paints its meters as a fixed green-amber-red ramp and covers up the
empty part, so that a colour always means the same share of the bar, and a
sprite fill would stretch the ramp instead.
"""

import os
import urllib.request

from PIL import Image

SRC = "https://opengameart.org/sites/default/files/ui_0.psd"
REF = "docs/reference"
OUT = "www/ui"

# The project's palette, darkest first. Source colours are sorted by brightness
# and dealt onto this ramp, so a light edge stays a light edge.
RAMP = ["#07090c", "#0f1318", "#151a21", "#262e39", "#3d4757", "#7b8794", "#c8d3de"]
# What to cut, where from, and how many pixels of each edge are corner rather
# than stretch - the border-image slice.
# Only the outer ring of each crop is used - border-image throws the middle
# away - so a crop may contain lettering as long as it sits further in than the
# slice. The panel is cut from one of the mockup's option rows for that reason:
# the window itself would have been the obvious source, but its top edge is the
# title bar, and a tiled border-image repeated the word INVENTORY along the top
# of every dialog.
PIECES = [
    ("button", (117, 139, 137, 159), RAMP, 8),
    # The same button pressed: Buch runs the highlight along the bottom-right
    # instead of the top-left, so it reads as pushed in. That is the selected
    # state for anything skinned - no colour needed to say "this one".
    ("button-on", (138, 138, 158, 158), RAMP, 8),
    ("panel", (82, 69, 127, 86), RAMP, 6),
    ("meter", (98, 118, 164, 138), RAMP, 8),
]


def rgb(s):
    return tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))


def recolour(im, ramp):
    """Every distinct colour onto the ramp, ordered by brightness."""
    px = im.load()
    seen = {}
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a:
                seen.setdefault((r, g, b), 0.299 * r + 0.587 * g + 0.114 * b)

    order = sorted(seen, key=lambda c: seen[c])
    steps = [rgb(h) for h in ramp]
    # Spread the colours present across the whole ramp rather than matching
    # absolute brightness: the source is a light UI and this one is not.
    mapped = {c: steps[round(i * (len(steps) - 1) / max(1, len(order) - 1))]
              for i, c in enumerate(order)}

    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    dst = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            dst[x, y] = (*mapped[(r, g, b)], a) if a else (0, 0, 0, 0)
    return out


def flatten(im, slice_):
    """Make the four tiled strips uniform along their length.

    border-image tiles the middle of each edge. Buch drew his bevels with the
    corner highlight running a pixel or two into that middle, so tiling a 4px
    strip that starts with one bright pixel puts a bright pixel every 4px along
    the top of the button - a dotted line where an unbroken one belongs. The
    meter frame had it worse: its crop caught the rounded end of the fill, and
    that notch repeated across the bar.

    Each row of the top and bottom strips, and each column of the left and
    right, is set to the colour that already dominates it. Corners are left
    alone - they are drawn once and never repeated.
    """
    px = im.load()
    w, h = im.size

    def dominant(pixels):
        counts = {}
        for p in pixels:
            counts[p] = counts.get(p, 0) + 1
        return max(counts, key=counts.get)

    for y in list(range(slice_)) + list(range(h - slice_, h)):
        span = range(slice_, w - slice_)
        keep = dominant([px[x, y] for x in span])
        for x in span:
            px[x, y] = keep
    for x in list(range(slice_)) + list(range(w - slice_, w)):
        span = range(slice_, h - slice_)
        keep = dominant([px[x, y] for y in span])
        for y in span:
            px[x, y] = keep
    return im


def hollow(im, slice_):
    """Clear everything border-image will discard, so the file is mostly empty."""
    px = im.load()
    for y in range(slice_, im.height - slice_):
        for x in range(slice_, im.width - slice_):
            px[x, y] = (0, 0, 0, 0)
    return im


def main():
    os.makedirs(REF, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    src = f"{REF}/buch-ui.psd"
    if not os.path.exists(src):
        print(f"fetching {SRC}")
        urllib.request.urlretrieve(SRC, src)

    sheet = Image.open(src).convert("RGBA")
    for name, box, ramp, slice_ in PIECES:
        piece = hollow(flatten(recolour(sheet.crop(box), ramp), slice_), slice_)
        piece.save(f"{OUT}/{name}.png")
        size = os.path.getsize(f"{OUT}/{name}.png")
        print(f"{OUT}/{name}.png  {piece.width}x{piece.height}  "
              f"border-image-slice: {slice_}  ({size} bytes)")


if __name__ == "__main__":
    main()
