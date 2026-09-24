# What the soul suggests: a brainstorm

Features Containment points toward, traced so each can be judged. **None of
these is a recommendation yet**, except the five marked *(built)*: L1, L3, G1
(as component and hull vents), P4 and P5. Each row reads Mechanic → Dynamic → Tone,
names where the idea comes from, gives a rough cost (S, M or L), and says
what to watch: the pitfall, standing rule or component conflict it could run
into. They all sit after the 1.0 checkpoint ([mvp-1.0.md](mvp-1.0.md)).

Sources: a pillar or component of the soul ([soul.md](soul.md)), or the
lineage. Lineage facts are marked **(verify)** where they come from memory of
IndustrialCraft 2 or its community rather than from this repo.

## The Ledger

| # | Idea | Mechanic → Dynamic → Tone | Source | Cost | Watch |
|---|---|---|---|---|---|
| L1 | **Ledger sheet (built)** | Tapping the rate line opens the tick split by kind: heat made by cells and by capacitors, shed by vents, turned to power, held by coolant, held by the pool → players find which kind is running the deficit → the player as accountant | The Line Is the Truth | S | Say it once: the sheet exists only when asked for |
| L2 | **Held trace** | A thin 60-tick trace of the held column under the rate line → players see a board settle or drift without doing sums → watchful calm, and a visual twin for the hum | The Hum of a Held Machine; audio_information needs a visual twin | S | Clutter on the reactor page; the gauges were decluttered on purpose |
| L3 | **Condensators (built)** | A part that soaks heat until full and is then refilled for money per point → storage becomes a paid valve, trading money for time → storage buys time, and here the time has a price | IC2's condensators, refilled with redstone or lapis **(verify)** | M | A new part is a post-1.0 content change; it must be a named sink, never a leak |
| L4 | **Incident ledger on the receipt** | The meltdown receipt adds a small board drawing with the first lost part outlined → players see where the chain started → a legible fall | legible_failure: itemize the causes | S | Must stay a receipt, not a scar: it is drawn on the sheet, never on the board |

## Geometry Is the Build

| # | Idea | Mechanic → Dynamic → Tone | Source | Cost | Watch |
|---|---|---|---|---|---|
| G1 | **Vents with neighbour rules (built)** | A component vent that cools the parts around it but not itself, and a hull vent that draws only from the pool → the same tile budget solves differently depending on what touches what → neighbours are the rules | IC2's component and reactor heat vents **(verify)**; NuclearCraft's cooler rules | M | Additive blandness if they are just stronger vents; each must change where it wants to sit |
| G2 | **Mirror, rotate and stamp in the planner** | Mirror or rotate the board, and repeat a selected block across it → players iterate on symmetric designs quickly → expression | workbench: tools the community would build | S | Game plays itself, if it drifts toward auto-layout; it must only copy what the player drew |
| G3 | **Pulse pips in Flow** | Flow shows each cell's neighbour count as small pips → players connect "four neighbours" with "a lot of heat" on their own → the square law found, not told | Total information (state) | S | The law is theirs to find: it shows the count, never the formula. Borderline, so judge it carefully |
| G4 | **Ratio-shaping doctrines** | A seventh doctrine set whose two sides change the shape of heat (heat to diagonals, or heat only into vents) → the best layout of the last run stops being best → every upgrade moves the optimum | The Checkerboard Forever fix | M | Balance debt; the pinned examples must still hold |

## Proof by Running

