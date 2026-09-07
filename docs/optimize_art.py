"""Shrink the shipped part artwork without changing a single pixel.

    python docs/optimize_art.py www/parts/revival

The packs arrive as 32-bit RGBA, but none of this art uses more than a couple
of hundred colours, so every file fits in a palette - and a palette entry is
one byte, or fewer once Pillow drops to the smallest bit depth that holds the
colour count. That is the whole trick, and it takes about a third off.

Every file is verified pixel-identical after rewriting; a file that would not
round-trip exactly is left exactly as it was.
"""

import glob
import os
import sys

from PIL import Image

LIMIT = 256  # a PNG palette holds this many colours


def paletted(src):
    """The same image in palette mode, colour for colour. None if it won't fit.

    Pillow's own quantisers approximate - they are for reducing colours, not
    for indexing an image that is already inside the limit - so the palette is
    built by hand from the colours actually present.
    """
    colours = src.getcolors(LIMIT)
    if not colours:
        return None
    index = {bytes(rgba): i for i, (_, rgba) in enumerate(colours)}

    raw = src.tobytes()
    out = Image.frombytes("P", src.size,
                          bytes(index[raw[i:i + 4]] for i in range(0, len(raw), 4)))
    out.putpalette(b"".join(bytes(c[:3]) for _, c in colours), "RGB")
    # Alpha lives in a tRNS chunk, one byte per palette entry.
    out.info["transparency"] = bytes(c[3] for _, c in colours)
    return out


def rewrite(path):
    """Re-encode one PNG as tightly as possible. Returns (before, after)."""
    before = os.path.getsize(path)
    src = Image.open(path).convert("RGBA")

    out = paletted(src)
    if out is None:
        return before, before  # too many colours to palette losslessly

    tmp = path + ".opt.png"
    out.save(tmp, optimize=True, compress_level=9)

    if Image.open(tmp).convert("RGBA").tobytes() != src.tobytes():
        os.remove(tmp)  # not lossless - keep what we had
        return before, before

    after = os.path.getsize(tmp)
    if after >= before:
        os.remove(tmp)
        return before, before
    os.replace(tmp, path)
    return before, after


def main():
    for folder in sys.argv[1:] or glob.glob("www/parts/*/"):
        sizes = [rewrite(f) for f in sorted(glob.glob(f"{folder}/*.png"))]
        was, now = sum(s[0] for s in sizes), sum(s[1] for s in sizes)
        print(f"{folder}: {len(sizes)} files  {was // 1024} KB -> {now // 1024} KB"
              f"  ({100 - now * 100 // max(was, 1)}% smaller)")


if __name__ == "__main__":
    main()
