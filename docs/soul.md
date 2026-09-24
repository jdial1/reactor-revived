# Soul: Containment

> "A good design is one you can stop watching."

Reactor Revived is the source game of **Containment**, a soul in the Game Souls
library (`game_souls/souls/containment.txt`, with this game's field notes in
`souls/field_notes/containment.txt`). This file is the soul as it applies here,
kept in the shape of the library's Instillation Report (LLM_SOUL_GUIDE.txt,
Step 8). New features are checked against it before they are built.

On the surface: a grid, a few bars, numbers that climb. Beneath: a
conservation puzzle on a small fixed board, where the same parts in a
different arrangement run for a week or melt in ninety seconds. Players
remember designs, and post them.

## Verbs

| Verb | What the player literally does | Kinetic profile |
|---|---|---|
| Place | Tap an empty tile with a part selected; drag to paint a row | Not real-time: instant, and refunded, so never committed |
| Inspect, then sell or move | Tap a placed part for its sheet, where selling, moving, replacing and refilling all live | Not real-time: instant; selling refunds the price less fuel used |
| Buy | Buy an upgrade, a doctrine side, or research | Not real-time: a menu choice |

Early on the player also taps the power bar to sell and the heat bar to vent.
That is the manual tax, which the first upgrades retire.

## Fact sheet

- **Interface:** a 12 x 8 board, three gauges (power, money, heat), one rate
  line (made, vented, moved, held), a floor line (mark and ticks without
  incident), the hum, and a planner beside it all.
- **Rules:** heat is conserved. Cells make it (the square law of touching
  fuel), parts hold it up to a limit, vents shed it, transfer parts move it,
  and the reactor pool holds the rest. Over twice its limit the reactor melts.
- **Goals:** the operator's log (thirty jobs), then records, marks,
  restriction runs and trophies.
- **Entities:** fuel cells, vents, coolant, plating, capacitors, reflectors,
  exchangers, inlets, outlets, accelerators, and modules (3 x 3 designs sealed
  into one part).
- **Entity manipulation:** place, sell, move, replace all, build from a code,
  rebuild a save state.
- **Economy shape: Generator.** Output grows without limit with investment.
  The sink that grows with it is rebirth: a reboot trades the board and the
  money for research. The scarce resource is space, which never inflates.

## Axis profile

| Axis | Position | Evidence | Conf. |
|---|---|---|---|
| Failure | Costly | A failed part is gone and its heat returns to the pool; a meltdown wipes the board but keeps money and research | High |
| Information | Total (state) / Observed (consequence) | Every number is on the board; what a layout does over time is learned by running it, or forecast only in the planner | High |
| Authorship | Player-Authored Build | The story is a design: layout codes, save states, modules, "my Mark I" | High |
| Power | Optimization | Ratios, geometry, upgrades, doctrines | High |
| Tone | Watchful Calm | The hum steadies when a board holds; near the limit the reactor becomes the loudest thing in the game | Med |
| Structure | Rebirth Account | Reboot banks particles into research; the log ends and the long game goes on | High |

**Tone killer:** random breakdowns, meaning a part that fails for a reason the
design did not cause. The game's only roll is the fractional Exotic Particle
count, which is a reward, never a failure. Keep it that way.

**Aesthetic targets (MDA):** Challenge, Expression, Submission. Automation,
Time Flux and a reactor that keeps running on every page serve Submission (a
game to glance at and return to).

## Psychological target

| Motivation | Level | Why |
|---|---|---|
| Action | Low | Nothing is performed by reflex. |
| Social | Low | Designs travel as codes; play is solitary. |
| Mastery | High | Ratios, geometry, conservation. |
| Achievement | High | Marks, records, restriction-run times, trophies. |
| Immersion | Low | The machine is the point. |
| Creativity | High | A layout that holds is the player's own. |

**Ideal-player watch:** the operator's log has one line of Harrow Station per
job. That is an Immersion feature. It stays because it is one deadpan line
that never gates play. Anything larger in that direction would work against
the soul.

## Components

