# Prompt: draw the Reactor Revived part set

Paste everything below the line into a capable LLM. It asks for **ten 16×16 pixel
grids**, not images — the other 65 sprites are derived from them by script, which is what
keeps the set coherent.

Why grids and not "generate 75 pixel-art icons": we tried four off-the-shelf packs and every
one failed on coherence — different hands, different light, different line weight — or on
legibility at 17px. A character grid is exact, reviewable, diffable, and costs nothing to
iterate on. It is also how this project already encodes its traced icons (`www/js/icons.js`).

---

You are drawing a set of pixel-art machine icons for **Reactor Revived**, a top-down nuclear
reactor puzzle game for phones. The player fills a 12×8 grid with components: fuel cells make
power and heat, vents shed heat, exchangers move it around, and everything melts if the heat
wins. It is a clean-room descendant of IndustrialCraft 2's reactor → *Reactor Incremental* →
*Reactor Knockoff*, and it should look like it belongs to that family: dark industrial steel,
hard black outlines, no gloss, no cartoon rounding.

## What I need from you

**Ten 16×16 base sprites, as character grids.** Not images, not SVG, not base64 — literal
text grids I can paste into a build script. I derive the full set of 75 sprites from these ten
by recolouring and compositing, so you draw each machine *once*.

## The single hardest constraint

**Every sprite must still be readable at 17×17 pixels.** The game draws parts at three sizes:
17px (a locked-tier silhouette), 31px (the part dock) and up to 72px (the board tile). Four
asset packs have already been rejected because they turned to mush at 17 and 31px. This is why
you are drawing at 16×16 — a sprite designed at 16 reads at 17. Do not draw detail that only
survives at 72px.

Practical consequences:
- One clear silhouette per part. A player must tell a vent from a capacitor by **shape alone**,
  with the colour stripped out.
- No lettering, no numerals, no fine gradients, no anti-aliasing, no dithering finer than 2×2.
- Leave a margin. Fill roughly 75–90% of the 16×16 box; do not run to the edges. Parts sit on
  a dark tile with a 1px border and need to breathe.

## Grid format

Sixteen lines of sixteen characters, one part per block, using exactly this legend:

| char | meaning |
|---|---|
| `.` | transparent |
| `S` | steel — the main body |
| `D` | dark steel — recesses, shadowed faces, panel gaps |
| `H` | highlight — the lit edge, used sparingly |
| `T` | tier band — the region that gets recoloured per tier (see below) |
| `C` | core — the functional colour: heat, coolant or fuel |
| `L` | core highlight — a brighter pixel or two inside `C` |

**Do not draw the outline.** It is derived: any transparent pixel orthogonally touching a
painted one becomes `#07090c`. Draw only the object.

Light comes from the **top left**, one source, no cast shadows and no ground plane. These are
components seen from directly above, not objects standing on a floor.

Every part needs some `T` — that region is what carries the tier, and a part with no `T` will
look identical at all six tiers. Cells are the exception; they use `C` for fuel colour instead.

## The ten base sprites

Each must read, at a glance and at 17px, as the thing it is:

1. **`vent`** — a fan. **Special requirement: the rotor must be centred and 4-fold rotationally
   symmetric.** The game animates a working vent by taking this very sprite, zooming to 166%
   about its centre, and spinning it. An off-centre or asymmetric hub visibly wobbles. Put the
   blades in a centred circle roughly 10px across, and the housing outside it.
2. **`heat_exchanger`** — a cross of pipes with a hub where they meet. It moves heat sideways
   between neighbours, so it should read as a junction, not a container.
3. **`heat_inlet`** — a funnel or hopper drawing heat *up* out of the parts around it. Mouth
   wide at the top, narrow at the bottom.
4. **`heat_outlet`** — the same funnel inverted. Draw it as a genuine vertical mirror of the
   inlet so the pair reads as opposites.
5. **`coolant_cell`** — a sealed tank of fluid. Mostly `C`, behind a window, with a steel shell.
   It holds heat rather than moving or shedding it, so it should look like storage.
6. **`reflector`** — a mirrored panel that bounces neutrons back into adjacent cells. A polished
   face, brighter than everything else in the set — the only part where `H` should dominate.
7. **`capacitor`** — raises maximum power. A block with two terminals on top and a charged
   window; the most electrical-looking part in the set.
8. **`reactor_plating`** — raises maximum heat. A bolted armour plate: bevelled edge, corner
   bolts, almost entirely `S` and `D`. The plainest part, and deliberately so.
9. **`particle_accelerator`** — the endgame part; converts heat into exotic particles. A ring
   with magnet poles around a glowing core. The most complex silhouette, but still legible at 17px.
