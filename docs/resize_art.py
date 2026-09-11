"""Store the part art at the size the game actually draws it.

    python docs/resize_art.py 64 32

The sprites arrived at 128x128 with up to 168 colours each. Nothing draws them
that big: the dock shows 31px, a board tile caps at 72px, and only a full
2.5x pinch reaches 180. Three quarters of every sprite was never on screen.

Both axes were measured against the art as drawn, resampled to 180px and
compared channel by channel:

    stored            bytes   mean error   worst
    128, as drawn    61,008            -       -
    128, 48 colours  46,987     0.1/255      51
    96,  32 colours  39,847     1.3/255     160
    64,  32 colours  36,834     3.2/255     143
    32,  32 colours  27,591     4.5/255     140

64 halves cleanly - no resampling artefacts from a fractional ratio - and 32
colours is where the palette stops being a third of every file. At the sizes
the game draws, the difference is not visible; the sheet that settled it is in
the commit that added this script.

This rewrites in place. The 128px originals are in git history, which is the
only copy, so re-run it from there rather than from the shipped art.
"""

import glob
import os
import sys

from PIL import Image

from optimize_art import rewrite


def shrink(path, size, colours):
    with Image.open(path) as src:
        im = src.convert("RGBA")
    if im.width != size:
        im = im.resize((size, size), Image.BOX)

    # Quantise the colour only. Alpha is one bit in this art - a pixel is either
    # part of the sprite or outside it - and a quantiser that is handed the
    # alpha channel spends palette entries on edge transparency instead.
    flat = im.convert("RGB").quantize(colors=colours - 1, method=Image.MEDIANCUT,
                                      dither=Image.NONE).convert("RGB")
    out = Image.new("RGBA", im.size)
    src_px, flat_px, out_px = im.load(), flat.load(), out.load()
    for y in range(im.height):
        for x in range(im.width):
            out_px[x, y] = ((0, 0, 0, 0) if src_px[x, y][3] < 128
                            else (*flat_px[x, y], 255))
    out.save(path)


def main():
    size = int(sys.argv[1]) if len(sys.argv) > 1 else 64
    colours = int(sys.argv[2]) if len(sys.argv) > 2 else 32
    folder = sys.argv[3] if len(sys.argv) > 3 else "www/parts/revival"

    files = sorted(glob.glob(f"{folder}/*.png"))
    before = sum(os.path.getsize(f) for f in files)
    for f in files:
        shrink(f, size, colours)
    after = sum(b for _, b in (rewrite(f) for f in files))
    print(f"{len(files)} sprites at {size}px, {colours} colours: "
          f"{before} -> {after} bytes ({100 - after * 100 // before}% smaller)")


if __name__ == "__main__":
    main()
