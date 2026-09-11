"""Shrink the shipped artwork without changing a single pixel.

    python docs/optimize_art.py www/parts/revival www/ui

Pillow reads; the PNG is written here, by hand, out of zlib and struct. That is
not showing off - it is the only way to control the three things that were
costing real bytes:

  * **The palette order.** A palette PNG stores alpha in a tRNS chunk, one byte
    per entry, and the chunk may stop early: entries past its end are opaque.
    Every sprite in this game has exactly one or two transparent colours out of
    up to 168, so putting those first turns an 87-byte tRNS into a 1-byte one.
  * **The bit depth.** A sprite with twelve colours does not need eight bits an
    index. Four bits halves its IDAT.
  * **The filter.** PNG picks one of five filters per scanline. At this size
    every one can simply be tried across the whole image, along with three
    deflate strategies and seven window sizes, and the smallest kept.

Every file is verified pixel-identical after rewriting; anything that will not
round-trip exactly is left exactly as it was.
"""

import glob
import os
import struct
import sys
import zlib

from PIL import Image

LIMIT = 256              # a PNG palette holds this many colours
DEPTHS = (1, 2, 4, 8)    # the palette bit depths PNG allows
STRATEGIES = (zlib.Z_DEFAULT_STRATEGY, zlib.Z_FILTERED, zlib.Z_RLE)
# A window bigger than the image buys nothing and occasionally costs a byte or
# two, so the window is swept as well. These files are a kilobyte; it is free.
WINDOWS = range(9, 16)


def chunk(kind, body):
    return (struct.pack(">I", len(body)) + kind + body
            + struct.pack(">I", zlib.crc32(kind + body)))


def indexed(src):
    """(indices, palette, alphas) with the see-through colours first.

    Ordering by alpha is what lets tRNS stop after an entry or two. Ties are
    broken by how often a colour appears, so the commonest index is the lowest
    - which costs nothing and helps the filters a little.
    """
    colours = src.getcolors(LIMIT)
    if not colours:
        return None
    colours.sort(key=lambda c: (c[1][3], -c[0]))
    index = {bytes(rgba): i for i, (_, rgba) in enumerate(colours)}
    raw = src.tobytes()
    return (bytes(index[raw[i:i + 4]] for i in range(0, len(raw), 4)),
            b"".join(bytes(c[:3]) for _, c in colours),
            bytes(c[3] for _, c in colours))


def pack(indices, w, h, depth):
    """One scanline per row, `depth` bits per index, rows byte-aligned."""
    if depth == 8:
        return [indices[y * w:(y + 1) * w] for y in range(h)]
    per = 8 // depth
    rows = []
    for y in range(h):
        row, acc, n = bytearray(), 0, 0
        for x in range(w):
            acc = (acc << depth) | indices[y * w + x]
            n += 1
            if n == per:
                row.append(acc)
                acc, n = 0, 0
        if n:
            row.append(acc << (depth * (per - n)))
        rows.append(bytes(row))
    return rows


def line(row, prior, bpp, kind):
    """One scanline under one filter."""
    if kind == 0:
        return row
    out = bytearray()
    for i, x in enumerate(row):
        a = row[i - bpp] if i >= bpp else 0
        b = prior[i]
        c = prior[i - bpp] if i >= bpp else 0
        if kind == 1:
            v = x - a
        elif kind == 2:
            v = x - b
        elif kind == 3:
            v = x - (a + b) // 2
        else:
            p = a + b - c
            pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
            v = x - (a if pa <= pb and pa <= pc else b if pb <= pc else c)
        out.append(v & 0xFF)
    return bytes(out)


def bodies(rows, bpp):
    """Every whole-image filter choice worth trying.

    The usual per-scanline heuristic is tuned for photographs, where a byte is
    a brightness. These are palette indices, where the number means nothing and
    subtracting one index from another is noise - so filtering often makes the
    file *bigger* here, and the honest thing at 32x32 is to try each filter
    across the whole image, plus the heuristic, and let the deflater decide.
    """
    out = []
    for kind in range(5):
        body, prior = bytearray(), bytes(len(rows[0]))
        for row in rows:
            body += bytes([kind]) + line(row, prior, bpp, kind)
            prior = row
        out.append(bytes(body))

    body, prior = bytearray(), bytes(len(rows[0]))
    for row in rows:
        best = min((line(row, prior, bpp, k) for k in range(5)),
                   key=lambda l: sum(min(v, 256 - v) for v in l))
        kind = next(k for k in range(5) if line(row, prior, bpp, k) == best)
        body += bytes([kind]) + best
        prior = row
    out.append(bytes(body))
    return out


def deflate(data):
    best = None
    for window in WINDOWS:
        for strategy in STRATEGIES:
            c = zlib.compressobj(9, zlib.DEFLATED, window, 9, strategy)
            out = c.compress(data) + c.flush()
            if best is None or len(out) < len(best):
                best = out
    return best


def encode(src):
    """One RGBA image as the smallest palette PNG that reproduces it exactly."""
    got = indexed(src)
    if got is None:
        return None
    indices, palette, alphas = got
    w, h = src.size
    count = len(palette) // 3
    depth = next(d for d in DEPTHS if count <= 1 << d)

    # tRNS may stop as soon as every remaining entry is opaque.
    opaque = len(alphas)
    while opaque and alphas[opaque - 1] == 255:
        opaque -= 1

    rows = pack(indices, w, h, depth)
    idat = min((deflate(b) for b in bodies(rows, 1)), key=len)
    out = b"\x89PNG\r\n\x1a\n"
    out += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, depth, 3, 0, 0, 0))
    out += chunk(b"PLTE", palette)
    if opaque:
        out += chunk(b"tRNS", alphas[:opaque])
    out += chunk(b"IDAT", idat)
    out += chunk(b"IEND", b"")
    return out


def rewrite(path):
    """Re-encode one PNG as tightly as possible. Returns (before, after)."""
    before = os.path.getsize(path)
    # Pillow holds the file open until it is told not to, and Windows will not
    # replace a file with an open handle on it.
    with Image.open(path) as im:
        src = im.convert("RGBA")

    data = encode(src)
    if data is None or len(data) >= before:
        return before, before

    tmp = path + ".opt.png"
    with open(tmp, "wb") as f:
        f.write(data)
    with Image.open(tmp) as check:
        same = check.convert("RGBA").tobytes() == src.tobytes()
    if not same:
        os.remove(tmp)               # not lossless - keep what we had
        return before, before
    os.replace(tmp, path)
    return before, len(data)


def main():
    folders = sys.argv[1:] or ["www/parts/revival", "www/ui"]
    was = now = 0
    for folder in folders:
        sizes = [rewrite(f) for f in sorted(glob.glob(f"{folder}/*.png"))]
        a, b = sum(s[0] for s in sizes), sum(s[1] for s in sizes)
        was, now = was + a, now + b
        print(f"{folder}: {len(sizes)} files  {a} -> {b} bytes "
              f"({100 - b * 100 // max(a, 1)}% smaller)")
    if len(folders) > 1:
        print(f"total: {was} -> {now} bytes ({100 - now * 100 // max(was, 1)}% smaller)")


if __name__ == "__main__":
    main()
