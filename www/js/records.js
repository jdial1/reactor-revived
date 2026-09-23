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
	["manual", "Manual feed", "Nothing rebuys itself. Every spent cell is replaced by hand."],
	["casingless", "Casingless", "No modules. Every part sits on the board itself."],
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
		if (s.restriction === "casingless") return false;
		return seen < 8 && p.module.layout.every((id) => !id || allowedBy(s, s.stats.get(id), seen + 1));
	}
	if (s.restriction === "direct") return !TRANSFER.has(p.category);
	if (s.restriction === "uranium") return p.category !== "cell" || p.type === "uranium";
	return true;
}

/** Manual feed switches off every automatic rebuy for the run. */
export const autoFeed = (s) => s.restriction !== "manual";

/** Hardcore keeps the player on the real board. */
export const toolsAllowed = (s) => s.restriction !== "hardcore";

/** Called at the end of every real tick with what that tick did. */
export function recordTick(s) {
	const r = s.records;
	if (!r || s.planner || s.sealed) return;
	const power = s.rate?.power ?? 0;
	r.maxPower = Math.max(r.maxPower, power);
	const parts = s.tiles.filter((t) => t.id);
	// An empty board is not a clean run; it is an empty board.
	r.streak = s.exploded.length ? 0 : r.streak + (parts.length ? 1 : 0);
	r.longest = Math.max(r.longest, r.streak);
	if (!s.hasMeltedDown && s.maxHeat > 0) r.hottest = Math.max(r.hottest, s.heat / s.maxHeat);
	s.runTicks++;

	// Held within a point of the limit and not melted: the red line.
	r.redFor = s.maxHeat > 0 && s.heat >= s.maxHeat * 0.99 && !s.hasMeltedDown ? (r.redFor ?? 0) + 1 : 0;
	if (r.redFor >= 60) award(s, "redline");
	if (r.longest >= 10000) award(s, "clean");
	// Nothing on the board but vents, a dozen or more, for a minute.
	const fan = parts.length >= 12 && parts.every((t) => s.stats.get(t.id)?.category === "vent");
	r.fanFor = fan ? (r.fanFor ?? 0) + 1 : 0;
	if (r.fanFor >= 60) award(s, "fan");
	const run = s.restriction ?? "open";
	for (const rung of RUNGS) {
		if (power < rung || s.runHit.includes(rung)) continue;
		s.runHit.push(rung);
		r.speed[run] ??= {};
		r.speed[run][rung] = Math.min(r.speed[run][rung] ?? Infinity, s.runTicks);
	}
	if (["open", ...RESTRICTIONS.map(([id]) => id)].every((run) => r.speed[run]?.[1e3])) award(s, "rules");
}

/** A meltdown is counted once, where it happens. */
export function recordMeltdown(s) {
	if (!s.records || s.planner || s.sealed) return;
	s.records.meltdowns++;
	if (s.runTicks <= 30) award(s, "fuse");
}

// The trophy case, after Kingdom of Loathing's: odd feats, named flatly, shown
// as ??? until earned. [id, name, how it was earned]. Nothing here changes a
// number in the game.
export const TROPHIES = [
	["fan", "A Very Expensive Fan", "Ran a board of a dozen vents and nothing else for a minute."],
	["cold", "Cold Fusion", "Made power for a minute with the reactor and every part at no heat at all."],
	["mass", "Critical Mass", "Surrounded a live cell with live cells on all eight sides."],
	["chain", "Chain Reaction", "Lost parts on five ticks in a row."],
	["redline", "Red Line", "Held the reactor within a point of its limit for a minute, and did not melt."],
	["fuse", "Short Fuse", "Melted down within thirty ticks of a reboot."],
	["clean", "Clean Hands", "Ran ten thousand ticks without a single part failing."],
	["mark", "Mark I", "Built the old checkerboard from its name."],
	["ancestor", "Ancestor Worship", "Named a design for one of the games before this one."],
	["notes", "Paperwork", "Earned every field note."],
	["done", "Nothing Left On The List", "Finished the operator's log."],
	["rules", "Every Rule", "Reached a thousand power a tick in an open run and under every rule."],
];

/** Put a trophy in the case. The real game only; true if it is new. */
export function award(s, id) {
	if (!s.trophies || s.planner || s.sealed || s.trophies.includes(id)) return false;
	s.trophies.push(id);
	return true;
}
