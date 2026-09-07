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
// Drawn on a 16x16 grid and painted as 2x2 blocks, which is what the rest of
// the lineage does: IndustrialCraft is natively 16x16, and both Reactor
// Incremental and Reactor Knockoff ship 32px files that are 2x upscales of
// 16x16 art. Sampling at 32 instead gave us half-pixel detail none of them
// have, which is what made these read as soft blobs rather than as pixel art.
//
// The forms are rectilinear for the same reason. The lineage draws squares
// with cut corners where a circle would be, so oct() is used in place of a
// disc, and every part keeps a margin instead of running to the canvas edge.
//
// Shapes come from primitives rather than typed-out pixel grids, so octagons,
// capsules and fan blades stay accurate. The black outline is derived, not
// drawn: any empty cell touching a painted one becomes it.

const GRID = 16;   // the art grid, as in every other game in the lineage
const SCALE = 2;   // painted as 2x2 blocks, so the output is still 32x32
const SIZE = GRID * SCALE;
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
const ring = (cx, cy, inner, outer) => (x, y) => oct(cx, cy, outer)(x, y) && !oct(cx, cy, inner)(x, y);
const rect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const diamond = (cx, cy, r) => (x, y) => Math.abs(x - cx) + Math.abs(y - cy) <= r;
const any = (...tests) => (x, y) => tests.some((t) => t(x, y));
const not = (test) => (x, y) => !test(x, y);

/** A square with cut corners - what the lineage draws where a circle would be. */
const oct = (cx, cy, r) => (x, y) => {
	const dx = Math.abs(x - cx);
	const dy = Math.abs(y - cy);
	return dx <= r && dy <= r && dx + dy <= r * 1.5;
};

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
const stipple = (test) => (x, y) => test(x, y) && (x + y) % 2 === 0;

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
	const cap = Math.max(1, Math.round(r * 0.7));
	return [
		[seg(cx, cy - half, cx, cy + half, r), "steel"],
		[seg(cx, cy - half + cap, cx, cy + half - cap, r - 1), "core"],
		[seg(cx - r * 0.4, cy - half + cap, cx - r * 0.4, cy + half - cap, 0.4), "coreLit"],
	];
};

