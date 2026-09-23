"""Sprites for the parts Reactor Revival never drew, made from the ones it did.

Condensators are coolant cells whose core is redstone red. Component vents are
vents drawn small, with four chevrons pointing out at the parts they cool. Hull
vents are vents inside an amber frame, the reactor's hull they draw from. Every
tier keeps its base sprite's own tier marks, so the family reads at a glance.

    python docs/derive_art.py
    python docs/optimize_art.py www/parts/revival
"""
import colorsys
from pathlib import Path

from PIL import Image, ImageDraw

ART = Path(__file__).resolve().parent.parent / "www" / "parts" / "revival"
SIZE = 64


def load(name):
    return Image.open(ART / f"{name}.png").convert("RGBA")


def redstone(im):
    """Coolant's cyan and blue core, turned to redstone red. Nothing else moves."""
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if not a:
                continue
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            # The cyan-to-blue core only: the tier brackets at the sides keep
            # their own colour, blue included.
            if 20 <= x <= 43 and s > 0.35 and 0.45 < h < 0.72:
                r2, g2, b2 = colorsys.hls_to_rgb(0.0 if h > 0.55 else 0.02, l * 0.9, s)
                px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
    return out


def shrunk(im, size):
    """A sprite drawn smaller, centred on a clear tile, nearest-neighbour."""
    tile = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    small = im.resize((size, size), Image.NEAREST)
    off = (SIZE - size) // 2
    tile.alpha_composite(small, (off, off))
    return tile


def component_vent(im):
    """A small vent with a chevron at each edge, pointing outwards."""
    tile = shrunk(im, 44)
    d = ImageDraw.Draw(tile)
    ink, rim = (120, 210, 240, 255), (0, 0, 0, 255)
    c = SIZE // 2
    for pts in (
        [(c - 6, 7), (c + 6, 7), (c, 1)],                # up
        [(c - 6, SIZE - 8), (c + 6, SIZE - 8), (c, SIZE - 2)],  # down
        [(7, c - 6), (7, c + 6), (1, c)],                # left
        [(SIZE - 8, c - 6), (SIZE - 8, c + 6), (SIZE - 2, c)],  # right
    ):
        d.polygon(pts, fill=ink, outline=rim)
    return tile


def hull_vent(im):
    """A vent inside an amber frame: the hull it draws its heat from."""
    tile = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(tile)
    d.rectangle([2, 2, SIZE - 3, SIZE - 3], fill=(0, 0, 0, 255))
    d.rectangle([4, 4, SIZE - 5, SIZE - 5], fill=(232, 140, 40, 255))
    d.rectangle([9, 9, SIZE - 10, SIZE - 10], fill=(0, 0, 0, 255))
    tile.alpha_composite(shrunk(im, 44))
    return tile


def main():
    for level in range(1, 6):
        redstone(load(f"coolant_cell_{level}")).save(ART / f"condensator_{level}.png")
        vent = load(f"vent_{level}")
        component_vent(vent).save(ART / f"component_vent_{level}.png")
        hull_vent(vent).save(ART / f"hull_vent_{level}.png")
    print("derived 15 sprites into", ART)


if __name__ == "__main__":
    main()
