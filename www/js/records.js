// What the player has done, kept like the statistics page Reactor Incremental
// had: the best the reactor has ever run, the longest it has run clean, and how
// fast each run reached each rung of power. Only the real reactor counts - the
// planner, forecasts and module casings never touch these.

import { fmt } from "./fmt.js";

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
	// The most power from a board that had earned Mark I: output that holds.
	markOne: 0,
	// And the most of it per fuel cell: IC2's other measure of a design.
	efficiency: 0,
	streak: 0,
	longest: 0,
	hottest: 0,
	meltdowns: 0,
	// { open: { 1000: ticks, ... }, direct: { ... } }
	speed: {},
	// Ticks from a reboot to the run's first Mark I board, per kind of run.
	markRun: {},
});

// Parts a restriction takes off the dock.
// A hull vent draws from the pool, so it is indirect cooling too.
const TRANSFER = new Set(["heat_exchanger", "heat_inlet", "heat_outlet", "hull_vent"]);

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
	const was = s.mark?.grade ?? 0;
	const grade = markTick(s, parts.length > 0, power);
	if (s.mark.grade && s.mark.grade !== was) {
		logEvent(s, s.mark.grade === 3 ? "Down to Mark III." : `Earned ${MARKS[s.mark.grade]}.`);
	}
	if (grade === 1 && !s.runMarked) {
		// The run's first held board, timed like the power rungs.
		s.runMarked = true;
		const kind = s.restriction ?? "open";
		r.markRun ??= {};
		r.markRun[kind] = Math.min(r.markRun[kind] ?? Infinity, s.runTicks);
	}
	if (grade === 1) {
		r.markOne = Math.max(r.markOne, power);
		const fuel = fuelOf(s);
		if (fuel) r.efficiency = Math.max(r.efficiency ?? 0, power / fuel);
	}
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

// ---- the board's mark --------------------------------------------------------
//
// IC2's players rated a design by how long it held: Mark I for one that never
// builds heat, higher marks for ones that need tending. The rating here is
// earned on the real board and never forecast - the planner predicts, the floor
// only reports. It is measured over a window since the player last changed the
// board, and a board that makes no power is not holding anything.

/** Ticks of steady running a mark is judged over. */
export const MARK_WINDOW = 300;
export const MARKS = [null, "Mark I", "Mark II", "Mark III"];
export const MARK_MEANS = [
	["Mark I", "Heat has stopped rising anywhere on the board. It can run as long as it has fuel."],
	["Mark II", "Nothing has failed yet, but heat is still building somewhere, or a condensator had to be paid to empty. Something will give, or keeps costing."],
	["Mark III", "Parts have been lost since the board last changed."],
];

/** Parts, upgrades and doctrines: what makes this machine this machine. */
function boardSig(s) {
	let sig = "";
	for (const t of s.tiles) sig += `${t.activated && t.id ? t.id : ""},`;
	return sig + JSON.stringify(s.levels) + JSON.stringify(s.doctrines);
}

const heatOf = (s) => s.tiles.map((t) => (t.id ? t.heatContained : 0));

function openWindow(s, m) {
	m.from = s.runTicks;
	m.paid = false;
	m.heat = s.heat;
	m.parts = heatOf(s);
}

/**
 * One tick of the mark. A change the player made starts it again; a part lost
 * to heat is not a redesign, it is Mark III until the player changes the board.
 * Returns the grade when a window closes.
 */
function markTick(s, hasParts, power) {
	const m = (s.mark ??= { sig: "", since: 0, grade: 0, lost: false, trend: 0, total: 0 });
	const sig = boardSig(s);
	const total = s.heat + s.tiles.reduce((n, t) => n + (t.id ? t.heatContained : 0), 0);
	// How much of the recent past the heat has been climbing, for the hum.
	m.trend = m.trend * 0.9 + (total > m.total + 1e-9 ? 0.1 : 0);
	m.total = total;
	if (!hasParts) {
		Object.assign(m, { sig, since: s.runTicks, grade: 0, lost: false });
		openWindow(s, m);
		return 0;
	}
	// Seen at the end of the first tick the new board ran, so it began one back.
	if (sig !== m.sig) {
		// Lost to heat this tick (the counter has already moved on) is an incident.
		const blew = s.incidents?.at(-1)?.tick === s.runTicks - 1;
		if (blew && m.sig) Object.assign(m, { sig, lost: true, grade: 3 });
		else Object.assign(m, { sig, since: s.runTicks - 1, grade: 0, lost: false });
		openWindow(s, m);
		return 0;
	}
	if (power <= 0) {
		openWindow(s, m);
		return 0;
	}
	// Storage that had to be paid to empty is storage, not a held machine.
	if (s.rate?.paid) m.paid = true;
	if (s.runTicks - m.from < MARK_WINDOW) return 0;
	if (!m.lost) {
		// Any real climb, however slow: a huge tank filling a point a tick is building.
		const rose = (then, now, cap) => now > then + Math.max(cap, 1) * 1e-9 + 1e-6;
		const building = rose(m.heat, s.heat, s.maxHeat)
			|| s.tiles.some((t, i) => t.id && rose(m.parts[i] ?? 0, t.heatContained, s.stats.get(t.id)?.containment ?? 0));
		m.grade = building || m.paid ? 2 : 1;
	}
	openWindow(s, m);
	return m.grade;
}