| # | Idea | Mechanic → Dynamic → Tone | Source | Cost | Watch |
|---|---|---|---|---|---|
| P1 | **Design book** | Earning a mark files the board, with its numbers, in a book that can be rebuilt from → players collect proven designs as a portfolio → players remember designs, and keep them | Rate the Machine by Its Stamina; save states | S | History nobody reads: the book has to be where codes are copied from |
| P2 | **Stamina rungs** | Records time each run to its first Mark I board at 1K, 1M, 1B and 1T → speed and stamina have to be solved together → stamina is the prestige | difficulty_ladder: efficiency is prestige | S | The Empty Top is already answered; this deepens it without adding a rung type players ignore |
| P3 | **The fuller Mark scale** | Mark II carries how many cycles it holds before it must cool; a marker for designs that lean on coolant that is spent → finer claims in shared codes → measured, not boasted | IC2's community Mark scale and single-use-coolant suffix **(verify)** | M | Detail nobody feels, unless codes and records use it |
| P4 | **Away receipt (built)** | When Time Flux finishes, one line: ticks run, incidents, money made → players trust leaving the board alone → permission to look away | Absence Is Play | S | The cheerful toast; it must be a plain line, shown once |
| P5 | **Quiet after Mark I (built)** | Once a board earns Mark I, the hum settles to a lower, steadier drone → a held machine sounds held → calm is the reward | The Hum of a Held Machine | S | Hearing required; Mark I on the floor line is its visual twin |
| P6 | **Creak near the limit** | A part past nine-tenths full gives a low creak, pitched by tier → players hear which part is next before they find it → the reactor is the loudest thing near the limit | audio_information: sound before sight | S | The buzzer: it must be dull and rare, and every creak already has a full heat bar as its twin |

## The Workbench

| # | Idea | Mechanic → Dynamic → Tone | Source | Cost | Watch |
|---|---|---|---|---|---|
| W1 | **Planner stepping** | Step one tick, run 100, run to the first failure, then stop → players debug a design tick by tick → forecast the failure tick | IC2 planners' per-tick logs **(verify)** | S | Time as a test input: it must stay fast at high tiers |
| W2 | **Heat log export** | The planner copies a per-tick log (made, shed, held, per part) as text → spreadsheeters study designs outside the game → the community's own tools, shipped | IC2 planners' exported logs **(verify)** | S | Written to last: a stable, plain format |
| W3 | **Check a claim in the lab** | A pasted code's header claim can be run in the planner: "Claimed Mark I; in this game, Mark I" → claims get tested against the reader's upgrades → a code carries its context | Stamina Travels With the Design | S | A forecast belongs in the lab; it never marks the floor |
| W4 | **Lab versus floor** | The planner shows its board next to the real one, numbers side by side, with no colours → players see exactly what a redesign changes → measure, don't grade | workbench | S | The red signal: no green or red |
| W5 | **Challenge codes** | A code can carry a rule (a budget, allowed parts) and opens as a planner puzzle: "reach Mark I within $X" → players post puzzles to each other offline → shared discovery without a server | difficulty_ladder: seeded runs; shared_discovery: offline echo | M | Must not become board variants; the board stays 12 x 8, and only the rule travels |

## Automation, voice and rebirth

| # | Idea | Mechanic → Dynamic → Tone | Source | Cost | Watch |
|---|---|---|---|---|---|
| A1 | **Rebuy on incident (bought)** | An upgrade that replaces a part that blew, at list price → a board survives a rare failure unattended, but still records the incident → hands on the design | automation: hands on the design | S | Proof nobody sees, if it hides failures; it must keep Mark III honest |
| A2 | **The sign flips** | When an incident resets "ticks without incident", the number winds to 0 on the money odometer's drums → the reset is felt, not announced → deadpan, the material is the feedback | interface_voice; the odometer already built | S | Winking at the camera; it must be dry |
| A3 | **Particles on stamina** | At a reboot, banked particles scale with the run's best Mark I output → players end runs on a board that holds, not a stunt → the prestige number is output that holds | Reactor Incremental's rule, paid on heat removed **(verify)** | M | Balance on the particle goals; it stacks with the heat-handled rule |
| A4 | **Plain-language errors in voice** | Every refusal (a bad code, a Hardcore import, a locked part) reads as the station would say it, dry and exact → even failure stays in the game's register → a straight face | interface_voice: even errors stay in voice | S | The flavourful lie: in voice, but literally true |

## Suggested by the soul, ruled out by the standing rules

Listed so they are not suggested again:

- **Seeded daily boards or smaller boards** (a difficulty-ladder staple): board variants are out.
- **Online leaderboards and shared design feeds** (shared_discovery at full strength): no network.
- **A meltdown that leaves wreckage or a lasting debuff** (making the fall matter): a meltdown is a clean wipe.
- **Operator stories and characters around the plant**: no story beats. The Immersion motivation is Low anyway.
- **Running live while the app is closed**: Time Flux is the standing choice.

---

# Round two: from outside the lineage

