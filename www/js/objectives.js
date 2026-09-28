// The operator's log at Harrow Station: a checklist, each item with the note
// that asked for it. The notes drift as the demand grows: formal manual sections
// for the first ten jobs, work orders for the next ten, then bare demands that
// have stopped explaining themselves (Soul Interview 3.2, 3.4). Every check is
// one line over three shared helpers.
import { ROWS, COLS, activeTiles, tileAt } from "./sim.js";
import { fmt } from "./fmt.js";
import { UPGRADE_BY_ID } from "./upgrades.js";
import { fileEntry } from "./records.js";

/** Placed parts, optionally filtered. `live` cells are ones with ticks left. */
function* placed(s) {
	for (const t of activeTiles(s)) {
		if (!t.activated || !t.id) continue;
		yield [t, s.stats.get(t.id)];
	}
}

const count = (s, match) => {
	let n = 0;
	for (const [t, p] of placed(s)) if (match(p, t)) n++;
	return n;
};

export const some = (s, match) => {
	for (const [t, p] of placed(s)) if (match(p, t)) return true;
	return false;
};

/** True when any live cell has an orthogonal neighbour matching `match`. */
export function adjacentToCell(s, match) {
	for (const [t, p] of placed(s)) {
		if (p.category !== "cell" || !t.ticks) continue;
		for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
			const r = t.r + dr;
			const c = t.c + dc;
			if (r < 0 || c < 0 || r >= ROWS || c >= COLS) continue;
			const n = tileAt(s, r, c);
			if (n.activated && n.id && match(s.stats.get(n.id))) return true;
		}
	}
	return false;
}

const liveCells = (id) => (p, t) => p.id === id && t.ticks;
// Total power the board makes per tick.
const statsPower = (s) => s.cells.reduce((n, t) => n + t.power, 0);

// A goal you can be part of the way through. `progress` is what the goal line
// draws a bar from; the check falls out of the same count.
const atLeast = (n, match) => ({
	check: (s) => count(s, match) >= n,
	progress: (s) => [Math.min(count(s, match), n), n],
});

/** Goal 2 and the tutorial's heat card: how many hand vents it takes. */
export const HAND_VENTS = 10;

const anyUpgrade = (s, match) => Object.entries(s.levels).some(([id, lv]) => lv > 0 && match(id));

