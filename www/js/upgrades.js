// Upgrades are data, not behaviour. The original gave every upgrade an
// `onclick` closure that reached into the game and mutated part objects in
// place, which made loading and rebooting a matter of replaying every closure
// in the right order. Here levels are the only stored truth and
// applyUpgrades() recomputes everything derived from them, so load, reboot and
// refund all fall out for free.
import { PARTS, CELLS_WITH_UPGRADES } from "./parts.js";

// The original was 11 rows by 14 columns - landscape, because it was a desktop
// game. This is 12 by 8: fewer tiles, but the whole reactor is visible at once
// on a phone with tiles big enough to hit, which matters more than matching a
// tile count. The expansion upgrades still grow it to 32 by 28.
const BASE_ROWS = 12;
const BASE_COLS = 8;
const BASE_MAX_POWER = 100;
const BASE_MAX_HEAT = 1000;
const BASE_LOOP_WAIT = 1000;
const DEFAULT_MAX_LEVEL = 32;

// Money-cost upgrades.
const CASH = [
	{ id: "chronometer", group: "other", title: "Improved Chronometers", cost: 10000, mul: 100,
	  desc: "+1 tick per second per level." },
	{ id: "forceful_fusion", group: "other", title: "Forceful Fusion", cost: 10000, mul: 100,
	  desc: "Cells produce more power the hotter the reactor runs." },
	{ id: "heat_control_operator", group: "other", title: "Heat Control Operator", cost: 1e6, levels: 1,
	  desc: "The reactor stops shedding heat below its maximum, making Forceful Fusion easier to hold." },
	{ id: "heat_outlet_control_operator", group: "other", title: "Better Heat Control Operator", cost: 1e7, levels: 1, requires: "heat_control_operator",
	  desc: "Outlets never push more heat than the vents they feed can take." },
	{ id: "improved_piping", group: "other", title: "Improved Piping", cost: 100, mul: 20,
	  desc: "Venting manually is 10x as effective per level." },
	{ id: "improved_alloys", group: "other", title: "Improved Alloys", cost: 5000, mul: 5,
	  desc: "Plating holds 100% more heat per level." },
	{ id: "improved_power_lines", group: "other", title: "Improved Power Lines", cost: 100, mul: 10,
	  desc: "Sells 1% of your maximum power each tick per level." },
	{ id: "improved_wiring", group: "other", title: "Improved Wiring", cost: 5000, mul: 5,
	  desc: "Capacitors hold 100% more power and heat per level." },
	{ id: "perpetual_capacitors", group: "other", title: "Perpetual Capacitors", cost: 1e18, levels: 1,
	  desc: "An overheating capacitor on a cool surface vents into the reactor and replaces itself, at 10x cost." },
	{ id: "improved_coolant_cells", group: "other", title: "Improved Coolant Cells", cost: 5000, mul: 100,
	  desc: "Coolant cells hold 100% more heat per level." },
	{ id: "improved_reflector_density", group: "other", title: "Improved Reflector Density", cost: 5000, mul: 100,
	  desc: "Reflectors last 100% longer per level." },
	{ id: "improved_neutron_reflection", group: "other", title: "Improved Neutron Reflection", cost: 5000, mul: 100,
	  desc: "Reflectors give an additional 1% power per level." },
	{ id: "perpetual_reflectors", group: "other", title: "Perpetual Reflectors", cost: 1e9, levels: 1,
	  // The original's text promises 1.5x here, but its code charges list price;
	  // only cells pay the 1.5x markup. Behaviour wins.
	  desc: "Spent reflectors replace themselves at list price." },
	{ id: "improved_heat_exchangers", group: "exchangers", title: "Improved Heat Exchangers", cost: 600, mul: 100,
	  desc: "Exchangers, inlets and outlets hold and move 100% more heat per level." },
	{ id: "reinforced_heat_exchangers", group: "exchangers", title: "Reinforced Heat Exchangers", cost: 1000, mul: 100,
	  desc: "Each plating adds 1% exchanger throughput per level." },
	{ id: "active_exchangers", group: "exchangers", title: "Active Exchangers", cost: 1000, mul: 100,
	  desc: "Each capacitor adds 1% exchanger throughput per level." },
	{ id: "improved_heat_vents", group: "vents", title: "Improved Heat Vents", cost: 250, mul: 100,
	  desc: "Vents hold and vent 100% more heat per level." },
	{ id: "improved_heatsinks", group: "vents", title: "Improved Heatsinks", cost: 1000, mul: 100,
	  desc: "Each plating adds 1% vent throughput per level." },
	{ id: "active_venting", group: "vents", title: "Active Venting", cost: 1000, mul: 100,
	  desc: "Each capacitor adds 1% vent throughput per level." },
	{ id: "expand_reactor_rows", group: "other", title: "Expand Reactor Rows", cost: 100, mul: 100, levels: 20,
	  desc: "Adds one row to the reactor per level." },
	{ id: "expand_reactor_cols", group: "other", title: "Expand Reactor Cols", cost: 100, mul: 100, levels: 20,
	  desc: "Adds one column to the reactor per level." },
];

