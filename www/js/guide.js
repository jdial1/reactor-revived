// The parts guide: what every part does, in plain rules, with its numbers as
// they stand in this game - upgrades included. It states the rules and never
// the answers: the square law is for the player to find, the experimental
// quirks are for field notes, and nothing here says where a part should go.
import { h, showCode } from "./ui.js";
import { fmt } from "./fmt.js";
import { artFor } from "./art.js";
import { icon } from "./icons.js";
import { PARTS, CATEGORY_AFTER, categoryOpen, isPartVisible, UNLOCK_AFTER, modulesOpen } from "./parts.js";
import { UPGRADE_BY_ID } from "./upgrades.js";
import { notesFor } from "./notes.js";

const exact = (v) => (Math.abs(v) < 1000 ? String(Math.round(v * 100) / 100) : fmt(v));

// [key, name, the part whose art stands for the family, paragraphs, upgrade ids]
export const FAMILIES = [
	["reactor", "The reactor itself", "icon:reactor", [
		"Heat that no part takes goes into the reactor's pool. The heat gauge is that pool against the reactor's limit.",
		"The pool sheds nothing by itself. Outlets and hull vents draw heat out of it, and tapping the heat gauge vents a little by hand.",
		"Over its limit, the reactor pushes a twentieth of the excess each tick into its parts, split evenly across every part that can hold heat. At twice its limit it melts down: every part is lost; the money and research stay.",
		"Power collects up to the power limit, and anything over it is wasted. Tap the power gauge to sell it, or buy Improved Power Lines to sell a share every tick.",
		"A part that fails, is sold, or is replaced leaves the heat it held in the pool.",
	], ["phlembotinum_core", "improved_power_lines", "improved_piping", "chronometer", "heat_control_operator", "forceful_fusion"]],

	["cell", "Fuel cells", "cell_1_1", [
		"A cell makes power and heat every tick until its life runs out, and then it is spent. With its fuel's Perpetual upgrade it rebuys itself, at one and a half times its price.",
		"Its heat is split evenly between the touching parts that can hold heat. Whatever finds no such neighbour goes into the reactor.",
		"Cells that touch pulse into each other, and a pulse raises both power and heat. Dual and quad cells are two and four cells in one tile, already pulsing among themselves.",
		"The numbers below are for a cell with nothing touching it. Each fuel has its own Potent (power), Enriched (life) and Perpetual (rebuy) upgrades.",
	], ["infused_cells", "unleashed_cells"]],

	["vent", "Heat vents", "vent_1", [
		"A vent holds heat up to its limit and sheds up to its rate every tick. Cells beside it split their heat into it.",
		"Past its limit it fails, and its heat goes into the reactor.",
		"Capacitors and plating touching it make it faster, once Active Venting or Improved Heatsinks is bought.",
	], ["improved_heat_vents", "fluid_hyperdynamics", "fractal_piping", "active_venting", "improved_heatsinks"]],

	["component_vent", "Component vents", "component_vent_1", [
		"A component vent holds no heat. Every tick it takes heat out of each part it touches, up to its rate from each, and sheds it.",
		"Cells cannot put heat into it: it has nowhere to keep it.",
		"Capacitors and plating touching it make it faster, like any vent.",
	], ["improved_heat_vents", "fluid_hyperdynamics", "active_venting", "improved_heatsinks"]],

	["hull_vent", "Hull vents", "hull_vent_1", [
		"A hull vent draws heat from the reactor's pool into itself, up to its draw rate, and sheds up to its vent rate. It does not care what it touches.",
		"Cells beside it split their heat into it as they would into any vent. Past its limit it fails.",
		"It is indirect cooling, so a Direct-only run leaves it out.",
	], ["improved_heat_vents", "fluid_hyperdynamics", "fractal_piping", "improved_heat_exchangers"]],

	["coolant_cell", "Coolant cells", "coolant_cell_1", [
		"A coolant cell holds a great deal of heat and sheds none. It buys time; when it is full, it fails like any part.",
	], ["improved_coolant_cells", "ultracryonics"]],

	["condensator", "Condensators", "condensator_1", [
		"A condensator holds far more heat than a coolant cell, and sheds none.",
		"Refilling it empties it, and that heat is gone. By hand, from its sheet, a refill costs its price in proportion to what it holds; with Condensator Refills bought, a full one is refilled automatically at its full price.",
		"Full and not refilled, it fails. A casing cannot pay for refills.",
	], ["perpetual_condensators", "improved_coolant_cells", "ultracryonics"]],

	["reactor_plating", "Reactor plating", "plating_1", [
		"Plating raises the reactor's heat limit by its amount. It holds no heat itself.",
		"With Improved Heatsinks or Reinforced Heat Exchangers bought, it also speeds the vents and transfer parts it touches.",
	], ["improved_alloys", "quantum_buffering", "improved_heatsinks", "reinforced_heat_exchangers"]],

	["capacitor", "Capacitors", "capacitor_1", [
		"A capacitor raises the reactor's power limit, so more power can wait to be sold.",
		"It holds a little heat, and fails past its limit.",
		"With Active Venting or Active Exchangers bought, it also speeds the vents and transfer parts it touches.",
	], ["improved_wiring", "quantum_buffering", "active_venting", "active_exchangers", "perpetual_capacitors"]],

	["reflector", "Neutron reflectors", "reflector_1", [
		"A reflector raises the power of every cell it touches by its percentage.",
		"It has a life, and uses it up as the cells around it run. Spent, it is gone, unless Perpetual Reflectors is bought.",
	], ["improved_reflector_density", "improved_neutron_reflection", "full_spectrum_reflectors", "perpetual_reflectors"]],

	["heat_exchanger", "Heat exchangers", "exchanger_1", [
		"An exchanger holds heat, and every tick moves heat between itself and the parts it touches so that each is equally full, up to its rate.",
		"It moves heat; it removes none.",
	], ["improved_heat_exchangers", "fluid_hyperdynamics", "fractal_piping", "active_exchangers", "reinforced_heat_exchangers"]],

	["heat_inlet", "Heat inlets", "inlet_1", [
		"An inlet pulls heat out of each part it touches and into the reactor's pool, up to its rate from each. It holds nothing itself.",
	], ["improved_heat_exchangers", "fluid_hyperdynamics", "active_exchangers", "reinforced_heat_exchangers"]],

	["heat_outlet", "Heat outlets", "outlet_1", [
		"An outlet pushes heat from the reactor's pool into each part it touches that can hold heat, up to its rate. Outlets share the pool between them. It holds nothing itself.",
		"While Heat Control Operator is switched on, outlets push nothing until the reactor is over its limit.",
	], ["improved_heat_exchangers", "fluid_hyperdynamics", "active_exchangers", "reinforced_heat_exchangers", "heat_outlet_control_operator"]],

	["particle_accelerator", "Particle accelerators", "accelerator_1", [
		"An accelerator holds heat and turns the heat it holds into Exotic Particles: the fuller it runs, the more it makes.",
		"Particles count only as far as the board sheds the heat it makes, tick by tick.",
		"One that overflows melts the whole reactor down.",
		"Each tier has its own Improved upgrade, which doubles the heat it can turn into particles.",
	], []],

	["module", "Modules", "icon:modules", [
		"A module is a casing: a 3 x 3 design of your own, placed as one part. Designs are made on the Modules page.",
		"Its parts run inside it every tick against the reactor's pool. Heat crosses whole, both ways; power and particles are cut to the casing's efficiency.",
		"When any part inside fails, the whole casing fails.",
	], ["casing_tolerances", "nested_casings"]],
];

