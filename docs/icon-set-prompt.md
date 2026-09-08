# Prompt: design the Reactor Revived icon system

Paste everything below the rule into a capable LLM.

This supersedes `asset-pack-prompt.md`. That one asked for ten shapes and kept the tier ramp,
palette and greebling as they already were. This one hands over the whole visual system —
shapes, tiers, colours, surface detail — and asks for it as data a build script can consume.

The output is fed to `docs/build_revived_pack.py`, which expands it into 75 sprites and
verifies it. Everything the brief asks for is machine-checkable, and the failures listed under
"learned the hard way" are all things that actually went wrong here, not hypotheticals.

---

You are designing the complete icon system for **Reactor Revived**, a top-down nuclear reactor
puzzle game for phones. The player fills a 12×8 grid with components: fuel cells make power and
heat, vents shed it, exchangers move it, plating and capacitors raise the ceilings, and the
whole thing melts down if heat wins. It descends from IndustrialCraft 2's reactor via *Reactor
Incremental* and *Reactor Knockoff*, and should look like it belongs to that family: dark
industrial steel, hard black outlines, one light source, no gloss and no cartoon rounding.

There are **75 sprites**: 9 component types × 6 tiers, plus 7 fuels × 3 pack sizes. You are not
drawing 75 things. You are designing a *system* that produces 75 things from about a dozen
decisions, because coherence is the whole point — four off-the-shelf packs were rejected for
this project and every one failed because separately-drawn art never agrees with itself about
light, weight or palette.

## Deliver five things

### 1. Ten shapes, as 16×16 character grids

`vent`, `heat_exchanger`, `heat_inlet`, `heat_outlet`, `coolant_cell`, `reflector`,
`capacitor`, `reactor_plating`, `particle_accelerator`, `fuel_rod`.

| char | meaning |
|---|---|
| `.` | transparent |
| `S` | steel — the body |
| `D` | dark steel — recesses and shadowed faces |
| `H` | highlight — the lit edge, used sparingly |
| `T` | tier band — the region recoloured per tier |
| `C` | core — the functional colour (heat, coolant, fuel) |
| `L` | core highlight |

**Never draw the outline.** Any transparent cell orthogonally touching a painted one becomes
`#07090c` automatically. Draw only the object. Light is a single source at the top left.

Each must read as what it is: the vent as a fan, the exchanger as a pipe junction, the inlet as
a funnel drawing heat up, the coolant cell as a sealed tank, the reflector as a polished face,
the capacitor as terminals and a charged window, the plating as a bolted armour plate, the
accelerator as a ring around a glowing core, the rod as a cased fuel column.

### 2. The tier ramp — six tiers, colour *and* shape

A tier must be recognisable with the colour stripped out, so each tier gets hardware as well as
a hue. Give me, for each of tiers 1–6:

- a hue and saturation, as `[hue, saturation]`, rendered as `hsl(h s% 42%)` and `hsl(h s% 62%)`
  for the dark and lit shades
- a **16×16 hardware mask**, `#` where the tier's hardware sits and `.` elsewhere, drawn
  *under* the body

Tier 1 is the plain one and normally has no hardware. Tiers should escalate: the sixth is the
experimental tier, bought with exotic particles, and should look it.

### 3. Greebling — surface detail that arrives with rank

A rule per tier, applied to `S` cells only, so higher tiers read as busier machinery without
new shapes. Express each as a predicate over `(x, y)` — for example `x % 5 == 2 and y % 5 == 2`
for scattered rivets, or `(x + 2*y) % 4 == 0` for a hatched face — and say which material it
paints (`D` or `H`). State the tier each rule starts at.

### 4. Colours

- the six tier `[hue, saturation]` pairs
- **function colours** that override the tier colour in a part's `C` region: one for heat
  (vents, exchangers, inlets, outlets), one for coolant, one for the accelerator's core
- **seven fuel hues**, one per element: uranium, plutonium, thorium, seaborgium, dolorium,
  nefastium, protium. They must be distinguishable from each other at 31px, side by side.

Steel is fixed and not yours to change: `#5c656f` / `#939da8`, dark steel `#333a42`, highlight
`#c8d0d8` / `#eef3f7`, outline `#07090c`.

### 5. Cell layouts

