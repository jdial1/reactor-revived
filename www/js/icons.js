// Interface icons as inline SVG - markup, not image files. Blocky shapes on
// whole-pixel coordinates with a hard dark outline, as the original's were.

const OUTLINE = "#07090c";

/**
 * A pixel grid to one path, each run of matching cells becoming a rectangle.
 * Cells are 2 units, so an 8x8 grid fills the 16-unit box.
 */
const grid = (rows, ch) => rows.flatMap((row, y) => {
	const runs = [];
	for (let x = 0; x < row.length;) {
		if (row[x] !== ch) { x++; continue; }
		let w = 0;
		while (row[x + w] === ch) w++;
		runs.push(`M${x * 2} ${y * 2} h${w * 2} v2 h-${w * 2} z`);
		x += w;
	}
	return runs;
}).join(" ");

// Traced from Knockoff's img/icon_power.gif.
const BOLT = [
	"...####.",
	"..#AA#..",
	".#AA#...",
	"#AA#....",
	".#AA#...",
	"..#AA#..",
	".#AA#...",
	"####....",
];

// img/icon_vent.gif, icon_inlet.gif and icon_outlet.gif: a fan, and heat
// arrows pointing in and out.
const FAN = [
	"...##...",
	"..#AA#..",
	".##BA##.",
	"#AABBBA#",
	"#ABBBAA#",
	".##AB##.",
	"..#AA#..",
	"...##...",
];

const INLET = [
	"..####..",
	"..#AB#..",
	"..#BA#..",
	"###AB###",
	"#BABABA#",
	".#BABA#.",
	"..#BA#..",
	"...##...",
];

const OUTLET = [
	"...##...",
	"..#AB#..",
	".#ABAB#.",
	"#ABABAB#",
	"###BA###",
	"..#AB#..",
	"..#BA#..",
	"..####..",
];

// From img/icon_heat.gif: a fire seen head on, not a teardrop.
const FLAME = [
	"..#.....",
	".#A#.#..",
	"#AAA#A#.",
	"#ABBBBB#",
	".#BCCB#.",
	".#CDDC#.",
	"..#DD#..",
	"...##...",
];

// [path, fill]. A fill of null means "inherit from the text colour".
const ICONS = {
	// Knockoff's bolt and flame, in Knockoff's colours.
	power: [[grid(BOLT, "#"), OUTLINE], [grid(BOLT, "A"), "#ffff00"]],
	heat: [
		[grid(FLAME, "#"), OUTLINE],
		[grid(FLAME, "A"), "#ff0000"],
		[grid(FLAME, "B"), "#ff4e00"],
		[grid(FLAME, "C"), "#ff8a00"],
		[grid(FLAME, "D"), "#ffff00"],
	],


	vent: [[grid(FAN, "#"), OUTLINE], [grid(FAN, "A"), "#c0c0c0"], [grid(FAN, "B"), "#808080"]],
	inlet: [[grid(INLET, "#"), OUTLINE], [grid(INLET, "A"), "#ff8a00"], [grid(INLET, "B"), "#ff4e00"]],
	outlet: [[grid(OUTLET, "#"), OUTLINE], [grid(OUTLET, "A"), "#ff8a00"], [grid(OUTLET, "B"), "#ff4e00"]],

	play: [["M3 1 L14 8 L3 15 Z", null]],
	pause: [["M3 1 h4 v14 h-4 z M9 1 h4 v14 h-4 z", null]],
	flux: [["M1 2 L8 8 L1 14 Z M8 2 L15 8 L8 14 Z", null]],
	// Plan: a pencil.
	plan: [["M11 1 L15 5 L5 15 L1 15 L1 11 Z", null]],

	// bottom navigation
	// The reactor: a grid of tiles.
	reactor: [["M1 1 h6 v6 h-6 z M9 1 h6 v6 h-6 z M1 9 h6 v6 h-6 z M9 9 h6 v6 h-6 z", null]],
	// Upgrades: an arrow going up.
	upgrades: [["M8 0 L15 8 h-4 v8 h-6 v-8 h-4 z", null]],
	// Experiments: a flask.
	experiments: [["M4 0 h8 v2 h-2 v4 l4 9 v1 h-12 v-1 l4 -9 v-4 h-2 z", null]],
	// Modules: a casing of nine.
	modules: [["M1 1 h4 v4 h-4 z M6 1 h4 v4 h-4 z M11 1 h4 v4 h-4 z M1 6 h4 v4 h-4 z M6 6 h4 v4 h-4 z M11 6 h4 v4 h-4 z M1 11 h4 v4 h-4 z M6 11 h4 v4 h-4 z M11 11 h4 v4 h-4 z", null]],
	// Options: sliders.
	options: [["M1 2 h14 v2 h-14 z M1 7 h14 v2 h-14 z M1 12 h14 v2 h-14 z", null],
		["M4 0 h2 v6 h-2 z M10 5 h2 v6 h-2 z M5 10 h2 v6 h-2 z", null]],
};

/** One icon, as an <svg>. Monochrome ones inherit the text colour. */
export function icon(name, className = "icon") {
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", "0 0 16 16");
	svg.setAttribute("class", className);
	svg.setAttribute("aria-hidden", "true");

	// An icon that draws its own outline pixels must not also be stroked, or the
	// stroke swallows the shape.
	const selfOutlined = ICONS[name].some(([, f]) => f === OUTLINE);

	for (const [d, fill] of ICONS[name]) {
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", d);
		path.setAttribute("fill", fill ?? "currentColor");
		if (fill && !selfOutlined) {
			// Outline behind the fill, the way the sprite art does it.
			path.setAttribute("stroke", OUTLINE);
			path.setAttribute("stroke-width", "1.5");
			path.setAttribute("stroke-linejoin", "round");
			path.setAttribute("paint-order", "stroke");
		}
		svg.append(path);
	}
	return svg;
}
