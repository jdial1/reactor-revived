# Asset packs: prompts and briefs

The Soul Interview's Sensory Palette (docs/soul-interview.md, 7.6) is met
everywhere except the part art, which is still Reactor Revival's sprites. This
file holds the prompts and briefs for every asset pack still to make, in the
order they matter:

| # | Pack | Count | Replaces | Status |
| --- | --- | --- | --- | --- |
| 1 | Part sprites | 90 | `www/parts/revival/*.png` | To make: the one open row in 7.6 |
| 2 | Interface icons | 17 | the pixel grids in `www/js/icons.js` | **In** (15 used): `www/js/icon-art.js` |
| 3 | Sounds | 8 cues | `www/audio/*` (Kenney impacts, reused) | To make |
| 4 | Effect sprites | 3 | `www/fx/spark.png`, `puff.png`, `orb.png` | To make |
| 5 | Night backdrops | 4 | the CSS darkening after seven | **In**: `www/backdrops/*-night.webp` |

**What came back.**
- **Icons** came as one sheet of twenty on tiles (a JPEG). They were rebuilt
  at their native pixel size by sampling the centre of each pixel (a pitch of
  4.267), the tiles removed, and each icon reduced to its own two to four
  colours with the game's outline.
  - Options' tracks were lightened to steel so they read on a dark key.
  - The two rockers (play, pause) are not used by the game and stay as they were.
  - The spare canister and hourglass variants were not used.
- **The night set** is one view in four seasons: green for summer, snow on the
  hills over a greening field for spring, falling snow for winter, red and
  gold for autumn. It is not the day paintings' view, so the valley changes at
  seven; painting a day set from this view would make the two one place.

Each pack has a **brief** (for a pixel artist or a sound designer) and
**prompts** (for a generator). Generators do not hold a pixel grid or a palette
reliably: use them for concepts, then draw or clean every sprite by hand at its
real size. Nothing ships that a person has not checked at 1x.

---

## The style block

Paste this at the top of every image prompt, and give it to any artist first.

