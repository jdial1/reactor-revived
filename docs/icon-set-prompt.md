# Prompt: draw the Reactor Revived sprite sheet

Paste everything below the rule into an image-capable model. It asks for **one PNG sprite
sheet** containing all 75 part icons, laid out on a fixed grid so `docs/split_sheet.py` can cut
it back into named files once it looks right.

The geometry is rigid on purpose. A sheet is only reviewable if you can see the whole set at
once, and only usable if a script can find every icon without guessing — so the cell size, the
row order and the background colour are all fixed, and the splitter verifies them before
writing anything.

---

You are drawing the complete icon set for **Reactor Revived**, a top-down nuclear reactor
puzzle game for phones. The player fills a 12×8 grid with components: fuel cells make power and
heat, vents shed it, exchangers move it between tiles, plating and capacitors raise the
ceilings, and the reactor melts down if heat wins. It descends from IndustrialCraft 2's reactor
via *Reactor Incremental* and *Reactor Knockoff*, and should look like it belongs to that
family: dark industrial steel, hard black outlines, one light source from the top left, no
gloss, no cartoon rounding, no perspective — everything seen from directly above.

## Deliver one PNG

**384 × 1024 pixels. A 6 × 16 grid of 64 × 64 cells.** No labels, no grid lines, no gutters —
the cells are flush.

**Background: pure magenta `#FF00FF`**, everywhere no icon is drawn, including the unused
cells. It is keyed out on import, so it must appear nowhere inside an icon.

**Every logical pixel must be a solid 4 × 4 block of one colour.** You are drawing 16 × 16
pixel art at 4× so it is legible on screen; the importer reduces each cell back to 16 × 16 and
**rejects the sheet if any 4 × 4 block is not uniform.** No anti-aliasing, no gradients, no soft
edges, no drop shadows.

### Row order — rows 1 to 9 are components, one per row, tiers 1 to 6 across the columns

| row | part | must read as |
|---|---|---|
| 1 | Vent | a bladed fan in a housing |
| 2 | Heat exchanger | a cross of pipes with a hub — a junction, not a container |
| 3 | Heat inlet | a funnel, mouth wide at the top, drawing heat up |
| 4 | Heat outlet | the same funnel inverted — an exact vertical mirror of row 3 |
| 5 | Coolant cell | a sealed tank of fluid behind a window |
| 6 | Reflector | a polished mirrored face, the brightest thing in the set |
| 7 | Capacitor | terminals on top and a charged window — the most electrical part |
| 8 | Reactor plating | a bolted armour plate, bevelled, almost all steel. Plain on purpose |
| 9 | Particle accelerator | a ring of magnet poles around a glowing core |

### Rows 10 to 16 are fuel cells — columns 1, 2, 3 only; leave columns 4 to 6 magenta

Row order: uranium, plutonium, thorium, seaborgium, dolorium, nefastium, protium.
Column 1 is a single rod, column 2 a pack of two, column 3 a pack of four.

## The tier progression, across columns 1 to 6

A tier must be recognisable **with the colour stripped out**, so each tier adds hardware as well
as a hue. Tier 1 is plain; tier 6 is the experimental tier, bought with exotic particles, and
should look like the end of the line. Escalate the hardware — bands, brackets, a containment
ring, a cage — and let higher tiers carry more surface detail: rivets, hatching, panel lines.
The part underneath stays the same machine; it is the same vent at tier 1 and tier 6.

**Every piece of tier hardware must be inset at least 4px (one logical pixel) from the cell
edge.** The game derives each icon's black outline from its transparent margin, so hardware
touching the edge has nothing to outline against and visually merges with the part on the
neighbouring tile — a full board of one tier grew continuous rails across it, and another turned
into horizontal stripes over the whole reactor. This has already happened twice. Leave the
margin.

## Fuel cells

The pack size is carried by the **layout**, the element by the **colour**. All three columns use
the same rod at the same size — the rod never shrinks.

- **×1** — one rod, centred.
- **×2** — two rods side by side.
- **×4** — four rods with depth: back pair up and left, front pair down and right, in front.
  Separate the overlapping rods by **darkening** the one behind, not by cutting a gap between
  them. At four rods across sixteen logical pixels there is no column to spare, and a gap eats
  most of the rod behind it.

Seven fuel hues, distinguishable from each other at a glance when the icons are only 31px on
screen: uranium green, plutonium amber, thorium teal, seaborgium blue, dolorium violet,
nefastium magenta, protium cyan.

## Palette

Steel is fixed. Everything else is yours, but keep it tight — this is a limited palette.

```
outline        #07090c      the hard black edge around every part
steel          #5c656f  dark      #939da8  lit
dark steel     #333a42      recesses, panel gaps, shadowed faces
highlight      #c8d0d8  dark      #eef3f7  lit
```

Function colours override the tier colour in a part's core: one for heat (vents, exchangers,
inlets, outlets), one for coolant, one for the accelerator core.

## The one constraint everything else serves

**Every icon must read at 17 × 17 pixels.** The game draws parts at 17px as a locked-tier
silhouette, 31px in the part dock, and up to 72px on the board. Four off-the-shelf asset packs
were rejected for this project because they turned to mush at 17 and 31px. That is why the art
is 16 × 16 logical pixels: art designed at 16 reads at 17. Do not draw detail that only survives
at 72px, and do not let the tier hardware bury the machine underneath it.

## Two things that have broken before

- **The vent's outline must be centred in its cell and unchanged by a 90° rotation** - a
  circular housing does this. The blades inside may shade however the light dictates; it is the
  silhouette that must not move. The game
  animates a working vent by zooming that exact sprite to 166% about its centre and spinning it,
  so an off-centre or asymmetric hub visibly wobbles. Every one of the six vents needs this.
- **Row 4 must be row 3 flipped vertically**, not redrawn. The inlet and outlet are opposites and
  drift apart the moment they are drawn separately.

## Check the sheet before you send it

- [ ] Exactly 384 × 1024, cells flush on a 64px grid, background `#FF00FF`
- [ ] Every 4 × 4 block one flat colour — no anti-aliasing anywhere
- [ ] Rows 10–16 have columns 4–6 left as background
- [ ] Squint the whole sheet down: is every row still distinguishable from every other row?
- [ ] Greyscale it: is every column still distinguishable from every other column?
- [ ] Is all tier hardware inset from the cell edge?
- [ ] Row 1: is each vent centred and 90°-symmetric?
- [ ] Row 4: an exact vertical mirror of row 3?
- [ ] Rows 10–16 column 1: is it the same rod in all seven, differing only in hue?

If something genuinely cannot be made legible at 16 × 16, say so and propose the smallest change
to the brief rather than sending a sheet that fails the squint test.
