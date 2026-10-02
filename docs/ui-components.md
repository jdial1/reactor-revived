# UI components and templates

The interface is built from nineteen components and seven templates. A component's
look (colour, edge, shadow, how it moves when pressed) is set **once**, in the
*Components* section at the end of `www/css/app.css`, from tokens in `:root`. A
screen's own rules above that section only say where a component sits and how
big it is. `test/components.test.js` holds the line: component colours appear
only as tokens, no rule outside *Components* styles a component, and every
button a screen builds is a key or a bin.

The look comes from the Soul Interview's Sensory Palette (5.2, 5.5, 5.6): teal
plating, cream plates with an orange rule, black keys that sink, lamps,
recessed bins, paper, and a phosphor screen. Red only for danger.

## Components

| Component | Class | What it is | States |
|---|---|---|---|
| **key** | `.key`, or any `button` in `.row`, `.sheet-actions`, `.tut-row`, `.keys` | A black key. Sinks by `--travel` when pressed. | `.on`, `aria-pressed="true"` or `aria-current="page"`: latched down, lit ink. `:disabled`: faded. `.danger`: red ink. |
| key sizes | `.key` / `.key.wide` / `.key.small` | A selector (page and family keys) / an action (full ink, full width) / a key on a strip (the verdict's tools, the switches). | |
| **lit key** | `.key.lit`, holding a `.lens` with an icon (or `.art`) and a `.legend` | An 80s illuminated pushbutton: a square bezel (`--size`) round a lens of smoked glass, the icon behind the glass and the name printed on it. The bulb is the state. | Enabled: backlit (`--bulb`). `:disabled`: dark glass, the icon a ghost. `.on` / `aria-current`: latched in, burning full; others a little lower. `.warming`: just unlocked, the bulb catching - a few uneven flickers over a second, then it holds (not on load, not with reduced motion). |
| **switch** | `.key.switch` | A key with a lamp. It never latches; the lamp says its state. | `.on`: lamp lit. |
| **lamp** | `.lamp` (or a switch's `::before`) | A round lamp. `--lamp` sets its colour (power green by default), `--lamp-size` its size (7px). | `.on`: lit, with a glow. |
| **nameplate** | `.nameplate`, and every `dialog h2` / `.tut-card h2` | A cream plate with an orange rule under it. A `span` in it is the dim second word. | |
| **panel** | `.panel` | Teal plating with a highlight along its top edge. | |
| **card** | `.card` | Paper: cream, with a tan rule down its left edge. | |
| card kinds | `.card.docket` / `.card.letter` | An order in the station file: a header (what it is, where it came from), the order, its payment. Its paper is its kind: `.manual` (a printed page), `.order` (manila), `.demand` (a bare slip), `.notice`, `.standing`. / A letter: an envelope with a flap, a postmark and a seal until opened, then a typed sheet. | Docket: `.current` ringed in the price's colour, `.done` dimmed. Letter: `.unread` sealed; `[open]` the sheet. |
| **stamp** | `.stamp` | A rubber stamp on paper, inked a little crooked: *Confirmed*, *Supplied*, *Revised*. | |
| **bin** | `.bin` | A recessed well in the tray, for a part or a saved module. | `.on` (on `.part`): lit from inside. |
| **frame** | `dialog`, `.tut-card` | A sheet's housing: dark face, plating border. | |
| **label strip** | `.strip`, from `strip(name, code)` | A white strip slid into the panel: a plain name and its plant code (`.code`, dim). On the gauges the code stacks under the name. | |
| **tag** | `.key.lit[data-tag]`, set by `tag(key, reason)` | An enamel tag on a hook, hung over a dark key, saying why it cannot be pressed. | |
| **zone plate** | `.zone-plate` | An inverse header plate over a zone: its name in white on black, its zone code at the right. | |
| **counter** | `.counter` | Six drums in a black window over a label strip. | A drum that turned `.roll-in`. |
| **odometer** | `.roll.cash` (from `roller()`) | The money: ten drums in the counters' frame and colours, the figure turning on the right, blank drums to its left. | |
| **meter** | `.meter.instrument` | A small square moving-coil meter on the heat bar's scale: cold at the left stop, rated upright, meltdown at the right stop, red from upright on, its needle eased. Sits at a gauge's side (`gauge(..., instrument)`). | `.over`: past rated. |
| **bargraph** | `.bargraph.instrument` | Ten lamps rising behind dark glass, a tenth each, the top two amber: the power store's level. Sits at a gauge's side. | `i.on`: lit. `.full`: the top lamp blinks. |
| **rotary** | `.rotary` | A rotary switch: a yellow dial with a black knob, set into a key (`.light-key`) beside its setting. | `data-mode` auto / day / night turns the knob. |
| **mimic** | `.mimic` (an SVG in `#grid`) | Track drawn between parts (`.track`), lit where heat moves (`.lit`), its lamps running. | Hidden unless Flow is on. |

Two states run across every component: `body.lamp-test` (every lamp and lens
burning, two seconds) and `body.desk-night` (lit lenses, lamps and the desk
lower).

Every colour a component uses is a token: `--key-face`, `--key-face-in`,
`--key-edge`, `--key-ink`, `--key-ink-off`, `--key-ink-lit`, `--key-sunk`,
`--lamp-off`, `--plating`, `--plating-hi`, `--plating-lo`, `--tray`, `--plate`,
`--plate-ink`, `--plate-ink-dim`, `--card-ink`, `--card-rule`, `--bin-face`,
`--frame-face`, `--flux-ink`, `--danger-ink`, and for the station file's papers
`--manila`, `--slip`, `--envelope`, `--stamp-ink`, `--cash-ink`, `--seal`,
`--greenbar`, the lit keys' `--bulb-hot`, `--bulb`, `--bulb-dim`, `--lens-off`, `--legend-off`, `--legend-lit`, and `--feed` (the punched margin every paper has: sprocket holes
down both edges, drawn by the card's `::before`), and for the desk's hardware
`--strip-face`, `--drum-face`, `--drum-ink`, `--meter-face`, `--meter-red`,
`--tag-face`, `--tag-rule`, `--zone-face`, `--zone-ink`, `--zone-ink-dim`, with
the tile module `--mod` and its seams `--mosaic-pale` / `--mosaic-dark`. Signal colours stay what they were:
`--power`, `--heat`, `--cash`, `--ep`.

## Templates

| Template | Made of | Used by |
|---|---|---|
| **printer** | a slot at the top of the screen over a `.printout` (tractor-feed paper in green bars, the type masked to dots), fed a character at a time, then animated into the goal line | `printer-ui.js`: orders, letters and field notes arriving |
| **file** | a sheet holding papers (`.file`): dockets and letters oldest first, the past folded into one line | the operator's log (`renderFile()` in `ui.js`, ordered by `storyFile()` in `story.js`) |
| **sheet** | a frame, named on a nameplate, its actions a bank of keys (`.row`, or `.sheet-actions` two to a row with a lone last action spanning) | every dialog; the tutorial's card |
| **terminal** | a panel housing, a nameplate with a lamp, a phosphor screen whose rows are lines, not cards | Upgrades, Experiments (the plant computer, `terminal()` in `ui.js`) |
| **plates** | panels (`.panel.plate-group`), each named on a nameplate over a `.keys` bank, then a card of what is kept on paper | Options; the core reboot on Experiments (`plate()` in `ui.js`) |
| **strip** | one panel under the board: text, then switches, then small keys | the verdict line, the automation switches, Flow and Plan |
| **tray** | darker plating; banks of lit keys (`.selector`, from `tabStrip()`), square and centred, every key always there and lit only when it can be pressed, over bins. Everything scales with the screen: a key's `--size` follows the width (`clamp()` on `vw`), its name is set by the bank's longest one (`--chars`) to fit the glass, and the tray's columns share the width equally between `--part-min` and `--part-max`, scrolling only past the floor | the parts dock, the page keys |

## Adding a control

- A button that does something is `h("button", { className: "key wide" })`, or a
  plain `button` inside a `.row` / `.sheet-actions` / `.keys`.
- A choice among several is `tabStrip()`; don't hand-roll a segmented control.
- Something with an on/off state is a `.key.switch` whose `.on` lights its lamp.
- Something that shows state without being pressed is a `.lamp`.
- A name over a group is a `.nameplate`; a group of controls is a `.panel`.
- Text the plant keeps on paper is a `.card`.
- Don't set `background`, `color`, `border` or `box-shadow` on a component in a
  screen's rule. If a screen needs a new look, it is a new token or a new state
  in *Components*, not an override.
