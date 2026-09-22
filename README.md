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

**Doctrines are choices, not volume.** A set opens every five goals, and each is
a choice between two ways to run a reactor. Buying a set opens it; which side is
in force can be switched at any time, for nothing. Each set costs ten times the
last. A reboot clears what was bought but remembers the sides.

| Set | Opens | Cost | Left | Right |
| --- | --- | --- | --- | --- |
| I - Vents or markets | 5 goals | $1K | **Open Vents** - vents shed +50%, hold 25% less | **Power Brokers** - every sale pays 25% more |
| II - When a part fails | 10 | $10K | **Cascade Vents** - a failing vent hands its excess to a neighbour with room | **Salvage Crews** - an exploded part refunds half its price |
| III - How hard the cells run | 15 | $100K | **Overclocked Cells** - 1.5x power, 2x heat | **Throttled Cells** - above 80% heat, half power and half heat |
| IV - The shape of a core | 20 | $1M | **Diagonal Pulse** - cells pulse into their corners | **Isolated Cores** - a lone cell makes 3x power |
| V - Where heat is kept | 25 | $10M | **Pressurised Core** - reactor max heat x2, outlets move 25% less | **Fast Exchange** - exchangers, inlets and outlets move +50%, max heat 25% less |
| VI - What parts last | 30 | $100M | **Reflector Lattice** - reflectors never wear, half the boost | **Deep Capacitors** - capacitors add 3x max power |

Every other upgrade makes a number bigger. These change the shape of a good
layout, so they are what a second reactor does differently from the first.

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

## Tutorial

`www/js/tutorial.js` is seventeen steps of data: a selector to spotlight, a
title, the text, and for five of them a `waitFor` predicate on game state - place
a cell, put a second cell touching it, sell power, vent the heat to zero, put a vent beside the cell. Those
steps will not advance until the player has really done it, and they reuse the
same board checks the goals do rather than restating them.

It starts on a new game, ends for good once finished or skipped, and replays from
Options. A save from before the tutorial existed loads with `tutorialDone` set,
so nobody mid-game gets taught what they already know. The overlay takes no taps
except on its own card, and the game keeps running underneath it.

It teaches how to do things and never states the rule. The step that used to
explain why packed cells run hot now asks the player to put two cells together
and watch the rate line; the square law is theirs to find.

## The operator's log

The goals are a checklist from one place: Harrow Station, a plant cold for
eleven years above a town that has been on candles since it closed. Each item is
the job, what it pays, and a one-line note from whoever asked for it - the mill
wanting a second shift, the clinic keeping its lights on overnight, the
university that sends an accelerator and stops saying what the particles are
for. The checks are unchanged; only the reason for them is new. IC2 players ran
their reactors inside a base they had built, so the reactor had somewhere to
be. This gives it one.

## Modules

Once the fifth goal on the log is done - the first upgrade bought - a Modules
page appears in the bottom bar, and a Modules tab in the dock. Before that,
neither exists. On the page you design a
sealed 3x3: pick an icon and a colour, fill the slots, and the readout says what
the casing will do - power, heat that leaks out, heat vented inside, particles,
net money per tick after rebuying its fuel, life, cost, and whether it holds or
the tick it fails. Save it, and it is a part you place in one tile.

`www/js/module.js` runs the 3x3 through the same `compile` and `tick` as the
board - the sim takes any grid size, and a *sealed* state has no reactor of its
own. A placed module ticks its 3x3 every tick with the reactor's pool as its
pool, so **heat crosses the casing at full strength, both ways**: a module of
bare cells dumps every bit of its heat into the reactor, and a module of vents
around an outlet pulls heat out of the reactor into those vents. Net-negative is
allowed. Nothing else reaches in - outside cells do not pulse into a casing, and
outside vents and exchangers do not touch it.