// Exotic-particle upgrades. `laboratory` gates the rest.
const EXOTIC = [
	{ id: "laboratory", group: "lab", title: "Laboratory", ecost: 1, levels: 1,
	  desc: "Enables experimental upgrades." },
	{ id: "infused_cells", group: "boost", title: "Infused Cells", ecost: 50, mul: 2,
	  desc: "Each fuel cell produces an additional 100% base power per level." },
	{ id: "unleashed_cells", group: "boost", title: "Unleashed Cells", ecost: 100, mul: 2,
	  desc: "Fuel cells produce twice their base heat and power per level." },
	{ id: "quantum_buffering", group: "boost", title: "Quantum Buffering", ecost: 50, mul: 2,
	  desc: "Capacitors and plating hold twice as much per level." },
	{ id: "full_spectrum_reflectors", group: "boost", title: "Full Spectrum Reflectors", ecost: 50, mul: 2,
	  desc: "Reflectors gain another 100% of their base reflection per level." },
	{ id: "fluid_hyperdynamics", group: "boost", title: "Fluid Hyperdynamics", ecost: 50, mul: 2,
	  desc: "Vents, exchangers, inlets and outlets are twice as effective per level." },
	{ id: "fractal_piping", group: "boost", title: "Fractal Piping", ecost: 50, mul: 2,
	  desc: "Vents and exchangers hold twice their base heat per level." },
	{ id: "ultracryonics", group: "boost", title: "Ultracryonics", ecost: 50, mul: 2,
	  desc: "Coolant cells hold twice their base heat per level." },
	{ id: "phlembotinum_core", group: "boost", title: "Phlembotinum Core", ecost: 50, mul: 2,
	  desc: "Quadruples the reactor's own heat and power capacity per level." },
	{ id: "protium_cells", group: "cells", title: "Protium Cells", ecost: 50, levels: 1,
	  desc: "Allows you to use protium cells." },
	{ id: "unstable_protium", group: "cells", title: "Unstable Protium", ecost: 500, mul: 2, requires: "protium_cells",
	  desc: "Protium cells last half as long and produce twice the power and heat per level." },
];

// The nine unlocks for the tier-6 parts. Identical but for the part they open,
// so they are generated from the parts that declare a `requires`.
const PART_UNLOCK_TITLES = {
	heat_reflection: "Heat Reflection",
	experimental_capacitance: "Experimental Capacitance",
	vortex_cooling: "Vortex Cooling",
	underground_heat_extraction: "Underground Heat Extraction",
	vortex_extraction: "Vortex Extraction",
	explosive_ejection: "Explosive Ejection",
	thermionic_conversion: "Thermionic Conversion",
	micro_capacitance: "Micro Capacitance",
	singularity_harnessing: "Singularity Harnessing",
};

const PART_UNLOCKS = Object.entries(PART_UNLOCK_TITLES).map(([id, title]) => ({
	id, title, group: "parts", ecost: 10000, levels: 1,
	desc: `Allows you to use ${PARTS.find((p) => p.requires === id).title}s. Buying one raises the cost of the others.`,
}));

