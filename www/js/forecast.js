// What a layout will do, measured rather than guessed - the question the IC2
// planners answered: what does it make, does it hold, and when does it fail.
// The board is copied and run forward; the real one is never touched.
import { compile, tick, rebuyPrice } from "./sim.js";
import { innerSave } from "./module.js";

const HORIZON = 600;

function seeded(seed = 7) {
	return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/**
 * A copy of the board that can be run without consequence. Fuel is assumed
 * kept up - everything rebuys itself - and power is never capped or sold, so
 * what it makes is what is counted. `swap` = [from, to] replaces one part with
 * another first, for asking what a change would do.
 */
function copyOf(s, swap) {
	const tiles = s.tiles.map((t) => {
		const c = { ...t, inner: null, saved: innerSave(t) ?? null, containments: [], neighbourCells: [], reflectors: [] };
		if (swap && t.id === swap[0]) {
			const p = s.stats.get(swap[1]);
			Object.assign(c, { id: swap[1], activated: true, ticks: p.ticks ?? 0, heatContained: 0, inner: null, saved: null });
		}
		return c;
	});
	const f = {
		...s,
		tiles,
		queue: [],
		exploded: [],
		random: seeded(),
		money: Infinity,
		autoSellMul: 0,
		baseMaxPower: Infinity,
		perpetual: new Set([...s.stats.values()].map((p) => (p.category === "cell" ? p.type : p.category))),
		hasMeltedDown: false,
		planner: true,
	};
	compile(f);
	return f;
}

/** Fuel spent per tick, keeping every consumable on the board topped up. */
function upkeepOf(s, f) {
	let upkeep = 0;
	for (const t of f.tiles) {
		const p = t.activated && t.id && s.stats.get(t.id);
		if (!p?.ticks) continue;
		// A reflector wears once per cell beside it per tick.
		const wear = p.category === "reflector"
			? f.tiles.filter((c) => c.reflectors?.includes(t)).length
			: 1;
		upkeep += (rebuyPrice(p) * wear) / p.ticks;
	}
	return upkeep;
}

/**
 * Run a copy of the board forward and report: power per tick, what the
 * reactor's heat does per tick, profit after fuel, and whether it holds - or
 * the tick it fails and what fails first. A heat still climbing when the run
 * ends is followed on to where it would melt down.
 */
export function forecast(s, swap) {
	const f = copyOf(s, swap);
	const parts = f.tiles.filter((t) => t.id).length;
	if (!parts) return { parts: 0 };

	const start = f.heat;
	let power = 0;
	let vented = 0;
	let failTick = 0;
	let failed = null;
	let midway = f.heat;
	let held = null;
	for (let n = 1; n <= HORIZON; n++) {
		tick(f);
		power += f.rate.power;
		vented += f.rate.vent;
		if (f.hasMeltedDown) {
			failTick = n;
			failed = "meltdown";
			break;
		}
		if (f.exploded.length) {
			failTick = n;
			const i = f.exploded[0];
			failed = s.stats.get(s.tiles[i].id)?.title ?? "a part";
			break;
		}
		if (n === HORIZON / 2) {
			midway = f.heat;
			held = f.tiles.map((t) => t.heatContained);
		}
	}
	const ran = failTick || HORIZON;

	// Still rising when the run ends: draw each line on - the reactor's to twice
	// its maximum, where it melts, and each part's to its own limit - and the
	// first to get there is the failure.
	let estimated = false;
	if (!failTick) {
		const half = HORIZON / 2;
		const slope = (f.heat - midway) / half;
		if (slope > 1e-9) {
			failTick = HORIZON + Math.ceil((f.maxHeat * 2 - f.heat) / slope);
			failed = "meltdown";
		}
		f.tiles.forEach((t, i) => {
			const p = t.id && s.stats.get(t.id);
			const rise = (t.heatContained - held[i]) / half;
			if (!p?.containment || rise <= 1e-9) return;
			const at = HORIZON + Math.ceil((p.containment - t.heatContained) / rise);
			if (!failTick || at < failTick) {
				failTick = at;
				failed = p.title;
			}
		});
		estimated = Boolean(failTick);
	}
	const perTick = power / ran;
	const upkeep = upkeepOf(s, f);
	return {
		parts,
		power: perTick,
		heat: (f.heat - start) / ran,
		vented: vented / ran,
		profit: perTick * (s.sellMul ?? 1) - upkeep,
		upkeep,
		failTick,
		failed,
		estimated,
	};
}

/** Tiles holding one part, for a replace-all. */
export const tilesOf = (s, id) => s.tiles.filter((t) => t.id === id);