export const OBJECTIVES = [
	{ title: "Place your first part in the reactor",
	  note: "Section 1.1. Start-up. Confirm the operator key is present and turns freely. Harrow Station has been idle for eleven years.", reward: 10,
	  check: (s) => some(s, () => true) },
	{ title: "Sell power: tap the power bar",
	  note: "Section 1.2. Sale of output. The town has been on candles since the station closed. Output is sold at the power bar.", reward: 10,
	  check: (s) => s.soldPower },
	// Ten taps that take heat off, not "down to 0": heat builds while a new
	// player reads, so a zero got harder the longer they waited.
	{ title: `Vent by hand: tap the heat bar ${HAND_VENTS} times`,
	  note: "Section 1.3. Heat gauge. The gauge is known to stick. Vent by hand and confirm the reading falls.", reward: 10,
	  check: (s) => (s.handVents ?? 0) >= HAND_VENTS,
	  progress: (s) => [Math.min(s.handVents ?? 0, HAND_VENTS), HAND_VENTS] },
	{ title: "Cool a cell with a Heat Vent",
	  note: "Section 2.4. Excess heat should be vented before the reactor is left unattended. Operators are advised not to remain at the valve overnight.", reward: 50,
	  check: (s) => adjacentToCell(s, (p) => p.category === "vent") },
	{ title: "Buy an upgrade",
	  note: "Section 2.6. Maintenance budget. The town's first payment has cleared. It is to be spent on the plant.", reward: 100,
	  check: (s) => anyUpgrade(s, () => true) },
	{ title: "Place a Dual cell",
	  note: "Section 3.1. Deliveries. Supply sent Dual cells by mistake. Install one and record the result.", reward: 25,
	  check: (s) => some(s, (p) => p.cellCount === 2) },
	{ title: "Run 10 cells at once",
	  note: "Section 3.3. Load increase. The mill has requested a second shift. Ten cells are to run at once.", reward: 200,
	  ...atLeast(10, (p, t) => p.category === "cell" && t.ticks) },
	{ title: "Buy a Perpetual cell upgrade",
	  note: "Section 4.1. Night refuelling. Replacing spent cells by hand at 3 a.m. has caused injuries. Automate replacement.", reward: 1000,
	  check: (s) => anyUpgrade(s, (id) => id.startsWith("cell_perpetual_")) },
	{ title: "Place a Capacitor",
	  note: "Section 4.2. Storage. Output produced between sales is lost. Install storage.", reward: 100,
	  check: (s) => some(s, (p) => p.category === "capacitor") },
	{ title: "Design and place a module (Modules)",
	  note: "Section 4.5. Spares. Spare cores are to be kept in casings, ready to install. Design one and install it.", reward: 500,
	  check: (s) => some(s, (p) => p.category === "module") },
	{ title: "Make 200 power per tick",
	  note: "Output required: 200 per tick. Clinic load. Maintain overnight.", reward: 1000,
	  check: (s) => statsPower(s) >= 200 && !s.paused },
	{ title: "Buy Improved Chronometers",
	  note: "Station clock running slow. Each lost second is output not delivered. Correct it.", reward: 5000,
	  check: (s) => s.levels.chronometer > 0 },
	{ title: "Run 5 kinds of part at once",
	  note: "Inspection due. Present a plant, not a pile of fuel.", reward: 2000,
	  check: (s) => new Set([...placed(s)].map(([, p]) => p.category)).size >= 5 },
	{ title: "Have 10 Capacitors",
	  note: "Winter reserve required. Cold nights. Store output.", reward: 5000,
	  ...atLeast(10, (p) => p.category === "capacitor") },
	{ title: "Make 500 power per tick",
	  note: "Output required: 500 per tick. Rail yard load, replacing diesel.", reward: 5000,
	  check: (s) => statsPower(s) >= 500 && !s.paused,
	  // Met as first asked, then asked again higher: the demand grows after it is
	  // made (Soul Interview 3.5), and says so.
	  revision: { title: "Make 750 power per tick",
	    note: "Order revised. 500 cancelled. Output required: 750 per tick.",
	    check: (s) => statsPower(s) >= 750 && !s.paused } },
	{ title: "Upgrade Potent Uranium Cell to level 3",
	  note: "Uranium stock weak. Raise its rating.", reward: 25000,
	  check: (s) => s.levels.cell_power_uranium > 2 },
	{ title: "Auto-sell 500 power per tick",
	  note: "Co-op load, sold off the line. 500. Continuous.", reward: 40000,
	  check: (s) => Math.ceil(s.maxPower * s.autoSellMul) >= 500 },
	{ title: "Run 5 Quad Plutonium Cells",
	  note: "Second valley connected. Plutonium required.", reward: 1e6,
	  ...atLeast(5, liveCells("plutonium3")) },
	// Was "expand your reactor 4 times", which a fixed grid cannot ask for.
	{ title: "Fill every tile in the reactor",
	  note: "Every empty slot is a house on candles. Fill them.", reward: 1e8,
	  check: (s) => [...activeTiles(s)].every((t) => t.id) },
	{ title: "Run 5 Quad Thorium Cells",
	  note: "Thorium delivery: Tuesday. Install on arrival.", reward: 1e8,
	  ...atLeast(5, liveCells("thorium3")) },
	{ title: `Have $${fmt(1e10)}`,
	  note: "Reserve required: $10B. Hold it.", reward: 1e10,
	  check: (s) => s.money >= 1e10,
	  revision: { title: `Have $${fmt(1.5e10)}`,
	    note: "Order revised. $10B cancelled. Reserve required: $15B.",
	    check: (s) => s.money >= 1.5e10 } },
	{ title: "Run 5 Quad Seaborgium Cells",
	  note: "Three towns on this grid. If the station trips, all three go dark.", reward: 1e11,
	  ...atLeast(5, liveCells("seaborgium3")) },
	{ title: "Make 10 Exotic Particles",
	  note: "Accelerator installed. Particles required: 10. Use: not stated.", reward: 1e13,
	  check: (s) => s.exoticParticles >= 10 },
	{ title: "Make 51 Exotic Particles",
	  note: "Particles required: 51. Break room reassigned.", epReward: 50,
	  check: (s) => s.exoticParticles >= 51 },
	{ title: "Reboot the reactor (Experiments)",
	  note: "Shut down. Rebuild the core. Restart.", epReward: 50,
	  check: (s) => s.currentExoticParticles > 0 },
	{ title: "Buy research (Experiments)",
	  note: "Particles are for research. Spend them.", epReward: 50,
	  check: (s) => anyUpgrade(s, (id) => UPGRADE_BY_ID.get(id).ecost) },
	{ title: "Run 5 Quad Dolorium Cells",
	  note: "Dolorium required. Candles: no longer remembered.", reward: 1e15,
	  ...atLeast(5, liveCells("dolorium3")) },
	{ title: `Make ${fmt(1000)} Exotic Particles`,
	  note: "Particles required: 1,000. Reason: not required.", epReward: 1000,
	  check: (s) => s.exoticParticles >= 1000,
	  revision: { title: `Make ${fmt(1500)} Exotic Particles`,
	    note: "Order revised. 1,000 cancelled. Particles required: 1,500.",
	    check: (s) => s.exoticParticles >= 1500 } },
	{ title: "Run 5 Quad Nefastium Cells",
	  note: "Nefastium. Signed for twice.", reward: 1e17,
	  ...atLeast(5, liveCells("nefastium3")) },
	{ title: "Place an experimental part (Exotic)",
	  note: "Crate received. No manual. Install.", epReward: 10000,
	  check: (s) => some(s, (p) => p.level === 6) },
	{ title: "Nothing left on the list",
	  note: "Demand met. All listed loads supplied. Maintain output.", check: () => false },
];

