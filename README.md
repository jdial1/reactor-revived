# Reactor Revived

An Android port of [Reactor Knockoff](https://github.com/cwmonkey/reactor-knockoff)
by cwmonkey, the latest in a line that starts in Minecraft:

| | |
|---|---|
| **IndustrialCraft 2** (2011) | The Minecraft mod whose nuclear reactor is the original puzzle: fuel rods heat their neighbours, vents and exchangers move that heat around, and a full grid melts down. |
| **[IC2 Reactor Planner](https://forum.industrial-craft.net/thread/2147-new-reactor-planner-made-by-talonius/)** by Talonius | A desktop tool for laying a reactor out and simulating it before mining anything. The grid stops being a build and becomes a puzzle on its own. |
| **[Reactor Incremental](http://www.kongregate.com/games/Cael/reactor-incremental)** by Cael (2014) | The planner made into an idle game: sell the power, buy upgrades, reboot for Exotic Particles. Every number here starts there. |
| **[Reactor Knockoff](https://github.com/cwmonkey/reactor-knockoff)** by cwmonkey | Incremental rebuilt in HTML5 with no engine and no build step. The direct parent of this rewrite, and what the balance is checked against. |
| **Reactor Revival** | A later remake in the same line. Its part artwork is what ships here. |
| **Reactor Revived** | This one: a clean-room rewrite for a phone. |

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
- **No image files but the art itself.** Every interface icon is inline SVG;
  the only bitmaps in the APK are the 75 part sprites and four UI frames,
  37 KB together, and the only sounds are six impacts.
- **No network access.** Nothing is fetched, ever.

The result is about 2,400 lines of game code, 750 of CSS, and a 105-line
Android shell. Comments are held to what the code cannot say for itself - a
formula, a constraint, a bug that will otherwise come back - because with no
build step every line of prose is a line the player downloads. The release APK is **146 KB**, of which the Android half is a
9 KB `classes.dex`: R8 is on, because without it the Kotlin runtime shipped
2.4 MB of itself to run one Activity.

## Layout

```
www/            the game - open index.html in any browser
  js/sim.js     pure simulation: compile() and tick(), no DOM
  js/parts.js   the part catalog, as data
  js/upgrades.js  upgrades as data; one function derives every stat from levels
  js/ui.js      build the DOM once, then patch what changed
  js/input.js   touch gestures
  parts/revival/  the 75 part sprites
  ui/           three frames the interface is skinned from
test/           node --test, no test framework
tools/serve.js  a 12-line dev server
app/            the Android module; one Activity, one WebView
docs/           two scripts: the art repacker and the UI skin
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
75 PNGs, one per part, 36 KB, committed and shipped. They arrived at 128x128
with up to 168 colours; nothing draws them that big, so `docs/resize_art.py`
stores them at 64px and 32 colours - measured against the originals at every
size the game draws, where the difference does not show.
There is no picker and no second set. The game had a pack registry once, with a
manifest of which sprites each game in the lineage had and a setting to choose
between them; it also had a complete second copy of the art drawn from geometry
at runtime, for a build with no image files. Nothing ever shipped without the
art, and nothing ever selected another pack, so both went. `www/js/art.js` is a
filename rule and a path.

The repack is worth keeping. `docs/optimize_art.py` reads with Pillow and then
writes the PNG itself, out of `zlib` and `struct`, because three things cost
real bytes and none of them are reachable through a library call: the palette is
ordered so the one or two see-through colours come first, which lets the tRNS
chunk stop after a byte instead of carrying one per entry; the bit depth drops
to whatever the colour count needs; and every filter, deflate strategy and
window size is simply tried, because these are palette indices, where filtering
usually makes things *worse*. Every file is verified pixel for pixel afterwards
and left alone if it would not round-trip. It runs over any directory of PNGs:

```bash
python docs/optimize_art.py www/parts/revival
```

The other games' art is not here and cannot be: Knockoff's is unlicensed, and
Incremental and Redux are commercial games whose sprites would have to be lifted
out of a Unity bundle. The tooling that used to fetch and convert it went with
the pack system.

## Sound

Six files in `www/audio/`, 47 KB, from **Kenney's Impact Sounds** (CC0). One
`<audio>` element per voice, two per file so a fast row of parts sounds like a
row of parts; no library and no Web Audio graph, because the game plays one
thud at a time.

They were picked by measuring rather than by name. Every candidate in the pack
was decoded in the browser and scored two ways: how much of its energy survives
a 220 Hz low-pass, and how often it crosses zero. Heavy and dull wins on both -
the bells and beeps score bright, and none of them are here. `impactWood_heavy`
scored 0.95 deep at 77 crossings a second; `impactBell_heavy` scored 0.51 at
874, which is the tinny sound this game is trying not to make.

Nine cues come from six files: a lower playback rate is a bigger, longer version
of the same impact, so a tier unlocking is a part being placed at 0.78, and a
meltdown is a punch at 0.8. Nothing in `www/js/sim.js` knows any of this exists -
audio is dispatched from the renderer and from `main.js`, and a test still
asserts the simulation touches no DOM.

Sound is on by default and the toggle is in Options; `muted` rides along in the
save. The source packs live in `assets/`, which is gitignored: 3 MB of sounds
this game does not play.

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
became here.

The short version: IC&sup2;'s fuel rods make `5 x n` power and `2n(n+1)` heat,
where `n` counts the rod and its neighbours. Power linear, heat quadratic. Every
generation since has kept that asymmetry, including this one.

## Credits

Original game by **cwmonkey**. Based on **Reactor Incremental** by **Cael**.

The generated pack is original and drawn at runtime. The other packs are the
artwork of the games they are named for and belong to their authors; they are
included so this game can be played in the style of the ones it came from.
