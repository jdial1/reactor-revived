// Modules: a 3x3 reactor saved as one part. A placed module runs its own 3x3
// every tick against the pool of the reactor around it: heat crosses the casing
// at full strength both ways, while power and particles are cut to the casing's
// efficiency. Outside parts never reach in - no pulses, no exchange.
import { compile, tick, rebuyPrice } from "./sim.js";
import { PART_BY_ID } from "./parts.js";
import { artFor } from "./art.js";

export const SIZE = 3;
// Long enough to find a steady state; a longer fuel is extrapolated from it.
const WINDOW = 2000;

export const modId = (m) => `mod:${m.id}`;
export const moduleOf = (s, id) => s.modules.find((m) => modId(m) === id);

/** Layers deep: a module of plain parts is 1, one holding that is 2. */
export function depthOf(s, layout, seen = new Set()) {
	let deepest = 0;
	for (const id of layout) {
		const m = id && moduleOf(s, id);
		if (!m) continue;
		// A module that holds itself has no answer; call it too deep to place.
		if (seen.has(m.id)) return Infinity;
		deepest = Math.max(deepest, depthOf(s, m.layout, new Set([...seen, m.id])));
	}
	return deepest + 1;
}

/** Can this part go into a casing whose layout would then be `layout`? */
export const fits = (s, layout) => depthOf(s, layout) <= s.maxNest;