// [field, label] for the per-tier table, in the order they are shown.
const FIELDS = [
	["vent", "Sheds /tick"],
	["transfer", "Moves /tick"],
	["containment", "Holds"],
	["reactorPower", "Power limit +"],
	["reactorHeat", "Heat limit +"],
	["powerIncrease", "Cell power +%"],
	["epHeat", "Particle heat"],
	["ticks", "Life"],
];

/** A cell alone: its pulse count is its own pack, and nothing touches it. */
const alone = (p) => ({
	power: p.basePower * p.cellMultiplier,
	heat: (p.baseHeat * p.cellMultiplier ** 2) / p.cellCount,
});

function table(s, key) {
	const parts = PARTS.filter((p) => (key === "cell" ? p.category === "cell" : p.category === key))
		.map((p) => s.stats.get(p.id));
	const shown = parts.filter((p) => isPartVisible(s, p));
	const hidden = parts.filter((p) => !isPartVisible(s, p) && !p.experimental).length;
	if (!shown.length) return null;
	const cols = key === "cell"
		? [["power", "Power"], ["heat", "Heat"], ["ticks", "Life"]]
		: FIELDS.filter(([f]) => shown.some((p) => p[f]));
	const label = (f, l) => (key === "hull_vent" && f === "transfer" ? "Draws /tick" : l);
	const cell = (p, f) => {
		const v = key === "cell" && f !== "ticks" ? alone(p)[f] : p[f];
		return v ? exact(v) : "-";
	};
	return h("div", { className: "guide-table-wrap" },
		h("table", { className: "guide-table" },
			h("thead", {}, h("tr", {}, h("th", { textContent: "Part" }),
				...cols.map(([f, l]) => h("th", { textContent: label(f, l) })),
				h("th", { textContent: "Price" }))),
			h("tbody", {}, ...shown.map((p) => h("tr", {},
				h("td", {}, h("i", { className: "guide-art", style: `background-image:url(${artFor(p)})` }), p.title),
				...cols.map(([f]) => h("td", { textContent: cell(p, f) })),
				h("td", { textContent: `$${fmt(p.cost)}` }))))),
		hidden ? h("p", { className: "guide-more", textContent: key === "cell"
			? `${hidden} more cells arrive, each after you place ${UNLOCK_AFTER} of the one before it.`
			: `${hidden} more ${hidden === 1 ? "tier arrives" : "tiers arrive"} as you place ${UNLOCK_AFTER} of the tier before.` }) : "");
}