/** Fuel cells burning on the board, a quad counting four; casings count what they hold. */
export function fuelOf(s) {
	const cells = (p, seen = 0) => (!p || seen > 8 ? 0
		: p.category === "cell" ? p.cellCount ?? 1
		: p.category === "module" ? p.module.layout.reduce((n, id) => n + (id ? cells(s.stats.get(id), seen + 1) : 0), 0)
		: 0);
	return s.tiles.reduce((n, t) => n + (t.activated && t.id && t.ticks ? cells(s.stats.get(t.id)) : 0), 0);
}

/** Power per fuel cell, to two places. */
export const perCell = (n) => (n >= 1000 ? fmt(n) : String(Math.round(n * 100) / 100));

/** "Mark I", or null while the board has not earned one. */
export const markOf = (s) => (s.planner ? null : MARKS[s.mark?.grade ?? 0]);

/** The line a shared code carries: what the board had done when it was copied. */
export function markLine(s) {
	const mark = markOf(s);
	// What the layout makes, compiled - a paused game has no last tick to read.
	const power = (s.cells ?? []).reduce((n, t) => n + t.power, 0);
	const fuel = fuelOf(s);
	return [mark, power > 0 ? `${fmt(power)} power/tick` : null, power > 0 && fuel ? `${perCell(power / fuel)} per cell` : null]
		.filter(Boolean).join(" · ");
}

// ---- the shift log -------------------------------------------------------------

/**
 * The board's last few events, newest last, in plain words: marks earned,
 * parts lost, meltdowns, reboots. Read back from the mark sheet - what happened
 * while nobody was looking. The real board only.
 */
export function logEvent(s, text) {
	if (s.planner || s.sealed) return;
	s.log ??= [];
	s.log.push({ tick: s.runTicks, text });
	if (s.log.length > 12) s.log.shift();
}

// ---- incidents and the receipt ----------------------------------------------

/** A part lost to heat on the real board: kept, the last few, as a receipt. */
export function recordIncident(s, t, p) {
	if (!s.incidents || s.planner || s.sealed) return;
	s.incidents.push({ tick: s.runTicks, id: p.id, r: t.r, c: t.c, held: t.heatContained, cap: p.containment });
	logEvent(s, `Lost a ${s.stats.get(p.id)?.title ?? p.id} at ${where(t)}.`);
	s.incidentCount = (s.incidentCount ?? 0) + 1;
	if (s.incidents.length > 5) s.incidents.shift();
}

/** Where on the board, as a player counts it. */
export const ticks = (n) => `${fmt(n)} tick${n === 1 ? "" : "s"}`;

export const where = (i) => `row ${i.r + 1}, column ${i.c + 1}`;

/** The last part lost to heat, in a line; null when nothing has been. */
export function lastIncident(s) {
	const i = s.incidents?.at(-1);
	if (!i) return null;
	const title = s.stats.get(i.id)?.title ?? i.id;
	return `${title} at ${where(i)}, ${ticks(s.runTicks - i.tick)} ago, holding ${fmt(i.held)} of ${fmt(i.cap)} heat.`;
}

/** Why the reactor melted, in plain lines, read off the ledger as it fell. */
export function receipt(s) {
	const lines = [];
	const since = s.mark?.since ?? 0;
	// Read mid-tick, before the counter moves: the tick that melted it counts.
	lines.push(`Ran ${ticks(s.runTicks + 1 - since)} since the board last changed.`);
	const first = s.incidents?.find((i) => i.tick >= since);
	const title = (i) => s.stats.get(i.id)?.title ?? i.id;
	if (first) {
		lines.push(`First part lost: ${title(first)} at ${where(first)}, ${ticks(s.runTicks - first.tick)} before the end, holding ${fmt(first.held)} of ${fmt(first.cap)} heat.`);
		const lost = s.incidents.filter((i) => i.tick >= since).length;
		if (lost > 1) lines.push(`${lost} parts lost in all${lost === 5 ? " (at least)" : ""}.`);
	}
	const last = s.incidents?.at(-1);
	if (s.meltdown && last && s.stats.get(last.id)?.category === "particle_accelerator") {
		lines.push(`${title(last)} overflowed. An accelerator that overflows takes the reactor with it.`);
	} else {
		const rate = s.rate ?? {};
		lines.push(`Last tick: cells made ${fmt(rate.heat ?? 0)} heat; vents shed ${fmt(rate.vent ?? 0)}.`);
		lines.push(`Reactor heat passed ${fmt(s.maxHeat * 2)}, twice what it can hold.`);
	}
	return lines;
}

/** A meltdown is counted once, where it happens. */
export function recordMeltdown(s) {
	if (!s.records || s.planner || s.sealed) return;
	s.receipt = receipt(s);
	logEvent(s, "Melted down.");
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
