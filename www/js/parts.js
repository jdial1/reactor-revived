// The part catalog, as data. Every field is either flat or "scales by mul^(level-1)";
// derive() below is the single place that expansion happens, replacing the eight
// copy-pasted `if (base_X && X_multiplier)` blocks in the original.

// Cells come in single/dual/quad packs. Index by level-1.
const CELL_POWER = [1, 4, 12];
const CELL_COUNT = [1, 2, 4];
const CELL_PREFIX = ["", "Dual ", "Quad "];
const TIER_PREFIX = ["Basic ", "Advanced ", "Super ", "Wonderous ", "Ultimate "];

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
	// Uranium is the one cell whose tiers the original hand-priced rather than
	// scaling; an array of per-tier costs keeps those exact numbers.
	{ type: "uranium",    title: "Uranium Cell",    cost: [10, 25, 60],           ticks: 15,    power: 1,           heat: 1,           upgradeCosts: { tick: 100, power: 500, perpetual: 1000 } },
	{ type: "plutonium",  title: "Plutonium Cell",  cost: 6e3,     costMul: 2.2,  ticks: 60,    power: 150,         heat: 150,         upgradeCosts: { tick: 30e3, power: 30e3, perpetual: 60e3 } },
	{ type: "thorium",    title: "Thorium Cell",    cost: 4.7e6,   costMul: 2.2,  ticks: 900,   power: 7400,        heat: 7400,        upgradeCosts: { tick: 25e6, power: 25e6, perpetual: 50e6 } },
	{ type: "seaborgium", title: "Seaborgium Cell", cost: 4e9,     costMul: 2.2,  ticks: 3600,  power: 1.6e6,       heat: 1.6e6,       upgradeCosts: { tick: 20e9, power: 20e9, perpetual: 40e9 } },
	{ type: "dolorium",   title: "Dolorium Cell",   cost: 3.9e12,  costMul: 2.2,  ticks: 22000, power: 2.3e8,       heat: 2.3e8,       upgradeCosts: { tick: 20e12, power: 20e12, perpetual: 40e12 } },
	{ type: "nefastium",  title: "Nefastium Cell",  cost: 3.6e15,  costMul: 2.2,  ticks: 86000, power: 5.2e10,      heat: 5.2e10,      upgradeCosts: { tick: 17.5e15, power: 17.5e15, perpetual: 35e15 } },
	{ type: "protium",    title: "Protium Cell",    cost: 3e15,    costMul: 2.2,  ticks: 3600,  power: 1.25e12,     heat: 1.25e12,     experimental: true, requires: "protium_cells" },
];

// Everything else: tiers 1-5 scale by the SCALED table; tier 6 is the
// hand-written experimental sibling, gated behind a research upgrade.
const COMPONENTS = [
	{ category: "reflector", title: "Neutron Reflector", levels: 5, cost: 500, costMul: 50,
	  ticks: 100, ticksMul: 2, powerIncrease: 5, powerIncreaseAdd: 1 },
	{ category: "reflector", title: "Thermal Neutron Reflector", level: 6, cost: 100e12,
	  experimental: true, requires: "heat_reflection", ticks: 3200, powerIncrease: 5, heatIncrease: 50 },

	{ category: "capacitor", title: "Capacitor", levels: 5, cost: 1000, costMul: 160,
	  reactorPower: 100, reactorPowerMul: 140, containment: 10, containmentMul: 5 },
	{ category: "capacitor", title: "Extreme Capacitor", level: 6, cost: 105e12,
	  experimental: true, requires: "experimental_capacitance", reactorPower: 2.1e15, containment: 5.4e12 },

	{ category: "vent", title: "Heat Vent", levels: 5, cost: 50, costMul: 250, cooling: true,
	  containment: 80, containmentMul: 75, vent: 4, ventMul: 75 },
	{ category: "vent", title: "Extreme Vent", level: 6, cost: 50e12, cooling: true,
	  experimental: true, requires: "vortex_cooling", containment: 100e9, vent: 5e9 },

	{ category: "heat_exchanger", title: "Heat Exchanger", levels: 5, cost: 160, costMul: 200, cooling: true,
	  containment: 320, containmentMul: 75, transfer: 16, transferMul: 75 },
	{ category: "heat_exchanger", title: "Extreme Heat Exchanger", level: 6, cost: 50e12, cooling: true,
	  experimental: true, requires: "underground_heat_extraction", containment: 1e12, transfer: 20e9 },

	{ category: "heat_inlet", title: "Heat Inlet", levels: 5, cost: 160, costMul: 200, cooling: true,
	  transfer: 16, transferMul: 75 },
	{ category: "heat_inlet", title: "Extreme Heat Inlet", level: 6, cost: 50e12, cooling: true,
	  experimental: true, requires: "vortex_extraction", transfer: 20e9, range: 2 },

	{ category: "heat_outlet", title: "Heat Outlet", levels: 5, cost: 160, costMul: 200, cooling: true,
	  transfer: 16, transferMul: 75 },
	{ category: "heat_outlet", title: "Extreme Heat Outlet", level: 6, cost: 50e12, cooling: true,
	  experimental: true, requires: "explosive_ejection", transfer: 20e9, range: 2 },

	{ category: "coolant_cell", title: "Coolant Cell", levels: 5, cost: 500, costMul: 200, cooling: true,
	  containment: 2000, containmentMul: 180 },
	{ category: "coolant_cell", title: "Thermionic Coolant Cell", level: 6, cost: 160e12, cooling: true,
	  experimental: true, requires: "thermionic_conversion", containment: 380e12 },

	{ category: "reactor_plating", title: "Reactor Plating", levels: 5, cost: 1000, costMul: 160, cooling: true,
	  reactorHeat: 100, reactorHeatMul: 140 },
	{ category: "reactor_plating", title: "Charged Reactor Plating", level: 6, cost: 100e12, cooling: true,
	  experimental: true, requires: "micro_capacitance", reactorHeat: 8e12 },

	{ category: "particle_accelerator", title: "Particle Accelerator", levels: 5, cost: 1e12, costMul: 10000, cooling: true,
	  containment: 100, containmentMul: 1e6, epHeat: 5e8, epHeatMul: 20000 },
	{ category: "particle_accelerator", title: "Black Hole Particle Accelerator", level: 6, cost: 100e12, cooling: true,
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
		// Output is always basePower/baseHeat run through the pulse formula in
		// sim.js; the pack size is carried by cellMultiplier and cellCount, so
		// there is no separate per-tier power/heat field to keep in step.
		p.basePower = def.power;
		p.baseHeat = def.heat;
		p.cellCount = CELL_COUNT[i];
		p.cellMultiplier = CELL_POWER[i];
		p.pulses = CELL_COUNT[i];
	} else {
		p.id = `${def.category}${level}`;
		p.title = level <= 5 ? TIER_PREFIX[level - 1] + def.title : def.title;
		for (const [field, mul] of SCALED) {
			if (def[field] && def[mul]) p[field] = def[field] * def[mul] ** (level - 1);
		}
		// The original wrote `base + add * level - 1`; `base + add * (level - 1)`
		// is what it meant and, for the one part that uses it, the same numbers.
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

// The cell types that carry prices for the generated cell_power / cell_tick /
// cell_perpetual upgrades. Protium has none - it is bought with particles.
export const CELLS_WITH_UPGRADES = CELLS.filter((c) => c.upgradeCosts);
