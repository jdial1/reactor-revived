# Play Store listing

Everything Google asks for, in the order the console asks for it. Character
limits are in brackets; the text below is inside them.

## App details

| field | value |
|---|---|
| App name (30) | `Reactor Revived` |
| Package | `com.jdial.reactor` |
| Default language | English (United Kingdom) |
| App or game | **Game** |
| Category | **Simulation** (second choice: Puzzle) |
| Tags | Idle, Simulation, Strategy, Offline |
| Contact email | justin.dial@mawdpathology.com |
| Website | https://github.com/jdial1/reactor-revived |
| Privacy policy | https://jdial1.github.io/reactor-revived/privacy (see PRIVACY.md) |

## Short description (80)

```
A reactor on a 12x8 grid. Build one that holds, then put your phone away.
```

73 characters. It says what the player does and never how the heat
works: the square law is the first thing the game lets them find, and the store
must not spend it.

## Full description (4000)

```
A reactor is a grid of 96 tiles, and every part you put on it makes the next
decision harder.

Fuel cells make power and heat. Cells that touch pulse into one another. What
that is worth, and what it costs, is yours to find out: put two together and
watch the numbers.

Everything else exists to handle the heat. Vents shed it. Exchangers spread it
across their neighbours. Inlets pull it out of parts and outlets push it in.
Coolant holds it for a while. Plating raises the reactor's limit; capacitors
raise how much power it can store. Reflectors make the cells beside them work
harder. Heat never vanishes on its own: every point the board makes is shed,
turned into power or held somewhere, and one line says which.

A design is not finished when it is placed. It is finished when it has run.
Three hundred ticks unchanged and the board earns a mark: Mark I if it holds,
Mark II if heat is still building somewhere, Mark III if a part was lost.
Records lead with the most power from a Mark I board.

WHAT IS IN IT
- A 12x8 reactor: 90 parts in 13 kinds, seven fuels
- 72 upgrades, six of them doctrine sets that change what a good reactor looks
  like
- The operator's log: 30 jobs at Harrow Station, after a seven-card tutorial
- A planner beside the reactor: try a design for free and see the tick it
  would fail, then build it
- Layout codes: copy a whole board as text, with its mark and the upgrades it
  ran under, and paste in someone else's
- Modules: design a sealed 3x3 and place it as a single part
- Exotic Particles and reboots, five restriction rules, records and trophies
- Meltdown, if you earn it, and a receipt of what went first

HOW IT PLAYS
Tap to place. Drag to paint a row. Tap a placed part to see exactly what it is
doing, and to sell, move or replace it. Pinch to zoom; tap twice to put the
board back.

The reactor runs while you are watching it. When you leave, nothing happens
behind your back: the time away is banked, up to eight hours, and spent at ten
times speed when you choose.

BUILT SMALL, ON PURPOSE
No ads. No in-app purchases. No accounts. No analytics. No network access at
all - the app has no internet permission, so it could not phone home if it
wanted to. Your save lives on your phone and can be exported to a file you keep.

The whole game is under a megabyte.

WHERE IT CAME FROM
This is the sixth game in a line that starts in a Minecraft mod. IndustrialCraft
2's nuclear reactor invented the puzzle; Talonius's reactor planner turned it
into something you solve on paper; Cael's Reactor Incremental made it an idle
game; cwmonkey's Reactor Knockoff rebuilt it in HTML5. Reactor Revived is a
clean-room rewrite of that for a phone, with Reactor Revival's artwork and
sounds from Kenney. The full lineage is in the game, under Options.
```

## Release notes (500) — the next version

The version number waits on item 7 of [mvp-1.0.md](../mvp-1.0.md): 1.0 if 1.2
never shipped publicly, otherwise 2.0.

```
- Marks: a board left unchanged for 300 ticks earns Mark I, II or III
- The planner: try a design for free and see the tick it would fail
- Layout codes carry the mark and upgrades they ran under
- Condensators, component vents and hull vents, from IC2
- A parts guide, a shift log and a heat ledger
- Heat is conserved: nothing vanishes for free any more
- Capacitors and plating boost only the parts they touch, so older boards may
  run slower
- Six doctrine sets; switch sides any time
```

## Release notes (500) — version 1.2

```
- The reactor hums, and the hum rises as it heats.
- Heat shows on the board: parts glow at the edges, the room warms, and the grid
  shimmers near the limit.
- Cells, vents and accelerators light up while they work.
- Three pairs of doctrine upgrades - pick one side of each, every run.
- Modules: design a sealed 3x3 and place it as a single part.
- The goals are now the operator's log at Harrow Station.
```

## Release notes (500) — version 1.1

```
- A guided tutorial that explains every part, how they interact, upgrades and
  Exotic Particles - with a few steps you do rather than read. Skip it any time,
  replay it from Options.
```

## Release notes (500) — version 1.0

```
First release.

- A 12x8 reactor: 75 parts, 63 upgrades, 30 goals
- Exotic Particles and rebooting, for when the first reactor stops being hard
- Export and import your save as a file
- No ads, no purchases, no accounts, no network access
```

## Graphics

| asset | file | required size |
|---|---|---|
| App icon | `graphics/icon-512.png` | 512 x 512, 32-bit PNG |
| Feature graphic | `graphics/feature-1024x500.png` | 1024 x 500 |
| Phone screenshots | `graphics/01..05-*.png` | 1080 x 1920, 2 to 8 of them |

Rebuild them with `python docs/play/make_graphics.py` and
`python docs/play/capture_shots.py`. The screenshots are the real game under
headless Chrome at the device scale Play wants, not mock-ups.

Tablet screenshots are optional and none are supplied: the game is portrait and
locked to it, so Play will show the phone set on larger devices.
