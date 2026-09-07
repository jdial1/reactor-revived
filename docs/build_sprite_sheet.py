"""Build the four-generation part sprite sheet.

Reproduces third-party sprites for study alongside ours. Run the exporter
first so our own sprites exist as pixel data:

    node docs/export_sprites.mjs > docs/reference/sprites.json
    python docs/build_sprite_sheet.py

Third-party art is fetched into docs/reference/, which is gitignored - the
whole point of generating our own sprites was to not redistribute anyone's.
"""

import json
import os
import urllib.request
from PIL import Image, ImageDraw, ImageFont

REF = "docs/reference"
CELL = 64          # sprite box
PAD = 10
LABEL_W = 210
COL_W = 170  # wide enough for the column headings, not just the sprite
BG = (11, 13, 16)
INK = (200, 211, 222)
DIM = (123, 135, 148)
RULE = (35, 43, 52)

# part label, IC2 file, Knockoff file, Revival file, our part id
ROWS = [
    ("Fuel rod", "Fuel_Rod_(Uranium)", "cell_1_1", "cell_1_1", "uranium1"),
    ("Fuel rod x2", "Dual_Fuel_Rod_(Uranium)", "cell_1_2", "cell_1_2", "uranium2"),
    ("Fuel rod x4", "Quad_Fuel_Rod_(Uranium)", "cell_1_4", "cell_1_4", "uranium3"),
    ("Exotic fuel", "Fuel_Rod_(MOX)", None, None, "protium1"),
    ("Heat vent", "Heat_Vent", "vent_1", "vent_1", "vent1"),
    ("Heat vent, mid", "Advanced_Heat_Vent", "vent_3", "vent_3", "vent3"),
    ("Heat vent, high", "Overclocked_Heat_Vent", "vent_5", "vent_5", "vent5"),
    ("Heat exchanger", "Heat_Exchanger", "exchanger_1", "exchanger_1", "heat_exchanger1"),
    ("Exchanger, mid", "Advanced_Heat_Exchanger", "exchanger_3", "exchanger_3", "heat_exchanger3"),
    ("Heat inlet", "Component_Heat_Exchanger", "inlet_1", "inlet_1", "heat_inlet1"),
    ("Heat outlet", "Reactor_Heat_Exchanger", "outlet_1", "outlet_1", "heat_outlet1"),
    ("Coolant cell", "Coolant_Cell", "coolant_1", "coolant_cell_1", "coolant_cell1"),
    ("Coolant, mid", "60k_Coolant_Cell", "coolant_3", "coolant_cell_3", "coolant_cell3"),
    ("Neutron reflector", "Neutron_Reflector", "reflector_1", "reflector_1", "reflector1"),
    ("Reflector, mid", "Thick_Neutron_Reflector", "reflector_3", "reflector_3", "reflector3"),
    ("Reactor plating", "Reactor_Plating", "plating_1", "plating_1", "reactor_plating1"),
    ("Plating, mid", "Heat-Capacity_Reactor_Plating", "plating_3", "plating_3", "reactor_plating3"),
    ("Capacitor", None, "capacitor_1", "capacitor_1", "capacitor1"),
    ("Capacitor, mid", None, "capacitor_3", "capacitor_3", "capacitor3"),
    ("Accelerator", None, "accelerator_1", "accelerator_1", "particle_accelerator1"),
    ("Accelerator, mid", None, "accelerator_3", "accelerator_3", "particle_accelerator3"),
    ("Condensator", "RSH-Condensator", None, None, None),
]

COLUMNS = ["IndustrialCraft²", "Reactor Knockoff", "Reactor Revival", "Reactor Revived"]
CAPTIONS = ["Minecraft mod", "2013 browser", "the fork", "drawn at runtime"]


KNOCKOFF_URL = "https://raw.githubusercontent.com/cwmonkey/reactor-knockoff/master/img"
IC2_API = "https://wiki.industrial-craft.net/api.php?action=query&list=allimages&ailimit=500&format=json"
# Where the fork keeps its art, if you have it checked out next door.
REVIVAL_DIR = "../reactor-knockoff/reactor-knockoff/public/img/parts"