Fuel comes in packs of 1, 2 and 4, and the pack size is carried by *layout*, not by colour —
colour is the element. All three use the same rod at the same size; the rod never shrinks. Say
where the rod goes for each pack size, as offsets into the 16×16 box, and which rods are drawn
last so they occlude the ones behind.

## Learned the hard way — these are not hypothetical

Every one of these broke a previous attempt at this set.

1. **Everything must read at 17×17.** The game draws parts at 17px (a locked-tier silhouette),
   31px (the dock) and up to 72px (the board). Four packs were rejected for turning to mush at
   17 and 31. This is why the grid is 16×16: art designed at 16 reads at 17. No lettering, no
   fine gradients, no dithering finer than 2×2.
2. **Inset every piece of tier hardware at least one cell from the edge.** The outline is
   derived from transparent cells, so hardware at x=0 has nothing to outline against and merges
   with the part on the neighbouring tile. A full board of one tier grew continuous rails across
   it; another turned into horizontal stripes over the entire reactor. A ring was the only
   hardware that survived, because a ring never touches the edge.
3. **The vent's rotor must be centred and identical under a 90° rotation.** The tile animates a
   working vent by zooming that same sprite to 166% about its centre and spinning it, so an
   off-centre or asymmetric hub visibly wobbles. If you cannot guarantee it by construction,
   say so and leave the vent's interior to be generated in polar coordinates.
4. **`heat_outlet` must be the exact vertical mirror of `heat_inlet`.** Drawing them separately
   only lets them drift.
5. **A pack of four is four rods with depth, not a 2×2 grid of windows.** Back pair up and left,
   front pair down and right, drawn last. Separate them by *darkening* the cell behind, not by
   cutting a transparent gap: at four rods across sixteen cells there is no column to spare, and
   clearing one erases most of the rod behind it.
6. **Leave the outer ring of every shape clear** or the tier hardware collides with the body.
7. **Every shape needs a `T` region** big enough to see at 31px, or all six tiers look identical.

## What the current system does, and where it falls down

You are replacing this, so improve on it rather than reproducing it:

- Tiers run plain grey → gold → green → blue → red → violet, with hardware: none, side rails,
  corner brackets, a containment ring, louvres, a full cage.
- **Tier 5's louvres are too heavy** — three full-width bands nearly bury the part underneath.
- **The tier band is too timid on most shapes.** Parts read as grey machines with a coloured
  trim, where the reference art reads as coloured machines. Consider marking more of each body
  `T`, especially on flatter parts like plating and capacitor.
- Greebling exists but is barely visible; tiers 4–6 do not look meaningfully busier than 1–3.

## Output format

````
### shapes
#### vent
```
................
        (16 lines of 16 chars, from . S D H T C L)
```
one line: what reads at 17px

... the other nine ...

### tiers
```json
[
  {"tier": 1, "hue": null, "sat": 0, "note": "plain"},
  {"tier": 2, "hue": 45, "sat": 78, "note": "..."}
]
```
#### tier 2 hardware
```
................
        (16 lines, # where hardware sits)
```
... tiers 3-6 ...

### greebling
```json
[{"from_tier": 4, "rule": "x % 5 == 2 and y % 5 == 2", "paints": "D"}]
```

### colours
```json
{"function": {"heat": [25, 88], "coolant": [196, 85], "accelerator": [275, 68]},
 "fuels": {"uranium": 96, "plutonium": 40, ...}}
```

### cells
```json
{"1": [[6, 2]], "2": [[3, 2], [9, 2]], "4": [[1, 0], [7, 0], [4, 4], [10, 4]]}
```
one line on the draw order and which rods occlude
````

## Check your own work before answering

- [ ] Squint each shape to 17px: is its silhouette distinct from the other nine?
- [ ] Strip the colour: can you still tell them apart?
- [ ] Is every tier distinguishable from every other **by hardware alone**, greyscale?
- [ ] Is every piece of hardware inset from the edge?
- [ ] Vent: centred, and the same rotated 90°?
- [ ] Outlet: an exact mirror of inlet?
- [ ] Are the seven fuel hues distinguishable side by side at small size?
- [ ] Does anything have a `T` region too small to notice at 31px?

If a part genuinely cannot be made legible at 16×16, say so and propose the smallest change to
the brief rather than delivering something that fails the squint test.