// One accelerator upgrade per tier.
const PA_UPGRADES = [1, 2, 3, 4, 5, 6].map((i) => ({
	id: `improved_particle_accelerators${i}`, group: "accelerators", ecost: 200 * i, mul: 2,
	title: `Improved ${PARTS.find((p) => p.id === `particle_accelerator${i}`).title}`,
	desc: "Doubles the heat this accelerator can turn into Exotic Particles per level.",
}));

// cell_power / cell_tick / cell_perpetual for every cell type that has a price.
const CELL_KINDS = [
	{ kind: "power", title: "Potent", desc: "cells produce 100% more power per level.", mul: 10 },
	{ kind: "tick", title: "Enriched", desc: "cells last twice as long per level.", mul: 10 },
	{ kind: "perpetual", title: "Perpetual", desc: "cells replace themselves when depleted, at 1.5x cost.", levels: 1 },
];

const CELL_UPGRADES = CELL_KINDS.flatMap(({ kind, title, desc, mul, levels }) =>
	CELLS_WITH_UPGRADES.map((c) => ({
		id: `cell_${kind}_${c.type}`,
		group: `cell_${kind}_upgrades`,
		title: `${title} ${c.title}`,
		desc: `${c.title} ${desc}`,
		cost: c.upgradeCosts[kind],
		mul,
		levels,
		cellType: c.type,
	})),
);

export const UPGRADES = [...CASH, ...EXOTIC, ...PART_UNLOCKS, ...PA_UPGRADES, ...CELL_UPGRADES];
export const UPGRADE_BY_ID = new Map(UPGRADES.map((u) => [u.id, u]));

export const maxLevel = (u) => u.levels ?? DEFAULT_MAX_LEVEL;

/** What the next level costs. Exotic-part unlocks get pricier as you buy them. */
export function costOf(s, u) {
	const level = s.levels[u.id];
	if (level >= maxLevel(u)) return Infinity;
	if (u.ecost) {
		const bought = PART_UNLOCKS.filter((p) => s.levels[p.id]).length;
		const scale = u.group === "parts" ? bought + 1 : (u.mul ?? 1) ** level;
		return u.ecost * scale;
	}
	return u.cost * (u.mul ?? 1) ** level;
}

export const isUnlocked = (s, u) =>
	(!u.requires || s.levels[u.requires] > 0) && (!u.ecost || u.id === "laboratory" || s.levels.laboratory > 0);

/** Buy one level. Returns true if it happened. */
export function buy(s, id) {
	const u = UPGRADE_BY_ID.get(id);
	if (!u || !isUnlocked(s, u)) return false;
	const price = costOf(s, u);
	const purse = u.ecost ? "currentExoticParticles" : "money";
	if (s[purse] < price) return false;
	s[purse] -= price;
	s.levels[id]++;
	applyUpgrades(s);
	return true;
}

// Every part field that upgrades scale, as [linearUpgrade, doublingUpgrade].
// The value becomes base * (level(linear) + 1) * 2 ** level(doubling).
const SCALE_BY_CATEGORY = {
	vent: { vent: ["improved_heat_vents", "fluid_hyperdynamics"], containment: ["improved_heat_vents", "fractal_piping"] },
	heat_exchanger: { transfer: ["improved_heat_exchangers", "fluid_hyperdynamics"], containment: ["improved_heat_exchangers", "fractal_piping"] },
	heat_inlet: { transfer: ["improved_heat_exchangers", "fluid_hyperdynamics"] },
	heat_outlet: { transfer: ["improved_heat_exchangers", "fluid_hyperdynamics"] },
	coolant_cell: { containment: ["improved_coolant_cells", "ultracryonics"] },
	capacitor: { reactorPower: ["improved_wiring", "quantum_buffering"], containment: ["improved_wiring", "quantum_buffering"] },
	reactor_plating: { reactorHeat: ["improved_alloys", "quantum_buffering"] },
};

