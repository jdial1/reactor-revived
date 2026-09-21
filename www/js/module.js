// Modules: a sealed 3x3 reactor saved as one part. The casing is simulated once,
// with the player's upgrades, and the tile on the board passes that profile on
// at the casing's efficiency. Nothing crosses the casing but power, heat and
// particles, so what the editor reads out is exactly what the tile does.
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

// Seeded, so a casing with an accelerator profiles the same every time.
function seeded(seed = 1) {
	return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/**
 * Run a layout as a sealed 3x3 and measure it. Raw: efficiency is applied by
 * whoever places it, so it multiplies once per layer of casing.
 */
export function profile(s, layout) {
	const inner = {
		...s,
		rows: SIZE,
		cols: SIZE,
		sealed: true,
		random: seeded(),
		heat: 0,
		power: 0,
		exoticParticles: 0,
		heatAddNextTick: 0,
		queue: [],
		exploded: [],
		// Nothing inside a casing rebuys itself: the module is the unit that does.
		perpetual: new Set(),
		tiles: layout.map((id, i) => ({
			r: Math.floor(i / SIZE), c: i % SIZE, id, activated: Boolean(id),
			ticks: (id && s.stats.get(id)?.ticks) || 0, heat: 0, power: 0, heatContained: 0,
		})),
	};
	const parts = layout.filter(Boolean).map((id) => s.stats.get(id));

	let cost = 0;
	let rebuy = 0;
	let life = Infinity;
	const consumables = new Set();
	for (const p of parts) {
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

	compile(inner);
	const run = Math.min(life, WINDOW);
	const half = Math.floor(run / 2);
	let power = 0;
	let heat = 0;
	let vented = 0;
	let failTick = 0;
	let midway = null;
	for (let n = 1; n <= run; n++) {
		tick(inner);
		power += inner.power;
		// compile() rounds each cell's share up, which can leave a cell owing
		// heat; a casing must not become a cooler for the board around it.
		heat += Math.max(0, inner.heat);
		vented += inner.rate.vent;
		inner.power = 0;
		inner.heat = 0;
		if (inner.exploded.length) {
			failTick = n;
			break;
		}
		if (n === half) midway = inner.tiles.map((t) => t.heatContained);
	}

	// Still filling when the window closed: draw the line on to where it fails.
	if (!failTick && run < life && midway) {
		for (const [i, t] of inner.tiles.entries()) {
			const p = t.id && s.stats.get(t.id);
			const slope = (t.heatContained - midway[i]) / (run - half);
			if (!p?.containment || slope <= 0) continue;
			const at = run + Math.ceil((p.containment - t.heatContained) / slope);
			if (at < life && (!failTick || at < failTick)) failTick = at;
		}
	}

	const ran = failTick && failTick <= run ? failTick : run;
	return {
		power: ran ? power / ran : 0,
		heat: ran ? heat / ran : 0,
		ep: ran ? inner.exoticParticles / ran : 0,
		vented: ran ? vented / ran : 0,
		cost,
		rebuy,
		life: Number.isFinite(life) ? life : 0,
		failTick,
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

/** A module as a part, the way the board, dock and sim expect one. */
function asPart(s, m, prof) {
	const icon = s.stats.get(m.icon) ?? PART_BY_ID.get(m.icon) ?? PART_BY_ID.get("uranium1");
	return {
		id: modId(m),
		category: "module",
		title: m.name,
		short: m.name,
		requires: "modular_casings",
		art: icon.art ?? artFor(icon),
		tint: m.tint,
		fuel: fuelOf(s, m.layout),
		module: m,
		cost: prof.cost,
		rebuy: prof.rebuy,
		ticks: prof.life,
		modPower: prof.power,
		modHeat: prof.heat,
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
	const upgrades = JSON.stringify(s.levels) + s.protiumParticles;
	for (const m of s.modules) {
		const key = `${upgrades}|${m.layout.map((id) => {
			const p = id && s.stats.get(id);
			return p?.category === "module" ? `${id}:${p.modPower}:${p.modHeat}:${p.failTick}` : id;
		})}`;
		let prof = cache.get(m.id);
		if (prof?.key !== key) {
			prof = { key, ...profile(s, m.layout) };
			cache.set(m.id, prof);
		}
		s.stats.set(modId(m), asPart(s, m, prof));
	}
}

/** What a design reads out in the editor: the profile at this casing's efficiency. */
export function readout(s, layout) {
	const p = profile(s, layout);
	const e = s.casingEff;
	const upkeep = p.life ? p.rebuy / p.life : 0;
	return { ...p, power: p.power * e, heat: p.heat * e, ep: p.ep * e, money: p.power * e - upkeep };
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
