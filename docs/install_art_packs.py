"""Install part-artwork packs into www/parts/ so the game can use them.

    python docs/install_art_packs.py revival
    python docs/install_art_packs.py revival knockoff incremental redux

Only `revival` is installed by default, and only that one is committed: it is
this project's own art. The other packs are other people's - Knockoff is
unlicensed, and Incremental and Redux are commercial games whose sprites have
to be pulled out of a Unity bundle - so installing them puts someone else's
artwork in your APK. That is your call to make, not a default.

Run docs/extract_unity_sprites.py first if you want incremental or redux.

Installed art is losslessly repacked on the way in - see docs/optimize_art.py.
"""

import os
import shutil
import sys
import urllib.request

from PIL import Image

from optimize_art import rewrite

OUT = "www/parts"
REF = "docs/reference"
# Where the fork lives, if it is checked out beside this repo.
REVIVAL_DIR = "../reactor-knockoff/reactor-knockoff/public/img/parts"
KNOCKOFF_URL = "https://raw.githubusercontent.com/cwmonkey/reactor-knockoff/master/img"

FUELS = ["uranium", "plutonium", "thorium", "seaborgium", "dolorium", "nefastium"]
TIERED = ["vent", "exchanger", "inlet", "outlet", "reflector", "capacitor",
          "plating", "accelerator"]


def names(pack):
    """Every filename a pack needs, matching the rules in www/js/art.js."""
    if pack in ("revival", "knockoff"):
        coolant = "coolant_cell" if pack == "revival" else "coolant"
        out = [f"cell_{i}_{n}" for i in range(1, 7) for n in (1, 2, 4)]
        out += [f"xcell_1_{n}" for n in (1, 2, 4)]
        out += [f"{stem}_{t}" for stem in TIERED + [coolant] for t in range(1, 7)]
        return out
    quad = 4 if pack == "incremental" else 3
    out = [f"Fuel{i}-{n}" for i in range(1, 7) for n in (1, 2, quad)]
    out += [f"{stem}{t}" for stem in
            ["Vent", "Exchanger", "Inlet", "Outlet", "Coolant", "Reflector", "Capacitor", "Plate"]
            for t in range(1, 7)]
    return out


def install(pack):
    dst = f"{OUT}/{pack}"
    os.makedirs(dst, exist_ok=True)
    wanted = names(pack)
    got = 0

    for name in wanted:
        target = f"{dst}/{name}.png"
        if os.path.exists(target):
            got += 1
            continue

        if pack == "revival":
            src = f"{REVIVAL_DIR}/{name}.png"
            if os.path.exists(src):
                shutil.copy(src, target)
                got += 1
        elif pack == "knockoff":
            try:
                tmp = f"{dst}/{name}.gif"
                urllib.request.urlretrieve(f"{KNOCKOFF_URL}/{name}.gif", tmp)
                Image.open(tmp).convert("RGBA").save(target)
                os.remove(tmp)
                got += 1
            except Exception:
                pass
        else:  # incremental / redux, extracted beforehand
            src = f"{REF}/{pack}/{name}.png"
            if os.path.exists(src):
                shutil.copy(src, target)
                got += 1

    have = [n for n in wanted if os.path.exists(f"{dst}/{n}.png")]
    saved = [rewrite(f"{dst}/{n}.png") for n in have]
    print(f"{pack}: {len(have)}/{len(wanted)} sprites, "
          f"{sum(a for a, _ in saved) // 1024} KB packed down to"
          f" {sum(b for _, b in saved) // 1024} KB"
          + ("" if len(have) == len(wanted) else "  (the rest fall back to generated art)"))
    return have


def main():
    packs = sys.argv[1:] or ["revival"]
    for pack in packs:
        install(pack)
    print("the game draws from www/parts/revival/; other packs are for comparison only")


if __name__ == "__main__":
    main()
