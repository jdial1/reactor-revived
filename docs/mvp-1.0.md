# Reactor Revived 1.0: the MVP checkpoint

A checkpoint, not a finish line: the point where the game is whole, true to its
soul, tested, and on the store, so that everything after it is an addition
rather than a repair. This plan comes from a fresh soul review against the Game
Souls library (Containment; see [soul.md](soul.md)) on 23 September 2026, at
commit `a971d5d`.

## Where the project stands

| | |
|---|---|
| Commits | 122 |
| Tests | 145, all passing (`node --test`) |
| Build | Signed AAB, 224 KB; `versionCode 3`, `versionName "1.2"` |
| Content | 75 parts in 10 kinds, 7 fuels, 71 upgrades (6 doctrine sets among them), 30 log jobs, 6 example layouts, 12 trophies, 5 restriction runs |
| Tools | Planner and forecast, layout codes with context, save states, replace-all, Move, Time Flux, modules |
| Soul | All eight litmus checks pass on the design; every open recommendation from the last review is built |

## Soul review, re-run

Checked against the library's Step 8: tone killer, economic topology, ideal
player, every component the soul uses (with its conflict tags), every pitfall
area those components touch, and Containment's own pitfalls.

**Still sound:** no tone killer (the only roll is a reward); the topology is a
Generator whose sink is rebirth, with tiles as the scarce resource; the
ledger balances every tick and is tested; the lab and the floor agree on every
example; marks are earned, never forecast on the floor; refactoring is free;
red means loss; mistakes are silent; the reactor runs on every page.

**New findings.** Only findings with evidence are listed:

| Finding | Evidence | Soul rule it breaks |
|---|---|---|
| The listing spends the law | The Play short description reads "heat grows with their square"; the full description explains the asymmetry | *The Law Is Theirs to Find* (trusting_the_player): the square law is the first discovery, and saying it spends it |
| The part sheet shows base rates | Since capacitors and plating became local, a boosted vent's sheet still shows its unboosted rate | *Hidden Math*, *The Voice Must Not Lie* |
| A cloud restore is a way back | `android:allowBackup="true"`: uninstall and reinstall brings back the last cloud backup, past a meltdown, even in Hardcore | *The Backdoor Rewind* |
| The listing describes an older game | It says the game "pauses while you are not" watching and is "about 150 KB"; it doesn't mention marks, the planner, codes or modules; the screenshots are from 11 September | *The Voice Must Not Lie*: the storefront is part of the voice |
| Unheard audio | The hum's trend tremor has never been listened to on a phone | *The Hum of a Held Machine* is only as good as it sounds |

## Scope of 1.0

**In:** everything on the board today. The soul is fully instilled, and 1.0
adds no new systems.

**Out, until after 1.0:**
- New parts, fuels, goals or doctrines.
- Running the reactor live while the app is closed (Time Flux stays).
- Anything online.
- The top exchanger's row reach (it stays as the named exception).

## Work

### P0: must land before 1.0

| # | Item | Mechanic → Dynamic → Tone | Done when |
|---|---|---|---|
| 1 | Part sheet shows the live vent and transfer rate, with the capacitor or plating bonus it gets from its neighbours | The sheet says what the part really does → players place capacitors deliberately → Geometry is the build | A test checks a boosted vent's sheet value |
| 2 | Rewrite the listing without stating the square law; update counts, size and the "pauses" line; add marks, planner, codes and modules; write 1.0 release notes | The first discovery happens in the game, not the store → The law is theirs to find | `listing.md` passes the litmus: no rule the game should teach is stated |
| 3 | Recapture the five screenshots, plus one showing a Mark I board and one showing the planner | The store shows the game that ships → The voice must not lie | `capture_shots.py` rerun; graphics dated after this plan |
| 4 | Decide `allowBackup`. Recommended: set it to `false` and point to Export save for moving phones | A restore can no longer rewind a meltdown → the receipt matters | The manifest and `checklist.md` agree, and the reason is written down |
| 5 | Old-save test: a real 1.2 save (v3, before marks, incidents and the new records) loads, runs 600 ticks and earns a mark | Existing players keep their game → trust | A fixture save in `test/` |
| 6 | On-device pass on a real phone (no emulator): tutorial, first ten goals, a meltdown receipt, the planner, a code round trip, and the hum with the sound on | → The hum of a held machine, heard | A written pass/fail list in this file |
| 7 | Version: `versionCode 4`. `versionName "1.0"` if 1.2 never shipped publicly; otherwise `"2.0"`. Git tag `v1.0` | → A checkpoint anyone can return to | The tag exists and the build reports the version |

### P1: should land, or be written down as accepted

| # | Item | Why |
|---|---|---|
| 8 | Early-game balance after the ledger changes: time goals 1-10 on a fresh save in the sim, and confirm the Mark I checkerboard earns something after fuel (it read $0/tick) | Removing the trickle and changing refunds moved the start of the game |
| 9 | Particle pacing: time goals 23-28 with the heat-handled rule | Particles now depend on shedding heat |
| 10 | Direct vs indirect cooling payback (160 vs 370 ticks): tune it, or accept it and say why | A known gap players of the line complained about |
| 11 | Performance at 10x Time Flux on a low-end phone (`stored()` and the board signature now run every tick) | Stamina is proven by running, so fast-forward must be smooth |
| 12 | Quiet celebrations: check trophy and goal feedback against *Never Congratulate a Number* | Keep say-it-once whole |
| 13 | Update the privacy policy's date; fix the listing contact if it should not be a work address | Store hygiene |

### P2: after 1.0

- The top exchanger's whole-row reach: keep it as the named exception, or make it local.
- Live offline running versus Time Flux (a standing choice; revisit only on purpose).
- Hand-selling and hand-venting in the early goals (lineage; revisit only with play data).
- The module designer's cold/hot datasheet as a second measurement.
- New content, once the checkpoint holds.

## Exit criteria

1.0 ships when all of these are true:

1. Every P0 is done, and every P1 is either done or accepted in writing here.
2. `node --test` is green, including the old-save test and the lab-versus-floor test.
3. The soul review finds no pitfall with evidence (see [soul.md](soul.md)).
4. The on-device pass has no failures.
5. A signed AAB is built from the tagged commit, and `listing.md` and the graphics match it.

## Release steps

```bash
node --test
./gradlew bundleRelease assembleDebug -q
python docs/play/capture_shots.py
python docs/play/make_graphics.py
git tag v1.0
```

Then follow `docs/play/checklist.md` from step 3.

## Risks

- **Balance drift from the soul work.** The ledger, refund, particle and
  capacitor changes each moved numbers. P1 items 8-10 exist to catch it before
  players do.
- **Existing saves.** Boards built around board-wide capacitors lose speed.
  Say so in the release notes.
- **Version confusion** if 1.2 is already public. Item 7 settles it.