def fetch_reference():
    """Pull the other generations' sprites into docs/reference/ if missing."""
    import json as _json
    import shutil

    for sub in ("ic2", "knockoff", "revival"):
        os.makedirs(f"{REF}/{sub}", exist_ok=True)

    for _, _, ko, _, _ in ROWS:
        if ko and not os.path.exists(f"{REF}/knockoff/{ko}.png"):
            try:
                urllib.request.urlretrieve(f"{KNOCKOFF_URL}/{ko}.gif", f"{REF}/knockoff/{ko}.gif")
                Image.open(f"{REF}/knockoff/{ko}.gif").convert("RGBA").save(f"{REF}/knockoff/{ko}.png")
                os.remove(f"{REF}/knockoff/{ko}.gif")
            except Exception as e:
                print(f"  knockoff/{ko}: {e}")

    wanted = {ic2 for _, ic2, _, _, _ in ROWS if ic2}
    if any(not os.path.exists(f"{REF}/ic2/{n}.png") for n in wanted):
        imgs, cont = {}, None
        for _ in range(12):
            url = IC2_API + (f"&aicontinue={cont}" if cont else "")
            with urllib.request.urlopen(url) as r:
                j = _json.load(r)
            imgs.update({i["name"]: i["url"] for i in j["query"]["allimages"]})
            cont = j.get("continue", {}).get("aicontinue")
            if not cont:
                break
        for n in wanted:
            if os.path.exists(f"{REF}/ic2/{n}.png"):
                continue
            url = imgs.get(f"{n}.png")
            if url:
                urllib.request.urlretrieve(url, f"{REF}/ic2/{n}.png")
            else:
                print(f"  ic2/{n}: not on the wiki")

    for _, _, _, rv, _ in ROWS:
        src = f"{REVIVAL_DIR}/{rv}.png" if rv else None
        if src and os.path.exists(src) and not os.path.exists(f"{REF}/revival/{rv}.png"):
            shutil.copy(src, f"{REF}/revival/{rv}.png")


def font(size, bold=False):
    for name in (("consolab.ttf", "consola.ttf") if bold else ("consola.ttf",)):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def sprite(path):
    """Load a third-party sprite, nearest-neighbour scaled to the cell."""
    if not path or not os.path.exists(path):
        return None
    im = Image.open(path).convert("RGBA")
    return im.resize((CELL, CELL), Image.NEAREST)


def ours(pixels, size):
    """Rebuild one of our sprites from exported pixel data."""
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = im.load()
    for x, y, r, g, b in pixels:
        px[x, y] = (r, g, b, 255)
    return im.resize((CELL, CELL), Image.NEAREST)


def main():
    fetch_reference()
    data = json.load(open(f"{REF}/sprites.json"))
    size = data["size"]

    f_title = font(30, True)
    f_sub = font(15)
    f_head = font(14, True)
    f_cap = font(12)
    f_row = font(15)
    f_note = font(12)

    top = 132
    row_h = CELL + PAD
    width = LABEL_W + COL_W * 4 + 40
    height = top + row_h * len(ROWS) + 78

    img = Image.new("RGB", (width, height), BG)
    d = ImageDraw.Draw(img)

    d.text((24, 24), "Reactor part sprite sheet", font=f_title, fill=(255, 255, 255))
    d.text((24, 62), "Four generations of the same components, drawn side by side.", font=f_sub, fill=DIM)

    for i, (name, cap) in enumerate(zip(COLUMNS, CAPTIONS)):
        x = 24 + LABEL_W + COL_W * i
        d.text((x, 92), name, font=f_head, fill=INK)
        d.text((x, 110), cap, font=f_cap, fill=DIM)

    for r, (label, ic2, ko, rv, mine) in enumerate(ROWS):
        y = top + row_h * r
        d.line([(24, y - 4), (width - 24, y - 4)], fill=RULE)
        d.text((24, y + CELL // 2 - 8), label, font=f_row, fill=INK)

        tiles = [
            sprite(f"{REF}/ic2/{ic2}.png" if ic2 else None),
            sprite(f"{REF}/knockoff/{ko}.png" if ko else None),
            sprite(f"{REF}/revival/{rv}.png" if rv else None),
            ours(data["sprites"][mine], size) if mine else None,
        ]
        for c, tile in enumerate(tiles):
            x = 24 + LABEL_W + COL_W * c
            if tile is None:
                d.text((x + (COL_W - CELL) // 2 - 40 + CELL // 2 - 5, y + CELL // 2 - 9), "—", font=f_row, fill=RULE)
            else:
                img.paste(tile, (x + (COL_W - CELL) // 2 - 40, y), tile)

    note_y = height - 62
    d.line([(24, note_y - 12), (width - 24, note_y - 12)], fill=RULE)
    for i, line in enumerate([
        "IC² sprites: wiki.industrial-craft.net  ·  Knockoff: cwmonkey/reactor-knockoff  ·  Revival: the jdial1 fork",
        "Reactor Revived sprites are computed from geometry at runtime and ship as no files at all.",
        "Third-party art is reproduced here for study; it is not redistributed with the game.",
    ]):
        d.text((24, note_y + i * 16), line, font=f_note, fill=DIM)

    out = f"{REF}/reactor-sprite-sheet.png"
    img.save(out)
    print(f"wrote {out}  ({width}x{height})")


if __name__ == "__main__":
    main()
