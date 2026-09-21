// One source, one path: Reactor Revival's art in www/parts/revival/.

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

// A module wears the art of whichever part its designer chose.
export const artFor = (part) => part.art ?? `parts/revival/${fileFor(part)}.png`;