/** A job as it stands: once revised, its raised order in place of the first. */
export function goalAt(s, i = s.objective) {
	const o = OBJECTIVES[i];
	return o?.revision && s.revised?.includes(i) ? { ...o, ...o.revision } : o;
}

/**
 * Pay out every objective the state now satisfies, in order. A job with a
 * revision is not paid the first time it is met: it is cancelled and asked
 * again higher, once, with a line in the log book.
 */
export function checkObjectives(s) {
	let paid = false;
	while (s.objective < OBJECTIVES.length && goalAt(s).check(s)) {
		const first = OBJECTIVES[s.objective];
		if (first.revision && !s.revised.includes(s.objective)) {
			s.revised.push(s.objective);
			fileEntry(s, first.revision.note);
			break;
		}
		const o = goalAt(s);
		if (o.reward) s.money += o.reward;
		if (o.epReward) s.currentExoticParticles += o.epReward;
		s.objective++;
		paid = true;
	}
	return paid;
}

// ---- the standing order ------------------------------------------------------
// The log ends; the demand does not (Soul Interview 4.6, 6.3). Past the last job
// one order stands at a time, always for more than the reactor made when it was
// issued and never less than the order before it. It pays nothing: the output
// sells as it always has. A reboot does not lower it.

/** The next round figure (1, 2 or 5 of a power of ten) at or above x. */
function roundUp(x) {
	const k = 10 ** Math.floor(Math.log10(x));
	return [1, 2, 5, 10].map((m) => m * k).find((v) => v >= x * (1 - 1e-9));
}

const nextOrder = (s) => roundUp(Math.max(s.order?.target ?? 0, statsPower(s), 1000) * 1.5);

/** The order's line, in the goal line's words and the log book's. */
export const orderTitle = (target) => `Increase output to ${fmt(target)} per tick`;
export const orderEntry = (target) => `Increase output: ${fmt(target)} per tick. Reason: not required.`;

/**
 * Issue the standing order once the log is finished, and raise it when the
 * reactor, running, meets it. True when an order was met.
 */
export function checkOrder(s) {
	if (s.objective < OBJECTIVES.length - 1) return false;
	if (!s.order) {
		s.order = { target: nextOrder(s), met: 0 };
		fileEntry(s, orderEntry(s.order.target));
		return false;
	}
	if (s.paused || statsPower(s) < s.order.target) return false;
	s.order = { target: nextOrder(s), met: s.order.met + 1 };
	fileEntry(s, orderEntry(s.order.target));
	return true;
}

/** How far the reactor is towards the standing order, for the goal line's bar. */
export const orderProgress = (s) => (s.order ? Math.min(statsPower(s) / s.order.target, 1) : 0);
