// Where part artwork comes from.
//
// One source: Reactor Revival's art, in www/parts/revival/. There was a pack
// system here - a registry of every game in the lineage, a manifest of which
// sprites each one had, a saved setting and a picker in Options - and with a
// single pack none of it earned its place.
//
// The generated sprites stay as a fallback, not as a choice. www/parts/ is
// filled by docs/install_art_packs.py rather than committed art being a given,
// so a build without it still runs, drawing every part from geometry: the
// README's "the game can run with no image files at all" is a rule, not a boast.
import { spriteFor } from "./sprites.js";

// The order fuels appear in the catalog; the art numbers cell files by that
// position rather than by name.
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

/** The file a part's art lives in, without the extension. */
export function fileFor(part) {
	if (part.category === "cell") {
		// Protium is the experimental fuel and gets its own "x" prefix.
		const stem = part.type === "protium" ? "xcell_1" : `cell_${FUEL_INDEX[part.type]}`;
		return `${stem}_${part.cellCount}`;
	}
	return `${CATEGORY[part.category]}_${part.level}`;
}

// Whether this build shipped the art at all. One probe at boot beats a manifest
// listing all 75 names, because the pack is either installed or it is not.
let installed = true;

/** Check once whether the art is there. Everything falls back to drawn sprites if not. */
export async function loadArt() {
	try {
		installed = (await fetch("parts/revival/cell_1_1.png")).ok;
	} catch {
		installed = false;
	}
	return installed;
}

export const artFor = (part) => (installed ? `parts/revival/${fileFor(part)}.png` : spriteFor(part));
