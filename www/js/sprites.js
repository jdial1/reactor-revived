// Every part icon is computed, not shipped.
//
// The original's art is IndustrialCraft-derived, and it reads on three axes at
// once:
//
//   * a steel body with a hard black outline and a light source at top left
//   * a TIER colour and a piece of TIER HARDWARE, the same across every
//     category - bare, rails, brackets, ring, louvres, cage - so a tier is
//     recognisable by shape as well as by colour
//   * a FUNCTION colour that never changes with tier: orange wherever heat is
//     being moved, cyan for coolant, the element's own colour for fuel
//
// Drawn on a 32x32 grid, which is what it takes for a vent to read as a fan
// and a fuel cell to read as a fuel rod rather than as coloured blobs. Shapes
// are built from primitives rather than typed out as pixel grids, so discs,
// capsules and fan blades come out accurate instead of approximated. The black
// outline is derived, not drawn: any empty pixel touching a painted one
// becomes it.

const SIZE = 32;
const OUTLINE = "#07090c";
// Steel: the shaded side and the lit side, plus an etched-line dark.
const STEEL = ["#5c656f", "#939da8"];
const SHADOW = ["#333a42", "#333a42"];

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
const not = (test) => (x, y) => !test(x, y);

/** A slice of an annulus - the shape of a fan blade or a magnet pole. */
const wedge = (cx, cy, r0, r1, from, span) => (x, y) => {
	const d = Math.hypot(x - cx, y - cy);
	if (d < r0 || d > r1) return false;
	const a = ((((Math.atan2(y - cy, x - cx) * 180) / Math.PI) % 360) + 360) % 360;
	return (a - (((from % 360) + 360) % 360) + 360) % 360 <= span;
};

/** Four of the same wedge, spaced round the centre. */
const blades = (cx, cy, r0, r1, span, offset = 0) =>
	any(...[0, 90, 180, 270].map((a) => wedge(cx, cy, r0, r1, a + offset, span)));