const opened = (s, key) => (key === "reactor" || key === "cell" ? true
	: key === "module" ? modulesOpen(s) : categoryOpen(s, key));

function family(s, [key, name, art, lines, upgrades], focus) {
	// A family drawn by a part's sprite, or by an interface icon when it has none.
	const head = h("summary", {},
		art.startsWith("icon:") ? h("i", { className: "guide-art" }, icon(art.slice(5)))
			: h("i", { className: "guide-art", style: `background-image:url(parts/revival/${art}.png)` }),
		h("b", { textContent: name }));
	if (!opened(s, key)) {
		const after = CATEGORY_AFTER[key];
		return h("details", { className: "guide-family locked" }, head,
			h("p", { textContent: `Arrives with the log, after goal ${after}.` }));
	}
	const notes = [...new Set(PARTS.filter((p) => p.category === key).flatMap((p) => notesFor(s, s.stats.get(p.id))))];
	const ups = upgrades.map((id) => UPGRADE_BY_ID.get(id)?.title).filter(Boolean);
	const experimental = PARTS.some((p) => p.category === key && p.experimental);
	const el = h("details", { className: "guide-family", open: focus === key }, head,
		...lines.map((t) => h("p", { textContent: t })),
		table(s, key) ?? "",
		experimental ? h("p", { className: "guide-more", textContent: key === "cell"
			? "Protium, the experimental fuel, is bought with research. Its quirk is written into its field notes the first time it shows."
			: "Its sixth tier is experimental, bought with research. Each has a quirk, written into its field notes the first time it shows." }) : "",
		...notes.map((t) => h("p", { className: "field-note", textContent: t })),
		ups.length ? h("p", { className: "guide-ups", textContent: `Upgrades: ${ups.join(", ")}.` }) : "");
	return el;
}

/**
 * The guide as plain text, for a spreadsheet or a forum: every family the log
 * has reached, its rules, and each placeable tier's numbers as they stand.
 */
export function datasheet(s) {
	const out = ["Reactor Revived - parts datasheet"];
	for (const [key, name, , lines] of FAMILIES) {
		if (!opened(s, key)) continue;
		out.push("", name.toUpperCase(), ...lines);
		const parts = PARTS.filter((p) => p.category === key).map((p) => s.stats.get(p.id)).filter((p) => isPartVisible(s, p));
		for (const p of parts) {
			const stats = key === "cell"
				? [["power", alone(p).power], ["heat", alone(p).heat], ["life", p.ticks]]
				: FIELDS.filter(([f]) => p[f]).map(([f, l]) => [l.toLowerCase(), p[f]]);
			out.push(`  ${p.title}: ${stats.map(([k, v]) => `${k} ${exact(v)}`).join(", ")}, price $${fmt(p.cost)}`);
		}
	}
	return out.join("\n");
}

/** The whole guide as a sheet, optionally opened at one family. */
export function guideDialog(s, focus = null) {
	const list = FAMILIES.map((f) => family(s, f, focus));
	const dialog = h("dialog", { className: "sheet guide", ariaLabel: "Parts guide" },
		h("h2", { textContent: "Parts guide" }),
		h("i", { textContent: "What each part does, with its numbers as they stand in this game. On the dock, a part's corners give the same numbers: what it makes or moves at the top left, the heat it makes or holds at the top right, its life at the bottom left, its price at the bottom right." }),
		...list,
		h("div", { className: "row" },
			h("button", { textContent: "Close", onclick: () => dialog.close() }),
			h("button", { textContent: "Copy as text", onclick: () => showCode(datasheet(s), "Parts datasheet") })));
	dialog.addEventListener("close", () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
	dialog.querySelector("details[open]")?.scrollIntoView({ block: "start" });
	return dialog;
}

/** The family a part belongs to, for opening the guide at it. */
export const familyOf = (p) => (p?.category === "module" ? "module" : p?.category);
