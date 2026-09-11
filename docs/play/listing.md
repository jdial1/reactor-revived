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
Build a reactor. Power grows with neighbours; heat grows with their square.
```

76 characters.

## Full description (4000)

```
A reactor is a grid, and every part you put on it makes the next decision
harder.

Fuel cells make power. Put two next to each other and they pulse into one
another: the power adds up, but the heat multiplies. That single asymmetry is
the whole game. Packing cells together is the only way to get rich and the only
way to melt down.

Everything else exists to buy you room. Vents bleed heat away. Exchangers even
it out across their neighbours. Inlets pull it out of parts that are struggling
and outlets push it into parts that can take it. Plating raises the ceiling.
Capacitors raise the other one. Reflectors squeeze more out of the cells you
already have.

Sell the power. Buy an upgrade. Fit one more cell in. Watch the heat.

WHAT IS IN IT
- A 12x8 reactor, 75 parts across ten kinds and six tiers, seven fuels
- 63 upgrades, each one measured against the simulation rather than described
- 30 goals that teach the game without a tutorial
- Exotic Particles: reboot the reactor, keep what it taught you, start harder
- Meltdown, if you earn it

HOW IT PLAYS
Tap to place. Drag to paint a row. Long press to sell. Pinch to zoom, double
tap to put it back. Tap a placed part to see exactly what it is doing right now,
and to sell one, all of that kind, or everything.

The reactor runs while you are watching it and pauses while you are not, so
nothing happens behind your back.

BUILT SMALL, ON PURPOSE
No ads. No in-app purchases. No accounts. No analytics. No network access at
all - the app has no internet permission, so it could not phone home if it
wanted to. Your save lives on your phone and can be exported to a file you keep.

The whole game is about 150 KB.

WHERE IT CAME FROM
This is the sixth game in a line that starts in a Minecraft mod. IndustrialCraft
2's nuclear reactor invented the puzzle; Talonius's reactor planner turned it
into something you solve on paper; Cael's Reactor Incremental made it an idle
game; cwmonkey's Reactor Knockoff rebuilt it in HTML5. Reactor Revived is a
clean-room rewrite of that for a phone, with Reactor Revival's artwork and
sounds from Kenney. The full lineage is in the game, under Options.
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
