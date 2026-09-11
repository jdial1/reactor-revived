"""Draw the Play Store icon and feature graphic out of the game's own art.

    python docs/play/make_graphics.py

Nothing here is decoration for its own sake: the icon is a quad uranium cell on
the tile face the game draws it on, and the feature graphic is a row of real
part sprites over the same background. If the art changes, re-run this.
"""

import os

from PIL import Image, ImageDraw, ImageFont

ART = "www/parts/revival"
OUT = "docs/play/graphics"
BG, FACE, EDGE, INK, DIM = (11, 13, 16), (15, 19, 24), (38, 46, 57), (200, 211, 222), (123, 135, 148)
CASH = (216, 193, 90)
MONO = "C:/Windows/Fonts/consola.ttf"
MONO_BOLD = "C:/Windows/Fonts/consolab.ttf"


def sprite(name, size):
    with Image.open(f"{ART}/{name}.png") as im:
        return im.convert("RGBA").resize((size, size), Image.NEAREST)


def icon():
    """512x512, the size Play asks for. It has to read at 48."""
    n = 512
    img = Image.new("RGBA", (n, n), (*BG, 255))
    d = ImageDraw.Draw(img)
    pad = 44
    d.rounded_rectangle([pad, pad, n - pad, n - pad], 24, fill=FACE, outline=EDGE, width=6)
    art = sprite("cell_1_4", 320)
    img.alpha_composite(art, ((n - 320) // 2, (n - 320) // 2))
    # Play wants the icon as 32-bit PNG; the feature graphic as 24-bit.
    img.save(f"{OUT}/icon-512.png")


def feature():
    """1024x500. Shown small and cropped, so the name lives left of centre."""
    w, h = 1024, 500
    img = Image.new("RGBA", (w, h), (*BG, 255))
    d = ImageDraw.Draw(img)

    # A band of the board behind everything, faint.
    tile = 64
    for y in range(0, h, tile + 4):
        for x in range(0, w, tile + 4):
            d.rectangle([x, y, x + tile, y + tile], fill=FACE, outline=(22, 27, 34))

    # Five parts, right of the name and clear of it: the graphic is cropped on
    # some surfaces, and the name is what has to survive the crop.
    row = ["cell_1_4", "vent_3", "exchanger_4", "capacitor_2", "accelerator_6"]
    size = 104
    x = w - len(row) * (size + 20) - 8
    for name in row:
        img.alpha_composite(sprite(name, size), (x, h // 2 - size // 2))
        x += size + 20

    d.text((56, 150), "REACTOR", font=ImageFont.truetype(MONO_BOLD, 76), fill=INK)
    d.text((56, 232), "REVIVED", font=ImageFont.truetype(MONO_BOLD, 76), fill=CASH)
    d.text((60, 330), "power grows with neighbours.", font=ImageFont.truetype(MONO, 26), fill=DIM)
    d.text((60, 364), "heat grows with their square.", font=ImageFont.truetype(MONO, 26), fill=DIM)
    img.convert("RGB").save(f"{OUT}/feature-1024x500.png")


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    icon()
    feature()
    for f in sorted(os.listdir(OUT)):
        print(f, os.path.getsize(f"{OUT}/{f}"), "bytes")
