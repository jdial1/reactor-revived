// The part catalog, as data. Every field is flat or scales by mul^(level-1),
// and derive() below is the only place that expansion happens.
import { allowedBy } from "./records.js";

// Cells come in single/dual/quad packs. Index by level-1.
const CELL_POWER = [1, 4, 12];
const CELL_COUNT = [1, 2, 4];
const CELL_PREFIX = ["", "Dual ", "Quad "];
const TIER_PREFIX = ["Basic ", "Advanced ", "Super ", "Wonderous ", "Ultimate "];

// Short names for the dock, where "Wonderous Heat Exchanger" does not fit.
const SHORT = {
	reflector: "Reflect",
	capacitor: "Capac",
	vent: "Vent",
	heat_exchanger: "Exch",
	heat_inlet: "Inlet",
	heat_outlet: "Outlet",
	coolant_cell: "Coolant",
	reactor_plating: "Plating",
	particle_accelerator: "Accel",
	component_vent: "C.Vent",
	hull_vent: "H.Vent",
	condensator: "Cond",
};
const PACK_SUFFIX = ["", "×2", "×4"];
const capitalise = (w) => w[0].toUpperCase() + w.slice(1);

// [field, multiplierField] - the only list that knows which stats scale with tier.
const SCALED = [
	["ticks", "ticksMul"],
	["containment", "containmentMul"],
	["vent", "ventMul"],
	["transfer", "transferMul"],
	["reactorPower", "reactorPowerMul"],
	["reactorHeat", "reactorHeatMul"],
	["epHeat", "epHeatMul"],
];

// Fuel cells: 7 elements x 3 pack sizes. `upgradeCost` drives the generated
// cell_power / cell_tick / cell_perpetual upgrades.
const CELLS = [
	// Uranium's tiers were hand-priced upstream, so its costs are a list.
	{ type: "uranium",    title: "Uranium Cell",    cost: [10, 25, 60],           ticks: 15,    basePower: 1,           baseHeat: 1,           upgradeCosts: { tick: 100, power: 500, perpetual: 1000 } },
	{ type: "plutonium",  title: "Plutonium Cell",  cost: 6e3,     costMul: 2.2,  ticks: 60,    basePower: 150,         baseHeat: 150,         upgradeCosts: { tick: 30e3, power: 30e3, perpetual: 60e3 } },
	{ type: "thorium",    title: "Thorium Cell",    cost: 4.7e6,   costMul: 2.2,  ticks: 900,   basePower: 7400,        baseHeat: 7400,        upgradeCosts: { tick: 25e6, power: 25e6, perpetual: 50e6 } },
	{ type: "seaborgium", title: "Seaborgium Cell", cost: 4e9,     costMul: 2.2,  ticks: 3600,  basePower: 1.6e6,       baseHeat: 1.6e6,       upgradeCosts: { tick: 20e9, power: 20e9, perpetual: 40e9 } },
	{ type: "dolorium",   title: "Dolorium Cell",   cost: 3.9e12,  costMul: 2.2,  ticks: 22000, basePower: 2.3e8,       baseHeat: 2.3e8,       upgradeCosts: { tick: 20e12, power: 20e12, perpetual: 40e12 } },
	{ type: "nefastium",  title: "Nefastium Cell",  cost: 3.6e15,  costMul: 2.2,  ticks: 86000, basePower: 5.2e10,      baseHeat: 5.2e10,      upgradeCosts: { tick: 17.5e15, power: 17.5e15, perpetual: 35e15 } },
	{ type: "protium",    title: "Protium Cell",    cost: 3e15,    costMul: 2.2,  ticks: 3600,  basePower: 1.25e12,     baseHeat: 1.25e12,     experimental: true, requires: "protium_cells" },
];