/** Recompute everything derived from upgrade levels: reactor settings and part stats. */
export function applyUpgrades(s) {
	const L = (id) => s.levels[id] ?? 0;

	s.loopWait = BASE_LOOP_WAIT / (L("chronometer") + 1);
	s.heatPowerMul = L("forceful_fusion");
	s.heatControlOperator = L("heat_control_operator");
	s.heatOutletControlled = L("heat_outlet_control_operator");
	s.manualHeatReduce = 10 ** L("improved_piping");
	s.autoSellMul = 0.01 * L("improved_power_lines");
	s.transferPlatingMul = L("reinforced_heat_exchangers");
	s.transferCapacitorMul = L("active_exchangers");
	s.ventPlatingMul = L("improved_heatsinks");
	s.ventCapacitorMul = L("active_venting");
	s.perpetualCapacitors = L("perpetual_capacitors") > 0;
	s.rows = BASE_ROWS + L("expand_reactor_rows");
	s.cols = BASE_COLS + L("expand_reactor_cols");
	s.baseMaxPower = BASE_MAX_POWER * 4 ** L("phlembotinum_core");
	s.baseMaxHeat = BASE_MAX_HEAT * 4 ** L("phlembotinum_core");

	// Which parts replace themselves when they run out, keyed by category for
	// components and by cell type for cells.
	s.perpetual = new Set(L("perpetual_reflectors") ? ["reflector"] : []);
	for (const c of CELLS_WITH_UPGRADES) if (L(`cell_perpetual_${c.type}`)) s.perpetual.add(c.type);

	const unleashed = 2 ** L("unleashed_cells");
	const infused = L("infused_cells");
	const protiumBoost = 2 ** L("unstable_protium");

	s.stats = new Map();
	for (const base of PARTS) {
		const p = { ...base };

		for (const [field, [linear, doubling]] of Object.entries(SCALE_BY_CATEGORY[p.category] ?? {})) {
			p[field] = base[field] * (L(linear) + 1) * 2 ** L(doubling);
		}

		if (p.category === "reflector") {
			p.ticks = base.ticks * (L("improved_reflector_density") + 1);
			p.powerIncrease = base.powerIncrease * (1 + L("improved_neutron_reflection") / 100)
				+ base.powerIncrease * L("full_spectrum_reflectors");
		} else if (p.category === "particle_accelerator") {
			p.epHeat = base.epHeat * (L(`improved_particle_accelerators${p.level}`) + 1);
		} else if (p.category === "cell") {
			if (p.type === "protium") {
				p.baseHeat = base.baseHeat * protiumBoost * unleashed;
				p.basePower = base.basePower * (infused + 1) * protiumBoost * unleashed * (1 + s.protiumParticles / 10);
				p.ticks = Math.ceil(base.ticks / protiumBoost);
			} else {
				p.baseHeat = base.baseHeat * unleashed;
				p.basePower = base.basePower * (L(`cell_power_${p.type}`) + infused + 1) * unleashed;
				p.ticks = base.ticks * 2 ** L(`cell_tick_${p.type}`);
			}
		}

		s.stats.set(p.id, p);
	}
	return s;
}

/**
 * Prestige. Banks this run's Exotic Particles, wipes the board, and drops every
 * money upgrade back to zero. A refund also clears the exotic upgrades and
 * hands back every particle ever earned.
 */
export function reboot(s, refund = false) {
	s.totalExoticParticles += s.exoticParticles;
	for (const t of s.tiles) {
		t.id = null;
		t.activated = false;
		t.ticks = 0;
		t.heatContained = 0;
	}
	s.queue = [];
	s.money = 10;
	s.power = 0;
	s.heat = 0;
	s.protiumParticles = 0;
	s.hasMeltedDown = false;

	for (const u of UPGRADES) if (refund || !u.ecost) s.levels[u.id] = 0;
	s.currentExoticParticles = refund ? s.totalExoticParticles : s.currentExoticParticles + s.exoticParticles;
	s.exoticParticles = 0;

	applyUpgrades(s);
	return s;
}
