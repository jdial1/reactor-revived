"""Derive the cell glow masks from the cell sprites themselves.

    python docs/derive_glow.py

A cell's glow is a white alpha mask, tinted by CSS, drawn over the sprite at
the same size and position (www/css/app.css, .tile .glow). Pack light masks are
the wrong shape for these rods, so each mask here is the fuel inside the glass:
every pixel that is fuel-coloured in any of the seven cell sprites of that size
(six fuels and protium share one geometry), grown by one pixel and softened, so
it lines up with the rods and bleeds a little onto the glass.

Writes www/fx/bar1.png, bar2.png and bar4.png at the sprites' size (64 px).
"""

import colorsys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "www" / "parts" / "revival"
OUT = ROOT / "www" / "fx"


def fuel_pixels(path):
    im = Image.open(path).convert("RGBA")
    mask = Image.new("L", im.size, 0)
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = im.getpixel((x, y))
            if a < 128:
                continue
            _, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            # Fuel is coloured; glass rims and caps are grey. The palest fuels
            # read as grey in places, which is why every fuel is unioned.
            if s > 0.35 and v > 0.2:
                mask.putpixel((x, y), 255)
    return mask


def main():
    for count in (1, 2, 4):
        paths = [ART / f"cell_{fuel}_{count}.png" for fuel in range(1, 7)] + [ART / f"xcell_1_{count}.png"]
        union = Image.new("L", (64, 64), 0)
        for path in paths:
            union = ImageChops.lighter(union, fuel_pixels(path))
        grown = union.filter(ImageFilter.MaxFilter(3))
        soft = grown.filter(ImageFilter.GaussianBlur(0.8))
        mask = Image.new("RGBA", soft.size, (255, 255, 255, 0))
        mask.putalpha(soft)
        mask.save(OUT / f"bar{count}.png", optimize=True)
        print(f"bar{count}.png", mask.size, soft.getbbox())


if __name__ == "__main__":
    main()