// Tiers 1-5 scale by SCALED; tier 6 is experimental and gated by research.
const COMPONENTS = [
	{ category: "reflector", title: "Neutron Reflector", levels: 5, cost: 500, costMul: 50,
	  ticks: 100, ticksMul: 2, powerIncrease: 5, powerIncreaseAdd: 1 },
	{ category: "reflector", title: "Thermal Neutron Reflector", level: 6, cost: 100e12,
	  experimental: true, requires: "heat_reflection", ticks: 3200, powerIncrease: 5, heatIncrease: 50 },

	{ category: "capacitor", title: "Capacitor", levels: 5, cost: 1000, costMul: 160,
	  reactorPower: 100, reactorPowerMul: 140, containment: 10, containmentMul: 5 },
	{ category: "capacitor", title: "Extreme Capacitor", level: 6, cost: 105e12,
	  experimental: true, requires: "experimental_capacitance", reactorPower: 2.1e15, containment: 5.4e12 },

	{ category: "vent", title: "Heat Vent", levels: 5, cost: 50, costMul: 250,
	  containment: 80, containmentMul: 75, vent: 4, ventMul: 75 },
	{ category: "vent", title: "Extreme Vent", level: 6, cost: 50e12,
	  experimental: true, requires: "vortex_cooling", containment: 100e9, vent: 5e9 },

	{ category: "heat_exchanger", title: "Heat Exchanger", levels: 5, cost: 160, costMul: 200,
	  containment: 320, containmentMul: 75, transfer: 16, transferMul: 75 },
	{ category: "heat_exchanger", title: "Extreme Heat Exchanger", level: 6, cost: 50e12,
	  experimental: true, requires: "underground_heat_extraction", containment: 1e12, transfer: 20e9 },

	{ category: "heat_inlet", title: "Heat Inlet", levels: 5, cost: 160, costMul: 200,
	  transfer: 16, transferMul: 75 },
	{ category: "heat_inlet", title: "Extreme Heat Inlet", level: 6, cost: 50e12,
	  experimental: true, requires: "vortex_extraction", transfer: 20e9, range: 2 },

	{ category: "heat_outlet", title: "Heat Outlet", levels: 5, cost: 160, costMul: 200,
	  transfer: 16, transferMul: 75 },
	{ category: "heat_outlet", title: "Extreme Heat Outlet", level: 6, cost: 50e12,
	  experimental: true, requires: "explosive_ejection", transfer: 20e9, range: 2 },

	{ category: "coolant_cell", title: "Coolant Cell", levels: 5, cost: 500, costMul: 200,
	  containment: 2000, containmentMul: 180 },
	{ category: "coolant_cell", title: "Thermionic Coolant Cell", level: 6, cost: 160e12,
	  experimental: true, requires: "thermionic_conversion", containment: 380e12 },

	{ category: "reactor_plating", title: "Reactor Plating", levels: 5, cost: 1000, costMul: 160,
	  reactorHeat: 100, reactorHeatMul: 140 },
	{ category: "reactor_plating", title: "Charged Reactor Plating", level: 6, cost: 100e12,
	  experimental: true, requires: "micro_capacitance", reactorHeat: 8e12 },

	// After IC2's component heat vent, reactor heat vent and condensators. A
	// component vent holds nothing: it bleeds the parts it touches. A hull vent
	// draws from the reactor's pool, so it can sit anywhere. A condensator holds
	// heat and never sheds it; emptying it costs its price again.
	{ category: "component_vent", title: "Component Vent", levels: 5, cost: 250, costMul: 250,
	  vent: 4, ventMul: 75,
	  desc: "Holds no heat itself. Every tick it takes heat out of each part it touches, up to its rate from each." },
	{ category: "hull_vent", title: "Hull Vent", levels: 5, cost: 300, costMul: 250,
	  containment: 80, containmentMul: 75, vent: 4, ventMul: 75, transfer: 4, transferMul: 75,
	  desc: "Draws heat from the reactor's pool into itself, and vents it. It does not care what it touches." },
	{ category: "condensator", title: "Condensator", levels: 5, cost: 1500, costMul: 200,
	  containment: 20000, containmentMul: 180,
	  desc: "Holds a great deal of heat and never sheds any. Refilling it empties it, for up to its price; full and not refilled, it fails." },

	{ category: "particle_accelerator", title: "Particle Accelerator", levels: 5, cost: 1e12, costMul: 10000,
	  containment: 100, containmentMul: 1e6, epHeat: 5e8, epHeatMul: 20000 },
	{ category: "particle_accelerator", title: "Black Hole Particle Accelerator", level: 6, cost: 100e12,
	  experimental: true, requires: "singularity_harnessing", containment: 1e32, epHeat: 1.6e30, transfer: 1e30 },
];

