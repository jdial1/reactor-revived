// Every part icon is computed, not shipped.
//
// The original's art is IndustrialCraft-derived, and it reads on three axes at
// once:
//
//   * a steel body with a hard black outline and a light source at top left
//   * a TIER colour, the same across every category - plain steel, gold,
//     green, blue, red, violet - so you can tell a tier-4 anything at a glance
//   * a FUNCTION colour that never changes with tier: orange wherever heat is
//     being moved, cyan for coolant, and the element's own colour for fuel
//
// That is the vocabulary these shapes reproduce. They are built from
// primitives rather than typed out as pixel grids - discs and diagonal
// capsules come out accurate instead of approximated, and the whole vocabulary
// is a dozen lines instead of two hundred rows of string. The black outline is
// derived, not drawn: any empty pixel touching a painted one becomes it.

const SIZE = 16;
const OUTLINE = "#07090c";
// Steel: the shaded side and the lit side, plus an etched-line dark.
const STEEL = ["#5c656f", "#939da8"];
const SHADOW = ["#3a4149", "#3a4149"];

// ---- primitives: each returns a (x, y) => boolean --------------------------

/** Distance to a line segment: capsules, rods and pipes at any angle. */
const seg = (x0, y0, x1, y1, r) => (x, y) => {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const len = dx * dx + dy * dy;
	const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len));
	return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)) <= r;
};

const disc = (cx, cy, r) => seg(cx, cy, cx, cy, r);
const ring = (cx, cy, inner, outer) => (x, y) => disc(cx, cy, outer)(x, y) && !disc(cx, cy, inner)(x, y);
const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const diamond = (cx, cy, r) => (x, y) => Math.abs(x - cx) + Math.abs(y - cy) <= r;
const any = (...tests) => (x, y) => tests.some((t) => t(x, y));
/** A shape stippled every other pixel, the way the original draws coolant. */
const stipple = (test) => (x, y) => test(x, y) && (x + y) % 2 === 0;
const corners = any(rect(0, 0, 4, 4), rect(11, 0, 15, 4), rect(0, 11, 4, 15), rect(11, 11, 15, 15));
/** The four tips of a plus, so colouring them keeps the plus silhouette. */
const armTips = any(rect(6, 0, 9, 2), rect(6, 13, 9, 15), rect(0, 6, 2, 9), rect(13, 6, 15, 9));

// ---- the parts -------------------------------------------------------------
// Each is a list of [region, material]; later entries paint over earlier ones.
// Materials: "steel", "tier" (the tier colour), "core" (the function colour).

// A fuel rod: a steel capsule with the element's colour glowing inside. Packs
// of two and four are the same rod repeated on a 2x1 or 2x2 grid, sitting
// close enough that only the outline separates them - the way the original
// draws bundled fuel.
const rod = (cx, cy, half, r) => [
	[seg(cx, cy - half, cx, cy + half, r), "steel"],
	[seg(cx, cy - half, cx, cy + half, r - 1.2), "core"],
];

