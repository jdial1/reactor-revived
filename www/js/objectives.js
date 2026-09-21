// The operator's log at Harrow Station: a checklist, each item with the note
// that asked for it. Every check is one line over three shared helpers.
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
	{ title: "Place your first part in the reactor",
	  note: "Day one. Harrow Station has sat cold for eleven years. The key still turns.", reward: 10,
	  check: (s) => some(s, () => true) },
	{ title: "Sell power: tap the power bar",
	  note: "The town has been on candles since the plant closed. Sell them something.", reward: 10,
	  check: (s) => s.soldPower },
	{ title: "Vent by hand: tap the heat bar down to 0",
	  note: "The old heat gauge sticks. Bring it down yourself and watch it move.", reward: 10,
	  check: (s) => s.soldHeat },
	{ title: "Put a Heat Vent next to a cell",
	  note: "Nobody can stand at the valve all night. Put a vent on it.", reward: 50,
	  check: (s) => adjacentToCell(s, (p) => p.category === "vent") },
	{ title: "Buy an upgrade",
	  note: "The town's first payment cleared. Spend it on the plant.", reward: 100,
	  check: (s) => anyUpgrade(s, () => true) },
	{ title: "Place a Dual cell",
	  note: "Supply sent Dual cells by mistake. Try one.", reward: 25,
	  check: (s) => some(s, (p) => p.cellCount === 2) },
	{ title: "Run 10 cells at once",
	  note: "The mill wants a second shift. That means ten cells burning.", reward: 200,
	  ...atLeast(10, (p, t) => p.category === "cell" && t.ticks) },
	{ title: "Buy a Perpetual cell upgrade",
	  note: "Swapping spent cells by hand at 3 a.m. is how people get hurt. Automate it.", reward: 1000,
	  check: (s) => anyUpgrade(s, (id) => id.startsWith("cell_perpetual_")) },
	{ title: "Place a Capacitor",
	  note: "Power is going to waste between sales. Store it.", reward: 100,
	  check: (s) => some(s, (p) => p.category === "capacitor") },
	{ title: "Make 200 power per tick",
	  note: "The clinic asked if the lights can stay on overnight. Two hundred a tick would do it.", reward: 1000,
	  check: (s) => statsPower(s) >= 200 && !s.paused },
	{ title: "Buy Improved Chronometers",
	  note: "The plant clock runs slow. Every second it loses is power nobody gets.", reward: 5000,
	  check: (s) => s.levels.chronometer > 0 },
	{ title: "Run 5 kinds of part at once",
	  note: "An inspector is coming. Show them a plant, not a pile of fuel.", reward: 2000,
	  check: (s) => new Set([...placed(s)].map(([, p]) => p.category)).size >= 5 },
	{ title: "Have 10 Capacitors",
	  note: "Winter is coming. The town needs a reserve for the cold nights.", reward: 5000,
	  ...atLeast(10, (p) => p.category === "capacitor") },
	{ title: "Make 500 power per tick",
	  note: "The rail yard will give up diesel if the station can promise five hundred.", reward: 5000,
	  check: (s) => statsPower(s) >= 500 && !s.paused },
	{ title: "Upgrade Potent Uranium Cell to level 3",
	  note: "Uranium is cheap and the old stock is weak. Make it count.", reward: 25000,
	  check: (s) => s.levels.cell_power_uranium > 2 },
	{ title: "Auto-sell 500 power per tick",
	  note: "The co-op will buy straight off the line, as long as the line never stops.", reward: 40000,
	  check: (s) => Math.ceil(s.maxPower * s.autoSellMul) >= 500 },
	{ title: "Run 5 Quad Plutonium Cells",
	  note: "The next valley wants in. That is plutonium money.", reward: 1e6,
	  ...atLeast(5, liveCells("plutonium3")) },
	// Was "expand your reactor 4 times", which a fixed grid cannot ask for.
	{ title: "Fill every tile in the reactor",
	  note: "Every empty slot is a house still on candles.", reward: 1e8,
	  check: (s) => [...activeTiles(s)].every((t) => t.id) },
	{ title: "Run 5 Quad Thorium Cells",
	  note: "Thorium arrives on Tuesday. The town has never been this bright.", reward: 1e8,
	  ...atLeast(5, liveCells("thorium3")) },
	{ title: `Have $${fmt(1e10)}`,
	  note: "The bank called. For once it was not about a loan.", reward: 1e10,
	  check: (s) => s.money >= 1e10 },
	{ title: "Run 5 Quad Seaborgium Cells",
	  note: "Three towns are on this grid now. If the station trips, all of them go dark.", reward: 1e11,
	  ...atLeast(5, liveCells("seaborgium3")) },
	{ title: "Make 10 Exotic Particles",
	  note: "The university sent an accelerator and a letter. They want what comes out of it.", reward: 1e13,
	  check: (s) => s.exoticParticles >= 10 },
	{ title: "Make 51 Exotic Particles",
	  note: "The physicists have moved into the break room. They say fifty is where it gets interesting.", epReward: 50,
	  check: (s) => s.exoticParticles >= 51 },
	{ title: "Reboot the reactor (Experiments)",
	  note: "They want the core rebuilt with what they have learned. Shut it down cleanly and start again.", epReward: 50,
	  check: (s) => s.currentExoticParticles > 0 },
	{ title: "Buy research (Experiments)",
	  note: "Research is paid for in particles, not dollars. Spend some.", epReward: 50,
	  check: (s) => anyUpgrade(s, (id) => UPGRADE_BY_ID.get(id).ecost) },
	{ title: "Run 5 Quad Dolorium Cells",
	  note: "Nobody in town remembers the candles now.", reward: 1e15,
	  ...atLeast(5, liveCells("dolorium3")) },
	{ title: `Make ${fmt(1000)} Exotic Particles`,
	  note: "The university wants a thousand. They have stopped saying what for.", epReward: 1000,
	  check: (s) => s.exoticParticles >= 1000 },
	{ title: "Run 5 Quad Nefastium Cells",
	  note: "Nefastium. The supplier made you sign twice.", reward: 1e17,
	  ...atLeast(5, liveCells("nefastium3")) },
	{ title: "Place an experimental part (Exotic)",
	  note: "The last crate from the lab came without a manual.", epReward: 10000,
	  check: (s) => some(s, (p) => p.level === 6) },
	{ title: "Nothing left on the list",
	  note: "The valley has power. Keep it that way.", check: () => false },
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
