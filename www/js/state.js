// Game state: its shape, its defaults, and how it round-trips to storage.
import { ROWS, COLS, compile, tileAt, countPlaced } from "./sim.js";
import { UPGRADES, applyUpgrades } from "./upgrades.js";
import { innerSave } from "./module.js";
import { freshRecords } from "./records.js";

const SAVE_KEY = "reactor-revived";
const SAVE_VERSION = 3; // 1 indexed tiles against a grid that could grow; 2 had no modules

const BASE = {
	money: 10,
	power: 0,
	heat: 0,
	exoticParticles: 0,
	currentExoticParticles: 0,
	totalExoticParticles: 0,
	protiumParticles: 0,
	objective: 0,
	hasMeltedDown: false,
	soldPower: false,
	soldHeat: false,
	paused: false,
	muted: false,
	tutorialDone: false,
	// Time Flux: ms banked while away, whether it is being spent, and when the
	// game last ran.
	flux: 0,
	fluxOn: false,
	lastSeen: 0,
	// This run was brought back from an exported save. Said on the goal line and
	// in the records, never hidden: a restore can undo a meltdown.
	restored: false,
	// Particles made but not yet whole, after the board's handling of heat.
	epCarry: 0,
};

// Every tile exists for the life of the game; the grid never changes size.
// play. Fixed indices mean growing the reactor never remaps a tile.
const newTile = (r, c) => ({
	r, c,
	id: null,
	activated: false,
	ticks: 0,
	heat: 0,
	power: 0,
	heatContained: 0,
});

export function newState(random = Math.random) {
	const s = {
		...BASE,
		random,
		rows: ROWS,
		cols: COLS,
		tiles: Array.from({ length: ROWS * COLS }, (_, i) => newTile(Math.floor(i / COLS), i % COLS)),
		queue: [],
		levels: {},
		// Lifetime count of each part ever bought, which drives what the dock
		// offers next.
		placed: {},
		statsDirty: false,
		exploded: [],
		// Saved designs, oldest first. A design only ever holds older ones.
		modules: [],
		nextModuleId: 1,
		// A save state per goal finished, and the example layouts already shown.
		snapshots: [],
		lessonsSeen: [],
		// Which side of each doctrine set: { doctrine1: "left" }.
		doctrines: {},
		// What the player has done and seen: records, field notes, and this
		// run's rule, age and the power rungs it has reached.
		records: freshRecords(),
		notes: [],
		restriction: null,
		runTicks: 0,
		runHit: [],
		trophies: [],
		// The board's mark and the last parts it lost to heat (records.js).
		mark: null,
		incidents: [],
	};
	for (const u of UPGRADES) s.levels[u.id] = 0;
	applyUpgrades(s);
	compile(s);
	return s;
}

/** Only what cannot be recomputed. Every multiplier is derived from `levels`. */
export function serialize(s) {
	return {
		v: SAVE_VERSION,
		money: s.money, power: s.power, heat: s.heat,
		exoticParticles: s.exoticParticles,
		currentExoticParticles: s.currentExoticParticles,
		totalExoticParticles: s.totalExoticParticles,
		protiumParticles: s.protiumParticles,
		objective: s.objective,
		restored: s.restored || undefined,
		epCarry: s.epCarry || undefined,
		hasMeltedDown: s.hasMeltedDown,
		soldPower: s.soldPower, soldHeat: s.soldHeat,
		paused: s.paused,
		muted: s.muted,
		tutorialDone: s.tutorialDone,
		flux: s.flux, fluxOn: s.fluxOn, lastSeen: s.lastSeen,
		levels: s.levels,
		placed: s.placed,
		modules: s.modules,
		nextModuleId: s.nextModuleId,
		snapshots: s.snapshots,
		lessonsSeen: s.lessonsSeen,
		doctrines: s.doctrines,
		records: s.records,
		notes: s.notes,
		restriction: s.restriction,
		runTicks: s.runTicks,
		runHit: s.runHit,
		trophies: s.trophies,
		mark: s.mark,
		incidents: s.incidents,
		tiles: [...s.tiles].map((t) =>
			t.id ? { i: t.r * COLS + t.c, id: t.id, ticks: t.ticks, activated: t.activated, heatContained: t.heatContained, age: t.age || undefined, inner: innerSave(t) } : null,
		).filter(Boolean),
		queue: s.queue.map((t) => t.r * COLS + t.c),
	};
}

/** Is this one of our saves, in a version this build can read? */
export const isSave = (saved) =>
	Boolean(saved) && typeof saved === "object" && (saved.v === SAVE_VERSION || saved.v === 2)
	&& Array.isArray(saved.tiles) && typeof saved.levels === "object";

export function deserialize(saved, random = Math.random) {
	const s = newState(random);
	if (!saved || (saved.v !== SAVE_VERSION && saved.v !== 2)) return s;

	for (const k of Object.keys(BASE)) if (k in saved) s[k] = saved[k];
	// A save from before the tutorial existed belongs to someone who has already
	// learned the game the hard way; do not start teaching them now.
	if (!("tutorialDone" in saved)) s.tutorialDone = true;
	for (const id of Object.keys(s.levels)) if (saved.levels?.[id]) s.levels[id] = saved.levels[id];
	Object.assign(s.placed, saved.placed);
	s.modules = saved.modules ?? [];
	s.nextModuleId = saved.nextModuleId ?? s.modules.length + 1;
	s.snapshots = saved.snapshots ?? [];
	s.lessonsSeen = saved.lessonsSeen ?? [];
	s.doctrines = saved.doctrines ?? {};
	// JSON writes Infinity as null; a record that never happened reads as absent.
	s.records = { ...freshRecords(), ...saved.records };
	s.notes = saved.notes ?? [];
	s.restriction = saved.restriction ?? null;
	s.runTicks = saved.runTicks ?? 0;
	s.runHit = saved.runHit ?? [];
	s.trophies = saved.trophies ?? [];
	s.mark = saved.mark ?? null;
	s.incidents = saved.incidents ?? [];
	applyUpgrades(s);

	for (const t of saved.tiles ?? []) {
		if (!s.stats.has(t.id)) continue;
		Object.assign(s.tiles[t.i], { id: t.id, ticks: t.ticks, activated: t.activated, heatContained: t.heatContained, age: t.age ?? 0, inner: null, saved: t.inner ?? null });
	}
	s.queue = (saved.queue ?? []).map((i) => s.tiles[i]);

	applyUpgrades(s);
	compile(s);
	return s;
}

export const exportSave = (s) => JSON.stringify(serialize(s));

export const save = (s, storage = localStorage) => storage.setItem(SAVE_KEY, JSON.stringify(serialize(s)));

export function load(storage = localStorage, random = Math.random) {
	try {
		return deserialize(JSON.parse(storage.getItem(SAVE_KEY)), random);
	} catch {
		return newState(random);
	}
}

/** Place a part on a tile, buying it now if affordable or queueing it if not. */
export function place(s, r, c, id) {
	const t = tileAt(s, r, c);
	const p = s.stats.get(id);
	t.id = id;
	t.age = 0;
	t.inner = null;
	t.ticks = p.ticks ?? 0;
	t.heatContained = 0;
	if (s.money >= p.cost) {
		s.money -= p.cost;
		t.activated = true;
		countPlaced(s, id);
		compile(s);
	} else {
		t.activated = false;
		s.queue.push(t);
	}
	return t;
}