| Component | Strength | Evidence here | Status |
|---|---|---|---|
| systemic_consistency | Core | Planner, forecast, modules and floor run the same `tick`; the lab changes money only | Pass |
| legible_failure | Core | Per-part heat bars, Flow, incidents, the meltdown receipt | Pass |
| interface_voice | Supporting | Say it once; red kept for real loss; no number is congratulated | Pass |
| scarcity_economy | Supporting | Tiles are the bottleneck; money inflates away | Pass |
| synergy_engines | Supporting | The square law, reflectors, compounding upgrades | Pass |
| difficulty_ladder | Supporting | Reboot, five restriction runs, time-to-output rungs | Pass |
| trusting_the_player | Supporting | Numbers without advice; the parts guide states every part's rules and live numbers but never the square law, the experimental quirks or placement; field notes record observations | Pass |
| shared_discovery | Supporting | Layout codes; "Mark I" builds the classic checkerboard | Pass |
| workbench | Supporting | Planner, a forecast of the failure tick, codes with context, free teardown, no rewind | Pass |
| automation | Supporting | Perpetual rebuys and auto-sell are bought early; there is no layout optimiser | Pass |
| audio_information | Supporting | The hum rises with heat and its tremor with the trend; other sounds duck | Pass |

**Relationship conflicts, and how this game resolves them:**

- *scarcity_economy* conflicts with an Inflationary topology. Here the scarce
  thing is tiles, not the money that inflates, and rebirth is the sink for
  money.
- *scarcity_economy* conflicts with *synergy_engines* late in a run. Here
  synergy is geometric, so every combo spends the tiles that stay scarce.
- *workbench* and *legible_failure* conflict with outcome randomness. Here the
  only roll is the Exotic Particle fraction, which is a reward, and the
  forecast seeds it.
- *workbench* conflicts with Terminal failure. Here failure is Costly, and
  Hardcore removes the lab for players who want the stakes whole.
- *audio_information* conflicts with Total-information UIs and needs a visual
  twin. Here the hum's trend has one on screen: the held column and Mark II.
- *trusting_the_player* conflicts with text-box tutorials. Here the tutorial is
  seven cards, five of which wait for the player to act, and none says where a
  part goes.

## The pillars, in this game

| Pillar | Rule | Where it lives |
|---|---|---|
| The Ledger | One conserved quantity; no leaks | Heat is split exactly; no free trickle; the over-limit dump pays in full; parts that blow, are sold or are replaced leave their heat in the reactor; throttling applies everywhere |
| | The line is the truth | Made, vented, moved, held: made = vented + converted + held, tested every tick |
| | Storage buys time, not safety | A board leaning on coolant earns Mark II, not Mark I; a condensator buys time at a price, and a board that needed a refill earns Mark II |
| | The ledger, on request | Tapping the rate line splits the tick by kind: made, shed, turned to power, held, moved |
| Geometry Is the Build | A small, fixed board | 12 x 8; modules pack a 3 x 3 into one tile at a casing cost |
| | Neighbours are the rules | Heat moves to touching parts and through the pool; capacitors and plating speed only what they touch. Each IC2 family has its own rule: a component vent bleeds what it touches, a hull vent draws from the pool. One named exception: the top exchanger reaches its whole row |
| | Every upgrade moves the optimum | Doctrines change ratios; an upgrade restarts the board's mark |
| | The same parts, a different machine | Move is free and keeps a part's heat and life |
| Proof by Running | The clock is the judge | Parts fail on schedule; randomness only in rewards |
| | Rate the machine by its stamina | Marks I-III earned on the floor; Records lead with Mark I power and efficiency; particles count as far as heat is shed |
| | Absence is play | The reactor runs on every page; Time Flux banks the time the app is closed and ends with a one-line receipt; nothing punishes leaving |
| | The hum of a held machine | Steady when held, beating while heat climbs, lower and quieter once Mark I is earned |
| | A meltdown is a receipt, not a scar | A clean wipe and a written receipt of the fall |
| The Workbench | Forecast the failure tick | The planner names the tick and the part, or says "Would earn Mark I" |
| | Stamina travels with the design | Codes carry mark, power, efficiency, upgrades and doctrines |

## Pitfalls scanned

The scan covered every area whose components this game uses, plus
Containment's own pitfalls. Only pitfalls with evidence in the game are
listed.

