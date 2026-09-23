# Soul: Containment

Reactor Revived is held to **Containment**, a soul written for its lineage
(IndustrialCraft 2's reactor, Reactor Incremental, Reactor Knockoff) using the
Game Souls library's procedure. The full soul, in the library's house style, is
`souls/containment.txt` in that library.

> "A good design is one you can stop watching."

On the surface: a grid, a few bars, numbers that climb. Beneath: a conservation
puzzle on a small fixed board, where the same parts in a different arrangement
run for a week or melt in ninety seconds. Players remember designs, and post
them.

## Profile

| Axis | Position | In this game |
|---|---|---|
| Failure | Costly | A failed part is gone and its heat returns to the reactor; a meltdown takes the board, never the money or research. |
| Information | Total (state) / Observed (consequence) | Every number is shown; what a layout does over time is learned by running it, or forecast in the planner. |
| Authorship | Player-Authored Build | The story is a design: "my Mark I runs five quad thorium." |
| Power | Optimization | Upgrades, doctrines, ratios, payback. |
| Tone | Watchful Calm | A dangerous machine, quiet because it was built right. |
| Structure | Rebirth Account | Reboot banks particles; research stays; the log ends and the long game goes on. |

Components: systemic consistency and legible failure (core); scarcity (tiles,
not money), synergy (adjacency), difficulty ladder (reboot rules, speed rungs),
trusting the player, shared discovery (codes) (supporting).

**Tone killer:** random breakdowns - a part that fails for a reason the design
did not cause. The game's only randomness is the fractional Exotic Particle
roll, which is output, never failure. Keep it that way.

## The pillars, in this game

| Pillar | Rule | Where it lives |
|---|---|---|
| The Ledger | One conserved quantity; no leaks in the math | Heat split exactly; no free trickle; the over-limit dump pays in full; parts that blow, are sold or replaced leave their heat in the reactor; throttling applies everywhere a cell's heat goes |
| | The line is the truth | The rates line: made, vented, moved, held - made = vented + converted + held, checked by a test every tick |
| | Storage buys time, not safety | Coolant cells and plating: a board leaning on them earns Mark II, not Mark I |
| Geometry Is the Build | A small, fixed board | 12 x 8 tiles; modules pack a 3 x 3 into one at a casing cost |
| | Neighbours are the rules | Heat moves only to touching parts, and through the reactor pool |
| | Every upgrade moves the optimum | An upgrade restarts the board's mark; a Mark I can become a Mark II |
| | The same parts, a different machine | Move a part from its sheet: free, keeps its heat and life, restarts the mark |
| Proof by Running | The clock is the judge | Parts fail on schedule; the forecast lives only in the planner |
| | Rate the machine by its stamina | Marks I-III earned on the floor; Records lead with power and efficiency from a Mark I board; particles count as far as the board sheds its heat |
| | Absence is play | Time Flux banks time away; nothing punishes leaving |
| | The hum of a held machine | The hum beats while heat is climbing and holds steady when the board is in balance |
| The Workbench | A lab beside the floor | The planner forecasts ("Would earn Mark I"); the floor, replace-all and save states report only what is and was |
| | The lab runs the floor's rules | Forecasts change money only; a test runs every example on lab and floor and requires them to agree |
| | Designs travel as text | Layout codes, carrying their mark, power and efficiency on a header line |
| | A code carries its context | Codes carry upgrades and doctrine sides; pasting says when the reader's game differs |
| | Measure, don't grade | Numbers before and after, no better/worse colouring, no stars, no advice |
| | Rebuild, never rewind | Save states rebuild onto today's board; import is refused in Hardcore and marks any other run Restored |

## Litmus

Run every new feature through these.

| Check | Question | Correct answer | Today |
|---|---|---|---|
| The Ledger | Can the player account for every point of heat the board made this tick? | Yes | Pass |
| The Neighbour | Would the same parts in a different arrangement make a different machine? | Yes | Pass |
| The Clock | Is a design judged by how long it holds, not only by what it makes in a minute? | Yes | Pass (Marks, Mark I record) |
| The Workbench | If players would need an outside tool to design well, does the game ship it? | Yes | Pass (planner, forecast, codes with numbers) |
| The Dice | Can a part fail for a reason the board did not cause? | No | Pass |

The standing project rules sit on top of the soul: stay inside the lineage;
meltdown is an absolute clean wipe (a receipt is words, not wreckage); no story
beats; no roguelite generations, board variants or scars; no network or
monetisation; comedy is deadpan only.

## Still bent, on purpose or for later

- Absence is banked as Time Flux rather than run live, and leaving the Reactor
  page pauses it (kept by choice).
- Early goals are manual (sell and vent by hand) before automation (lineage).
- The module designer forecasts its casing: a second lab.
- Some parts reach past their neighbours (one exchanger's whole row), and
  capacitors and plating raise rates board-wide.
- The tutorial and example notes still give layout advice.

## Trust in the opening

The tutorial is seven cards, five of which wait for the player to do the thing
they describe. Everything else is taught by the operator's log and by tapping
parts - the soul's workbench, not a lecture.
