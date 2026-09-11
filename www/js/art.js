// Where part artwork comes from.
//
// One source, one path: Reactor Revival's art in www/parts/revival/, 75 PNGs
// that ship in the APK. There was a pack system here once - a registry of every
// game in the lineage, a manifest of which sprites each had, a saved setting and
// a picker in Options - and with a single pack none of it earned its place.
//
// There was also a second copy of the whole set drawn from geometry at runtime,
// as a fallback for a build with no image files. Nothing ever shipped without
// them, so the fallback was 314 lines that only the tests ever ran.

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

export const artFor = (part) => `parts/revival/${fileFor(part)}.png`;
