// Upgrades are data, not behaviour: levels are the only stored truth and
// applyUpgrades() recomputes the rest, so load, reboot and refund fall out.
import { PARTS, CELLS_WITH_UPGRADES } from "./parts.js";
import { fmt } from "./fmt.js";
import { refreshModules } from "./module.js";

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
];

// Doctrines: a set opens every five goals, each a choice between two ways to run
// a reactor. Buying a set opens it; which side is in force can be switched at
// any time, for nothing. Each set costs ten times the last. A reboot clears
// what was bought, like any cash upgrade, but remembers the sides. Each side's
// `nums` lead its card: [text, kind, downside], kind being power, heat, money
// or ticks.
export const DOCTRINE_SETS = [
	{ title: "Vents or markets",
	  left: { key: "openVents", title: "Open Vents", nums: [["+50% venting", "heat"], ["-25% vent capacity", "heat", true]], desc: "Vents shed 50% more heat each tick, but hold 25% less before they fail." },
	  right: { key: "sellBonus", title: "Power Brokers", nums: [["+25% sale price", "money"]], desc: "Every sale pays 25% more, whether you sell by hand or the power lines sell for you." } },
	{ title: "When a part fails",
	  left: { key: "cascadeVents", title: "Cascade Vents", nums: [["100% of a failing vent's excess passed on", "heat"]], desc: "A vent about to fail passes its excess to a neighbouring vent with room instead." },
	  right: { key: "salvage", title: "Salvage Crews", nums: [["50% refund on explosion", "money"]], desc: "A part that explodes refunds half its price." } },
	{ title: "How hard the cells run",
	  left: { key: "overclock", title: "Overclocked Cells", nums: [["+50% power", "power"], ["+100% heat", "heat", true]], desc: "Cells make 50% more power and twice as much heat." },
	  right: { key: "throttle", title: "Throttled Cells", nums: [["-50% power over 80% heat", "power", true], ["-50% heat over 80% heat", "heat"]], desc: "Above 80% of maximum heat, cells make half their power and half their heat." } },
	{ title: "The shape of a core",
	  left: { key: "diagonalPulse", title: "Diagonal Pulse", nums: [["+4 neighbours per cell", "power"]], desc: "Cells also pulse into the cells at their corners." },
	  right: { key: "isolatedCores", title: "Isolated Cores", nums: [["x3 power for a lone cell", "power"]], desc: "A cell with no other cell beside it makes three times the power." } },
	{ title: "Where heat is kept",
	  left: { key: "pressurised", title: "Pressurised Core", nums: [["x2 max heat", "heat"], ["-25% outlet transfer", "heat", true]], desc: "The reactor holds twice as much heat before it shakes, but outlets move 25% less." },
	  right: { key: "fastExchange", title: "Fast Exchange", nums: [["+50% transfer", "heat"], ["-25% max heat", "heat", true]], desc: "Exchangers, inlets and outlets move 50% more heat, but the reactor holds 25% less." } },
	{ title: "What parts last",
	  left: { key: "reflectorLattice", title: "Reflector Lattice", nums: [["reflectors never wear", "ticks"], ["-50% reflector boost", "power", true]], desc: "Reflectors never wear out, but give half the boost." },
	  right: { key: "deepCapacitors", title: "Deep Capacitors", nums: [["x3 capacitor max power", "power"]], desc: "Capacitors raise maximum power three times as much." } },
];

const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
const DOCTRINES = DOCTRINE_SETS.map((d, i) => ({
	id: `doctrine${i + 1}`,
	group: "doctrine",
	title: `${NUMERALS[i]} \u00B7 ${d.title}`,
	cost: 1000 * 10 ** i,
	levels: 1,
	after: (i + 1) * 5,
	set: d,
	desc: `${d.left.title} or ${d.right.title}. Pick a side; switch whenever you like.`,
}));

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
	{ id: "casing_tolerances", group: "casings", title: "Casing Tolerances", ecost: 250, mul: 2, levels: 7,
	  desc: "A module passes on 5% more of what its parts make per level, from 25% up to 60%." },
	{ id: "nested_casings", group: "casings", title: "Nested Casings", ecost: 5000, mul: 4, levels: 3,
	  desc: "A module can hold modules one layer deeper per level. Each layer takes its own efficiency cut." },
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

export const UPGRADES = [...CASH, ...DOCTRINES, ...EXOTIC, ...PART_UNLOCKS, ...PA_UPGRADES, ...CELL_UPGRADES];

