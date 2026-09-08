"""Cut a sprite sheet into the game's 75 named part icons.

    python docs/split_sheet.py sheet.png [pack]

Takes the sheet described by docs/icon-set-prompt.md - a 6x16 grid of 64x64
cells on a magenta ground, drawn at 4x - and writes www/parts/<pack>/*.png.

The sheet is checked before anything is written, because a sheet that is subtly
wrong produces 75 subtly wrong files that all look plausible in a folder:

  * the canvas is the size the brief asked for
  * every 4x4 block is one flat colour, so the art really is 16x16 and reducing
    it loses nothing - anti-aliasing anywhere fails this
  * magenta appears only as background, never inside an icon
  * the outlet row is the inlet row flipped
  * every vent is unchanged by a quarter turn, which the fan animation needs

Failures are reported per cell and nothing is written unless --force is given.
"""

import json
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from install_art_packs import load_manifest  # noqa: E402
from optimize_art import rewrite             # noqa: E402

CELL, COLS, ROWS = 64, 6, 16
BLOCK = 4                                    # one logical pixel, as drawn
GRID = CELL // BLOCK                         # 16
SCALE = 2                                    # written at 32x32, as the other packs are
KEY = (255, 0, 255)
OUTLINE = (7, 9, 12)          # the derived edge; it may sit against the cell border
OUT = "www/parts"

COMPONENTS = ["vent", "exchanger", "inlet", "outlet", "coolant_cell",
              "reflector", "capacitor", "plating", "accelerator"]
FUELS = ["uranium", "plutonium", "thorium", "seaborgium", "dolorium", "nefastium", "protium"]
COUNTS = [1, 2, 4]


def cell_name(row, col):
    """The filename for a cell, or None where the sheet is meant to be empty."""
    if row < len(COMPONENTS):
        return f"{COMPONENTS[row]}_{col + 1}"
    fuel = row - len(COMPONENTS)
    if col >= len(COUNTS):
        return None                          # fuel rows only use the first three columns
    if FUELS[fuel] == "protium":
        return f"xcell_1_{COUNTS[col]}"
    return f"cell_{fuel + 1}_{COUNTS[col]}"


def reduce_cell(cell):
    """A 64x64 cell to 16x16, reporting any block that is not one flat colour."""
    px = cell.load()
    out = Image.new("RGBA", (GRID, GRID), (0, 0, 0, 0))
    dst = out.load()
    ragged = 0
    for gy in range(GRID):
        for gx in range(GRID):
            block = [px[gx * BLOCK + i, gy * BLOCK + j]
                     for j in range(BLOCK) for i in range(BLOCK)]
            first = block[0]
            if any(b != first for b in block):
                ragged += 1
            dst[gx, gy] = (0, 0, 0, 0) if first[:3] == KEY else first
    return out, ragged


def grid_of(im):
    """Every cell of the sheet, reduced, keyed by (row, col)."""
    cells = {}
    for row in range(ROWS):
        for col in range(COLS):
            box = (col * CELL, row * CELL, (col + 1) * CELL, (row + 1) * CELL)
            cells[(row, col)] = reduce_cell(im.crop(box))
    return cells


def check(cells):
    """Everything the brief promised. Returns a list of complaints."""
    bad = []
    for (row, col), (art, ragged) in sorted(cells.items()):
        name = cell_name(row, col)
        painted = sum(1 for p in art.getchannel("A").tobytes() if p > 0)
        if name is None:
            if painted:
                bad.append(f"r{row + 1}c{col + 1}: should be empty, has {painted} painted pixels")
            continue
        if ragged:
            bad.append(f"{name}: {ragged} of 256 blocks are not one flat colour (anti-aliased?)")
        if not painted:
            bad.append(f"{name}: empty")

    def rows_of(row):
        return [cells[(row, c)][0] for c in range(COLS)]

    # Silhouettes, not pixels: the light comes from the top left and does not
    # flip with the shape, so a correctly mirrored outlet is shaded differently
    # from the inlet it mirrors.
    for col, (inlet, outlet) in enumerate(zip(rows_of(2), rows_of(3))):
        a = inlet.getchannel("A").transpose(Image.FLIP_TOP_BOTTOM)
        if a.tobytes() != outlet.getchannel("A").tobytes():
            bad.append(f"outlet_{col + 1}: silhouette is not a vertical mirror of inlet_{col + 1}")

    # Tier hardware that reaches the cell edge merges with the part on the next
    # tile. The black outline is allowed there - two dark edges meeting read as
    # one - so only coloured material in the outer ring is a problem.
    for (row, col), (art, _) in cells.items():
        if row >= len(COMPONENTS):
            continue
        px = art.load()
        ring = [(x, y) for x in range(GRID) for y in (0, GRID - 1)] +                [(x, y) for y in range(GRID) for x in (0, GRID - 1)]
        if any(px[x, y][3] > 0 and px[x, y][:3] != OUTLINE for x, y in ring):
            bad.append(f"{cell_name(row, col)}: coloured material on the cell edge - "
                       "tier hardware needs a margin or boards grow stripes")

    # The spinning overlay shows the sprite at 166%, so only the middle ~60% is
    # ever on screen: tier hardware around the rim is cropped out and may be any
    # shape. What must be round is the part that turns. Shading is ignored - the
    # light does not follow the rotation - so this tests the silhouette only.
    keep = GRID * 6 // 10
    off = (GRID - keep) // 2
    for col, vent in enumerate(rows_of(0)):
        mask = vent.getchannel("A").crop((off, off, off + keep, off + keep))
        if mask.transpose(Image.ROTATE_90).tobytes() != mask.tobytes():
            bad.append(f"vent_{col + 1}: the spinning area is not round - the fan will wobble")
    return bad


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path = sys.argv[1]
    pack = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("-") else "sheet"
    force = "--force" in sys.argv

    im = Image.open(path).convert("RGBA")
    if im.size != (COLS * CELL, ROWS * CELL):
        sys.exit(f"sheet is {im.size[0]}x{im.size[1]}, expected {COLS * CELL}x{ROWS * CELL}")

    cells = grid_of(im)
    complaints = check(cells)
    for c in complaints:
        print("  !", c)
    if complaints and not force:
        sys.exit(f"\n{len(complaints)} problem(s); nothing written. Re-run with --force to write anyway.")

    dst = f"{OUT}/{pack}"
    os.makedirs(dst, exist_ok=True)
    names = []
    for (row, col), (art, _) in cells.items():
        name = cell_name(row, col)
        if name is None:
            continue
        art.resize((GRID * SCALE, GRID * SCALE), Image.NEAREST).save(f"{dst}/{name}.png")
        names.append(name)

    saved = [rewrite(f"{dst}/{n}.png") for n in names]
    print(f"{pack}: {len(names)} sprites, "
          f"{sum(a for a, _ in saved) // 1024} KB packed down to {sum(b for _, b in saved) // 1024} KB")

    manifest = load_manifest()
    manifest[pack] = sorted(names)
    with open(f"{OUT}/packs.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, separators=(",", ":"))
    print("packs:", list(manifest))
    print(f"add a PACKS entry for '{pack}' in www/js/art.js to make it selectable")


if __name__ == "__main__":
    main()
