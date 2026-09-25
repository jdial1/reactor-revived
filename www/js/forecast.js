// What a layout will do, measured rather than guessed - the question the IC2
// planners answered: what does it make, does it hold, and when does it fail.
// The board is copied and run forward; the real one is never touched.
import { compile, tick, rebuyPrice, replaces, stored } from "./sim.js";
import { innerSave } from "./module.js";

const HORIZON = 600;
/** A failure further off than this is a board that holds, warming slowly. */
const FAR = 100000;

function seeded(seed = 7) {
	return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/**
 * A copy of the board that can be run without consequence. It runs the floor's
 * rules exactly - the power cap, auto-sell, and only the rebuys the player has
 * bought - and changes one thing: money is endless, so nothing waits to be
 * afforded. A lab that changed more would forecast one board and run another.
 * `swap` = [from, to] replaces one part with another first, for asking what a
 * change would do.
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
		// Its own copies of what the tick changes, so the real game is untouched.
		levels: { ...s.levels },
		records: undefined,
		incidents: undefined,
		mark: undefined,
		hasMeltedDown: false,
		planner: true,
	};
	compile(f);
	return f;
}

/** Fuel spent per tick on the rebuys the player owns: what auto-buy will pay. */
function upkeepOf(s, f) {
	let upkeep = 0;
	for (const t of f.tiles) {
		const p = t.activated && t.id && s.stats.get(t.id);
		if (!p?.ticks || !replaces(s, p)) continue;
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
	const storedStart = stored(f);
	const ep = f.exoticParticles;
	let power = 0;
	let vented = 0;
	let converted = 0;
	let failTick = 0;
	let failed = null;
	let midway = f.heat;
	let held = null;
	let refills = 0;
	let paid = false;
	for (let n = 1; n <= HORIZON; n++) {
		tick(f);
		power += f.rate.power;
		refills += f.rate.paidCost ?? 0;
		if (n > HORIZON / 2 && f.rate.paid) paid = true;
		vented += f.rate.vent;
		converted += f.rate.converted ?? 0;
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
	// Heat still climbing anywhere over the second half, judged the way the real
	// board's mark is: any real climb, past rounding noise.
	const rose = (then, now, cap) => now > then + Math.max(cap, 1) * 1e-9 + 1e-6;
	const rising = !failTick && (rose(midway, f.heat, f.maxHeat)
		|| f.tiles.some((t, i) => t.id && !settles(s.stats.get(t.id), held[i] ?? 0, t.heatContained, HORIZON / 2)
			&& rose(held[i] ?? 0, t.heatContained, s.stats.get(t.id)?.containment ?? 0)));

	// Still rising when the run ends: draw each line on - the reactor's to twice
	// its maximum, where it melts, and each part's to its own limit - and the
	// first to get there is the failure.
	let estimated = false;
	// What refilling condensators will cost per tick, from how fast they fill.
	let refillRate = 0;
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
			// A condensator the player pays to refill empties instead of failing.
			if (p.category === "condensator" && replaces(s, p)) {
				refillRate += (p.cost * rise) / p.containment;
				return;
			}
			// An accelerator spends a share of what it holds, so it levels off
			// rather than climbing in a line: where it settles is what it holds
			// now plus its climb over that share. Below its limit, it holds.
			if (p.consume && t.heatContained + rise / p.consume < p.containment) return;
			const at = HORIZON + Math.ceil((p.containment - t.heatContained) / rise);
			if (!failTick || at < failTick) {
				failTick = at;
				failed = p.title;
			}
		});
		estimated = Boolean(failTick);
		if (failTick > FAR) {
			failTick = 0;
			failed = null;
			estimated = false;
		}
	}
	const perTick = power / ran;
	// Condensator refills are upkeep too: money spent to keep the board running.
	const upkeep = upkeepOf(s, f) + refills / ran + refillRate;
	// What the board cost to build, and how long its profit takes to pay that
	// back - the efficiency players ranked designs by, in ticks.
	const cost = s.tiles.reduce((a, t) => a + (t.activated && t.id ? s.stats.get(t.id).cost : 0), 0);
	const profit = perTick * (s.sellMul ?? 1) - upkeep;
	return {
		parts,
		power: perTick,
		heat: (f.heat - start) / ran,
		vented: vented / ran,
		converted: converted / ran,
		// Heat kept on the board per tick: in the parts or the pool.
		held: (stored(f) - storedStart) / ran,
		ep: (f.exoticParticles - ep) / ran,
		profit,
		cost,
		payback: profit > 0 ? cost / profit : Infinity,
		upkeep,
		failTick,
		failed,
		estimated,
		// The mark it would earn on the real board: 1 or 2, or 0 if it fails.
		mark: failTick ? 0 : rising || paid || f.heat > f.maxHeat ? 2 : 1,
	};
}

/**
 * A part that spends a share of what it holds (an accelerator) levels off
 * instead of climbing: still rising slowly is settling, not building, when
 * where it settles - what it holds plus its climb over that share - is below
 * its limit.
 */
export function settles(p, then, now, span) {
	if (!p?.consume) return false;
	const rise = Math.max(0, now - then) / span;
	return now + rise / p.consume < p.containment;
}

/** Tiles holding one part, for a replace-all. */
export const tilesOf = (s, id) => s.tiles.filter((t) => t.id === id);