// Seeded, so a casing with an accelerator measures the same every time.
function seeded(seed = 1) {
	return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

const innerTiles = (s, layout) => layout.map((id, i) => ({
	r: Math.floor(i / SIZE), c: i % SIZE, id, activated: Boolean(id),
	ticks: (id && s.stats.get(id)?.ticks) || 0, heat: 0, power: 0, heatContained: 0,
}));

/**
 * The casing as a state the sim can tick: the board's upgrades and its own 3x3.
 * It has no reactor of its own - its pool is whatever is put in `heat` before
 * each tick, and whatever is left there afterwards has crossed the casing.
 */
function casing(s, tiles, random) {
	const inner = {
		...s,
		rows: SIZE,
		cols: SIZE,
		sealed: true,
		random,
		heat: 0,
		power: 0,
		exoticParticles: 0,
		queue: [],
		exploded: [],
		// Nothing inside a casing rebuys itself: the module is the unit that does.
		perpetual: new Set(),
		tiles,
	};
	compile(inner);
	return inner;
}

/**
 * One tick of a placed module against the pool of the reactor around it. Cells
 * inside dump into that pool; outlets inside pull from it. Returns what crossed.
 */
export function stepModule(s, t, p) {
	// Rebuilt when the upgrades change: applyUpgrades replaces s.stats.
	if (!t.inner || t.inner.stats !== s.stats) {
		const tiles = t.inner?.tiles ?? innerTiles(s, p.module.layout);
		if (!t.inner && t.saved) {
			t.saved.forEach(([ticks, held], i) => Object.assign(tiles[i], { ticks, heatContained: held }));
			t.saved = null;
		}
		t.inner = casing(s, tiles, s.random);
	}
	const inner = t.inner;
	const pool = s.heat;
	inner.heat = pool;
	inner.power = 0;
	inner.exoticParticles = 0;
	inner.exploded = [];
	tick(inner);
	return {
		power: inner.power,
		ep: inner.exoticParticles,
		heat: inner.heat - pool,
		failed: inner.exploded.length > 0,
	};
}

/**
 * How full a placed module's parts are, as one fraction: the average fill of
 * everything inside that holds heat, nested casings included. The tile's heat
 * bar, so a casing warns before it goes like any other part.
 */
export function heatFill(s, t) {
	const tiles = t.inner?.tiles ?? (t.saved && innerTiles(s, s.stats.get(t.id).module.layout)
		.map((x, i) => ({ ...x, heatContained: t.saved[i][1] })));
	if (!tiles) return 0;
	let sum = 0;
	let n = 0;
	for (const x of tiles) {
		const p = x.id && s.stats.get(x.id);
		if (p?.category === "module") {
			sum += heatFill(s, x);
			n++;
		} else if (p?.containment) {
			sum += Math.min(1, x.heatContained / p.containment);
			n++;
		}
	}
	return n ? sum / n : 0;
}

/** A placed module's inner parts, for the save: [ticks, heat held] per slot. */
export const innerSave = (t) => t.inner?.tiles.map((x) => [x.ticks, x.heatContained]) ?? t.saved ?? undefined;

/** Run a layout against a pool held at `pool`, and measure what crosses. */
function measure(s, layout, pool, life) {
	const inner = casing(s, innerTiles(s, layout), seeded());
	const span = Math.min(life, WINDOW);
	const half = Math.floor(span / 2);
	let power = 0;
	let heat = 0;
	let vented = 0;
	let failTick = 0;
	let midway = null;
	for (let n = 1; n <= span; n++) {
		inner.heat = pool;
		inner.power = 0;
		tick(inner);
		power += inner.power;
		heat += inner.heat - pool;
		vented += inner.rate.vent;
		if (inner.exploded.length) {
			failTick = n;
			break;
		}
		if (n === half) midway = inner.tiles.map((x) => x.heatContained);
	}

	// Still filling when the window closed: draw the line on to where it fails.
	if (!failTick && span < life && midway) {
		for (const [i, x] of inner.tiles.entries()) {
			const p = x.id && s.stats.get(x.id);
			const slope = (x.heatContained - midway[i]) / (span - half);
			if (!p?.containment || slope <= 0) continue;
			const at = span + Math.ceil((p.containment - x.heatContained) / slope);
			if (at < life && (!failTick || at < failTick)) failTick = at;
		}
	}
	const ran = failTick && failTick <= span ? failTick : span;
	return {
		power: ran ? power / ran : 0,
		heat: ran ? heat / ran : 0,
		ep: ran ? inner.exoticParticles / ran : 0,
		vented: ran ? vented / ran : 0,
		failTick,
	};
}

/**
 * What a design does, measured twice: beside a cold reactor, and beside one at
 * its maximum heat - where outlets inside have the most to pull. Raw: power and
 * particles are cut by whoever places it, once per layer of casing.
 */
export function profile(s, layout) {
	let cost = 0;
	let rebuy = 0;
	let life = Infinity;
	const consumables = new Set();
	for (const p of layout.filter(Boolean).map((id) => s.stats.get(id))) {
		cost += p.cost;
		if (!p.ticks) continue;
		rebuy += rebuyPrice(p);
		if (p.category === "reflector") consumables.add("reflector");
		else {
			life = Math.min(life, p.ticks);
			if (p.category === "cell") consumables.add(p.type);
			else for (const k of p.consumables) consumables.add(k);
		}
	}
	const cold = measure(s, layout, 0, life);
	const hot = measure(s, layout, s.baseMaxHeat, life);
	const fails = [cold.failTick, hot.failTick].filter(Boolean);
	return {
		power: cold.power,
		heat: cold.heat,
		heatHot: hot.heat,
		ep: cold.ep,
		vented: Math.max(cold.vented, hot.vented),
		cost,
		rebuy,
		life: Number.isFinite(life) ? life : 0,
		failTick: fails.length ? Math.min(...fails) : 0,
		consumables: [...consumables],
	};
}

/** The strongest fuel inside, for the tile's glow; nested casings count. */
function fuelOf(s, layout) {
	let best = null;
	for (const id of layout) {
		const p = id && s.stats.get(id);
		if (!p) continue;
		const f = p.category === "cell" ? p : p.category === "module" ? { basePower: p.modPower, type: p.fuel } : null;
		if (f?.type && (!best || f.basePower > best.basePower)) best = f;
	}
	return best?.type ?? null;
}

// The games this one came down from. A design named for one wears gold.
const ANCESTORS = /^(ic2|industrialcraft( 2)?|reactor incremental|incremental|reactor knockoff|knockoff|reactor revival|revival)$/i;
export const isAncestor = (name) => ANCESTORS.test(String(name).trim());

/** A module as a part, the way the board, dock and sim expect one. */
function asPart(s, m, prof) {
	const icon = s.stats.get(m.icon) ?? PART_BY_ID.get(m.icon) ?? PART_BY_ID.get("uranium1");
	return {
		id: modId(m),
		category: "module",
		title: m.name,
		short: m.name,
		art: icon.art ?? artFor(icon),
		tint: isAncestor(m.name) ? "cash" : m.tint,
		fuel: fuelOf(s, m.layout),
		module: m,
		cost: prof.cost,
		rebuy: prof.rebuy,
		ticks: prof.life,
		modPower: prof.power,
		modHeat: prof.heat,
		modHeatHot: prof.heatHot,
		modEP: prof.ep,
		vented: prof.vented,
		failTick: prof.failTick,
		consumables: prof.consumables,
	};
}

// Profiles depend only on the layout and the upgrades, so they are kept until
// either changes. Keyed per state, so a test's state never sees another's.
const CACHE = new WeakMap();

/**
 * Add every saved module to s.stats. Called from applyUpgrades. Modules only
 * ever hold modules saved before them, so list order is dependency order.
 */
export function refreshModules(s) {
	if (!CACHE.has(s.modules)) CACHE.set(s.modules, new Map());
	const cache = CACHE.get(s.modules);
	const upgrades = JSON.stringify(s.levels) + s.protiumParticles + s.baseMaxHeat;
	for (const m of s.modules) {
		const key = `${upgrades}|${m.layout.map((id) => {
			const p = id && s.stats.get(id);
			return p?.category === "module" ? `${id}:${p.modPower}:${p.modHeat}:${p.modHeatHot}:${p.failTick}` : id;
		})}`;
		let prof = cache.get(m.id);
		if (prof?.key !== key) {
			prof = { key, ...profile(s, m.layout) };
			cache.set(m.id, prof);
		}
		s.stats.set(modId(m), asPart(s, m, prof));
	}
}

/** What a design reads out in the editor. Heat is not cut: it crosses whole. */
export function readout(s, layout) {
	const p = profile(s, layout);
	const e = s.casingEff;
	const upkeep = p.life ? p.rebuy / p.life : 0;
	return { ...p, power: p.power * e, ep: p.ep * e, money: p.power * e - upkeep };
}

/** Save a design. Designs never change once saved: editing saves a copy. */
export function saveModule(s, { name, icon, tint, layout }) {
	const m = { id: s.nextModuleId++, name: name.trim() || `Module ${s.nextModuleId - 1}`, icon, tint, layout: [...layout] };
	s.modules.push(m);
	refreshModules(s);
	return m;
}

/** Placed, queued, or inside another design: any of those keeps it. */
export function inUse(s, m) {
	const id = modId(m);
	return s.tiles.some((t) => t.id === id) || s.modules.some((o) => o.layout.includes(id));
}

export function deleteModule(s, m) {
	if (inUse(s, m)) return false;
	s.modules.splice(s.modules.indexOf(m), 1);
	s.stats.delete(modId(m));
	return true;
}