> Harrow Station: an old Soviet-built nuclear plant in a foggy English valley,
> reopened after eleven years. A control room left in clean order over a
> failing core: cold, industrial, mildly musty, maintained on the surface.
> Materials are Soviet off-colour plastics, teal and orange metal plating,
> cream painted panels with process lines in orange, blue and black, black
> bakelite keys, steel with rivets. Flat 2D pixel art, seen straight on, a
> 1-pixel near-black outline (#07090c). Dense and intentional: every pixel
> means something, nothing is decoration. Never 3D, never glossy, never
> gradients or bloom, never over-greebled, never a generic factory part: only
> the parts this reactor needs. Colour that carries a signal is allowed
> (a fuel's glow, heat's orange); bright decoration is not. Transparent
> background.

**The palette.** Stay inside it; a sprite may add at most two shades of its own
family colour.

| Use | Colours |
| --- | --- |
| Outline, deep shadow | `#07090c` `#101417` `#151a21` |
| Steel, cold to lit | `#262e39` `#4b5563` `#7b8794` `#c8d3de` |
| Teal plating | `#1b2927` `#2f4744` `#4a6a66` `#6f8f8a` |
| Cream panels and labels | `#b8ae92` `#d9d2bd` `#efe9d8` |
| Orange plating, rust | `#8a4a26` `#b8602e` `#d8703a` |
| Process blue | `#2f5f8a` `#4a86b8` |
| Signals | power `#58c470`, cash `#d8c15a`, particles `#b06fd8`, danger `#d84a3a` |
| Fuels (glow only) | uranium `#7fe07a`, plutonium `#6fd0e8`, thorium `#e8d06f`, seaborgium `#e87fb0`, dolorium `#b08cff`, nefastium `#ff6f5a`, protium `#f0f4ff` |

---

## Pack 1: Part sprites (90)

### Technical spec

- **Master size 16x16**, pixel art, transparent background, the palette above.
  Draw at 1x.
- **Export** each master scaled 4x with nearest-neighbour to **64x64 PNG**,
  indexed colour, under the file name listed for its family. The game reads
  64x64 and draws it pixelated in a 31-48 px tile, so it must read at 31 px:
  test every sprite at that size on the dark tray (`#1c2b29`) and on an empty
  tile (`#262e39`).
- **Tiers 1-5** (Basic, Advanced, Super, Wonderous, Ultimate) are one object
  improved, never five different objects. Mark the tier two ways at once:
  1. **Pips**: 1 to 5 notches along the bottom edge, cream on dark.
  2. **Material**: 1 painted grey steel, 2 teal plating, 3 orange plating,
     4 cream enamel with black bands, 5 black bakelite with cream trim.
- **Tier 6** is the experimental part, the one that "came without a manual"
  (log job 29, letter `objective`): built by the university's units for a
  reactor that runs without an operator. It has **no pips, no labels, no
  handles, no screws**, nothing a hand would hold or an eye would read.
  Seamless and precise, slightly wrong in proportion, in black `#101417` with
  its family's signal colour inlaid.
- **Two constraints from the build:**
  - **Cells**: the fuel must be the only pixels in the fuel's colour, inside
    glass rods. `docs/derive_glow.py` finds those pixels to make the glow
    masks, and all seven fuels at one rod count must share **identical rod
    geometry**.
  - **Vents** (and component and hull vents): the game spins the sprite as a
    rotor, cropped to the **middle 60%** of the tile (about 10x10 of 16). Put a
    rotor there that looks right turning, with the frame and corners outside
    it.

### The master prompt

For a generator, fill in the brackets. Always attach the style block.

> [STYLE BLOCK] A single 16x16 pixel-art game sprite of [PART], for a nuclear
> reactor puzzle game, seen straight on, centred, transparent background.
> [FAMILY DESCRIPTION]. [TIER LINE]. Readable at 32 pixels. Limited palette,
> 1-pixel near-black outline, no anti-aliasing, no text.

Tier lines:

- **Tier 1:** "Painted grey steel, one cream notch on the bottom edge. Plain,
  old, serviceable."
- **Tier 2:** "Teal metal plating, two cream notches. A careful refit."
- **Tier 3:** "Orange metal plating, three cream notches. Heavier fittings."
- **Tier 4:** "Cream enamel with black bands, four cream notches. Precise."
- **Tier 5:** "Black bakelite with cream trim, five notches. The best the
  plant ever fitted."
- **Tier 6:** "Seamless matte black, no markings, no screws, no handles: made by
  machines for a machine. [SIGNAL] inlaid. Proportions slightly wrong."

### The families

**Fuel cells: 21 sprites.** Files `cell_{f}_{n}.png`, where the fuel index `f`
is 1 uranium, 2 plutonium, 3 thorium, 4 seaborgium, 5 dolorium, 6 nefastium,
and `n` is 1, 2 or 4 rods. Protium is `xcell_1_{n}.png`.

> A fuel cell: [ONE / TWO / FOUR] vertical glass rod(s) in a steel cradle with
> end caps, the rods filled with glowing [FUEL] fuel in [HEX]. Dual cells
> carry two rods side by side, quad cells four in a 2x2 block, tightly packed:
> four rods in one cradle should look crowded and hot.

- **The rule:** the cradle and caps are identical across all fuels at one rod
  count; only the fuel colour changes.
- **Protium** is the experimental fuel: the same cradle in tier-6 black, with
  white-blue fuel `#f0f4ff`.
- Do not mark cell tiers with pips. The rod count is the tier.

**Heat vents: 6.** Files `vent_1..6.png`.

> A heat vent: a round fan rotor of 4-6 blades in a square louvred frame with
> corner bolts, drawing heat out and away. The rotor sits in the middle ten
> pixels.

- **Tier 6** is the Extreme Vent, which pays for venting with power: the rotor
  is black with a thin power-green inlaid ring.

**Component vents: 5.** Files `component_vent_1..5.png`.

> A small vent (rotor about 8 px) with four chevrons pointing outward from each
> side, at the parts it cools.

**Hull vents: 5.** Files `hull_vent_1..5.png`.

> A vent set inside a thick amber-orange frame, the reactor's hull that it
> draws heat from.

**Heat exchangers: 6.** Files `exchanger_1..6.png`.

> A square block with two crossing pipes and four short arrows, heat moving
> both ways between neighbours; orange on one axis, process blue on the other.

**Heat inlets: 6.** Files `inlet_1..6.png`.

> A heat inlet: a flanged pipe mouth with orange arrows pointing inward to the
> centre, drawing heat in from the touching parts.

**Heat outlets: 6.** Files `outlet_1..6.png`.

> A heat outlet: a flanged nozzle with orange arrows pointing outward from the
> centre, pushing the reactor's heat out into the touching parts.

**Coolant cells: 6.** Files `coolant_cell_1..6.png`.

> A squat coolant canister with a sight glass showing cyan-blue coolant, frost
> at the seams.

- **Tier 6** is the Thermionic Coolant Cell, which turns half the heat it takes
  into power: the coolant glows, with a power-green filament through it.

**Condensators: 5.** Files `condensator_1..5.png`.

> A coolant canister whose sight glass shows a dull red core instead of blue.
> It fills and must be refilled, so it has a filler cap on top.

**Reactor plating: 6.** Files `plating_1..6.png`.

> A thick armour plate, the reactor's hull, with a riveted border and a
> stamped rib pattern. Heavy, dull, no moving parts.

- **Tier 6** is the Charged Reactor Plating: power-green traces running through
  the plate.

**Neutron reflectors: 6.** Files `reflector_1..6.png`.

> A neutron reflector: a dense block with a concave dished face, like a small
> mirror of graphite and beryllium, a few pale lines to show it throws back.

- **Tier 6** is the Thermal Neutron Reflector: a warm orange glow in the dish.

**Capacitors: 6.** Files `capacitor_1..6.png`.

> A capacitor: an upright cylinder in a clamp, two terminals on top, a cream
> rating label with a stamped line (no readable text).

- **Tier 6** is the Extreme Capacitor, which heats itself: black, with a faint
  orange glow at its base.

**Particle accelerators: 6.** Files `accelerator_1..6.png`.

> A particle accelerator: a ring of magnet segments around a narrow beam pipe,
> a faint violet `#b06fd8` spark on the ring.

- **Tier 6** is the Black Hole Particle Accelerator: the ring around a perfectly
  black core that everything leans toward, with the violet drawn inward.

### Acceptance

- [ ] 90 files, 64x64, under the names above, each a clean 4x of a 16x16 master.
- [ ] Every sprite reads at 31 px on both test backgrounds.
- [ ] Tiers 1-5 of a family are one object improved; tier 6 has no human
      affordances.
- [ ] The seven fuels share rod geometry at each rod count, and fuel is the only
      fuel-coloured pixel.
- [ ] Vent rotors turn cleanly inside the middle 60%.
- [ ] Run `python docs/derive_glow.py`, then check the glow lines up on the
      board (the earlier glow fix: masks too wide, or off the rods on dual and
      quad cells, is the thing to look for).
- [ ] `docs/derive_art.py` is retired once component vents, hull vents and
      condensators are drawn, not derived.
- [ ] The README's *Part artwork* section and the in-game credit name the new
      art's author; the Sensory Palette's part-art row is marked met.

---

## Pack 2: Interface icons (17)

**Brief.** These replace the pixel grids in `www/js/icons.js`, which today mix
Knockoff's colours with this game's. Draw them at **12x12**, in the palette,
with the same outline as the parts, and deliver each as a PNG plus the pixel
grid if you can. They appear at 10-18 px, on dark keys and on the cream panel,
so check both.

> [STYLE BLOCK] A 12x12 pixel-art interface icon of [SUBJECT], flat, centred,
> 1-pixel outline, no text, readable at 12 pixels on dark and cream grounds.

| Icon | Subject |
| --- | --- |
| `power` | a lightning bolt, power green `#58c470` |
| `heat` | a flame, heat orange `#d8703a` with a yellow core |
| `cash` | a stack of two coins, cash `#d8c15a` |
| `vent` | a small fan rotor, steel |
| `inlet` | an orange arrow pointing down into a bar |
| `outlet` | an orange arrow pointing up out of a bar |
| `held` | a closed canister with an orange level line |
| `play` / `pause` | a rocker switch up / down |
| `flux` | an hourglass with violet sand |
| `ticks` | a clock face with one hand |
| `plan` | a pencil over grid paper |
| `reactor` | a 2x2 grid of fuel rods (the Reactor page) |
| `upgrades` | a terminal screen with a caret (the plant computer) |
| `experiments` | a flask with a violet spark (research) |
| `modules` | a casing: a square of nine small cells |
| `options` | three vertical slide levers (the station office) |

---

## Pack 3: Sounds (8 cues)

**Brief.** Today every sound is one of six Kenney impacts, and the click is the
place impact played fast. The interview asks for "the click and clank of
shifting/moving/placing parts": the physical weight, the effort of your
actions, the heaviness of the situation (5.4); and buttons that are "tactile
mechanical double click industrial slow", heard as a two-stage click-clack,
slow in feel but not in speed (5.5).

**Spec.** Mono, 44.1 kHz, Ogg Vorbis about 64 kbps, peak -3 dBFS, no reverb
tail past the stated length. It must measure heavy and dull, the way the
current set was chosen: most energy under 220 Hz, few zero crossings (aim under
150 a second), no bells, chimes, beeps, UI blips or anything bright. Metal,
but damped.

| File | Cue | Length | Prompt |
| --- | --- | --- | --- |
| `click.ogg` | first stage of every key | 40-80 ms | "The first stage of pressing a heavy bakelite key on an old Soviet control desk: a short, dry, low mechanical click as the key's spring gives, no ring, no echo." |
| `place.ogg` | a part seated on the board | 150-300 ms | "A steel machine part dropped into a close-fitting steel socket and seating home: a dull, heavy metal clank, muffled by a rubber gasket, short decay, no ring." |
| `buy.ogg` | the key bottoming out | 120-250 ms | "A heavy mechanical key on an industrial control desk bottoming out: a solid low clack of bakelite on steel, muted, no ring, no echo." |
| `sell.ogg` | power sold, the power bar | 150-300 ms | "A large electrical relay closing in a power station switchroom: a deep, muffled thunk with a tiny contact buzz, no hum tail." |
| `coin.ogg` | the money drums turning | 150-300 ms | "The mechanical counter drums of an old cash register turning over one step: a low wooden-metal clunk, dull, no bell." |
| `vent.ogg` | heat vented by hand | 200-400 ms | "A short release of pressure from a valve on an old boiler: a low, breathy hiss that stops dead, no whistle, no metal ring." |
| `boom.ogg` | a meltdown | 1.2-2.0 s | "A heavy, muffled explosion heard through the thick concrete walls of a reactor building: a deep low thump and rumble, no debris, no ringing, no high frequencies." |
| `hum.webm` | the reactor running (loop) | 2-3 s, seamless | "A steady low electrical hum of a large transformer in an old power plant, about 50 Hz with soft harmonics, perfectly even, seamlessly loopable, no clicks or fades." |

**Acceptance.**

- [ ] The same eight file names, so `www/js/audio.js` needs no change beyond
      a `click` cue pointing at `click.ogg` instead of the place file at 1.9x.
- [ ] Each measures under 220 Hz for most of its energy, and the hum loops with
      no seam.
- [ ] The two stages played 70 ms apart (`click`, then `buy` or `place`) sound
      like one key pressed through, not two sounds.
- [ ] Licence recorded in the README's *Sound* section.

---

## Pack 4: Effect sprites (3)

**Brief.** Each is a white alpha mask that the game tints with CSS, so draw it
**white on transparent**, with the alpha doing the work. Same pixel scale as the
parts.

| File | Size | Prompt |
| --- | --- | --- |
| `spark.png` | 64x64 (16x16 master) | "A small burst of 4-6 straight electrical sparks from a centre point, pixel art, white on transparent, no glow blur." |
| `puff.png` | 48x48 (12x12 master) | "A small round puff of steam or smoke, three overlapping lobes, pixel art, white on transparent, dithered edge rather than blur." |
| `orb.png` | 48x48 (12x12 master) | "A small soft orb of light for a particle, a solid centre with a two-step dithered falloff, pixel art, white on transparent." |

---

## Pack 5: Night backdrops (optional)

**Brief.** The four seasonal paintings in `www/backdrops/` are the designer's own
work, and after seven in the evening the game darkens them in CSS. A painted
night set would let the room's own light be the only light (5.3). Paint each
night version **from the same composition** as its day painting, same size
(900 px wide WebP), so the swap at seven keeps the view and only the light
changes. These are the designer's to paint or commission. The prompt below
describes the look in plain terms rather than naming any living artist.

> The same view as [SEASON] day painting, at night: an old industrial plant
> standing in green English country under low fog, painterly and still, flat
> and muted. No moon, no stars through the overcast; the only light is a few
> small sodium-orange windows in the plant and a faint blue-grey sky glow at
> the horizon. Cold, quiet, dreary. No people, no vehicles moving, no text.

---

## When a pack comes back

1. Put the files in place under the names above, and keep the old ones in git
   history.
2. **Parts:** run `python docs/derive_glow.py` and `python docs/optimize_art.py
   www/parts/revival`, then look at every family on the board in the browser,
   with glow, rotor and heat.
3. **Store graphics:** run `python docs/play/make_graphics.py` and
   `docs/play/capture_shots.py`. The store graphics are made from the art, so
   they follow it.
4. Run `npm test`, then build a debug release (Actions → Android debug APK →
   Run workflow, with a release tag) and check it on a phone.
5. Update the credits (README and the in-game line under Options) and the
   Sensory Palette row in `docs/soul-interview.md`.
