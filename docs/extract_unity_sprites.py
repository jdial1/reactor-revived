"""Pull the part icons out of Reactor Incremental and Reactor Redux.

Both are Unity WebGL builds on Kongregate, so their art is inside an asset
bundle rather than in loose files. This downloads the bundle, gunzips it, and
writes the named part sprites out as PNGs for study.

    pip install UnityPy
    python docs/extract_unity_sprites.py

Output goes to docs/reference/, which is gitignored - these are someone else's
sprites and are not redistributed with the game.
"""

import gzip
import io
import os
import shutil
import urllib.request

import UnityPy

REF = "docs/reference"

GAMES = {
    "incremental": "https://game230582.konggames.com/gamez/0023/0582/live/Build/Build.data.unityweb",
    "redux": "https://game299615.konggames.com/gamez/0029/9615/live/Build/WebGL%202.2c.data.unityweb",
}

# The sprites the comparison sheet uses. Incremental packs fuel as -1/-2/-4
# (single, dual, quad); Redux renamed the quad to -3.
WANTED = {
    "incremental": [
        "Fuel1-1", "Fuel1-2", "Fuel1-4", "Vent1", "Vent3", "Vent5",
        "Exchanger1", "Exchanger3", "Inlet1", "Outlet1",
        "Coolant1", "Coolant3", "Reflector1", "Reflector3",
        "Plate1", "Plate3", "Capacitor1", "Capacitor3",
    ],
    "redux": [
        "Fuel1-1", "Fuel1-2", "Fuel1-3", "Vent1", "Vent3", "Vent5",
        "Exchanger1", "Exchanger3", "Inlet1", "Outlet1",
        "Coolant1", "Coolant3", "Reflector1", "Reflector3",
        "Plate1", "Plate3", "Capacitor1", "Capacitor3",
    ],
}


def bundle(name, url):
    """Download and gunzip a Unity WebGL data bundle, cached on disk."""
    raw = os.path.join(REF, f"{name}.data")
    if os.path.exists(raw):
        return raw
    os.makedirs(REF, exist_ok=True)
    print(f"  fetching {name}...")
    with urllib.request.urlopen(url) as r:
        blob = r.read()
    if blob[:2] == b"\x1f\x8b":
        blob = gzip.decompress(blob)
    with open(raw, "wb") as f:
        f.write(blob)
    return raw


def main():
    for name, url in GAMES.items():
        out = f"{REF}/{name}"
        os.makedirs(out, exist_ok=True)
        env = UnityPy.load(bundle(name, url))

        want = set(WANTED[name])
        found = {}
        for obj in env.objects:
            if obj.type.name != "Sprite":
                continue
            try:
                data = obj.read()
            except Exception:
                continue
            if data.m_Name in want and data.m_Name not in found:
                try:
                    found[data.m_Name] = data.image
                except Exception:
                    pass

        for sprite_name, image in found.items():
            image.save(f"{out}/{sprite_name}.png")
        missing = sorted(want - set(found))
        print(f"{name}: wrote {len(found)} sprites" + (f", missing {missing}" if missing else ""))


if __name__ == "__main__":
    main()