10. **`fuel_rod`** — a single vertical fuel rod: a steel casing with a `C` core down the middle
    and a cap at each end. Draw it to sit in the *centre* of the 16×16 box occupying roughly
    the middle third horizontally — I tile this one image to make the 2- and 4-packs.

## How the 75 sprites are derived (do not draw these — just make them possible)

**Tiers 1–6 (9 categories × 6 = 54 sprites).** Your `T` pixels are recoloured per tier, and
tier hardware is composited *under* the body:

| tier | colour | hardware added |
|---|---|---|
| 1 | dark steel (nearly colourless) | none |
| 2 | gold | rails down both sides |
| 3 | green | corner brackets |
| 4 | blue | a containment ring |
| 5 | red | louvres across the face |
| 6 | violet (experimental) | a full cage |

So leave the outer 1–2 pixel border of the box mostly clear, or the tier hardware collides with
your body. Tier 6 parts are named "Extreme Vent", "Black Hole Particle Accelerator" and so on —
the violet and the cage carry that, you do not need to draw anything special.

**Cells (21 sprites).** From `fuel_rod` alone: one rod centred, two side by side, four in a 2×2
block; then the `C` pixels hue-shifted per fuel — uranium green, plutonium amber, thorium teal,
seaborgium blue, dolorium violet, nefastium magenta, protium cyan. Keep the rod narrow enough
that two fit side by side inside 16px with a gap.

## Palette

Use these exactly. `T` and `C` are placeholders that get replaced, so pick any readable stand-in
when you preview them; what matters is which pixels are marked `T` and `C`.

```
outline (derived, do not draw)  #07090c
S  steel            #5c656f  (dark)   #939da8  (lit)
D  dark steel       #333a42
H  highlight        #c8d0d8  (dark)   #eef3f7  (lit)
T  tier band        recoloured per tier; tier 1 is #3a424b / #49525c
C  core             heat hsl(25 88%), coolant hsl(196 85%), fuel hue per element
L  core highlight   the same hue at 62% lightness
```

Two shades exist for `S`, `H`, `T` and `C`; the script picks the lit one for pixels in the
upper-left half and the dark one for the lower-right. You do not need to encode that — just mark
the material and let the light source resolve it.

## Before you answer, check your own work

For each of the ten grids:

- [ ] Squint test: mentally scale to 17px. Is the silhouette still distinct from the other nine?
- [ ] Strip the colour. Can you still tell which part it is?
- [ ] Is there a `T` region big enough to notice at 31px?
- [ ] Is the outermost ring of the box clear enough for tier hardware?
- [ ] `vent` only: is the rotor centred, and does the grid look the same rotated 90°?
- [ ] `heat_outlet` only: is it an exact vertical mirror of `heat_inlet`?
- [ ] `fuel_rod` only: is it narrow enough that two fit side by side with a gap?
- [ ] No stray single pixels floating off the body — they become outline noise.

## Output format

For each of the ten, in this order — `vent`, `heat_exchanger`, `heat_inlet`, `heat_outlet`,
`coolant_cell`, `reflector`, `capacitor`, `reactor_plating`, `particle_accelerator`, `fuel_rod`:

````
### vent
```
................
................
....DDDDDDDD....
...D SSSSSSS D..
        (16 lines of 16 chars, using only . S D H T C L)
```
one sentence on what reads at 17px, and what the T region is
````

Then a short closing note on anything you had to compromise. If a part genuinely cannot be made
legible at 16×16, say so and propose the smallest change to the brief rather than delivering
something that will fail the squint test.

---

## Appendix: the 75 filenames (for whoever wires the pack up)

Derived, not drawn. Filenames follow the existing pack convention in `www/js/art.js`:

```
cells (21):   cell_<fuel>_<count>.png   fuel 1-6 = uranium, plutonium, thorium,
                                        seaborgium, dolorium, nefastium
                                        count = 1, 2, 4
              xcell_1_<count>.png       protium (the experimental fuel)

components (54): <name>_<tier>.png for tier 1-6, name one of:
              vent  exchanger  inlet  outlet  coolant_cell
              reflector  capacitor  plating  accelerator
```

Deliver as 32×32 PNGs (the 16×16 art at 2× nearest-neighbour, matching `www/js/sprites.js`),
transparent background, palette-indexed, and register the pack per the "Part artwork" section
of `README.md`.

## If you would rather try an image model

It will not hold the palette, the tier system or 16×16 legibility across 75 sprites — that is
what coherence means and it is exactly where the off-the-shelf packs failed. If you try anyway,
generate **one** part at a time at 512×512, then downsample to 16×16 with nearest-neighbour and
snap to the palette above; judge every result at 17px before accepting it. Expect to redraw the
vent by hand regardless, because of the rotational-symmetry requirement.