const SHAPES = {
	cell1: rod(7.5, 7.5, 4.4, 3.4),
	cell2: [...rod(4.1, 7.5, 4.4, 3.4), ...rod(11.9, 7.5, 4.4, 3.4)],
	cell4: [
		...rod(4.4, 4.3, 0.5, 3.2), ...rod(11.6, 4.3, 0.5, 3.2),
		...rod(4.4, 11.7, 0.5, 3.2), ...rod(11.6, 11.7, 0.5, 3.2),
	],

	// A capsule with a tier band across its middle.
	reflector: [
		[seg(7.5, 3.5, 7.5, 12.5, 3.4), "steel"],
		[rect(4, 7, 11, 9), "tier"],
	],

	// A block with two terminals on top.
	capacitor: [
		[rect(4, 1, 6, 4), "steel"],
		[rect(9, 1, 11, 4), "steel"],
		[seg(7.5, 9.5, 7.5, 10.5, 4.5), "steel"],
		[rect(5, 8, 10, 13), "tier"],
	],

	// A round housing whose fan blades carry the tier colour.
	vent: [
		[disc(7.5, 7.5, 6.6), "steel"],
		[seg(3.5, 3.5, 11.5, 11.5, 1.5), "tier"],
		[seg(11.5, 3.5, 3.5, 11.5, 1.5), "tier"],
		[disc(7.5, 7.5, 2.1), "steel"],
	],

	// A fat plus with tier-coloured arm tips and the orange hub heat moves
	// through. Colouring the tips rather than the corners keeps the plus
	// silhouette, so a tier-1 exchanger still reads differently from a plate.
	heat_exchanger: [
		[any(rect(6, 0, 9, 15), rect(0, 6, 15, 9)), "steel"],
		[armTips, "tier"],
		[diamond(7.5, 7.5, 3.2), "core"],
	],

	// A T of pipe drawing heat up out of its neighbours.
	heat_inlet: [
		[rect(2, 2, 13, 5), "steel"],
		[seg(7.5, 5, 7.5, 13.5, 2.4), "steel"],
		[any(rect(1, 2, 3, 6), rect(12, 2, 14, 6)), "tier"],
		[seg(7.5, 6, 7.5, 13, 1.1), "core"],
		[rect(5, 3, 10, 4), "core"],
	],

	// The same pipe inverted, pushing heat down into them.
	heat_outlet: [
		[rect(2, 10, 13, 13), "steel"],
		[seg(7.5, 2.5, 7.5, 10, 2.4), "steel"],
		[any(rect(1, 9, 3, 13), rect(12, 9, 14, 13)), "tier"],
		[seg(7.5, 3, 7.5, 9, 1.1), "core"],
		[rect(5, 11, 10, 12), "core"],
	],

	// A capsule of stippled coolant between tier rails.
	coolant_cell: [
		[seg(7.5, 3.5, 7.5, 12.5, 3.4), "steel"],
		[any(rect(4, 4, 5, 12), rect(10, 4, 11, 12)), "tier"],
		[stipple(rect(6, 4, 9, 12)), "core"],
	],

	// A bevelled armour plate with tier corners.
	reactor_plating: [
		[rect(1, 1, 14, 14), "steel"],
		[corners, "tier"],
		[diamond(7.5, 7.5, 4), "steel"],
	],

	// A ring of tier pads around an orange core.
	particle_accelerator: [
		[disc(7.5, 7.5, 6.6), "steel"],
		[ring(7.5, 7.5, 3.4, 5), "tier"],
		[disc(7.5, 7.5, 2.4), "core"],
	],
};

// Each tier wears different hardware, so a tier is recognisable by shape as
// well as by colour - the way the original turns a round fan into an X, then a
// louvred grille, then a caged one. Indexed by level - 1; tier 1 is bare.
const TIER_TRIM = [
	null,
	// 2: rails down both sides
	any(rect(0, 4, 1, 11), rect(14, 4, 15, 11)),
	// 3: corner brackets
	any(
		rect(0, 0, 4, 1), rect(0, 0, 1, 4), rect(11, 0, 15, 1), rect(14, 0, 15, 4),
		rect(0, 14, 4, 15), rect(0, 11, 1, 15), rect(11, 14, 15, 15), rect(14, 11, 15, 15),
	),
	// 4: a containment ring
	ring(7.5, 7.5, 6.4, 7.6),
	// 5: louvres across the face
	any(rect(1, 1, 14, 2), rect(1, 7, 14, 8), rect(1, 13, 14, 14)),
	// 6: a full cage
	(x, y) => !rect(2, 2, 13, 13)(x, y),
];

// A little surface texture on top, so the higher tiers read as busier.
const GREEBLES = [
	[4, (x, y) => x % 6 === 2 && y % 6 === 2, "shadow"],
	[6, (x, y) => (x + 2 * y) % 5 === 0, "shadow"],
];