| Pitfall | Evidence | Status |
|---|---|---|
| The Friendly Leak | Knockoff's trickle, the lossy over-limit dump, heat deleted with blown or sold parts | Fixed |
| The Lab That Lies | The forecast dropped the power cap, selling and rebuys | Fixed; a test runs every example on lab and floor |
| Proof Nobody Sees | Peak power was the only power record | Fixed: marks, Mark I records |
| The Backdoor Rewind | Import could undo a meltdown, even in Hardcore | Fixed: refused in Hardcore, tagged Restored elsewhere |
| The Buzzer | A "deny" thud played on every tap the player couldn't afford | Fixed: the flash stays, the sound is gone |
| The Cheerful Toast | "Replaced with X" repeated what the board already showed | Fixed: removed |
| The Red Signal | Every confirmation was red, including "OK" and "Skip"; selling a part was styled as danger | Fixed: red only for a lost save, run or design |
| Refactoring cost (workbench rule) | A hot part refunded less, on top of leaving its heat behind | Fixed: refund is the price less fuel used |
| The Wordy Tutorial | Seventeen cards | Fixed: seven cards, five that wait for an action |
| The Law Is Theirs to Find (listing) | The Play short description states the square law | Open: P0 in [mvp-1.0.md](mvp-1.0.md) |
| Hidden Math (part sheet) | A boosted vent's sheet showed its base rate once bonuses went local | Fixed: the sheet shows the rate where it sits |
| The Backdoor Rewind (cloud) | `allowBackup` lets a reinstall restore past a meltdown | Open: P0 decision |
| The Voice Must Not Lie (store) | The listing and screenshots describe an older game | Open: P0 |
| Chores Forever / The Babysat Machine | Manual selling and venting early | Watched: perpetual rebuys arrive at goal 8, and the manual tax is lineage |

## Litmus

| Check | Question | Answer | Today |
|---|---|---|---|
| The Ledger | Can the player account for every point of heat the board made this tick? | Yes | Pass |
| The Neighbour | Would the same parts in a different arrangement make a different machine? | Yes | Pass |
| The Clock | Is a design judged by how long it holds? | Yes | Pass |
| The Workbench | If players would need an outside tool to design well, does the game ship it? | Yes | Pass |
| The Dice | Can a part fail for a reason the board did not cause? | No | Pass |
| The Voice | Does any word, colour or sound claim something the systems don't do? | No | Pass |
| The Chores | Can the player earn a machine for the tasks they started doing by hand, without it deciding for them? | Yes | Pass |
| The Blindfold | With eyes closed, could a player tell the board is heading for failure? | Yes | Pass |

## Recommendations, traced

Each row reads Mechanic → Dynamic → Tone. Built, in this order:

| # | Mechanic | Dynamic | Tone |
|---|---|---|---|
| 1 | No free trickle; every blown or sold part leaves its heat | Players reason from conservation and get the right answer | Calm that is earned |
| 2 | The lab changes money only | A design that holds in the planner holds on the floor | Trust in the workbench |
| 3 | Marks on the floor; Mark I records first | Players run a board until it proves itself | Watchful calm, then permission to look away |
| 4 | The hum beats while heat climbs | Players hear a board failing before they see it | The reactor is the loudest thing near the limit |
| 5 | Full refunds less fuel; Move is free | Players tear down and rebuild without flinching | Expression |
| 6 | Red only for real loss; no deny sound; no redundant toasts | Players read red as danger and keep the sound on | Say it once |

Then, closing the last open items:

| # | Mechanic | Dynamic | Tone |
|---|---|---|---|
| 7 | The reactor keeps running on the Upgrades and Options pages | Players shop while the board proves itself | Submission: glance and return |
| 8 | Capacitor and plating bonuses reach only their neighbours, with the row exchanger a named exception | Where a capacitor sits becomes a choice | Geometry is the build |
| 9 | The tutorial and the examples observe rather than advise; the vent step waits for any vent | Players find the first vent placement themselves | The square law stays their discovery |
| 10 | A capacitor's buyout heat reaches the reactor in the same tick | The held column never dips | A ledger that always balances |

## Open bends

- Time away from the app is banked as Time Flux rather than run live. Kept by
  choice: nothing runs on a timer that punishes being away.
- Early goals are manual (sell and vent by hand). Kept as lineage.
- The module designer measures its casing cold and hot. That is the design's
  datasheet, like a cell's listed heat, not a forecast of the board.
- The top exchanger reaches its whole row: the one named exception to
  neighbours-only.

## Cost warning

- **Tuning ratios, not values:** every part change moves the optimum for every
  shared code. The pinned example balances and the lab-versus-floor test are
  what keep that honest.
- **Time as a test input:** stamina is proven by running. The 300-tick mark
  window, Time Flux and the forecast are what make that bearable.

## Standing rules

These sit on top of the soul:

- Stay inside the lineage.
- A meltdown is an absolute clean wipe (a receipt is words, not wreckage).
- No story beats.
- No roguelite generations, board variants or scars.
- No network or monetisation.
- Comedy is deadpan only.