// Grouped by what an upgrade acts on, the way Incremental and Knockoff laid
// their pages out: the reactor, each fuel on its own, then the dock's families.
// [id, title, fuel type for the heading's art]. Order is page order.
export const SECTIONS = [
	["lab", "Laboratory"],
	["reactor", "Reactor"],
	["cells", "Cells"],
	...CELLS_WITH_UPGRADES.map((c) => [c.type, c.title.replace(" Cell", ""), c.type]),
	["power", "Capacitors and reflectors"],
	["cooling", "Vents, coolant and plating"],
	["transfer", "Exchangers, inlets and outlets"],
	["casings", "Modules"],
	["accelerators", "Particle accelerators"],
	["parts", "Experimental parts"],
	["doctrine", "Doctrines - pick a side, switch any time"],
];

const SECTION_BY_ID = {
	chronometer: "reactor", forceful_fusion: "reactor", heat_control_operator: "reactor",
	heat_outlet_control_operator: "reactor", improved_piping: "reactor", improved_power_lines: "reactor",
	phlembotinum_core: "reactor",
	improved_wiring: "power", perpetual_capacitors: "power", quantum_buffering: "power",
	improved_reflector_density: "power", improved_neutron_reflection: "power",
	perpetual_reflectors: "power", full_spectrum_reflectors: "power",
	improved_heat_vents: "cooling", improved_heatsinks: "cooling", active_venting: "cooling",
	improved_coolant_cells: "cooling", improved_alloys: "cooling", ultracryonics: "cooling",
	fractal_piping: "cooling",
	improved_heat_exchangers: "transfer", reinforced_heat_exchangers: "transfer",
	active_exchangers: "transfer", fluid_hyperdynamics: "transfer",
	infused_cells: "cells", unleashed_cells: "cells", protium_cells: "cells", unstable_protium: "cells",
	laboratory: "lab",
};

/** Which section of its page an upgrade is listed under. */
export const sectionOf = (u) => SECTION_BY_ID[u.id] ?? u.cellType ?? {
	doctrine: "doctrine", casings: "casings", parts: "parts", accelerators: "accelerators",
}[u.group] ?? "reactor";
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
	(!u.requires || s.levels[u.requires] > 0)
	&& (!u.after || s.objective >= u.after)
	&& (!u.ecost || u.id === "laboratory" || s.levels.laboratory > 0);

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
	// Whichever side of each bought doctrine set is in force.
	for (const [i, d] of DOCTRINE_SETS.entries()) {
		const side = L(`doctrine${i + 1}`) > 0 ? (s.doctrines?.[`doctrine${i + 1}`] ?? "left") : null;
		s[d.left.key] = side === "left";
		s[d.right.key] = side === "right";
	}
	s.sellMul = s.sellBonus ? 1.25 : 1;
	s.baseMaxPower = BASE_MAX_POWER * 4 ** L("phlembotinum_core");
	s.baseMaxHeat = BASE_MAX_HEAT * 4 ** L("phlembotinum_core");
	if (s.pressurised) s.baseMaxHeat *= 2;
	if (s.fastExchange) s.baseMaxHeat *= 0.75;
	s.casingEff = 0.25 + 0.05 * L("casing_tolerances");
	s.maxNest = 1 + L("nested_casings");

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

		// Doctrines, after the upgrades have scaled the part.
		if (s.openVents && p.category === "vent") {
			p.vent *= 1.5;
			p.containment *= 0.75;
		}
		if (s.fastExchange && p.transfer && p.category.startsWith("heat_")) p.transfer *= 1.5;
		if (s.pressurised && p.category === "heat_outlet") p.transfer *= 0.75;
		if (s.reflectorLattice && p.category === "reflector") p.powerIncrease *= 0.5;
		if (s.deepCapacitors && p.category === "capacitor") p.reactorPower *= 3;

		s.stats.set(p.id, p);
	}
	if (s.modules) refreshModules(s);
	return s;
}

/**
 * Prestige: bank this run's particles, wipe the board, zero the money upgrades.
 * A refund also clears the exotic ones and returns every particle ever earned.
 */