/** A shape in a 2px checker, the way the original draws coolant. */
const stipple = (test) => (x, y) => test(x, y) && (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;

// ---- the parts -------------------------------------------------------------
// Each is a list of [region, material]; later entries paint over earlier ones.
// Materials: "steel", "tier", "core" (the function colour), "shadow" (an
// etched line), "shine" (a highlight).

/**
 * A fuel rod: metal end caps around a glowing core, like a battery. Packs of
 * two and four are this same rod on a 2x1 or 2x2 grid, close enough that only
 * the outline separates them.
 */
const fuelRod = (cx, cy, half, r) => {
	const cap = Math.max(2, r * 0.75);
	return [
		[seg(cx, cy - half, cx, cy + half, r), "steel"],
		[seg(cx, cy - half + cap, cx, cy + half - cap, r - 1.5), "core"],
		// A highlight down the lit side of the core.
		[seg(cx - r * 0.35, cy - half + cap + 1, cx - r * 0.35, cy + half - cap - 1, r * 0.2), "coreLit"],
		// The contact nub on top.
		[rect(cx - r * 0.45, cy - half - r - 1.5, cx + r * 0.45, cy - half - r + 0.5), "steel"],
	];
};

const SHAPES = {
	cell1: fuelRod(16, 16, 8, 7),
	cell2: [...fuelRod(8.3, 16, 8, 6.4), ...fuelRod(23.7, 16, 8, 6.4)],
	cell4: [
		...fuelRod(8.6, 9, 1.5, 6.2), ...fuelRod(23.4, 9, 1.5, 6.2),
		...fuelRod(8.6, 23.4, 1.5, 6.2), ...fuelRod(23.4, 23.4, 1.5, 6.2),
	],

	// A capsule with a mirrored face and a tier band.
	reflector: [
		[seg(16, 9, 16, 23, 7.5), "steel"],
		[rect(7, 13, 25, 19), "tier"],
		// The mirror: a bright streak down the lit side.
		[seg(12.5, 5, 12.5, 27, 1.6), "shine"],
	],

	// A cell with two terminals on top and a charged window.
	capacitor: [
		[rect(8, 1, 13, 9), "steel"],
		[rect(19, 1, 24, 9), "steel"],
		[seg(16, 18, 16, 22, 10), "steel"],
		[rect(10, 13, 22, 27), "tier"],
		[rect(12, 15, 20, 17), "shadow"],
	],

	// A bladed fan in a round housing - the thing a vent most needs to look like.
	vent: [
		[disc(16, 16, 14), "steel"],
		[ring(16, 16, 12, 14), "shadow"],
		[blades(16, 16, 4, 12, 62, 12), "tier"],
		[disc(16, 16, 4.5), "steel"],
		[disc(16, 16, 2), "shadow"],
	],

	// A cross of pipes with an orange hub: heat passing through a junction.
	heat_exchanger: [
		[any(rect(11, 0, 20, 31), rect(0, 11, 31, 20)), "steel"],
		[any(rect(13, 0, 14, 31), rect(0, 13, 31, 14)), "shadow"],
		[disc(16, 16, 10), "steel"],
		[ring(16, 16, 8.5, 10), "shadow"],
		[diamond(16, 16, 7), "core"],
	],

	// A funnel drawing heat up out of the parts around it.
	heat_inlet: [
		[rect(3, 4, 28, 11), "steel"],
		[rect(3, 9, 28, 11), "shadow"],
		[seg(16, 13, 16, 26, 5), "steel"],
		[seg(16, 14, 16, 27, 2.4), "core"],
		// The arrowhead, pointing up into the bar.
		[diamond(16, 6, 5), "core"],
	],

	// The same funnel inverted, pushing heat down into them.
	heat_outlet: [
		[rect(3, 20, 28, 27), "steel"],
		[rect(3, 20, 28, 22), "shadow"],
		[seg(16, 5, 16, 18, 5), "steel"],
		[seg(16, 4, 16, 17, 2.4), "core"],
		[diamond(16, 25, 5), "core"],
	],

	// A canister of stippled coolant behind a window.
	coolant_cell: [
		[seg(16, 9, 16, 23, 7.5), "steel"],
		[rect(10, 6, 22, 26), "shadow"],
		[stipple(rect(10, 6, 22, 26)), "core"],
		[any(rect(7, 4, 10, 28), rect(22, 4, 25, 28)), "tier"],
	],

	// A bevelled armour plate with bolts at its corners.
	reactor_plating: [
		[rect(2, 2, 29, 29), "steel"],
		[rect(5, 5, 26, 26), "shadow"],
		[rect(7, 7, 24, 24), "steel"],
		[any(disc(6, 6, 2.4), disc(25, 6, 2.4), disc(6, 25, 2.4), disc(25, 25, 2.4)), "shadow"],
	],

	// Magnet poles around a ring, with the core glowing at the centre.
	particle_accelerator: [
		[disc(16, 16, 14), "steel"],
		[ring(16, 16, 7, 11), "shadow"],
		[blades(16, 16, 10.5, 14, 45, 22), "tier"],
		[ring(16, 16, 7, 8.5), "core"],
		[disc(16, 16, 4.5), "core"],
	],
};

// Each tier wears different hardware, so a tier is recognisable by shape as
// well as by colour. Indexed by level - 1; tier 1 is bare. Laid down beneath
// the body, so a louvre frames the part instead of erasing it.
const TIER_TRIM = [
	null,
	// 2: rails down both sides
	any(rect(0, 8, 3, 23), rect(28, 8, 31, 23)),
	// 3: corner brackets
	any(
		rect(0, 0, 9, 3), rect(0, 0, 3, 9), rect(22, 0, 31, 3), rect(28, 0, 31, 9),
		rect(0, 28, 9, 31), rect(0, 22, 3, 31), rect(22, 28, 31, 31), rect(28, 22, 31, 31),
	),
	// 4: a containment ring
	ring(16, 16, 13, 15.5),
	// 5: louvres across the face
	any(rect(1, 1, 30, 4), rect(1, 14, 30, 17), rect(1, 27, 30, 30)),
	// 6: a full cage
	not(rect(4, 4, 27, 27)),
];

// A little surface texture, so the higher tiers read as busier.
const GREEBLES = [
	[4, (x, y) => x % 11 === 4 && y % 11 === 4, "shadow"],
	[6, (x, y) => (x + 2 * y) % 9 === 0, "shadow"],
];

// The tier ramp, shared by every category. Tier 1 has no colour of its own, so
// it uses a darker steel - light-on-light would hide the fan blades and the
// hardware entirely.
const TIER_DARK = ["#3a424b", "#49525c"];
const TIER_HUE = [
	[210, 6],   // 1 - plain, drawn with TIER_DARK
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
const bright = ([hue, sat]) => [`hsl(${hue} ${sat}% 72%)`, `hsl(${hue} ${sat}% 84%)`];

const shapeKey = (p) => (p.category === "cell" ? `cell${p.cellCount}` : p.category);
const coreOf = (p) => (p.category === "cell" ? [FUEL_HUE[p.type], 70] : CORE[p.category] ?? TIER_HUE[p.level - 1]);

/** A data-URL PNG for one part, drawn once and remembered. */
export function spriteFor(part) {
	const cached = cache.get(part.id);
	if (cached) return cached;

	const core = coreOf(part);
	const paint = {
		steel: STEEL,
		shadow: SHADOW,
		shine: ["#c8d0d8", "#eef3f7"],
		tier: part.level === 1 ? TIER_DARK : shades(TIER_HUE[part.level - 1]),
		core: shades(core),
		coreLit: bright(core),
	};

	// Fuel is identified by its element, so packs stay bare; everything else
	// wears its tier's hardware, underneath the body.
	const trim = part.category === "cell" ? null : TIER_TRIM[part.level - 1];
	const layers = trim ? [[trim, "tier"], ...SHAPES[shapeKey(part)]] : SHAPES[shapeKey(part)];

	const material = new Array(SIZE * SIZE).fill(null);
	for (const [region, kind] of layers) {
		for (let y = 0; y < SIZE; y++) {
			for (let x = 0; x < SIZE; x++) if (region(x, y)) material[y * SIZE + x] = kind;
		}
	}

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
