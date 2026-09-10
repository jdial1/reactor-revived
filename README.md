# Reactor Revived

An Android port of [Reactor Knockoff](https://github.com/cwmonkey/reactor-knockoff)
by cwmonkey — itself a fan clone of
[Reactor Incremental](http://www.kongregate.com/games/Cael/reactor-incremental)
by Cael.

Build a grid of fuel cells, vents and heat exchangers. Cells make power, but
neighbouring cells pulse into each other: power grows linearly with the number
of neighbours and heat grows with the *square* of it. Density is what kills
you. Sell power, buy upgrades, and eventually turn heat into Exotic Particles
and start over stronger.

## Why it exists

The original is a 2013 browser game: `index.html`, some CSS, and 156 KB of raw
JavaScript in ten IIFEs that talk to each other through `window`. No build
step, no package manager, no framework. That constraint *is* the aesthetic.

This is a clean-room rewrite of that game for a phone, keeping the constraint:

- **No JavaScript dependencies.** Not one. No framework, no bundler, no
  transpiler. `www/` is what runs, in the browser and in the APK.
- **No Gradle dependencies.** The `app` module has no `dependencies` block at
  all — no AndroidX, no Material, no Compose. AGP 9 supplies Kotlin.
- **The game can run with no image files at all.** Every one of the 75 part
  icons can be drawn at runtime from geometry, and every interface icon is
  inline SVG. One artwork pack ships as well &mdash; see below &mdash; but it is
  a fallback away from running on nothing.
- **No network access.** Nothing is fetched, ever.

The result is about 2,000 lines of game code and a 100-line Android shell.

## Layout

```
www/            the game - open index.html in any browser
  js/sim.js     pure simulation: compile() and tick(), no DOM
  js/parts.js   the part catalog, as data
  js/upgrades.js  upgrades as data; one function derives every stat from levels
  js/sprites.js procedural sprites - shapes from primitives, not pixel grids
  js/ui.js      build the DOM once, then patch what changed
  js/input.js   touch gestures
test/           node --test, no test framework
tools/serve.js  a 12-line dev server
app/            the Android module; one Activity, one WebView
```

Gradle points the APK's assets at `../www`, so the browser and the phone run
byte-identical files.

## Running it

```bash
node tools/serve.js      # then open http://localhost:8080
```

```bash
npm test                 # node --test, zero dependencies
```

```bash
./gradlew installDebug   # needs an Android SDK and a device or emulator
```

## How it works

**The simulation is pure.** `compile(state)` rebuilds adjacency and per-cell
output whenever the layout changes; `tick(state)` advances one second. Neither
touches the DOM, reads a global, or sets a timer — so the tests drive them
directly with no harness. `sim`, `state`, `parts`, `upgrades` and `objectives`
contain zero DOM references, and a test asserts it.

**Upgrades are data.** The original gave each of its ~60 upgrades an `onclick`
closure that reached into the game and mutated part objects in place, which
made loading and prestige a matter of replaying every closure in the right
order. Here, levels are the only stored truth and one `applyUpgrades()`
recomputes everything derived from them — so load, reboot and refund fall out
for free.

**Sprites are computed.** A part's look comes from three things: a steel body
with a derived black outline, a tier colour shared across every category
(plain, gold, green, blue, red, violet), and a function colour that never
changes with tier — orange where heat moves, cyan for coolant, the element's
own colour for fuel. Higher tiers accumulate rivets and panel lines. Shapes are
built from segments, discs and rings rather than typed-out pixel grids, so
round forms come out accurate.

**The Android shell does two things** the web cannot: it serves `www/` from a
real `https://` origin (a modern WebView gives `file://` an opaque origin,
which kills both `localStorage` and ES modules), and it opens the document
picker for save export and import.

## Part artwork

The parts are drawn with **Reactor Revival's** art, in `www/parts/revival/` —
75 PNGs, one per part, 67 KB after a lossless repack. There is no picker: the
game had one, along with a registry of every pack in the lineage and a manifest
of which sprites each had, and with a single pack none of it earned its place.

If that folder is missing, every part is drawn from geometry at runtime instead
(`www/js/sprites.js`) — which is what keeps "runs with no image files at all"
true rather than merely claimed. The game probes for the art once at boot and
falls back wholesale.

To install or reinstall it:

```bash
python docs/install_art_packs.py revival
```

Art is repacked losslessly on the way in — the sprites are 32-bit RGBA but use
at most a couple of hundred colours, so `docs/optimize_art.py` re-encodes them
as palette PNGs and verifies every file pixel for pixel, taking about a third
off.

Knockoff, Incremental and Redux can still be installed for comparison and are
gitignored: Knockoff's art is unlicensed and the other two are commercial games
whose sprites have to be lifted out of a Unity bundle, so they are not ours to
redistribute. `docs/build_revived_pack.py` and `docs/split_sheet.py` build
alternative sets the same way. None of them is wired into the game — to try
one, copy it over `www/parts/revival/`.

## Interface skin

The buttons, dialogs and meter frames are cut from **"Sci-fi User Interface
Elements" by Buch** on OpenGameArt, which is **CC0** — the same pack Reactor
Knockoff drew its buttons from, so this is a lineage inheritance rather than a
new dependency. Three files in `www/ui/`, 1.4 KB together, applied with CSS
`border-image`.

The sheet is a mockup of one window rather than a kit, and it is drawn in lilac
and teal, so only the *shape* is taken: every colour is remapped onto this
project's own steel ramp by brightness, keeping Buch's bevels and losing his
palette. `border-image` uses only the outer ring of each file, so the middles
are blanked and the slices stay 1:1 with the source pixels — nothing is
resampled.

```bash
python docs/build_ui_skin.py
```

Skinning is opt-in per selector. A part in the dock is a 31px sprite in a 63px
box with no eight pixels to give to a frame, and the page tabs mark the current
page by colouring one border, which an image border would paint over. Each
skinned rule keeps a plain steel `border-color` underneath, so a build without
`www/ui/` still has visible edges.

## Balance parity

The numbers are checked against the *running* original at
[cwmonkey.github.io/reactor-knockoff](https://cwmonkey.github.io/reactor-knockoff/),
not against its source. Two adjacent uranium cells report 4 power and 8 heat
there and here; part costs, containments, vent rates and tick counts match
across tiers. Those observations are permanent tests, so the balance cannot
quietly drift.

Where the original's code and its own text disagree, the code wins: Perpetual
Reflectors promises a 1.5x replacement cost but charges list price, and a
reactor sitting just over twice its heat ceiling does *not* melt down, because
passive cooling runs first.

## Differences from the original

- Portrait, and 12x8 rather than 11x14. Fewer tiles, but the whole reactor is
  visible at once with tiles big enough to hit on a phone, which matters more
  than matching a tile count. The expansion upgrades still grow it to 32x28.
- Touch instead of a mouse. Tap to place, tap a placed part to inspect it,
  long press to sell, drag to paint, pinch to zoom. The original's six
  modifier-key macros are gone; dragging covers what they were for.
- Parts reveal progressively — each stays hidden until ten of the one before it
  have been placed — so the dock opens with ten buttons instead of seventy-five.
- Upgrades show only what you own or can afford, plus the three nearest to
  affordable, dithered.
- The Google Drive save integration is gone. Saves live in `localStorage`, with
  export and import through Android's document picker.

## Where the design came from

`docs/reactor-lineage-chart.pdf` traces the whole family tree back to
IndustrialCraft&sup2;'s nuclear reactor in Minecraft: a component reference with
IC&sup2;'s published figures, and a table mapping each of its parts to the part it
became here. Rebuild it with `python docs/build_lineage_chart.py`.

`docs/build_sprite_sheet.py` builds a companion sprite sheet showing the same
component drawn by all six generations side by side &mdash; IndustrialCraft&sup2;,
Reactor Incremental, Reactor Redux, Reactor Knockoff, Reactor Revival and this
game. It fetches the others' sprites into `docs/reference/`, which is gitignored
&mdash; the point of generating our own art was to not redistribute anyone
else's. Incremental and Redux are Unity WebGL builds, so their icons come out of
the asset bundle via `docs/extract_unity_sprites.py` (needs `pip install
UnityPy`).

The short version: IC&sup2;'s fuel rods make `5 x n` power and `2n(n+1)` heat,
where `n` counts the rod and its neighbours. Power linear, heat quadratic. Every
generation since has kept that asymmetry, including this one.

## Credits

Original game by **cwmonkey**. Based on **Reactor Incremental** by **Cael**.

The generated pack is original and drawn at runtime. The other packs are the
artwork of the games they are named for and belong to their authors; they are
included so this game can be played in the style of the ones it came from.