export function reboot(s, refund = false, restriction = null) {
	s.totalExoticParticles += s.exoticParticles;
	// A new run: its own rule, its own clock.
	s.restriction = restriction;
	s.runTicks = 0;
	s.runHit = [];
	// A new run starts with a new board: no mark, no incidents, nothing restored.
	s.restored = false;
	s.mark = null;
	s.incidents = [];
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

// What the next level buys, measured rather than restated: run applyUpgrades at
// this level and the next and compare. 63 tables would drift from the sim.

/** The scalar fields applyUpgrades derives, in the order they are worth showing. */
const SCALARS = [
	"loopWait", "autoSellMul", "manualHeatReduce", "heatPowerMul",
	"baseMaxPower", "baseMaxHeat", "transferPlatingMul", "transferCapacitorMul",
	"ventPlatingMul", "ventCapacitorMul", "casingEff", "maxNest",
];

/** The part fields worth showing, in the order a row should prefer them. */
const STAT_FIELDS = ["basePower", "baseHeat", "vent", "transfer", "reactorPower", "reactorHeat", "containment", "powerIncrease", "epHeat", "ticks"];

const PERCENT = new Set(["autoSellMul", "transferPlatingMul", "transferCapacitorMul", "ventPlatingMul", "ventCapacitorMul"]);

/** The one-off switches, which have no number to show - only a state. */
const SWITCHES = ["heatControlOperator", "heatOutletControlled", "perpetualCapacitors",
	"cascadeVents", "salvage", "overclock", "throttle", "diagonalPulse", "isolatedCores",
	"openVents", "sellBonus", "pressurised", "fastExchange", "reflectorLattice", "deepCapacitors"];

// fmt() drops the decimals below 1000, which is right for money and wrong for
// a vent going 4 -> 4.5, so small numbers are written out instead.
const num = (v) => (Math.abs(v) < 1000 ? String(Math.round(v * 100) / 100) : fmt(v));

/** Show a field the way the upgrade's own description talks about it. */
function show(field, v) {
	if (field === "loopWait") return `${num(1000 / v)}/s`;
	if (field === "manualHeatReduce") return `${num(v)}x`;
	if (field === "casingEff") return `${num(v * 100)}%`;
	if (field === "maxNest") return `${num(v)} deep`;
	if (PERCENT.has(field)) return `${num(field === "autoSellMul" ? v * 100 : v)}%`;
	return num(v);
}

/** Levels are the only input applyUpgrades needs, so a shell is enough. */
const derive = (s, id, level) =>
	applyUpgrades({ levels: { ...s.levels, [id]: level }, protiumParticles: s.protiumParticles });

/**
 * What buying the next level changes, as `{ from, to }` strings - or null when
 * nothing measurable moves (the one-off switches, and anything already maxed).
 */
export function nextLevel(s, u) {
	const lv = s.levels[u.id] ?? 0;
	if (lv >= maxLevel(u)) return null;

	const now = derive(s, u.id, lv);
	const next = derive(s, u.id, lv + 1);

	// A field whose reading does not visibly move is no use on screen, so keep
	// looking rather than printing "5 -> 5".
	const moved = (field, a, b) => {
		const from = show(field, a);
		const to = show(field, b);
		return from === to ? null : { field, from, to };
	};

	for (const field of SCALARS) {
		const d = now[field] !== next[field] && moved(field, now[field], next[field]);
		if (d) return d;
	}
	for (const field of STAT_FIELDS) {
		for (const [id, p] of now.stats) {
			const q = next.stats.get(id);
			const d = p[field] !== q[field] && moved(field, p[field], q[field]);
			if (d) return d;
		}
	}
	for (const field of SWITCHES) {
		if (now[field] !== next[field]) return { field, from: "off", to: "on" };
	}
	return null;
}

// Power, heat or neither, from the field the upgrade moves - not a list of ids.

const KIND_BY_FIELD = {
	overclock: "power", diagonalPulse: "power", isolatedCores: "power",
	throttle: "heat", cascadeVents: "heat", casingEff: "power",
	basePower: "power", reactorPower: "power", powerIncrease: "power",
	autoSellMul: "power", baseMaxPower: "power", heatPowerMul: "power",

	baseHeat: "heat", reactorHeat: "heat", vent: "heat", transfer: "heat",
	containment: "heat", baseMaxHeat: "heat", manualHeatReduce: "heat",
	ventPlatingMul: "heat", ventCapacitorMul: "heat",
	transferPlatingMul: "heat", transferCapacitorMul: "heat",
	heatControlOperator: "heat", heatOutletControlled: "heat",
	// loopWait, ticks and epHeat move neither: they are utility.
};

const KIND_BY_CATEGORY = {
	vent: "heat", heat_exchanger: "heat", heat_inlet: "heat", heat_outlet: "heat",
	coolant_cell: "heat", reactor_plating: "heat",
	capacitor: "power", reflector: "power", cell: "power",
	particle_accelerator: "utility",
};

// An upgrade whose whole job is to unlock a part is that part's kind - it moves
// no field of its own, so there is nothing to measure.
const UNLOCKS = new Map(PARTS.filter((p) => p.requires).map((p) => [p.requires, p.category]));

const KIND = new Map();

/** "power", "heat" or "utility". Static per upgrade, so worked out once. */
export function kindOf(u) {
	if (!KIND.has(u.id)) {
		const unlocked = UNLOCKS.get(u.id);
		const step = nextLevel({ levels: {}, protiumParticles: 0 }, u);
		KIND.set(u.id, (unlocked && KIND_BY_CATEGORY[unlocked])
			|| (step && KIND_BY_FIELD[step.field])
			|| "utility");
	}
	return KIND.get(u.id);
}
