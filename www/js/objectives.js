// A linear list of goals. The original re-implemented the same nested board
// scan in six of these, and one of them hand-inlined its own adjacency test;
// here every check is one line over three shared helpers.
import { activeTiles, tileAt } from "./sim.js";
import { fmt } from "./fmt.js";
import { UPGRADE_BY_ID } from "./upgrades.js";

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

const some = (s, match) => count(s, match) > 0;

/** True when any live cell has an orthogonal neighbour matching `match`. */
function adjacentToCell(s, match) {
	for (const [t, p] of placed(s)) {
		if (p.category !== "cell" || !t.ticks) continue;
		for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
			const r = t.r + dr;
			const c = t.c + dc;
			if (r < 0 || c < 0 || r >= s.rows || c >= s.cols) continue;
			const n = tileAt(s, r, c);
			if (n.activated && n.id && match(s.stats.get(n.id))) return true;
		}
	}
	return false;
}

const liveCells = (id) => (p, t) => p.id === id && t.ticks;
// Total power the board makes per tick.
const statsPower = (s) => s.cells.reduce((n, t) => n + t.power, 0);

const anyUpgrade = (s, match) => Object.entries(s.levels).some(([id, lv]) => lv > 0 && match(id));

export const OBJECTIVES = [
	{ title: "Place your first component in the reactor", reward: 10,
	  check: (s) => some(s, () => true) },
	{ title: 'Sell all your power by clicking "Sell"', reward: 10,
	  check: (s) => s.soldPower },
	{ title: "Reduce your Current Heat to 0", reward: 10,
	  check: (s) => s.soldHeat },
	{ title: "Put a Heat Vent next to a power Cell", reward: 50,
	  check: (s) => adjacentToCell(s, (p) => p.category === "vent") },
	{ title: "Purchase an Upgrade", reward: 100,
	  check: (s) => anyUpgrade(s, () => true) },
	{ title: "Purchase a Dual power Cell", reward: 25,
	  check: (s) => some(s, (p) => p.cellCount === 2) },
	{ title: "Have at least 10 active power Cells in your reactor", reward: 200,
	  check: (s) => count(s, (p, t) => p.category === "cell" && t.ticks) >= 10 },
	{ title: "Purchase a Perpetual power Cell upgrade", reward: 1000,
	  check: (s) => anyUpgrade(s, (id) => id.startsWith("cell_perpetual_")) },
	{ title: "Increase your max power with a Capacitor", reward: 100,
	  check: (s) => some(s, (p) => p.category === "capacitor") },
	{ title: "Generate at least 200 power per tick", reward: 1000,
	  check: (s) => statsPower(s) >= 200 && !s.paused },
	{ title: "Purchase one Improved Chronometers upgrade", reward: 5000,
	  check: (s) => s.levels.chronometer > 0 },
	{ title: "Have 5 different kinds of components in your reactor", reward: 2000,
	  check: (s) => new Set([...placed(s)].map(([, p]) => p.category)).size >= 5 },
	{ title: "Have at least 10 Capacitors in your reactor", reward: 5000,
	  check: (s) => count(s, (p) => p.category === "capacitor") >= 10 },
	{ title: "Generate at least 500 power per tick", reward: 5000,
	  check: (s) => statsPower(s) >= 500 && !s.paused },
	{ title: "Upgrade Potent Uranium Cell to level 3 or higher", reward: 25000,
	  check: (s) => s.levels.cell_power_uranium > 2 },
	{ title: "Auto-sell at least 500 power per tick", reward: 40000,
	  check: (s) => Math.ceil(s.maxPower * s.autoSellMul) >= 500 },
	{ title: "Have at least 5 active Quad Plutonium Cells in your reactor", reward: 1e6,
	  check: (s) => count(s, liveCells("plutonium3")) >= 5 },
	{ title: "Expand your reactor 4 times in either direction", reward: 1e8,
	  check: (s) => s.levels.expand_reactor_rows >= 4 || s.levels.expand_reactor_cols >= 4 },
	{ title: "Have at least 5 active Quad Thorium Cells in your reactor", reward: 1e8,
	  check: (s) => count(s, liveCells("thorium3")) >= 5 },
	{ title: `Have at least $${fmt(1e10)} total`, reward: 1e10,
	  check: (s) => s.money >= 1e10 },
	{ title: "Have at least 5 active Quad Seaborgium Cells in your reactor", reward: 1e11,
	  check: (s) => count(s, liveCells("seaborgium3")) >= 5 },
	{ title: "Generate 10 Exotic Particles with Particle Accelerators", reward: 1e13,
	  check: (s) => s.exoticParticles >= 10 },
	{ title: "Generate 51 Exotic Particles with Particle Accelerators", epReward: 50,
	  check: (s) => s.exoticParticles >= 51 },
	{ title: "Reboot your reactor in the Experiments tab", epReward: 50,
	  check: (s) => s.currentExoticParticles > 0 },
	{ title: "Purchase an Experimental Upgrade", epReward: 50,
	  check: (s) => anyUpgrade(s, (id) => UPGRADE_BY_ID.get(id).ecost) },
	{ title: "Have at least 5 active Quad Dolorium Cells in your reactor", reward: 1e15,
	  check: (s) => count(s, liveCells("dolorium3")) >= 5 },
	{ title: `Generate ${fmt(1000)} Exotic Particles with Particle Accelerators`, epReward: 1000,
	  check: (s) => s.exoticParticles >= 1000 },
	{ title: "Have at least 5 active Quad Nefastium Cells in your reactor", reward: 1e17,
	  check: (s) => count(s, liveCells("nefastium3")) >= 5 },
	{ title: "Place an experimental part in your reactor.", epReward: 10000,
	  check: (s) => some(s, (p) => p.level === 6) },
	{ title: "All objectives completed!", check: () => false },
];

/** Pay out every objective the state now satisfies, in order. */
export function checkObjectives(s) {
	let paid = false;
	while (s.objective < OBJECTIVES.length && OBJECTIVES[s.objective].check(s)) {
		const o = OBJECTIVES[s.objective];
		if (o.reward) s.money += o.reward;
		if (o.epReward) s.currentExoticParticles += o.epReward;
		s.objective++;
		paid = true;
	}
	return paid;
}
