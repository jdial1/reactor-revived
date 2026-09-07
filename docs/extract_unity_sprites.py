"""Pull the part icons out of Reactor Incremental and Reactor Redux.

Both are Unity WebGL builds on Kongregate, so their art is inside an asset
bundle rather than in loose files. This downloads the bundle, gunzips it, and
writes the named part sprites out as PNGs for study.

    pip install UnityPy
    python docs/extract_unity_sprites.py

Output goes to docs/reference/; run docs/install_art_packs.py afterwards to
turn it into a playable pack under www/parts/.
"""

import gzip
import io
import os
import shutil
import urllib.request

import UnityPy

from install_art_packs import names

REF = "docs/reference"

GAMES = {
    "incremental": "https://game230582.konggames.com/gamez/0023/0582/live/Build/Build.data.unityweb",
    "redux": "https://game299615.konggames.com/gamez/0029/9615/live/Build/WebGL%202.2c.data.unityweb",
}

# Which sprites to pull is exactly the pack's filename list, so the two scripts
# cannot drift apart. Incremental packs fuel as -1/-2/-4 (single, dual, quad);
# Redux renamed the quad to -3, which names() already knows.
WANTED = {name: set(names(name)) for name in GAMES}


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
