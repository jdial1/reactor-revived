// A save state for every goal finished: the board as it stood the moment the
// job was done, with what its reactor was doing. From the log, a player can
// rebuild that board onto today's. There is no rolling the game back to it: a
// meltdown is final, and so is everything else.
import { serialize } from "./state.js";
import { forecast } from "./forecast.js";
import { OBJECTIVES } from "./objectives.js";
import { markOf } from "./records.js";

/** Record the game as it stands, filed under the goal just finished. */
export function takeSnapshot(s, objective, now = Date.now()) {
	const f = forecast(s);
	const { snapshots, ...save } = serialize(s);
	const snap = {
		objective,
		title: OBJECTIVES[objective]?.title ?? "",
		at: now,
		stats: {
			money: s.money,
			parts: f.parts,
			power: f.power ?? 0,
			heat: f.heat ?? 0,
			profit: f.profit ?? 0,
			// Infinity does not survive JSON; 0 reads as "never".
			payback: Number.isFinite(f.payback) ? f.payback : 0,
			failTick: f.failTick ?? 0,
			failed: f.failed ?? null,
			mark: f.mark,
			// The mark the real board had earned when the job was done.
			earned: markOf(s),
		},
		save,
	};
	// One per goal: finishing it again after a roll-back replaces the old one.
	s.snapshots = [...s.snapshots.filter((x) => x.objective !== objective), snap]
		.sort((a, b) => a.objective - b.objective);
	return snap;
}

export const snapshotFor = (s, objective) => s.snapshots.find((x) => x.objective === objective);

/** A snapshot's board as a layout, for rebuilding onto the current game. */
export const layoutOfSnapshot = (snap) => ({
	tiles: snap.save.tiles.map((t) => [t.i, t.id]),
	modules: snap.save.modules ?? [],
});
