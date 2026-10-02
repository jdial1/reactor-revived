# Reference: modular industrial dashboards

A study of 24 photographs from Marcin Wichary's *Before pixels: modular
industrial dashboards* (Unsung, https://unsung.aresluna.org/before-pixels-modular-industrial-dashboards/),
sent by the designer as "the very soul we are trying to instill in the UI".

**Reference only.** As with the Soul Interview's photographs (5.6), none of
these images is stored in this repository, traced, or shipped. What is kept here
is what they teach, in words, so it can be built from.

## What is in them

- **Mosaic signal-box desks** (railway and airfield): a surface of identical
  square tiles. Each tile carries one thing: a length of track, a button, a lamp,
  a counter, a label. The track plan is drawn across the tiles in black bars,
  with the routes lighting up in warm white and orange as they are set.
  - A German desk is grey-green with blue, red, yellow and green tiles for its
    groups, and mechanical counters in a row.
  - An airfield desk is pale with runway headings in inverse header plates
    ("14L–32R").
- **A Polish relay panel** in pale blue enamel tiles: brass track bars riveted
  onto the tiles, green and black pull-knobs, small coloured jewel lamps, and
  mechanical counters in brass frames.
  - An ammeter and a rotary switch between *Dzień* and *Noc* (day and night).
  - Rust spots and chipped enamel.
- **Two power-station control rooms**: a long cream desk in a shallow curve, a
  wall of instruments above it, and two chairs. The desk itself is hundreds of
  identical small tiles.
  - A wall section is a busbar diagram with breakers sitting on the lines, and
    square needle meters each with its three buttons.
  - An "emergency stop" (*Not-Aus*) mushroom in red.
- **A process panel** (a flue gas fan, *Saugzug 2*): square edgewise meters with
  4–20 mA scales and the maker's mark.
  - Rows of amber, white and green lamps.
  - Inserted label strips naming each part twice, in words and in plant code
    (*KLAPPE HQA30 AA001*).
  - A numbered list of measuring points.
  - An *acknowledge / lamp test* pair of blue buttons (*Quittieren /
    Lampenprüfung*).
  - Aluminium tape over a split.
- **Details**:
  - **Covers and tags:** a missing tile showing the bulbs behind it, and an
    enamel tag hung over a button (*Rotte*, a work gang on the track: do not
    route here).
  - **Annotations:** a printed track plan taped above the desk, and handwritten
    pencil on the label strips.
  - **Controls and readouts:** a grey rotary handle on a cream wall, and a
    six-digit counter in a blue zone.

## The ethos

1. **The panel is the plant.** The process is drawn on the surface: track,
   busbar, pipe. Every control sits on the line it acts on, and every lamp sits
   where the thing it reports is. Nothing is a menu. You read the desk as you
   read a map.
2. **One module, repeated.** Everything lives in a square tile of one size, with
   its seams and the clips at its corners showing.
   - **Blanks:** a blank tile is an honest placeholder for what is not there yet.
   - **Change:** the desk grows or changes by swapping tiles, and when one is
     missing you see the bulbs behind it.
3. **A quiet field, colour for meaning.** One neutral ground: grey-green,
   cream, pale blue enamel.
   - **Colour is a zone or a state, never decoration:** a block of blue tiles is
     one group, a lit route is a set path.
   - **Red is stop and fault**, and the mushroom.
4. **Light is information.** A lamp is lit only when it says something, and it
   is warm: a filament behind coloured glass. Lamps come in small rows and
   triads (on, off, fault).
   - **Lamp test (*Lampenprüfung*):** a key that lights every lamp at once, so a
     dead bulb can never pass for a dark one.
   - **Acknowledge (*Quittieren*):** an alarm is not over until someone has
     acknowledged it.
5. **Everything is named, twice.**
   - **Name and code:** a plain name and a plant code, on a white strip slid into
     the tile, in condensed DIN lettering.
   - **Zone plates:** zones have an inverse header plate, white on black.
   - **Instruments:** carry their scale, their unit and their maker's mark.
6. **Everything is counted.** Mechanical counters sit beside the switches they
   count, the number of operations rolling on drums. Nothing resets.
7. **Analog first.** Needles on square meters and digits on drums, never a
   number that jumps. A needle at rest is information too.
8. **Worn, not broken.** The surfaces carry their history but still work:
   - dust in the seams;
   - chipped enamel and rust around the rivets;
   - aluminium tape over a crack;
   - pencil on a label;
   - a printed plan taped up.
9. **One operator, a long desk, a dim room.** The panel is the brightest thing
   in the room: warm overheads, blue dusk at the windows. Two chairs, both
   empty.

## Against Reactor Revived today

**Already true**
- Lit keys: incandescent, smoked glass, dark when not available, a bulb that
  catches (4).
- Lamps: lamps for waiting and automation (4).
- Money: the money on drums that only turn forward (6, 7).
- Plates: cream nameplates with an orange rule.
- Paper: printouts on tractor feed (9).
- The pale desk: the gauge panel is pale with a painted process line (1, 3).
- Signing off: an order must be signed off, the way *Quittieren* closes an
  alarm (4).
- The board: a square grid of identical tiles is the mosaic desk itself (2).

**Not yet true** (before the nine proposals below were built)
- **Mosaic surfaces (2):** the desk, the tray and the strips are smooth plating.
  They have no tile module, no seams, no clips and no blank tiles.
- **Mimic lines (1):** nothing is drawn between parts. The Flow overlay shows
  numbers, not a lit route.
- **Names and codes (5):** keys carry a name only. There are no inserted strips,
  no plant codes and no inverse zone plates.
- **Lamp test and lamp triads (4):** there is no lamp test, and a part has no
  on/off/fault triad.
- **Counters (6):** only the money is counted on drums. The switches and the sell
  bar count nothing.
- **Needles (7):** power and heat are bars, not needles.
- **Wear (8):** every surface is clean.
- **Tags (2, 8):** a key that cannot be used is dark, but nothing says why. The
  hanging tag is the desk's own way of saying "not this one, because...".
- **Day and night (9):** the backdrop follows the clock, but the desk does not.
  There is no *Dzień / Noc* panel brightness.

## Proposals, smallest first

The designer said yes to all nine ("build all nine"); all nine are built. What
was built is in the last column, and the README's *Gauges* and *The control
desk* say how each looks in play.

| # | Proposal | From | Size | Built as |
| --- | --- | --- | --- | --- |
| 1 | **Lamp test** key in Options: every lamp and lit key burns for two seconds | 4 | Small | *Lamp test* key on the Control room plate (`lampTest()` in `desk-ui.js`) |
| 2 | **Hanging tags** on keys that cannot be used: an enamel tag hung over the glass saying why (*Planner*, *Direct run*, *Not yet issued*) | 2, 8 | Small | `.key.lit[data-tag]`: *Unissued*, *Direct run*, *Planner* |
| 3 | **Counters** beside the automation switches and under the sell bar: six-digit drums of operations, never reset | 6 | Small | Counters for Sold, Vented, Auto-sell, Rebuy, Operator (`s.counts`, kept through reboots), on their own plate in Options: a row of them under the gauges cost the board too much height |
| 4 | **Panel brightness** (*Day / Night*): a rotary switch on the desk; at night the lamps and lit keys run lower, matching the night backdrop | 9 | Small | A key with a rotary dial on the Control room plate, Auto / Day / Night (`s.panelLight`, `deskNight()`) |
| 5 | **Mosaic surfaces**: the desk, tray and strips laid out in a square tile module, with seams, corner clips and blank tiles, and a key or bin is a tile in it | 2 | Medium | Seams and clips on the desk, tray and page bank (`--mosaic-pale`, `--mosaic-dark`, `--mod`). No blank tiles yet: the keys and bins do not snap to the module |
| 6 | **Inserted label strips** with a plant code beside each name (*COOLING · HV-1*), and inverse zone plates over the tray and the page bank | 5 | Medium | Strips on the gauges, meter and counters; codes on every part's sheet (`codes.js`); *Parts issue Z2* and *Station Z3* plates |
| 7 | **Needle meter** for heat: a square moving-coil meter (0 to 200% of rated) beside the heat bar, the needle easing, red past 100 | 7 | Medium | A small meter inside the heat gauge, beside its reading and bar, so the desk stays one row. Its scale and the heat bar's run to meltdown: rated heat is upright and half the bar. Power got its own instrument, a lamp bargraph, since a store is a level, not a swing |
| 8 | **Wear**: dust in the seams, chipped edges and a strip of tape, faint and fixed, never on the board | 8 | Small, risky to taste | Three chips in the desk's enamel and a strip of tape in its corner |
| 9 | **Mimic Flow**: the Flow overlay as lit track segments between parts, warm where heat moves and brighter as it moves more | 1 | Large | An SVG over the board: dark track along every join, lit where `s.edges` says heat moved this tick. Replaces Flow's numbers |