/** Expand one definition at one tier into a concrete part. */
function derive(def, level) {
	const cost = Array.isArray(def.cost) ? def.cost[level - 1] : def.cost * (def.costMul ?? 1) ** (level - 1);
	const p = { ...def, level, cost };

	if (def.category === "cell") {
		const i = level - 1;
		p.id = `${def.type}${level}`;
		p.title = CELL_PREFIX[i] + def.title;
		// Output is basePower/baseHeat through the pulse formula in sim.js.
		p.cellCount = CELL_COUNT[i];
		p.cellMultiplier = CELL_POWER[i];
		p.pulses = CELL_COUNT[i];
		p.short = capitalise(def.type) + PACK_SUFFIX[i];
	} else {
		p.id = `${def.category}${level}`;
		p.title = level <= 5 ? TIER_PREFIX[level - 1] + def.title : def.title;
		p.short = `${SHORT[def.category]} ${level}`;
		for (const [field, mul] of SCALED) {
			if (def[field] && def[mul]) p[field] = def[field] * def[mul] ** (level - 1);
		}
		if (def.powerIncrease && def.powerIncreaseAdd) {
			p.powerIncrease = def.powerIncrease + def.powerIncreaseAdd * (level - 1);
		}
	}
	return p;
}

/** The full catalog, flat: every part at every tier, keyed by id. */
export const PARTS = [
	...CELLS.flatMap((c) => [1, 2, 3].map((lv) => derive({ ...c, category: "cell" }, lv))),
	...COMPONENTS.flatMap((c) => c.levels ? Array.from({ length: c.levels }, (_, i) => derive(c, i + 1)) : [derive(c, c.level)]),
];

export const PART_BY_ID = new Map(PARTS.map((p) => [p.id, p]));

/** How many of the previous part you must place before the next one appears. */
export const UNLOCK_AFTER = 10;

/** Modules open once this many goals are done: after the first upgrade is bought. */
export const MODULES_AFTER = 5;
export const modulesOpen = (s) => s.objective >= MODULES_AFTER;

/**
 * The goal each family waits for, so a new game opens on one cell and nothing
 * else: vents when the log asks for a vent, capacitors and reflectors when it
 * asks for a capacitor, transfer parts when the first layout that needs them
 * comes up, accelerators when particles become the job.
 */
export const CATEGORY_AFTER = {
	vent: 3, coolant_cell: 3, reactor_plating: 3,
	reflector: 8, capacitor: 8,
	heat_exchanger: 10, heat_inlet: 10, heat_outlet: 10,
	particle_accelerator: 22,
	component_vent: 10, hull_vent: 10, condensator: 14,
	module: MODULES_AFTER,
};
export const categoryOpen = (s, category) => s.objective >= (CATEGORY_AFTER[category] ?? 0);

// Progressive reveal: a part is hidden until ten of the one before it have been
// placed. Cells form one chain; each component category forms its own.
const chains = new Map([["cell", []]]);
for (const p of PARTS) {
	if (p.experimental) continue;
	const key = p.category === "cell" ? "cell" : p.category;
	if (!chains.has(key)) chains.set(key, []);
	chains.get(key).push(p);
}
for (const chain of chains.values()) {
	chain.forEach((p, i) => {
		p.after = i ? chain[i - 1].id : null;
	});
}

/** Is this part offered yet - research done, and enough of its predecessor placed? */
/**
 * How close a part is to unlocking, as `{ have, need }` - or null when placing
 * more of the tier below is not what it is waiting for.
 */
export const unlockProgress = (s, p) =>
	(p.after && (!p.requires || s.levels[p.requires] > 0)
		? { have: Math.min(s.placed[p.after] ?? 0, UNLOCK_AFTER), need: UNLOCK_AFTER }
		: null);

export const isPartVisible = (s, p) =>
	categoryOpen(s, p.category)
	&& allowedBy(s, p)
	&& (!p.requires || s.levels[p.requires] > 0)
	&& (!p.after || (s.placed[p.after] ?? 0) >= UNLOCK_AFTER);

// The cells that carry prices for the generated cell_* upgrades.
export const CELLS_WITH_UPGRADES = CELLS.filter((c) => c.upgradeCosts);