Power and particles are what the casing cuts: it passes on 25% of what its parts
make, and **Casing Tolerances** raises that to 60%. **Nested Casings** lets a
module hold modules, one layer deeper per level, and each layer takes its own
cut - at 60%, a module inside a module passes on 36% of its power. Heat is never
cut, however deep. A spent module rebuys itself when every fuel inside it is
perpetual, and a module whose inside part fails blows as a whole. Its tile carries a
heat bar like any other part: the average fill of everything inside that holds
heat, nested casings included, so a casing warns before it goes.

The editor measures a design twice - beside a cold reactor, and beside one held
at its base maximum heat, where an outlet has the most to pull - for up to 2,000
ticks or one fuel life, drawing the line on to the tick a still-filling part
would fail. That profile is cached against the layout and the upgrades. A placed
module's inner heat and fuel ride along in the save.

A design never changes once saved. "Edit as copy" opens a copy, so a module on
the board is always the one that was placed. A design can be deleted only when
nothing uses it - not the board, and not another design.

## From the players

Before adding anything else, the Kongregate comments on Reactor Incremental,
Knockoff's GitHub issues and the IC2 planner threads were read for what players
of this line loved, what broke, and what they asked for. What came of it:

- **Layout codes** (Options). The whole board as a line of text - `RR1.` and
  base64 JSON - carrying every module design on it, nested ones included. IC2
  players passed planner links around and kept a ranked list of the best;
  Incremental players asked for saved layouts. Building a code fills empty tiles
  only: parts you cannot afford queue, locked ones are left out, and an identical
  design already saved is reused rather than duplicated.
- **The planner** (Plan, in the header). A free copy of the board: money is
  infinite, spent parts rebuy themselves, goals do not count, and the real game
  waits and keeps being saved. Build puts the plan onto the real board by the
  same path as a code; Discard forgets it. The IC2 planners were this, and
  Incremental players asked for a way to test without losing income.
- **Time Flux.** Knockoff's, with its issue #23 answered. Nothing ticks while the
  game is out of sight; the time is banked, up to eight hours, and coming back
  says how long you were gone. The bank sits in the header and, when tapped,
  runs at ten times speed, counting down, until it is empty or tapped again.
- **The verdict line**, above the rates: what the board makes, whether it
  holds - or the tick it fails and what goes first - and profit after fuel.
  `www/js/forecast.js` copies the board, keeps its fuel topped up, and runs it
  600 ticks, then follows any heat still climbing (the reactor's, or any part's)
  on to where it gives out. It is what the IC2 planners told you, and it runs
  in the planner too.
- **Flow**, beside the verdict: an overlay of what each tile did with heat this
  tick - made (+), taken in (▼), passed on (▲), vented (≈). Players
  of this line kept calculators for exchangers and outlets; this is that, live.
- **Heat made** on the rate line is what the cells make. It used to be what was
  left after the vents beside them took their share, which rounds below zero -
  the line the tutorial points at said two uranium cells made -2 heat.
- **Replace or upgrade all**, from any part's sheet: pick what to replace it
  with, and see the new parts' cost, the refund, what you pay, each part's stats
  before and after, and the whole reactor's verdict before and after - measured,
  not guessed - before anything is bought. All or nothing.
- **A save state for every goal finished.** The game as it stood, with its
  verdict, filed in the log under the job. From there: rebuild that board onto
  today's, or roll the whole game back to that moment.
- **Example layouts** as the goals reach them - direct cooling, indirect
  cooling through outlets, and exchangers spreading a hot block across many
  first-tier vents - each shown once, kept on its job in the log, and one tap
  from the planner. A test holds every one to holding and paying.
- **Import asks first** and refuses a file it cannot read (Knockoff #36 - and
  here an unknown version used to load as a brand-new game).