const SHAPES = {
	cell1: fuelRod(8, 8, 3.5, 3.5),
	cell2: [...fuelRod(4.5, 8, 3.5, 2.5), ...fuelRod(11.5, 8, 3.5, 2.5)],
	cell4: [
		...fuelRod(4.5, 4.5, 0.8, 2.5), ...fuelRod(11.5, 4.5, 0.8, 2.5),
		...fuelRod(4.5, 11.5, 0.8, 2.5), ...fuelRod(11.5, 11.5, 0.8, 2.5),
	],

	// A canister with a mirrored face and a tier band.
	reflector: [
		[rect(4, 1, 11, 14), "steel"],
		[rect(3, 6, 12, 9), "tier"],
		[rect(5, 2, 6, 13), "shine"],
	],

	// A block with two terminals on top and a charged window.
	capacitor: [
		[rect(4, 0, 6, 4), "steel"],
		[rect(9, 0, 11, 4), "steel"],
		[rect(2, 4, 13, 14), "steel"],
		[rect(4, 6, 11, 12), "tier"],
		[rect(5, 7, 10, 8), "shadow"],
	],

	// A bladed fan in a squared-off housing, as the lineage draws it.
	vent: [
		[oct(8, 8, 6), "steel"],
		// A groove round the rim, but the face stays steel: dark blades on a
		// pale face is what makes a tier-1 vent read as a fan at all.
		[ring(8, 8, 4.5, 6), "shadow"],
		[blades(8, 8, 1.5, 4.5, 62, 12), "tier"],
		[oct(8, 8, 1.5), "shadow"],
	],

	// A cross of pipes with a hub the heat passes through.
	heat_exchanger: [
		[any(rect(5, 2, 10, 13), rect(2, 5, 13, 10)), "steel"],
		[any(rect(6, 2, 6, 13), rect(2, 6, 13, 6)), "shadow"],
		[oct(8, 8, 4.5), "steel"],
		[diamond(8, 8, 3), "core"],
	],

	// A funnel drawing heat up out of the parts around it.
	heat_inlet: [
		[rect(2, 3, 13, 6), "steel"],
		[rect(2, 6, 13, 6), "shadow"],
		[rect(6, 6, 9, 13), "steel"],
		[rect(7, 7, 8, 13), "core"],
		[diamond(8, 3, 2.5), "core"],
	],

	// The same funnel inverted, pushing heat down into them.
	heat_outlet: [
		[rect(2, 9, 13, 12), "steel"],
		[rect(2, 9, 13, 9), "shadow"],
		[rect(6, 2, 9, 9), "steel"],
		[rect(7, 2, 8, 8), "core"],
		[diamond(8, 12, 2.5), "core"],
	],

	// A canister of stippled coolant behind a window.
	coolant_cell: [
		[rect(4, 1, 11, 14), "steel"],
		[rect(5, 3, 10, 12), "shadow"],
		[stipple(rect(5, 3, 10, 12)), "core"],
		[any(rect(2, 3, 3, 12), rect(12, 3, 13, 12)), "tier"],
	],

	// A bevelled armour plate with bolts at its corners.
	reactor_plating: [
		[rect(1, 1, 14, 14), "steel"],
		[rect(3, 3, 12, 12), "shadow"],
		[rect(4, 4, 11, 11), "steel"],
		[any(rect(2, 2, 3, 3), rect(12, 2, 13, 3), rect(2, 12, 3, 13), rect(12, 12, 13, 13)), "shadow"],
	],

	// Magnet poles around a ring, with the core glowing at the centre.
	particle_accelerator: [
		[oct(8, 8, 6), "steel"],
		[ring(8, 8, 2.5, 4.5), "shadow"],
		[blades(8, 8, 4.5, 6, 45, 22), "tier"],
		[ring(8, 8, 3, 4), "core"],
		[oct(8, 8, 2), "core"],
	],
};

// Each tier wears different hardware, so a tier is recognisable by shape as
// well as by colour. Indexed by level - 1; tier 1 is bare. Laid down beneath
// the body, so a louvre frames the part instead of erasing it.
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
	ring(8, 8, 6.5, 7.5),
	// 5: louvres across the face
	any(rect(0, 0, 15, 1), rect(0, 7, 15, 8), rect(0, 14, 15, 15)),
	// 6: a full cage
	not(rect(2, 2, 13, 13)),
];

// A little surface texture, so the higher tiers read as busier.
const GREEBLES = [
	[4, (x, y) => x % 5 === 2 && y % 5 === 2, "shadow"],
	[6, (x, y) => (x + 2 * y) % 4 === 0, "shadow"],
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

	const material = new Array(GRID * GRID).fill(null);
	for (const [region, kind] of layers) {
		for (let y = 0; y < GRID; y++) {
			for (let x = 0; x < GRID; x++) if (region(x, y)) material[y * GRID + x] = kind;
		}
	}

	for (const [level, pattern, kind] of GREEBLES) {
		if (part.level < level) continue;
		for (let y = 0; y < GRID; y++) {
			for (let x = 0; x < GRID; x++) {
				if (material[y * GRID + x] === "steel" && pattern(x, y)) material[y * GRID + x] = kind;
			}
		}
	}

	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = SIZE;
	const ctx = canvas.getContext("2d");
	const at = (x, y) => (x < 0 || y < 0 || x >= GRID || y >= GRID ? null : material[y * GRID + x]);

	for (let y = 0; y < GRID; y++) {
		for (let x = 0; x < GRID; x++) {
			const kind = at(x, y);
			if (!kind) {
				// Derive the outline: empty, but touching something painted.
				if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) {
					ctx.fillStyle = OUTLINE;
					ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
				}
				continue;
			}
			// One light source at the top left, as in the original.
			ctx.fillStyle = paint[kind][x + y < GRID - 1 ? 1 : 0];
			ctx.fillRect(x * SCALE, y * SCALE, SCALE, SCALE);
		}
	}

	const url = canvas.toDataURL();
	cache.set(part.id, url);
	return url;
}
