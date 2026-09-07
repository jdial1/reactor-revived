// Every part icon is computed, not shipped. Twelve 8x8 shape strings and one
// palette function cover all 75 parts: the shape comes from the category, the
// colour from the category's hue and the tier's brightness. Drawn once into an
// 8x8 canvas at boot and cached as a data URL.
//
// Rendering assets instead of shipping them is the whole point - the original's
// ~140 GIFs weighed more than this entire game.

// ' ' is transparent; 1-4 index the palette from darkest to brightest.
const SHAPES = {
	// Fuel rods, one per unit in the pack.
	cell1: [
		"        ",
		"  3333  ",
		"  3223  ",
		"  3223  ",
		"  3223  ",
		"  3223  ",
		"  3333  ",
		"        ",
	],
	cell2: [
		"        ",
		" 33  33 ",
		" 32  23 ",
		" 32  23 ",
		" 32  23 ",
		" 32  23 ",
		" 33  33 ",
		"        ",
	],
	cell4: [
		" 33  33 ",
		" 32  23 ",
		" 33  33 ",
		"        ",
		" 33  33 ",
		" 32  23 ",
		" 33  33 ",
		"        ",
	],
	// Angled mirror.
	reflector: [
		"    4444",
		"   4332 ",
		"  4332  ",
		" 4332   ",
		"4332    ",
		"332     ",
		"32      ",
		"2       ",
	],
	// Charged plates.
	capacitor: [
		"        ",
		" 444444 ",
		" 4    4 ",
		" 4 33 4 ",
		" 4 33 4 ",
		" 4    4 ",
		" 444444 ",
		"        ",
	],
	// Fins bleeding heat upward.
	vent: [
		" 4 4 4  ",
		" 4 4 4  ",
		"333333  ",
		"3    3  ",
		"333333  ",
		" 4 4 4  ",
		" 4 4 4  ",
		"        ",
	],
	// Interleaved pipes.
	heat_exchanger: [
		"        ",
		"44444444",
		"2      2",
		"44444444",
		"2      2",
		"44444444",
		"        ",
		"        ",
	],
	// Arrow pointing in.
	heat_inlet: [
		"   44   ",
		"  4444  ",
		" 444444 ",
		"   44   ",
		"   44   ",
		"  3333  ",
		"  3333  ",
		"        ",
	],
	// Arrow pointing out.
	heat_outlet: [
		"        ",
		"  3333  ",
		"  3333  ",
		"   44   ",
		"   44   ",
		" 444444 ",
		"  4444  ",
		"   44   ",
	],
	// Sealed canister.
	coolant_cell: [
		"        ",
		" 333333 ",
		" 322223 ",
		" 324423 ",
		" 324423 ",
		" 322223 ",
		" 333333 ",
		"        ",
	],
	// Riveted armour.
	reactor_plating: [
		"44444444",
		"4322223 ",
		"43    3 ",
		"43 44 3 ",
		"43 44 3 ",
		"43    3 ",
		"4333333 ",
		"        ",
	],
	// Ring with a core.
	particle_accelerator: [
		"  3333  ",
		" 3    3 ",
		"3  44  3",
		"3 4444 3",
		"3 4444 3",
		"3  44  3",
		" 3    3 ",
		"  3333  ",
	],
};

// One hue per category. Tier shifts brightness, so a tier-6 part reads as the
// same component, glowing.
const HUE = {
	cell: 96,
	reflector: 45,
	capacitor: 205,
	vent: 190,
	heat_exchanger: 280,
	heat_inlet: 25,
	heat_outlet: 5,
	coolant_cell: 165,
	reactor_plating: 220,
	particle_accelerator: 310,
};

const SIZE = 8;
const cache = new Map();

/** Four shades of one hue, brighter and more saturated at higher tiers. */
function palette(hue, level) {
	const lift = (level - 1) * 5;
	const sat = Math.min(90, 40 + level * 8);
	return [22, 38, 55, 76].map((l) => `hsl(${hue} ${sat}% ${Math.min(92, l + lift)}%)`);
}

const shapeKey = (p) => (p.category === "cell" ? `cell${p.cellCount}` : p.category);

/** A data-URL PNG for one part, drawn once and remembered. */
export function spriteFor(part) {
	const cached = cache.get(part.id);
	if (cached) return cached;

	const rows = SHAPES[shapeKey(part)];
	const shades = palette(HUE[part.category], part.level);

	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = SIZE;
	const ctx = canvas.getContext("2d");
	for (let y = 0; y < SIZE; y++) {
		for (let x = 0; x < SIZE; x++) {
			const ch = rows[y][x];
			if (ch === " ") continue;
			ctx.fillStyle = shades[Number(ch) - 1];
			ctx.fillRect(x, y, 1, 1);
		}
	}

	const url = canvas.toDataURL();
	cache.set(part.id, url);
	return url;
}
