"""Turn a part sprite into an SVG of merged rectangles, pixel for pixel.

    python docs/svg_from_png.py www/parts/revival

Every pixel becomes part of exactly one <path>, greedily grown right and then
down while the colour matches, so a flat area costs one rectangle rather than
one per pixel. The result is verified by rebuilding the pixel grid from the
rectangles and comparing it to the source: identical, or nothing is written.

It is a measurement, not a pipeline. For this project's art SVG loses to PNG at
every size and colour count that was tried, because 128x128 shaded sprites with
~150 colours need ~25,000 rectangles, and XML - even gzipped - cannot beat
palette indices under deflate:

    source                  PNG       SVG gzipped
    128px, as drawn          61 KB     151 KB
    64px                     59 KB     158 KB
    32px                     43 KB      94 KB
    32px, 8 colours          16 KB      39 KB
    64px, 32 colours (now)   37 KB     120 KB

SVG wins when a sprite is genuinely blocky - a dozen colours in flat runs, as
hand-drawn pixel art is. Nothing in www/parts/revival is: only 14 of the 75
sprites survived a 2x2 uniformity test at 128px, so they are smooth-shaded art
that happens to be stored as pixels. The art has since been stored at 64px and
32 colours, which moves it closer to SVG's ground - re-run this to check.
"""

import glob
import os
import sys

from PIL import Image


def rectangles(im):
    """Cover every opaque pixel with as few equal-colour rectangles as possible."""
    w, h = im.size
    px = im.load()
    taken = [[False] * w for _ in range(h)]
    out = []
    for y in range(h):
        for x in range(w):
            if taken[y][x]:
                continue
            colour = px[x, y]
            if colour[3] == 0:
                taken[y][x] = True
                continue
            x2 = x
            while x2 + 1 < w and not taken[y][x2 + 1] and px[x2 + 1, y] == colour:
                x2 += 1
            y2 = y
            while y2 + 1 < h and all(not taken[y2 + 1][i] and px[i, y2 + 1] == colour
                                     for i in range(x, x2 + 1)):
                y2 += 1
            for j in range(y, y2 + 1):
                for i in range(x, x2 + 1):
                    taken[j][i] = True
            out.append((x, y, x2 - x + 1, y2 - y + 1, colour))
    return out


def render(boxes, size):
    """The pixel grid those rectangles describe, for checking against the source."""
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    px = out.load()
    for x, y, w, h, colour in boxes:
        for j in range(y, y + h):
            for i in range(x, x + w):
                px[i, j] = colour
    return out


def svg(im):
    w, h = im.size
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"'
             ' shape-rendering="crispEdges">']
    for x, y, rw, rh, c in rectangles(im):
        fill = "#%02x%02x%02x" % c[:3]
        alpha = "" if c[3] == 255 else f' fill-opacity="{round(c[3] / 255, 3)}"'
        # A path costs less than a <rect> with four attributes.
        parts.append(f'<path fill="{fill}"{alpha} d="M{x} {y}h{rw}v{rh}h-{rw}z"/>')
    parts.append("</svg>")
    return "".join(parts)


def convert(path, out_dir):
    with Image.open(path) as src:
        im = src.convert("RGBA")
    boxes = rectangles(im)
    if render(boxes, im.size).tobytes() != im.tobytes():
        return None                       # not pixel for pixel; refuse to write it
    name = os.path.splitext(os.path.basename(path))[0]
    dst = f"{out_dir}/{name}.svg"
    with open(dst, "w", encoding="utf-8") as f:
        f.write(svg(im))
    return len(boxes), os.path.getsize(path), os.path.getsize(dst)


def main():
    folder = sys.argv[1] if len(sys.argv) > 1 else "www/parts/revival"
    out_dir = sys.argv[2] if len(sys.argv) > 2 else "docs/reference/svg"
    os.makedirs(out_dir, exist_ok=True)

    boxes = png = svgs = 0
    files = sorted(glob.glob(f"{folder}/*.png"))
    for f in files:
        got = convert(f, out_dir)
        if got is None:
            sys.exit(f"{f}: rectangles do not reproduce the source")
        b, p, s = got
        boxes += b
        png += p
        svgs += s
    print(f"{len(files)} sprites, {boxes} rectangles, all verified pixel for pixel")
    print(f"PNG {png} bytes -> SVG {svgs} bytes ({svgs / max(png, 1):.1f}x)")


if __name__ == "__main__":
    main()