// The tier ramp, shared by every category so a tier reads at a glance. Tier 1
// is bare steel in the original, so its "colour" is just a lighter steel.
const TIER_HUE = [
	[210, 6],   // 1 - plain
	[45, 78],   // 2 - gold
	[105, 58],  // 3 - green
	[215, 68],  // 4 - blue
	[0, 62],    // 5 - red
	[275, 68],  // 6 - violet, the experimental tier
];

// Function colours, fixed regardless of tier.
const HEAT = [25, 88];
const COOLANT = [196, 85];

// Fuel is coloured by element, so uranium and thorium never read as the same
// part; pack size is carried by the shape instead.
const FUEL_HUE = {
	uranium: 96,
	plutonium: 40,
	thorium: 172,
	seaborgium: 210,
	dolorium: 268,
	nefastium: 330,
	protium: 186,
};

// Which categories have a function colour, and what it is.
const CORE = {
	heat_exchanger: HEAT,
	heat_inlet: HEAT,
	heat_outlet: HEAT,
	particle_accelerator: HEAT,
	coolant_cell: COOLANT,
};

const cache = new Map();

/** Shaded and lit versions of one [hue, saturation]. */
const shades = ([hue, sat]) => [42, 62].map((l) => `hsl(${hue} ${sat}% ${l}%)`);

const shapeKey = (p) => (p.category === "cell" ? `cell${p.cellCount}` : p.category);
const coreOf = (p) => (p.category === "cell" ? [FUEL_HUE[p.type], 70] : CORE[p.category] ?? TIER_HUE[p.level - 1]);

/** A data-URL PNG for one part, drawn once and remembered. */
export function spriteFor(part) {
	const cached = cache.get(part.id);
	if (cached) return cached;

	const paint = {
		steel: STEEL,
		shadow: SHADOW,
		tier: shades(TIER_HUE[part.level - 1]),
		core: shades(coreOf(part)),
	};

	const material = new Array(SIZE * SIZE).fill(null);
	// Fuel is identified by its element, so packs stay bare; everything else
	// wears its tier's hardware. The trim is laid down first so the body sits
	// on top of it - otherwise a louvre or a cage just erases the part.
	const trim = part.category === "cell" ? null : TIER_TRIM[part.level - 1];
	const layers = trim ? [[trim, "tier"], ...SHAPES[shapeKey(part)]] : SHAPES[shapeKey(part)];

	for (const [region, kind] of layers) {
		for (let y = 0; y < SIZE; y++) {
			for (let x = 0; x < SIZE; x++) if (region(x, y)) material[y * SIZE + x] = kind;
		}
	}

	// Detailing, applied over steel only so it never obscures what a part does.
	for (const [level, pattern, kind] of GREEBLES) {
		if (part.level < level) continue;
		for (let y = 0; y < SIZE; y++) {
			for (let x = 0; x < SIZE; x++) {
				if (material[y * SIZE + x] === "steel" && pattern(x, y)) material[y * SIZE + x] = kind;
			}
		}
	}

	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = SIZE;
	const ctx = canvas.getContext("2d");
	const at = (x, y) => (x < 0 || y < 0 || x >= SIZE || y >= SIZE ? null : material[y * SIZE + x]);

	for (let y = 0; y < SIZE; y++) {
		for (let x = 0; x < SIZE; x++) {
			const kind = at(x, y);
			if (!kind) {
				// Derive the outline: empty, but touching something painted.
				if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) {
					ctx.fillStyle = OUTLINE;
					ctx.fillRect(x, y, 1, 1);
				}
				continue;
			}
			// One light source at the top left, as in the original.
			ctx.fillStyle = paint[kind][x + y < SIZE - 1 ? 1 : 0];
			ctx.fillRect(x, y, 1, 1);
		}
	}

	const url = canvas.toDataURL();
	cache.set(part.id, url);
	return url;
}
