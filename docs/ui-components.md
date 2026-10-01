# UI components and templates

The interface is built from nine components and six templates. A component's
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
| **switch** | `.key.switch` | A key with a lamp. It never latches; the lamp says its state. | `.on`: lamp lit. |
| **lamp** | `.lamp` (or a switch's `::before`) | A round lamp. `--lamp` sets its colour (power green by default), `--lamp-size` its size (7px). | `.on`: lit, with a glow. |
| **nameplate** | `.nameplate`, and every `dialog h2` / `.tut-card h2` | A cream plate with an orange rule under it. A `span` in it is the dim second word. | |
| **panel** | `.panel` | Teal plating with a highlight along its top edge. | |
| **card** | `.card` | Paper: cream, with a tan rule down its left edge. | |
| card kinds | `.card.docket` / `.card.letter` | An order in the station file: a header (what it is, where it came from), the order, its payment. Its paper is its kind: `.manual` (a printed page), `.order` (manila), `.demand` (a bare slip), `.notice`, `.standing`. / A letter: an envelope with a flap, a postmark and a seal until opened, then a typed sheet. | Docket: `.current` ringed in the price's colour, `.done` dimmed. Letter: `.unread` sealed; `[open]` the sheet. |
| **stamp** | `.stamp` | A rubber stamp on paper, inked a little crooked: *Confirmed*, *Supplied*, *Revised*. | |
| **bin** | `.bin` | A recessed well in the tray, for a part or a saved module. | `.on` (on `.part`): lit from inside. |
| **frame** | `dialog`, `.tut-card` | A sheet's housing: dark face, plating border. | |

Every colour a component uses is a token: `--key-face`, `--key-face-in`,
`--key-edge`, `--key-ink`, `--key-ink-off`, `--key-ink-lit`, `--key-sunk`,
`--lamp-off`, `--plating`, `--plating-hi`, `--plating-lo`, `--tray`, `--plate`,
`--plate-ink`, `--plate-ink-dim`, `--card-ink`, `--card-rule`, `--bin-face`,
`--frame-face`, `--flux-ink`, `--danger-ink`, and for the station file's papers
`--manila`, `--slip`, `--envelope`, `--stamp-ink`, `--cash-ink`, `--seal`. Signal colours stay what they were:
`--power`, `--heat`, `--cash`, `--ep`.

## Templates

| Template | Made of | Used by |
|---|---|---|
| **file** | a sheet holding papers (`.file`): dockets and letters oldest first, the past folded into one line | the operator's log (`renderFile()` in `ui.js`, ordered by `storyFile()` in `story.js`) |
| **sheet** | a frame, named on a nameplate, its actions a bank of keys (`.row`, or `.sheet-actions` two to a row with a lone last action spanning) | every dialog; the tutorial's card |
| **terminal** | a panel housing, a nameplate with a lamp, a phosphor screen whose rows are lines, not cards | Upgrades, Experiments (the plant computer, `terminal()` in `ui.js`) |
| **plates** | panels (`.panel.plate-group`), each named on a nameplate over a `.keys` bank, then a card of what is kept on paper | Options; the core reboot on Experiments (`plate()` in `ui.js`) |
| **strip** | one panel under the board: text, then switches, then small keys | the verdict line, the automation switches, Flow and Plan |
| **tray** | darker plating; banks of selector keys (`.selector`, from `tabStrip()`) over bins | the parts dock, the page keys |

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
