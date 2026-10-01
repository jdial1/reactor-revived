# Reactor Revived

A revival of [Reactor Incremental](http://www.kongregate.com/games/Cael/reactor-incremental)
for Android phones, by way of cwmonkey's
[Reactor Knockoff](https://github.com/cwmonkey/reactor-knockoff), the latest in
a line that starts in Minecraft:

| | |
|---|---|
| **IndustrialCraft 2** (2011) | The Minecraft mod whose nuclear reactor is the original puzzle: fuel rods heat their neighbours, vents and exchangers move that heat around, and a full grid melts down. |
| **[IC2 Reactor Planner](https://forum.industrial-craft.net/thread/2147-new-reactor-planner-made-by-talonius/)** by Talonius | A desktop tool for laying a reactor out and simulating it before mining anything. The grid stops being a build and becomes a puzzle on its own. |
| **[Reactor Incremental](http://www.kongregate.com/games/Cael/reactor-incremental)** by Cael (2014) | The planner made into an idle game: sell the power, buy upgrades, reboot for Exotic Particles. The game this one revives, and where every number here starts. |
| **[Reactor Knockoff](https://github.com/cwmonkey/reactor-knockoff)** by cwmonkey | Incremental rebuilt in HTML5 with no engine and no build step. The route Incremental survived by, and what the balance is checked against. |
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
  the only bitmaps in the APK are the 90 part sprites and four UI frames,
  37 KB together, and four paintings of the valley outside, 144 KB; the only
  sounds are six impacts.
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
  parts/revival/  the 90 part sprites
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

The parts are still Reactor Revival's sprites; the Sensory Palette asks for
16x16 art drawn for this reactor. The brief, the prompts and the drop-in steps
for it, and for the icons, sounds, effects and night backdrops, are in
`docs/asset-packs.md`.

The parts are drawn with **Reactor Revival's** art, in `www/parts/revival/` —
90 PNGs, one per part, committed and shipped. Fifteen of them - condensators,
component vents and hull vents, three families Revival never drew - are made
from its coolant and vent sprites by `docs/derive_art.py` (a red core, four
outward chevrons, an amber hull frame), so they share its palette and tier
marks. They arrived at 128x128
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

`www/js/tutorial.js` is eight steps of data: a selector to spotlight, a title,
the text, and for six of them a `waitFor` predicate on game state - place a
cell, turn the reactor on, put a second cell touching it, sell power, vent by
hand ten times, put a vent anywhere - where it goes is the player's to work out. Those steps will not advance until the player has really
done it, and they reuse the same board checks the goals do rather than
restating them. It used to be seventeen cards; the rest is left to the
operator's log, which opens each tab when it gets there, and to the parts, which
say what they do when tapped.

It starts on a new game, ends for good once finished or skipped, and replays from
Options. A save from before the tutorial existed loads with `tutorialDone` set,
so nobody mid-game gets taught what they already know. The overlay takes no taps
except on its own card, and the game keeps running underneath it. A card that
waits for the player dims nothing - the board and the dock are what they have to
reach - and only rings its target; the two cards that are only read dim the room.

Venting by hand is ten taps that take heat off, counted on the card and the goal
line. It used to be "down to 0", which grew harder the longer a new player spent
reading, since the cells kept adding heat.

It teaches how to do things and never states the rule. The step that used to
explain why packed cells run hot now asks the player to put two cells together
and watch the rate line; the square law is theirs to find.

## The operator's log

The goals are a checklist from one place: Harrow Station, a plant cold for
eleven years above a town that has been on candles since it closed. Each item is
the job, what it pays, and a one-line note from whoever asked for it - the mill
wanting a second shift, the clinic keeping its lights on overnight, the
university that sends an accelerator and stops saying what the particles are
for. The notes change as the demand grows: the first ten are sections of an old
start-up guide, the next ten are work orders, and the last ten are demands that
no longer give a reason. The checks are unchanged; only the reason for them is new. IC2 players ran
their reactors inside a base they had built, so the reactor had somewhere to
be. This gives it one.

## Parts guide

Options opens a **Parts guide**, and every part's sheet has an *About* button
that opens it at that part's family. Each family gets its rules in plain
words, a table of the tiers you can place with their numbers as they stand in
this game (upgrades included), the upgrades that touch it, and any field notes
you have earned for it. Families the log has not reached yet show only when
they arrive. Every part's sheet also carries a one-line description.

The guide states rules and never answers. It says that touching cells pulse
into each other and that a pulse raises power and heat, but not how much; the
experimental quirks stay in field notes until they are seen; and nothing in it
says where a part should go. A test holds all of that: every family covered,
every part described, and no word of the square law or of layout advice in the
guide, the descriptions or the example notes.

## From IC2: condensators, component vents, hull vents

Three part families from IndustrialCraft 2's reactor, each with its own
neighbour rule, so each wants a different spot on the board:

- **Component Vent** (Cooling, from goal 10) holds no heat. Every tick it takes
  heat out of each part it touches, up to its rate from each. Cells cannot
  dump into it; it wants to sit among coolant and exchangers, not cells.
- **Hull Vent** (Transfer, from goal 10) draws heat from the reactor's pool
  into itself and vents it, wherever it sits. It is indirect cooling, so a
  Direct-only run leaves it out. Outlets push before hull vents draw, and when
  the pool cannot fill every hull vent, they share it evenly rather than the
  first in scan order taking it all.
- **Condensator** (Cooling, from goal 14) holds far more than a coolant cell
  and never sheds any. Full and left alone, it fails like any part. Refilled -
  by hand from its sheet, for its price in proportion to what it holds, or
  automatically once **Condensator Refills** is bought, at its full price -
  it empties, and that heat is shed by a sink the player paid for. Storage
  that has to be paid to empty is not a held machine: a board that needed a
  refill earns Mark II, not Mark I, and the planner counts refills as upkeep.

The vent upgrades apply to both new vents, and the coolant upgrades to
condensators. A casing cannot pay for refills, so a condensator inside a module
simply fills.

Three smaller things came with them:

- **The ledger.** Tapping the rate line opens the tick split by kind: heat
  made by cells and by capacitors, shed by vents and by refills, turned to
  power, held, and moved in and out of the reactor.
- **The away receipt.** When a Time Flux run ends, one line says what the board
  did: ticks run, parts lost, money made.
- **A quieter hum** once the board has earned Mark I.

Part sheets now show each vent's and transfer part's rate as it runs where it
sits, capacitor and plating bonuses included.

A few lighter touches followed. The mark sheet keeps a **shift log**: the
board's last dozen events (marks earned, parts lost, meltdowns, reboots) with
how long ago each was. Records time each kind of run to its **first Mark I
board**. The ledger adds the board's **capacity**: what its vents can shed and
what it can hold before something fails; the planner alone adds how long until
full, since that is a projection. The parts guide can be **copied as a plain
datasheet**. A part placed on the board **settles** into its tile with a small,
heavy drop (none with reduced motion on).

Then five more, from further afield. A tile's heat bar stays **grey until it
is past four-fifths full**, and only then takes colour, as control-room screens
keep colour for abnormal states. A cascade of failures is **one line** in the
shift log, naming how many went and which went first. The ledger adds the
**last minute**, averaged per tick. Each example layout has a **broken copy**
to mend in the planner: a few tiles missing, pinned by a test so the example
holds and the copy does not. And a copied code carries the **board as a grid
of letters** under its header, with a legend, so a posted design can be read
without the game.

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
  lights the bank, which sits in the header and, when tapped,
  runs at ten times speed, counting down, until it is empty or tapped again.
- **The verdict line**, in the planner: what the board makes, whether it
  holds - or the tick it fails and what goes first - and profit after fuel.
  `www/js/forecast.js` copies the board and runs it 600 ticks under the floor's
  own rules - the power cap, auto-sell, and only the rebuys you have bought and switched on -
  changing nothing but money, then follows any heat still climbing (the
  reactor's, or any part's) on to where it gives out. A lab that changed more
  would forecast one board and run another; a test runs every example both
  ways and requires them to agree. Forecasts live only in the planner.
- **Flow**, beside the verdict: an overlay of what each tile did with heat this
  tick - made, taken in, passed on and vented, each as the rate line's own icon and a compact number (1.8K, 22M), at most three rows a tile so nothing runs off it at any tier. Players
  of this line kept calculators for exchangers and outlets; this is that, live.
- **Heat made** on the rate line is what the cells make. It used to be what was
  left after the vents beside them took their share, which rounds below zero -
  the line the tutorial points at said two uranium cells made -2 heat. The line
  ends in **held**: made = vented (and turned to power) + held, every tick.
- **Replace or upgrade all**, from any part's sheet: pick what to replace it
  with, and see the new parts' cost, the refund, what you pay and each part's
  stats before and after, with no colour saying which is better. In the
  planner it also forecasts the whole reactor before and after. All or nothing.
- **A saved layout for every goal finished.** The board as it stood - parts,
  power and the mark it had earned - filed in the log under the job, to
  rebuild onto today's board. The game itself is never rolled back - a
  meltdown is final.
- **Example layouts** as the goals reach them, each drawn larger with its idea
  marked over it - a yellow ring where the heat comes from, a blue one where it
  ends up, solid arrows for heat moving part to part and dashed ones for heat
  going through the reactor's pool; a few marks, never every flow - waiting on their job in the log
  behind a dot on the goal line, and one tap from the planner: direct cooling (goal 6), indirect
  cooling through outlets (10), exchangers spreading a hot block across many
  first-tier vents (14), an exchanger chain carrying heat away to a vent field
  (16) and a heat pipe of coolant, inlets and outlets (18). A test holds every
  one to holding, paying, and venting exactly what its cells make. Goal 22 is
  different on purpose: it shows the particle accelerator's numbers as they
  stand - what it holds, where it makes the most, the feed that holds it there
  and the feed that fills it - and puts one accelerator alone in the planner.
  How to feed it is the player's to work out; it is the story players of the
  line tell each other, and the game does not tell it for them.
- **Heat is conserved.** A cell's heat is split exactly between the parts
  around it. Knockoff rounded each share up, so 4 heat over 3 vents put 6 into
  them and sent -2 to the reactor: heat from nothing, which Flow made visible.
  Knockoff's other leaks are closed too. The reactor no longer sheds a free
  trickle of heat under its limit - every sink is a part you place - and over
  its limit it dumps the excess into its parts in full. A part that blows, is
  sold or is replaced leaves its heat in the reactor, as IC2's coolant did, and
  throttling halves what a cell's neighbours take as well as what it sends on.
  A test checks the ledger balances every tick.
- **Payback**, on the planner's verdict line and in its replace-all: what
  the board cost to build, over its profit per tick - how many ticks it takes to
  earn itself back. It is the efficiency figure IC2 players ranked designs by.
- **The balance is pinned.** A test holds each example's power, cost and payback
  to its current value, so a change that moves the balance fails a test rather
  than slipping through. Today direct cooling pays back in 160 ticks and
  indirect in 370 - the gap Reactor Incremental players complained about, left
  as it is until it is tuned on purpose.
- **Refactoring is free.** A sold part refunds its price less only the fuel or
  wear it has used. Knockoff docked a hot part for its heat, because that heat
  vanished; here the heat stays in the reactor, which is the real cost of
  pulling it out, so tearing a design down to improve it costs nothing else.
- **Say it once.** The board, the bars and the hum carry the information, so
  nothing repeats them: a tap you cannot afford flashes without a sound, and
  red is kept for danger - heat near the limit, a design that will fail, and
  losing a save, a run or a design. A price out of reach is grey, not red.
- **Import asks first** and refuses a file it cannot read (Knockoff #36 - and
  here an unknown version used to load as a brand-new game). A save is a way
  back past a meltdown, so a Hardcore run cannot be restored from one, and any
  other restored run says *Restored* on the goal line and in its records.
- **Exchangers share evenly** (Knockoff #4). Every share is worked out before any
  is paid, and scaled down together when there is not enough to go round; handed
  out in turn, the up and left neighbours took it all and the far side blew.
- Already answered here: selling on a touch screen (#38) is on the part's sheet,
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
shakes, and a meltdown stops everything. A part coming into reach flashes on its
own dock button and says nothing else; a trophy or a field note goes to Records
without a toast or a sound (house rule 3 of the soul instance, One Request,
Waiting).

## The valley outside

Behind the board is the valley Harrow Station powers: one painting per season,
chosen by the calendar. After seven in the evening it is the night set instead -
the same four seasons painted at night, the plant with only its windows lit - so
the only warm light is the station's own. The night paintings are the
designer's (docs/asset-packs.md, pack 5): 1100x600 WebP, about 130 KB for the
four, shown uncrushed rather than darkened in CSS. It shows faintly through the empty slots - a
slot not yet filled is a view of what it is not yet lighting - and fades as the
reactor heats, so near the limit the room's red is all there is. It never moves,
never changes while you watch, and is not shown in the planner.

When everything is done - the log finished, every part on issue, every upgrade
at its maximum, every tile filled - the game notices once, without a toast: the
log files a notice, *"All listed loads supplied. All parts on issue. All systems at
full rating. Demand continues."*, Records gains *All complete*, and from then
on the valley stays lit, day and night. The content ends there; the demand does
not. `www/js/complete.js` says what counts, and a test holds it.

The demand also grows after it is made. Three late jobs - 500 power a tick, a
$10B reserve, 1,000 particles - are cancelled the first time they are met and
asked again half as much higher, once each; the goal line flashes *Revised* and
the log keeps the first ask struck through, so a target that moves always says it
moved. Past the last job a **standing order** takes the goal line: *Increase
output to 2B per tick*, always a round figure above what the reactor makes when
it is issued, raised each time it is met, never lowered - not by a quiet
reactor, a save or a reboot. It pays nothing; Records counts the orders met.
`test/demand.test.js` holds both.

The four paintings (`www/backdrops/`) were made by this game's author for
Reactor Revival, in the manner of Simon Stålenhag, and are free to use; they are
not his work. Revival carries thirty; these four are the ones that look like
Harrow's valley - fog, flat grey light, green country, old plant standing in it -
resized to 900 px and re-encoded as WebP once, by hand, since there is no build
step. `www/js/backdrop.js` picks one; a test holds the four under 200 KB.

## Gauges

Power, money and heat sit in one panel with nothing framed inside it. Power
and heat are a small label, a reading and one plain bar each - how Reactor
Incremental and Knockoff showed them - and the bar is the button that sells or
vents. The heat bar reddens past 60%; a full power bar brightens and dims,
because output going nowhere is worth noticing. Money rolls on digit drums
behind a single recessed slot, with Exotic Particles as plain text under it.

Parts wear light masks, six white alpha PNGs in `www/fx/` (5.7 KB), tinted by
CSS (`mask-image` over a `background-color`). A cell's glow is the fuel inside
its own glass: `docs/derive_glow.py` builds the single, dual and quad masks from
the cell sprites themselves (the fuel-coloured pixels of all seven fuels, grown
a pixel and softened), so the light sits on the rods, including the staggered
four of a quad. It glows in the fuel's own colour, and breathes while it has
life left. The orb, puff and spark are from **Kenney's Light Masks** and
**Particle Pack** (CC0). An accelerator holding heat shows a violet orb, a working vent
puffs steam while its fan turns, and an exploding part throws a spark.

## Sound

Four impacts in `www/audio/` from **Kenney's Impact Sounds** (CC0), and two
one synthesised clack - five presses of a lever latching home, for the sell bar
and the plant computer both - made by `tools/synth_sounds.py`. One `<audio>` element per voice, two
per file so a fast row of parts sounds like a row of parts.

Every hand control is heard in two stages, a click and then its impact (Soul
Interview 5.4, 5.5): placing or moving a part is the click and clank of it going
into place, and the sell and vent bars, the reactor switch, the automation
switches, a doctrine side and an upgrade are keys pressed through. The click is
no new file - it is the place impact at 1.9x and a fifth of the loudness, 70 ms
ahead of the clack - and it has its own voices, so it never cuts off the clack
before it. Bulk actions (a plan or a layout built) stay one sound. Nothing takes
longer to act: the second stage is heard, not waited for.

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

### Graded on a phone

The impacts were picked for depth, and on a desk speaker they are deep. A phone
plays next to nothing under 300 Hz, so on a phone what is left of a deep impact
is its edge. Every cue was rendered as the game plays it and graded through a
model of a phone speaker (`tools/render_cues.mjs`, `tools/grade_sounds.py`):
sharpness on the Bark scale, energy over 2 kHz, the ring still sounding 60 ms
after the hit, the peak, and the length. A soft, short, dark hit scores 100.

| Cue | Heard on | Was | Grade | Now | Grade |
| --- | --- | --- | --- | --- | --- |
| `coin` | the sell bar, an order signed off, the money drums | Kenney `coin`: clunky - rattling into five uneven hits with the click ahead of it - and on a phone 1.1 kHz, 16% over 2 kHz, 12 dB louder than anything else | F (37) | `latch-1` to `-5`: a lever latching home; with the click, two clean hits; nothing over 2 kHz or ringing, level with the rest | A (88) |
| `buy` | an upgrade or research authorised, a doctrine | Kenney `buy`: 1 kHz, 15% over 2 kHz, the longest ring | F (34) | the same latch, cycled on its own | A (88) |
| `place`, `sell`, `vent`, `boom`, `click`, `print` | | deep impacts: soft on a phone | A (86-100) | unchanged | |

The sell bar is the most-pressed control in the game, and the coin was clunky:
it rattled into four or five uneven, boomy hits every tap. The Soul Interview
asks for presses that are "tactile mechanical double click industrial slow" - a
click, then a clack, with weight, in metal (5.4, 5.5) - so its replacement keeps
the click and is one clean clack after it: a lever latching home, synthesised
as a short body for weight (120 Hz, 60 ms), three damped metal modes (520 to
1,310 Hz), and the knock of the strike. Measured as heard: click then clack, two
hits, not five, and nothing left ringing. The plant computer's authorise is the
same latch. It was chosen by the designer from four candidates written by
`tools/synth_sounds.py --candidates` - a contactor, a counter drum, a Bakelite
toggle and the latch - after a first attempt, wooden mallet notes on a
pentatonic scale, measured well and did not fit: musical where the plant is
mechanical.

**Variance.** A family is cycled - every variant once, in a shuffled order, and
never the same one twice running, even across rounds - and every play of every
cue drifts up to 3% in pitch and 1.5 dB in level - the way no two presses of
one switch sound quite alike - so a run of taps is not one sound repeated.
Each variant of a family is the same switch, written with a little jitter in its
modes, not a different note. `test/audio.test.js` holds the cycle, and that the
synthesised files stay dark (under 2% of their energy over 2 kHz) and unclipped.

Eight cues: the impacts and the latch, each at its own playback rate - a lower rate is a
bigger, longer version of the same impact, so a meltdown is a punch at 0.8 - and
the hum. Nothing filed silently in the log makes a sound. Nothing in `www/js/sim.js` knows any of this exists -
audio is dispatched from the renderer and from `main.js`, and a test still
asserts the simulation touches no DOM.

Sound is on by default and the toggle is in Options; `muted` rides along in the
save. The source packs live in `assets/`, which is gitignored: 3 MB of sounds
this game does not play.

## Interface skin

*Superseded.* Every control is now a black key, every frame teal plating, every
name a cream plate (see *The control desk* below and *The plant computer*); the
steel frames described here no longer show anywhere. The files stay in
`www/ui/` as the lineage record, and the in-game credit says the first interface
was cut from them.

The buttons, dialogs and the gauge panel were cut from **"Sci-fi User Interface
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

### The control desk

Under the board sits the desk the operator works at, from the lead reference in
the Soul Interview (5.6): the gauges and the money on a pale painted panel,
framed in the plant computer's teal plating, with a painted process line under
them - blue on the power side, orange on the heat side, over a black rule. The
money shows through its own dark slot. The automation switches are black keys on
a strip of the same plating, and sink when pressed. The board stays the reactor;
nothing on the desk is decoration without a job.

The rest of the plant follows. Dialogs are framed in plating and named on a
cream plate, their actions keys two to a row, so a part's sheet fits a phone.
Options is the station office: its controls grouped on labelled plates
(Station record, Layout codes, Manuals, Control room), the sound a switch with a
lamp, the records and trophies on a cream record card. On Experiments the two
reboots sit on their own plate, *Core reboot*, and what the old status box said
is the plant computer's prompt (*170 EP available. 20 pending: reboot to bank
them.*). On Modules the note is a cream plate and each saved design sits in a
recessed bin like the parts. The tutorial's card is framed and named like a
dialog.

The strip above the desk is one row, not two: the floor line, the automation
switches and the Flow and Plan tools share one strip of plating, the floor
line taking the room left and wrapping to two lines before it pushes anything.
On a phone narrower than 380 px, Flow and Plan are their icons alone and the
money's drums shrink a size, so the floor line and the gauges keep their
numbers.

Below the desk, the parts are a tray of darker plating with each part in a
recessed bin, the chosen one ringed. The part families (Cells, Power, Cooling,
Transfer, Exotic, Modules) and the pages (Reactor, Upgrades, Experiments,
Modules, Options) are banks of lit keys, square and centred, like the
illuminated pushbuttons of an 80s desk: a bezel round a lens of smoked glass,
the family's first part (or the page's icon) behind the glass and its name
printed on it. Every key is always there, as on a finished desk. The bulb behind
the glass is the key's state: lit, it can be pressed; dark, it cannot yet - a
family not reached, Modules before casings are authorised, every page but the
reactor in the planner - and its icon is only a ghost through the glass. The
chosen one latches in and burns full; the others glow a little lower. Never an
underline or a segmented control. A key is a quiet click, no
clack, since nothing on the board moves. What a page has waiting is a lamp on
its key - amber on Upgrades, violet on Experiments, heat-coloured on Reactor when
it was paused while away - not a counted badge; the plant computer's own lamp and
its section counts say how many, and a screen reader still hears the number.

### Components

All of the above is built from ten components - key, lit key, switch, lamp, nameplate,
panel, card, stamp, bin, frame - and seven templates made from them: printer, file,
sheet, terminal, plates, strip, tray. Each component's look is set once, from tokens in `:root`,
in the *Components* section at the end of `www/css/app.css`; a screen's rules
only place and size them. [docs/ui-components.md](docs/ui-components.md) lists
them, their states and how to add a control, and `test/components.test.js`
keeps the look from drifting back into per-screen rules.

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

A debug APK for installing by hand is built by GitHub Actions
(`.github/workflows/android.yml`) on every push and pull request, after the
tests pass, and can be run on demand from the Actions tab. Download it from the
run's *Artifacts*, then `adb install -r app-debug.apk`. It is signed with the
runner's debug key, so uninstall a build signed by another machine first.
Pushing a tag (`v*` or `debug-*`, e.g. `git tag debug-2026-09-28 && git push
origin debug-2026-09-28`), or *Run workflow* on the Actions tab with a release
tag filled in, also publishes a GitHub Release, marked pre-release, with the
tested APK attached as `reactor-revived-<tag>.apk`.

## Balance parity

The numbers are checked against Knockoff *running* at
[cwmonkey.github.io/reactor-knockoff](https://cwmonkey.github.io/reactor-knockoff/),
not against its source: Reactor Incremental is the game being revived, and
Knockoff is the version of it that runs in a browser today. Two adjacent uranium cells report 4 power and 8 heat
there and here; part costs, containments, vent rates and tick counts match
across tiers. Those observations are permanent tests, so the balance cannot
quietly drift.

Where the original's code and its own text disagree, the code wins: Perpetual
Reflectors promises a 1.5x replacement cost but charges list price, and a
reactor sitting just over twice its heat ceiling does *not* melt down, because
the over-limit dump runs first. Knockoff's free trickle under the limit is
the one rule dropped on purpose: it deleted heat.

## Differences from the original

- The particle accelerator works. Knockoff's first one held 100 heat but made
  its particles at 500 million, so it could never make one, and any heat that
  reached it overfilled it in a tick and melted the reactor. Here each tier
  holds twice its particle heat (the sweet spot is half full), and making
  particles spends a hundredth of the heat it holds each tick - a named sink
  that lets a steady feed settle it where the feed and the spending meet. A
  test keeps a working farm (one dual seaborgium cell between two
  accelerators) as a fixture; the game shows only the numbers.
- Capacitors and plating speed only the vents and transfer parts they touch.
  Knockoff applied their bonus board-wide; here where a capacitor sits is a
  choice, as every other part's is.
- The reactor keeps running on the Upgrades, Experiments, Modules and Options
  pages. Only its on switch, or leaving the app (which banks Time Flux), stops
  it. The switch sits in the header with a lamp, lit while the reactor runs,
  and a new station starts with it off: turning the reactor on is the new
  operator's first act, and the tutorial's third card.
- Portrait, and 12x8 rather than 11x14. Fewer tiles, but the whole reactor is
  visible at once with tiles big enough to hit on a phone, which matters more
  than matching a tile count. The board never grows: Knockoff's two expansion
  upgrades are gone, because a bigger board would no longer fit the screen.
- Touch instead of a mouse. Tap to place, tap a placed part to inspect it,
  every action on a placed part in its sheet, drag to paint, pinch to zoom. The original's six
  modifier-key macros are gone; dragging covers what they were for. A press on
  a placed part - a tap, a long press, one that slips - always opens its sheet
  and nothing else; a stroke paints only when it starts on empty ground, and
  while a part is being moved nothing paints, so the next press is where it
  goes (and a press on another part opens that part's sheet). A sheet ignores
  taps for its first 350 ms, so the click a phone sends after the tap that
  opened it cannot land on Sell or Move.
- Families arrive with the log: a new game opens on one cell and one dock tab.
  Vents, coolant and plating come with the goal that asks for a vent; capacitors
  and reflectors with the one that asks for a capacitor; exchangers, inlets and
  outlets with the first example layout that uses them; accelerators when
  particles become the job.
- Every dock part shows its numbers in its corners, with the rate bar's icons:
  power in blue, heat in red, life in purple, price in green, and its art in
  the middle.
- Parts reveal progressively — each stays hidden until ten of the one before it
  have been placed — so the dock opens with ten buttons instead of seventy-five.
- Upgrades show only what you own or can afford, plus the three nearest to
  affordable, dithered.
- The Google Drive save integration is gone. Saves live in `localStorage`, with
  export and import through Android's document picker.
- Two systems are this game's own, not the line's. **Doctrine sets**: every
  upgrade the line had makes a number bigger, and a doctrine side changes the
  shape of a good layout instead (see Doctrines above). **Modules**: nothing
  earlier in the line sealed a design into one part; here a proven 3x3 takes a
  single tile of a board smaller than Knockoff's, at the cut its casing takes.

## Where the design came from

`docs/reactor-lineage-chart.pdf` traces the whole family tree back to
IndustrialCraft&sup2;'s nuclear reactor in Minecraft: a component reference with
IC&sup2;'s published figures, and a table mapping each of its parts to the part it
became here.

The short version: IC&sup2;'s fuel rods make `5 x n` power and `2n(n+1)` heat,
where `n` counts the rod and its neighbours. Power linear, heat quadratic. Every
generation since has kept that asymmetry, including this one.

## Fair play

This game keeps the contract the Loathing games are loved for, and the one its
own lineage kept by never asking for anything: no ads, no purchases, no
accounts, no network. Nothing is sold, nothing can be skipped for money, and
nothing runs on a timer that punishes being away - Time Flux banks the time
instead. It stays that way.

## The automation panel

Every automated system the player owns has a switch and a lamp on the reactor
screen, on the floor line's strip between the verdict and the Flow and Plan
tools, and nowhere else: **Sell** (the power lines
selling on their own), **Rebuy** (spent cells, reflectors, condensator refills
and capacitor buyouts replacing themselves) and **Operator** (Heat Control
Operator). A lamp is lit while its system runs. The panel appears with the first
system bought, and a switch with its own; in a Manual feed run there is no Rebuy
to switch. Knockoff let its automation be toggled; here the toggles sit where a
control room keeps them, in sight of the reactor. Selling and rebuying start on,
the operator starts off.

A switch changes how the machine runs, so flipping one starts the board's mark
again, as a doctrine does, and the planner's forecast runs with the switches as
they are set.

## Letters

The valley's story is told in letters, and only there and in the log (Soul
Interview 6.3): optional, never required, never interrupting play. A letter is
filed in the operator's log as the station climbs - fifteen of them, from the
Regional Energy Authority, Harrow Supply, the town clerk, the clinic's night
ward, the university, the works and, once, the courier. Nothing outside the log says
it came. Records counts them.

### The station file

The operator's log is one file, not a checklist with lists folded under it: the
orders and the letters, oldest first, as they came, each letter just above the
order it came with (`www/js/story.js`). The orders are documents too, and their
paper drifts with the log's voice:

- **Jobs 1-10** are pages of the *Operating manual*, marked *Translated* - the
  `drawings` letter says only sections 1 to 4 were, and these are sections 1.1
  to 4.5.
- **Jobs 11-20** are *Work orders* on manila, each from someone in the valley,
  mostly the same institutions that write the letters: the clinic's overnight
  load, the Authority's inspection, the town clerk's winter reserve, Harrow
  Supply's thorium delivery.
- **Jobs 21-30** are *Demands* on a bare slip, *From: not stated*.
- Past the last job the **standing order** is unsigned too, until the works'
  letter has said who it is for; then it is *From: Harrow Works*.

A done order is stamped (*Confirmed*, *Supplied*); a revised one keeps its first
ask struck through, stamped *Revised*. The order the room is waiting on is
ringed. A letter is an envelope with a flap, a postmark (*Received* or *Found*)
and a seal until it is opened, when it becomes a typed sheet in place.

Everything before the current order folds into one line (*Filed: 14 orders, 3
letters*), except a letter not yet read, which stays out of the fold until it
is opened, and the log opens on it. The old silent log book is gone: what it
said, the dock, the Modules key and Records already say.

### The printer

Nothing reaches the file on its own. A met order is held on the goal line -
*Sign off: Buy an upgrade $100*, in the price's colour - until it is tapped,
which pays it. The next order is then on the station's printer, and the goal line
reads *Awaiting the next order.* Five to ten seconds later it comes out of a slot
at the top of the screen on tractor-feed paper in green bars, printed in dots a
character at a time with the head ticking across, is torn off, and goes into the
log behind the goal line; a lamp on the goal line stays lit until the log is
opened. It cannot be met until it has printed.

Letters and field notes come the same way, one at a time each. The next letter
prints once every letter filed has been opened - opening is the claim, and
reading stays optional: an unopened letter only holds back the letters after it.
A field note seen on the board is printed and filed under the current order,
and only written into its parts' sheets once it is signed off; the next one
waits on it. The printer takes no taps, prints one thing at a time with orders
first, and prints nothing in the planner or while the game is in the background.
`www/js/story.js` decides what is waiting and where it files;
`www/js/printer-ui.js` is the waiting and the printing.

Every paper in the log came off that printer, so every paper has its punched
margins: sprocket holes down both edges and the perforation that would tear them
off.

They hint before they answer, and by the end each of the world's open questions
has an answer (why the plant closed, why nobody else could run it, what the
demand and the particles are for, what came in the last crate). Like the log,
they speak of the station and the power, never to the operator. The words, and
the answers they give, are accepted by the designer: every letter has a row
in `docs/soul-interview.md` (7.3), and `test/letters.test.js` fails for one
that does not.

## The plant computer

Upgrades and research are not bought from a shop. They are authorised on the
**plant computer**, a terminal in the control room: teal plating around a dark
phosphor screen, a cream plate with its name (*Maintenance* on the Upgrades
page, *Research* on Experiments), and a lamp lit while anything on the screen is
within budget. The screen's first line stays in view as the list scrolls: the
budget (*Maintenance. Budget: $60K.*), or for four seconds after a purchase,
what was done (*Authorised: Forceful Fusion, level 1.*), which is also said to a
screen reader once.

The upgrades are lines on the screen, not cards, and a part family's upgrades
share one row of condensed tiles: what the next level moves, its price and the
level, with the full name and description in the tile's label. Each fuel is
**Power · Time · Autobuy**, and so are the reflectors; vents and exchangers are
**Rate · By plating · By capacitor**; capacitors are **Capacity** and
**Replace**, under Autobuy's column. On the Experiments screen the six
accelerator tiers are two rows of three, and the nine experimental-part unlocks
a 3x3 grid, where each price shows the rise that buying another brings. Tile
rows lead their section; once any tile of a row shows, all of it does, the rest
dimmed, so every tile keeps its place. `TILE_ROWS` in `www/js/upgrades.js` is
the one list of them. A tap is a key pressed
through: the line goes to inverse video while it is held, and again when the
computer takes it, and it is heard in two stages - a short click (the place
impact, fast and quiet) and then the buy impact as the clack. One tap still buys
one level; nothing takes longer than it did (Soul Interview 5.5: slow in feel,
not in speed). The colours that carry a signal stay: a price within reach in
cash, a raised figure in power, particles in violet.

## Records and runs

Options keeps a **Records** page, the statistics page Reactor Incremental had:
the most power a reactor has made in a tick, the longest it has run without a
part failing, the hottest it has been held, meltdowns, parts placed, Exotic
Particles ever made, and how many field notes have been earned.

A **reboot can take a rule** for the run it starts, the way Kingdom of
Loathing's ascensions take a path: *Direct only* (no exchangers, inlets or
outlets, and no module that holds one), *Uranium only*, *Hardcore* (no planner,
no layout codes, no rebuilding saved layouts), *Manual feed* (nothing rebuys
itself) or *Casingless* (no modules). The
rule shows on the goal line. Each run is timed to each rung of power per tick -
1K, 1M, 1B, 1T - from its reboot, and Records keeps the fastest per kind of
run. Nothing carries over from a rule but the time.

A **trophy case** sits under Records, after Kingdom of Loathing's: a dozen odd
feats, named flatly, shown as ??? until they are earned. None of them changes a
number in the game. **Copy records as text** puts the records, the trophies and
the current board's layout code on the clipboard, to keep or to share. Finishing
the operator's log offers a reboot and a rule for the next run.

**Field notes** fill a part's sheet the first time its quirk is seen on the real
board: a reflector wearing out, a thermionic cell turning heat into power, an
extreme capacitor heating itself, an accelerator making particles. The planner,
forecasts and module casings never count.

**Marks**, after the ratings IC2's players gave their designs. The real board
earns one by running: 300 ticks making power since the player last changed it.
*Mark I* - heat has stopped rising anywhere on the board, and the reactor is
within its limit (one held over its limit by the emergency dump is only running
hot). *Mark II* - nothing
has failed, but heat is still building somewhere. *Mark III* - parts have been
lost since the last change. A lost part is an incident, not a redesign; placing,
selling, building, upgrading or switching a doctrine starts the mark again. The
line under the grid reads like the sign at a plant gate - *Mark I · 4,210 ticks
without incident* - and tapping it gives the legend and the last incident.
Records leads with the **most power from a Mark I board**, output that holds,
with peak power from any board below it, and the **best Mark I efficiency** - power per
fuel cell, a quad counting four, IC2's other measure of a design. The planner's
verdict speaks the same language as a forecast: *Would earn Mark I*, *Would
earn Mark II*, or the tick it fails. Every example layout would earn Mark I.

Tapping a part offers **Move**: the next tap on an empty tile carries it there
with its heat, its life and a casing's insides, free, as parts moved in an IC2
reactor's inventory. A move is a new machine, so the board's mark starts again.

A copied layout code carries its mark, power and efficiency on a line above
it, and inside it the upgrades and doctrine sides it was copied under. Pasting
one keeps the header as the claim it makes, and says when your game differs,
so "Mark I" means the same in both. Save states remember the mark the board
had when the job was done.

**Exotic Particles count as far as the board handles its heat**, as Reactor
Incremental paid them on heat removed: each tick, an accelerator's particles
are scaled by how much of the heat made that tick was vented or turned to
power. A board that holds keeps them all; one storing heat toward a failure
earns little.

A meltdown still wipes the board clean, and now leaves a **receipt**: how long
the board ran since it last changed, the first part it lost and what that part
held, and what the last tick made against what the vents shed.

The hum keeps time with the heat: a board in balance hums steady, and one that
is building toward failure beats.

The verdict belongs to the planner, as the forecast belonged to the IC2
planners: on the real board you watch, and find out. Example layouts wait on
their job in the log, marked with a dot, and open only when asked. Saved
layouts can be rebuilt; the game itself cannot be rolled back.

## Soul

This game is the source of **Containment**, a soul in the Game Souls library:
*"A good design is one you can stop watching."* Its pillars are the Ledger
(heat is conserved), Geometry Is the Build, Proof by Running, and the Workbench
Ships with the Game, and it draws on eleven of the library's components,
including interface voice, audio as information, automation and the
workbench. [docs/soul.md](docs/soul.md) is the soul as it applies here, in the
library's instillation-report shape: the verbs, the economy's shape, the ideal
player, each component and its conflicts, the pitfalls scanned, the litmus
test, and every change traced from mechanic to feeling.
[docs/soul-interview.md](docs/soul-interview.md) is the other half: the
designer's answers about the world around the machine - why the plant runs, who
the operator is, how the game speaks and looks - turned into rules. Its soul
sentence: *"Paid to start a Soviet reactor nobody else could, in an English
fog, you learn it alone until it holds. The valley asks for more."*

## Credits

Original game by **cwmonkey**. Based on **Reactor Incremental** by **Cael**.

The part artwork is Reactor Revival's, with fifteen sprites derived from it
(see Part artwork). The four paintings of the valley are also Reactor Revival's,
made by this game's author in the manner of Simon Stålenhag, and free to use. The
interface icons and the four night paintings of the valley were made for this
game by its author (docs/asset-packs.md). The sounds, light masks and interface frames are CC0, from
Kenney and from Buch on OpenGameArt.
