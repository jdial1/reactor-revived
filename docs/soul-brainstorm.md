# What the soul suggests: a brainstorm

Features Containment points toward, traced so each can be judged. **None of
these is a recommendation yet.** Each row reads Mechanic → Dynamic → Tone,
names where the idea comes from, gives a rough cost (S, M or L), and says
what to watch: the pitfall, standing rule or component conflict it could run
into. They all sit after the 1.0 checkpoint ([mvp-1.0.md](mvp-1.0.md)).

Sources: a pillar or component of the soul ([soul.md](soul.md)), or the
lineage. Lineage facts are marked **(verify)** where they come from memory of
IndustrialCraft 2 or its community rather than from this repo.

## The Ledger

| # | Idea | Mechanic → Dynamic → Tone | Source | Cost | Watch |
|---|---|---|---|---|---|
| L1 | **Ledger sheet** | Tapping the rate line opens the tick split by kind: heat made by cells and by capacitors, shed by vents, turned to power, held by coolant, held by the pool → players find which kind is running the deficit → the player as accountant | The Line Is the Truth | S | Say it once: the sheet exists only when asked for |
| L2 | **Held trace** | A thin 60-tick trace of the held column under the rate line → players see a board settle or drift without doing sums → watchful calm, and a visual twin for the hum | The Hum of a Held Machine; audio_information needs a visual twin | S | Clutter on the reactor page; the gauges were decluttered on purpose |
| L3 | **Condensators** | A part that soaks heat until full and is then refilled for money per point → storage becomes a paid valve, trading money for time → storage buys time, and here the time has a price | IC2's condensators, refilled with redstone or lapis **(verify)** | M | A new part is a post-1.0 content change; it must be a named sink, never a leak |
| L4 | **Incident ledger on the receipt** | The meltdown receipt adds a small board drawing with the first lost part outlined → players see where the chain started → a legible fall | legible_failure: itemize the causes | S | Must stay a receipt, not a scar: it is drawn on the sheet, never on the board |

## Geometry Is the Build

| # | Idea | Mechanic → Dynamic → Tone | Source | Cost | Watch |
|---|---|---|---|---|---|
| G1 | **Vents with neighbour rules** | A component vent that cools the parts around it but not itself, and a hull vent that draws only from the pool → the same tile budget solves differently depending on what touches what → neighbours are the rules | IC2's component and reactor heat vents **(verify)**; NuclearCraft's cooler rules | M | Additive blandness if they are just stronger vents; each must change where it wants to sit |
| G2 | **Mirror, rotate and stamp in the planner** | Mirror or rotate the board, and repeat a selected block across it → players iterate on symmetric designs quickly → expression | workbench: tools the community would build | S | Game plays itself, if it drifts toward auto-layout; it must only copy what the player drew |
| G3 | **Pulse pips in Flow** | Flow shows each cell's neighbour count as small pips → players connect "four neighbours" with "a lot of heat" on their own → the square law found, not told | Total information (state) | S | The law is theirs to find: it shows the count, never the formula. Borderline, so judge it carefully |
| G4 | **Ratio-shaping doctrines** | A seventh doctrine set whose two sides change the shape of heat (heat to diagonals, or heat only into vents) → the best layout of the last run stops being best → every upgrade moves the optimum | The Checkerboard Forever fix | M | Balance debt; the pinned examples must still hold |

## Proof by Running

| # | Idea | Mechanic → Dynamic → Tone | Source | Cost | Watch |
|---|---|---|---|---|---|
| P1 | **Design book** | Earning a mark files the board, with its numbers, in a book that can be rebuilt from → players collect proven designs as a portfolio → players remember designs, and keep them | Rate the Machine by Its Stamina; save states | S | History nobody reads: the book has to be where codes are copied from |
| P2 | **Stamina rungs** | Records time each run to its first Mark I board at 1K, 1M, 1B and 1T → speed and stamina have to be solved together → stamina is the prestige | difficulty_ladder: efficiency is prestige | S | The Empty Top is already answered; this deepens it without adding a rung type players ignore |
| P3 | **The fuller Mark scale** | Mark II carries how many cycles it holds before it must cool; a marker for designs that lean on coolant that is spent → finer claims in shared codes → measured, not boasted | IC2's community Mark scale and single-use-coolant suffix **(verify)** | M | Detail nobody feels, unless codes and records use it |
| P4 | **Away receipt** | When Time Flux finishes, one line: ticks run, incidents, money made → players trust leaving the board alone → permission to look away | Absence Is Play | S | The cheerful toast; it must be a plain line, shown once |
| P5 | **Quiet after Mark I** | Once a board earns Mark I, the hum settles to a lower, steadier drone → a held machine sounds held → calm is the reward | The Hum of a Held Machine | S | Hearing required; Mark I on the floor line is its visual twin |
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