The first round drew mostly on the soul and the IC2 line. Five of this round are built, marked *(built)*: P8, E3, W8 (capacity rows in the ledger, with time to full in the planner only), W9 and F4. This round draws on
other games, real reactor engineering, and information and interface design,
so the soul keeps borrowing from outside itself. The format is the same:
Mechanic → Dynamic → Tone, where each idea comes from, a rough cost, and what
to watch. Facts about other games are marked **(verify)** where they come from
memory rather than a checked source.

## The Ledger, seen

| # | Idea | Mechanic → Dynamic → Tone | Reference | Cost | Watch |
|---|---|---|---|---|---|
| L5 | **Sankey ledger** | The ledger sheet draws the tick as a flow diagram: heat made on the left, splitting into vents, refills, power and held, each band as wide as its share → players see at a glance which sink carries the load → the line is the truth, drawn | Sankey diagrams, first drawn by Captain Sankey in 1898 for a steam engine's energy flow; Machinations' flow diagrams in game design | S | Must stay on request, inside the sheet; it redraws the same numbers, never new advice |
| L6 | **Fill overlay** | A third overlay beside Flow tints every tile by how full it is, with a small arrow where the fill is rising → players find the part that will go next without tapping each one → watchful calm | Oxygen Not Included's temperature overlay; the data views in SimCity and Cities: Skylines **(verify)** | S | Diegesis at the cost of legibility: the colours must read in colour-blind modes too |
| L7 | **Decay heat** | A spent cell stays warm for a short while, a named, falling source, unless it is rebought at once → refuelling timing and perpetual upgrades matter to the ledger → consequences arrive late, but lawfully | Real reactors: fission products keep making heat after shutdown | M | Detail nobody feels, unless the ledger shows it; must never be a leak |

## Geometry Is the Build

| # | Idea | Mechanic → Dynamic → Tone | Reference | Cost | Watch |
|---|---|---|---|---|---|
| G5 | **Control rods** | A part that damps the pulses of the cells it touches: less power and less heat from each, a negative reflector → players trade output for stability tile by tile → every tile is a trade | Real reactors: control rods absorb neutrons; moderators and absorbers as opposites | M | It must change where it sits, not just subtract; the pinned examples must still hold |
| G6 | **Conditional coolers** | A cooler that works only when a stated neighbour touches it (another cooler of a different kind, or a vent) → layouts become small adjacency puzzles inside the big one → neighbours are the rules | NuclearCraft's fission coolers, each with its own placement rule **(verify)** | M | Illegible combos: each rule must be one line on its sheet |
| G7 | **Trimmed cells** | A cell's sheet offers a trim: run it at a fraction of its rating → the same fuel yields a different ratio of power to heat, and dense cores can be tuned rather than thinned → geometry plus a dial | Satisfactory's clock-speed slider on each machine **(verify)** | M | The law is theirs to find: the sheet shows the numbers at each trim, never the curve |

## Proof by Running

| # | Idea | Mechanic → Dynamic → Tone | Reference | Cost | Watch |
|---|---|---|---|---|---|
| P7 | **Scram interlock** | A placeable thermal monitor: when the pool passes the player's set point, the cells stop until it falls back → a design can carry its own safety, and a board held by its interlock earns Mark II, not Mark I → the machine that holds, honestly | IC2 reactors ran only on a redstone signal, and its Nuclear Control add-on had thermal monitors **(verify)**; the real SCRAM | M | The game plays itself: the player sets the point, the part only obeys it |
| P8 | **Shift log (built)** | A plain list of the board's last events (mark earned, incident, refill, meltdown receipt, reboot), newest first → players can read back what happened while they looked away → absence is play, with a receipt | Dwarf Fortress's legends and combat logs; Factorio's alerts list **(verify)** | S | History nobody reads: it opens from the floor line, where the eye already is |
| P9 | **Personal histograms** | Records draw each power tier's Mark I boards as a small histogram of efficiency: where this board sits among your own → players chase their own best, not a stranger's → measure, don't grade | Opus Magnum's cost/cycles/area histograms, shown offline against your own history only | M | The scoreboard: it compares you only with you; nothing online |

## The Workbench

