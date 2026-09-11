"""Capture the Play Store screenshots, 1080x1920, from a real build of the game.

    node tools/serve.js            # in another shell
    python docs/play/capture_shots.py

Headless Chrome at 540x960 with a 2x device scale factor, which is exactly the
1080x1920 portrait Play wants. shot.html is copied into www/ for the run and
removed afterwards, so the shipped game never carries a page that seeds saves
from the query string.

The board in the screenshots is a real save fed through the game's own loader -
cells packed against vents, a transfer row, plating and capacitors round the
edge - so nothing here is a mock-up of a game that does not exist.
"""

import json
import os
import shutil
import subprocess
import urllib.parse

CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"
HERE = os.path.dirname(__file__)
OUT = f"{HERE}/graphics"
URL = "http://localhost:8124/_shot.html"

LAYOUT = [
    "PKPKPKPK", "vcvdvcvK", "dvqvdvcP", "vcvqvdvK", "xixoxixP", "vqvcvqvK",
    "cvdvcvdP", "vdvcvdvK", "ClClClCP", "vcvdvcvK", "qvcvqvcP", "aPaPaPaP",
]
ID = {"v": "vent1", "x": "heat_exchanger1", "i": "heat_inlet1", "o": "heat_outlet1",
      "C": "coolant_cell1", "l": "reflector1", "K": "capacitor1", "P": "reactor_plating1",
      "a": "particle_accelerator1", "c": "uranium1", "d": "uranium2", "q": "uranium3"}

SHOTS = [
    ("01-reactor.png", ""),
    ("02-upgrades.png", "page=upgrades"),
    ("03-goals.png", "goals=1"),
    ("04-inspect.png", "inspect=1,1"),
    ("05-experiments.png", "page=experiments"),
]


def save_param():
    tiles = [{"i": r * 8 + c, "id": ID[ch], "ticks": 15, "activated": True, "heatContained": 0}
             for r, row in enumerate(LAYOUT) for c, ch in enumerate(row) if ch in ID]
    return urllib.parse.quote(json.dumps({
        "v": 2, "money": 1.2e6, "power": 740, "heat": 610, "objective": 12,
        "currentExoticParticles": 0, "exoticParticles": 0, "totalExoticParticles": 0,
        "levels": {}, "placed": {"uranium": 40, "vent": 30, "capacitor": 12},
        "tiles": tiles, "queue": [],
    }))


def main():
    os.makedirs(OUT, exist_ok=True)
    shutil.copy(f"{HERE}/shot.html", "www/_shot.html")
    try:
        save = save_param()
        for name, query in SHOTS:
            subprocess.run([
                CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--force-device-scale-factor=2", "--window-size=540,960",
                "--virtual-time-budget=7000", f"--screenshot={OUT}/{name}",
                f"{URL}?save={save}&{query}",
            ], check=True, capture_output=True)
            print(f"{name} {os.path.getsize(f'{OUT}/{name}')} bytes")
    finally:
        os.remove("www/_shot.html")


if __name__ == "__main__":
    main()
