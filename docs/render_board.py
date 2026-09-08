"""Render a populated reactor board, for reviewing a part pack in situ.

    python docs/render_board.py

A contact sheet shows parts in isolation, which is not how anyone sees them.
This lays out a plausible 12x8 reactor - cells packed against vents, a transfer
row, plating and capacitors round the edge - and draws it at the tile size a
phone actually uses, once per tier, so the whole progression can be judged at a
glance. Output goes to docs/reference/ (gitignored).

Tile geometry and colours are taken from www/css/app.css: a 1px gap, a 1px
#262e39 border, a #0f1318 face, and the art drawn at 100% of the tile.
"""

import os
import sys

from PIL import Image, ImageDraw

OUT = "docs/reference/boards"
PARTS = "www/parts"
ROWS, COLS = 12, 8
TILE, GAP = 46, 2                 # ~what 8 columns come to across a 375px phone
BG, FACE, EDGE, INK, DIM = (11, 13, 16), (15, 19, 24), (38, 46, 57), (200, 211, 222), (123, 135, 148)

# One tier per fuel, so a board reads as a snapshot of that stage of the game.
FUEL_FOR_TIER = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6}

# `.` empty, c/d/q a single, dual and quad cell, and one letter per component.
LAYOUT = [
    "PKPKPKPK",
    "vcvdvcvK",
    "dvqvdvcP",
    "vcvqvdvK",
    "xixoxixP",
    "vqvcvqvK",
    "cvdvcvdP",
    "vdvcvdvK",
    "ClClClCP",
    "vcvdvcvK",
    "qvcvqvcP",
    "aPaPaPaP",
]
COMPONENT = {"v": "vent", "x": "exchanger", "i": "inlet", "o": "outlet",
             "C": "coolant_cell", "l": "reflector", "K": "capacitor",
             "P": "plating", "a": "accelerator"}
CELL_COUNT = {"c": 1, "d": 2, "q": 4}


def sprite(pack, name):
    path = f"{PARTS}/{pack}/{name}.png"
    return Image.open(path).convert("RGBA") if os.path.exists(path) else None


def board(pack, tier):
    """One populated reactor, drawn as the game draws it."""
    w = COLS * TILE + (COLS + 1) * GAP
    h = ROWS * TILE + (ROWS + 1) * GAP
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    fuel = FUEL_FOR_TIER[tier]

    for r, line in enumerate(LAYOUT):
        for c, ch in enumerate(line):
            x = GAP + c * (TILE + GAP)
            y = GAP + r * (TILE + GAP)
            d.rectangle([x, y, x + TILE - 1, y + TILE - 1], fill=FACE, outline=EDGE)
            if ch == ".":
                continue
            name = (f"cell_{fuel}_{CELL_COUNT[ch]}" if ch in CELL_COUNT
                    else f"{COMPONENT[ch]}_{tier}")
            art = sprite(pack, name)
            if art:
                art = art.resize((TILE, TILE), Image.NEAREST)
                img.paste(art, (x, y), art)
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    pack = sys.argv[1] if len(sys.argv) > 1 else "revived"

    boards = [(t, board(pack, t)) for t in range(1, 7)]
    for t, im in boards:
        im.save(f"{OUT}/{pack}-tier{t}.png")

    # All six side by side, for judging the progression rather than one board.
    bw, bh = boards[0][1].size
    pad, top = 14, 34
    sheet = Image.new("RGB", (6 * (bw + pad) + pad, bh + top + pad), BG)
    d = ImageDraw.Draw(sheet)
    for i, (t, im) in enumerate(boards):
        x = pad + i * (bw + pad)
        d.text((x, 12), f"tier {t}", fill=INK)
        sheet.paste(im, (x, top))
    sheet.save(f"{OUT}/{pack}-tiers.png")
    print(f"{OUT}/{pack}-tier1..6.png and {pack}-tiers.png ({sheet.size[0]}x{sheet.size[1]})")


if __name__ == "__main__":
    main()