- **Exchangers share evenly** (Knockoff #4). Every share is worked out before any
  is paid, and scaled down together when there is not enough to go round; handed
  out in turn, the up and left neighbours took it all and the far side blew.
- Already answered here: selling on a touch screen (#38) is a long press,
  replacing a part never loses money (#18), locked parts cannot be placed
  (#15), Heat Control Operator works (#6, #8), and a spent reflector leaves the
  board and stops boosting (#32) - which now has a test.

## Heat you can see

Heat is shown on the board as well as in the bar:

- Each tile carries `--warm`, its own containment as a fraction, drawn as an
  inset ember at its edges. A part about to fail glows before it goes.
- The board behind the grid warms toward red with the reactor's heat (`--hot`).
- Above 80% of maximum the grid shimmers, like air over a hot plate. Past the
  maximum the screen shakes, as before.
- Everything else goes quiet: toasts fade with `--quiet`, and the impact
  sounds drop by up to 60%. At the limit the loudest thing in the game is the
  reactor.

Because the reactor now shows what it is doing, the interface stopped repeating
it. If the board, the hum or a bar already says it, nothing else does: no pop on
placement, no wash or floating number on a sell or vent, no flash on an upgrade,
no toast for a goal (a tick appears on the goal line instead) or for a price the
button already shows. What stays is what the board cannot say - a refused tap
shakes, a tier unlocking is announced, and a meltdown stops everything.

## Gauges

Power, money and heat sit in one panel with nothing framed inside it. Power
and heat are a small label, a reading and one plain bar each - how Reactor
Incremental and Knockoff showed them - and the bar is the button that sells or
vents. The heat bar reddens past 60%; a full power bar brightens and dims,
because output going nowhere is worth noticing. Money rolls on digit drums
behind a single recessed slot, with Exotic Particles as plain text under it.

Parts wear light masks from **Kenney's Light Masks** and **Particle Pack**
(CC0), six white alpha PNGs in `www/fx/` (6.7 KB), tinted by CSS
(`mask-image` over a `background-color`). A cell's glow matches its shape - one
bar, two bars, or a 2x2 for a quad - in its fuel's own colour, and breathes while
it has life left. An accelerator holding heat shows a violet orb, a working vent
puffs steam while its fan turns, and an exploding part throws a spark.

## Sound

Six impacts in `www/audio/`, 47 KB, from **Kenney's Impact Sounds** (CC0). One
`<audio>` element per voice, two per file so a fast row of parts sounds like a
row of parts.

And one hum: `hum.webm`, 6.7 KB, a 2.4 s slice of `spaceEngine_001` from
**Kenney's Sci-fi Sounds** (CC0), cut with a crossfaded seam and re-encoded to
24 kbps Opus. It is the one sound on Web Audio, because only a buffer source loops
without a gap and bends pitch smoothly. It starts on the first tap, runs while
the reactor is producing, and rises with heat: from 0.75x speed and a murmur when
cold to 1.3x and three times louder at the limit, and higher again past it. Muted,
paused, idle or backgrounded, it fades out. It was picked by measurement like the
rest - 0.96 deep, 115 crossings a second, and the steadiest of forty candidates
by the variation in its loudness.

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

The buttons, dialogs and the gauge panel are cut from **"Sci-fi User Interface
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

## Shipping it

`docs/play/` carries everything Google asks for: the listing copy, the data
safety and content rating answers, a submission checklist, and the graphics.

```bash
python docs/play/make_graphics.py     # icon and feature graphic, from the art
python docs/play/capture_shots.py     # 1080x1920 screenshots of the real game
./gradlew bundleRelease               # the .aab, about 147 KB
```

The screenshots are headless Chrome at the device scale Play wants, driving a
real save through the game's own loader - not mock-ups. Signing is the one part
this repo does not do for you: `keystore.properties` is gitignored and the build
falls back to an unsigned bundle without it. See `docs/play/checklist.md`.

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
- Families arrive with the log: a new game opens on one cell and one dock tab.
  Vents, coolant and plating come with the goal that asks for a vent; capacitors
  and reflectors with the one that asks for a capacitor; exchangers, inlets and
  outlets with the first example layout that uses them; accelerators when
  particles become the job. Each arrival is announced once.
- The dock's **123** toggle shows each part's numbers in its corners, with the rate
  bar's icons: power in blue, heat in red, life in purple, price in green - a cell's
  power, heat and life, a vent's rate and capacity, and so on - with the price
  kept underneath.
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
