// What the player has done, kept like the statistics page Reactor Incremental
// had: the best the reactor has ever run, the longest it has run clean, and how
// fast each run reached each rung of power. Only the real reactor counts - the
// planner, forecasts and module casings never touch these.

/** The power-per-tick rungs a run is timed to. */
export const RUNGS = [1e3, 1e6, 1e9, 1e12];

/** Opt-in rules for a run, chosen at a reboot. [id, label, what it forbids]. */
export const RESTRICTIONS = [
	["direct", "Direct only", "No exchangers, inlets or outlets - every cell is cooled by what touches it."],
	["uranium", "Uranium only", "No fuel but uranium, however far the research goes."],
	["hardcore", "Hardcore", "No planner, no layout codes, no rebuilding saved layouts. The real board is the only board."],
];
export const restrictionLabel = (id) => RESTRICTIONS.find(([r]) => r === id)?.[1] ?? "Open";

export const freshRecords = () => ({
	maxPower: 0,
	streak: 0,
	longest: 0,
	hottest: 0,
	meltdowns: 0,
	// { open: { 1000: ticks, ... }, direct: { ... } }
	speed: {},
});

// Parts a restriction takes off the dock.
const TRANSFER = new Set(["heat_exchanger", "heat_inlet", "heat_outlet"]);

/** Does this run's restriction allow the part? A module is judged by what it holds. */
export function allowedBy(s, p, seen = 0) {
	if (!s.restriction || !p) return true;
	if (p.category === "module") {
		return seen < 8 && p.module.layout.every((id) => !id || allowedBy(s, s.stats.get(id), seen + 1));
	}
	if (s.restriction === "direct") return !TRANSFER.has(p.category);
	if (s.restriction === "uranium") return p.category !== "cell" || p.type === "uranium";
	return true;
}

/** Hardcore keeps the player on the real board. */
export const toolsAllowed = (s) => s.restriction !== "hardcore";

/** Called at the end of every real tick with what that tick did. */
export function recordTick(s) {
	const r = s.records;
	if (!r || s.planner || s.sealed) return;
	const power = s.rate?.power ?? 0;
	r.maxPower = Math.max(r.maxPower, power);
	r.streak = s.exploded.length ? 0 : r.streak + 1;
	r.longest = Math.max(r.longest, r.streak);
	if (!s.hasMeltedDown && s.maxHeat > 0) r.hottest = Math.max(r.hottest, s.heat / s.maxHeat);
	s.runTicks++;
	const run = s.restriction ?? "open";
	for (const rung of RUNGS) {
		if (power < rung || s.runHit.includes(rung)) continue;
		s.runHit.push(rung);
		r.speed[run] ??= {};
		r.speed[run][rung] = Math.min(r.speed[run][rung] ?? Infinity, s.runTicks);
	}
}

/** A meltdown is counted once, where it happens. */
export function recordMeltdown(s) {
	if (s.records && !s.planner && !s.sealed) s.records.meltdowns++;
}
