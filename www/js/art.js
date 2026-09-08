// Where part artwork comes from.
//
// Every game in the lineage draws the same components, so any of them can skin
// this one. A pack is a folder of PNGs under www/parts/<id>/ plus a rule for
// turning one of our part ids into that game's filename - each names things
// differently, which is the only reason this is per-pack code rather than one
// template.
//
// "generated" is the built-in pack: no files at all, drawn from geometry at
// runtime. parts/packs.json, written by docs/install_art_packs.py, lists which
// packs are installed and which sprites each one actually has - the older games
// stop at tier 5 for several categories, and none of them has a particle
// accelerator, so every pack has gaps that fall back to generated art.
import { spriteFor } from "./sprites.js";

// The order fuels appear in the catalog; the older games number their cell art
// by that position rather than by name.
const FUEL_INDEX = {
	uranium: 1, plutonium: 2, thorium: 3, seaborgium: 4, dolorium: 5, nefastium: 6,
};

const CATEGORY = {
	vent: "vent",
	heat_exchanger: "exchanger",
	heat_inlet: "inlet",
	heat_outlet: "outlet",
	coolant_cell: "coolant_cell",
	reflector: "reflector",
	capacitor: "capacitor",
	reactor_plating: "plating",
	particle_accelerator: "accelerator",
};

/** Reactor Revival and Reactor Knockoff share a naming scheme, bar one word. */
const knockoffStyle = (coolant) => (p) => {
	if (p.category === "cell") {
		// Protium is the experimental fuel and gets its own "x" prefix.
		const stem = p.type === "protium" ? "xcell_1" : `cell_${FUEL_INDEX[p.type]}`;
		return `${stem}_${p.cellCount}`;
	}
	return `${p.category === "coolant_cell" ? coolant : CATEGORY[p.category]}_${p.level}`;
};

/** Reactor Incremental and its sequel use CamelCase and a different quad name. */
const caelStyle = (quad) => (p) => {
	if (p.category === "cell") {
		if (p.type === "protium") return null; // no experimental fuel art
		return `Fuel${FUEL_INDEX[p.type]}-${p.cellCount === 4 ? quad : p.cellCount}`;
	}
	const name = {
		vent: "Vent", heat_exchanger: "Exchanger", heat_inlet: "Inlet",
		heat_outlet: "Outlet", coolant_cell: "Coolant", reflector: "Reflector",
		capacitor: "Capacitor", reactor_plating: "Plate",
	}[p.category];
	return name ? `${name}${p.level}` : null; // neither game has an accelerator
};

export const PACKS = {
	generated: { label: "Generated (no files)", file: null },
	revival: { label: "Reactor Revival", file: knockoffStyle("coolant_cell") },
	// This game's own art: ten drawn shapes, the other 65 sprites derived from
	// them by docs/build_revived_pack.py. Same filenames as Revival.
	revived: { label: "Reactor Revived", file: knockoffStyle("coolant_cell") },
	knockoff: { label: "Reactor Knockoff", file: knockoffStyle("coolant") },
	incremental: { label: "Reactor Incremental", file: caelStyle(4) },
	redux: { label: "Reactor Redux", file: caelStyle(3) },
};

export const DEFAULT_PACK = "revival";

// Pack id to the set of sprite names it ships, filled in at boot from
// parts/packs.json. "generated" needs no files and so is always available.
let installed = { generated: null };

export const availablePacks = () => Object.keys(installed).filter((id) => PACKS[id]);

/** Read which packs shipped with this build. Falls back to generated only. */
export async function loadPacks() {
	try {
		const res = await fetch("parts/packs.json");
		if (res.ok) {
			for (const [id, names] of Object.entries(await res.json())) {
				installed[id] = new Set(names);
			}
		}
	} catch {
		// No packs installed; the generated art is always there.
	}
	return availablePacks();
}

/**
 * The image for one part in one pack. Falls back to the generated sprite for
 * anything the pack does not have - Cael's games have no particle accelerator,
 * no game but ours has seven fuels, and several categories stop at tier 5.
 */
export function artFor(part, pack) {
	const spec = PACKS[pack];
	const have = installed[pack];
	if (!spec?.file || !have) return spriteFor(part);
	const name = spec.file(part);
	return name && have.has(name) ? `parts/${pack}/${name}.png` : spriteFor(part);
}
