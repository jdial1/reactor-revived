// A linear list of goals. The original re-implemented the same nested board
// scan in six of these, and one of them hand-inlined its own adjacency test;
// here every check is one line over three shared helpers.
import { ROWS, COLS, activeTiles, tileAt } from "./sim.js";
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

const anyUpgrade = (s, match) => Object.entries(s.levels).some(([id, lv]) => lv > 0 && match(id));

export const OBJECTIVES = [
	{ title: "Place your first part in the reactor", reward: 10,
	  check: (s) => some(s, () => true) },
	{ title: "Sell your power by tapping the power bar", reward: 10,
	  check: (s) => s.soldPower },
	{ title: "Tap the heat bar until your heat is back to 0", reward: 10,
	  check: (s) => s.soldHeat },
	{ title: "Put a Heat Vent next to a cell", reward: 50,
	  check: (s) => adjacentToCell(s, (p) => p.category === "vent") },
	{ title: "Buy an upgrade from the Upgrades tab", reward: 100,
	  check: (s) => anyUpgrade(s, () => true) },
	{ title: "Place a Dual cell in the reactor", reward: 25,
	  check: (s) => some(s, (p) => p.cellCount === 2) },
	{ title: "Have 10 active cells in the reactor", reward: 200,
	  ...atLeast(10, (p, t) => p.category === "cell" && t.ticks) },
	{ title: "Buy a Perpetual Cell upgrade", reward: 1000,
	  check: (s) => anyUpgrade(s, (id) => id.startsWith("cell_perpetual_")) },
	{ title: "Place a Capacitor to raise your max power", reward: 100,
	  check: (s) => some(s, (p) => p.category === "capacitor") },
	{ title: "Generate at least 200 power per tick", reward: 1000,
	  check: (s) => statsPower(s) >= 200 && !s.paused },
	{ title: "Buy an Improved Chronometers upgrade", reward: 5000,
	  check: (s) => s.levels.chronometer > 0 },
	{ title: "Have 5 different kinds of part in the reactor", reward: 2000,
	  check: (s) => new Set([...placed(s)].map(([, p]) => p.category)).size >= 5 },
	{ title: "Have 10 Capacitors in the reactor", reward: 5000,
	  ...atLeast(10, (p) => p.category === "capacitor") },
	{ title: "Generate at least 500 power per tick", reward: 5000,
	  check: (s) => statsPower(s) >= 500 && !s.paused },
	{ title: "Upgrade Potent Uranium Cell to level 3 or higher", reward: 25000,
	  check: (s) => s.levels.cell_power_uranium > 2 },
	{ title: "Auto-sell at least 500 power per tick", reward: 40000,
	  check: (s) => Math.ceil(s.maxPower * s.autoSellMul) >= 500 },
	{ title: "Have at least 5 active Quad Plutonium Cells in the reactor", reward: 1e6,
	  ...atLeast(5, liveCells("plutonium3")) },
	// Was "expand your reactor 4 times", which a fixed grid cannot ask for.
	{ title: "Fill every tile in the reactor", reward: 1e8,
	  check: (s) => [...activeTiles(s)].every((t) => t.id) },
	{ title: "Have at least 5 active Quad Thorium Cells in the reactor", reward: 1e8,
	  ...atLeast(5, liveCells("thorium3")) },
	{ title: `Have at least $${fmt(1e10)} total`, reward: 1e10,
	  check: (s) => s.money >= 1e10 },
	{ title: "Have at least 5 active Quad Seaborgium Cells in the reactor", reward: 1e11,
	  ...atLeast(5, liveCells("seaborgium3")) },
	{ title: "Generate 10 Exotic Particles with Particle Accelerators", reward: 1e13,
	  check: (s) => s.exoticParticles >= 10 },
	{ title: "Generate 51 Exotic Particles with Particle Accelerators", epReward: 50,
	  check: (s) => s.exoticParticles >= 51 },
	{ title: "Reboot your reactor in the Experiments tab", epReward: 50,
	  check: (s) => s.currentExoticParticles > 0 },
	{ title: "Buy a research upgrade in the Experiments tab", epReward: 50,
	  check: (s) => anyUpgrade(s, (id) => UPGRADE_BY_ID.get(id).ecost) },
	{ title: "Have at least 5 active Quad Dolorium Cells in the reactor", reward: 1e15,
	  ...atLeast(5, liveCells("dolorium3")) },
	{ title: `Generate ${fmt(1000)} Exotic Particles with Particle Accelerators`, epReward: 1000,
	  check: (s) => s.exoticParticles >= 1000 },
	{ title: "Have at least 5 active Quad Nefastium Cells in the reactor", reward: 1e17,
	  ...atLeast(5, liveCells("nefastium3")) },
	{ title: "Place an experimental part from the Exotic tab", epReward: 10000,
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