| # | Idea | Mechanic → Dynamic → Tone | Reference | Cost | Watch |
|---|---|---|---|---|---|
| W6 | **Planner undo and draft slots** | In the planner only: undo, and three named drafts to switch between → trying a change stops costing the last idea → expression, with the floor still unrewindable | Zachtronics' solution slots; Into the Breach's turn reset; Baba Is You's undo **(verify)** | S | Rebuild, never rewind: undo lives in the lab and never touches the real board |
| W7 | **Board card** | Share a picture of the board with its numbers and code printed under it, through the phone's own share sheet → designs travel as pictures on forums as well as text → players remember designs, and post them | Opus Magnum's solution GIFs; Factorio's blueprint previews **(verify)** | M | No network in the app: it hands a file to Android's share sheet and nothing else |
| W8 | **Capacity sheet (lab) (built)** | The planner lists the board's totals: heat made, vent capacity, transfer capacity, storage, and time to full → players check a design's budget before running it → the workbench the community would build | Factorio's rate calculators; KSP's delta-v readout **(verify)** | S | Must report, not advise: totals, never "add two vents" |
| W9 | **Datasheet export (built)** | The parts guide can be copied as plain text, every family and every tier's numbers → spreadsheeters start from the game's own figures → the outside tool, shipped | Shenzhen I/O and TIS-100's printable manuals | S | Written to last: a stable, plain format |

## Feel, sound and access

| # | Idea | Mechanic → Dynamic → Tone | Reference | Cost | Watch |
|---|---|---|---|---|---|
| F1 | **The machine's own music** | Each kind of working part adds a quiet voice to the hum (vents a soft pulse, cells a low tone), and it thins as parts fail → a board sounds as full as it is → the hum of a held machine, composed by the board | Mini Metro's procedural sound, where the network plays itself **(verify)** | M | The decorative mix: every voice must track a real state |
| F2 | **Haptic incidents** | A short, dull vibration when a part fails, a longer one for a meltdown → the phone's third channel carries danger when the sound is off → every threat has a cue | Android haptics guidance; console rumble used as information | S | Needs Android's vibrate permission (no network); it must be rare, and can be turned off in Options |
| F3 | **Colour-blind heat** | A setting that swaps red and orange heat for a palette and pattern that read without hue → the heat bars stay legible to everyone → legible failure for every player | The Game Accessibility Guidelines; Xbox's accessibility guidance | S | The red signal: the new palette still keeps its warning colour for danger alone |
| F4 | **Settling motion (built)** | A placed part settles into its tile with a small, heavy motion, and a failing part flickers once before it goes → the board feels machined, not drawn → calm, with weight | Steve Swink's *Game Feel* | S | Juice must stay heavy and dull, like the sounds; never bouncy |

## Economy and rebirth

| # | Idea | Mechanic → Dynamic → Tone | Reference | Cost | Watch |
|---|---|---|---|---|---|
| E1 | **A fuel market** | Buying many cells of one fuel quickly raises its price, and the price eases back as ticks pass → spreading fuels and buying steadily beats one huge splurge → scarcity that asks for a decision, not a wait | Power Grid's resource market, where prices climb as stock is bought **(verify)** | M | No FOMO: prices ease by ticks run, never by the clock outside the game |
| E2 | **Permed research** | At each reboot the player keeps one doctrine side unlocked for free in every future run → rebirths add breadth, not height → the ladder grows sideways | Kingdom of Loathing's permed skills; Hades' mirror, where the choice matters more than the power | M | Grind disguised as progress: it must widen options, never raise numbers |
| E3 | **Challenge rules with a mark (built)** | Restriction runs gain a Mark I rung: the fastest time to a Mark I board under each rule → the hardest runs demand stamina, not a sprint → stamina is the prestige, even on the ladder | Antimatter Dimensions' challenges with their own records **(verify)** | S | The Empty Top is already answered; this has to stay one record per rule |

## Round two, ruled out by the standing rules

- **A growing board** (Factorio's expansion, IC2's reactor chambers): the board is fixed.
- **A news ticker of jokes** (Antimatter Dimensions): deadpan only, and never a second voice over the board.
- **Push notifications while away** (most idle games): the nagging feed; nothing punishes absence.
- **Advisors who suggest builds** (SimCity's advisors): measure, don't grade, and never advise.
- **Online histograms against everyone** (Opus Magnum's global ones): no network, so only your own history.
