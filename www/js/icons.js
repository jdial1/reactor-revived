// Interface icons as inline SVG - markup, not image files.
//
// The style follows the original's 16px sprites: blocky shapes on whole-pixel
// coordinates with a hard dark outline, a yellow bolt for power and a
// red-to-yellow flame for heat. Nav icons are monochrome and take their colour
// from the surrounding text, so the active tab lights up for free.

const OUTLINE = "#07090c";

/**
 * A pixel grid to one path, each run of matching cells becoming a rectangle.
 *
 * The power and heat icons are traced from Reactor Knockoff's own 8x8 art, and
 * a grid is how that art is legible in source - a hand-written path for a
 * fifteen-step zigzag is neither readable nor checkable against the original.
 * Cells are 2 units, so an 8x8 grid fills the 16-unit box like everything else.
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

// Traced pixel for pixel from Knockoff's img/icon_power.gif: a zigzag ribbon
// with the outline cut flat at the top right and bottom left.
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

// From img/icon_cash.gif: a coin, not a dollar sign.
const COIN = [
	"...##...",
	"..#AA#..",
	".#AAAA#.",
	".#AA##..",
	"..#AAA#.",
	".#AAAA#.",
	"..#AA#..",
	"...##...",
];

// From img/icon_heat.gif: wide and forked at the top, tapering to a point at
// the bottom - a fire seen head on rather than a symmetrical teardrop.
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

	cash: [[grid(COIN, "#"), OUTLINE], [grid(COIN, "A"), "#00c000"]],

	vent: [[grid(FAN, "#"), OUTLINE], [grid(FAN, "A"), "#c0c0c0"], [grid(FAN, "B"), "#808080"]],
	inlet: [[grid(INLET, "#"), OUTLINE], [grid(INLET, "A"), "#ff8a00"], [grid(INLET, "B"), "#ff4e00"]],
	outlet: [[grid(OUTLET, "#"), OUTLINE], [grid(OUTLET, "A"), "#ff8a00"], [grid(OUTLET, "B"), "#ff4e00"]],

	play: [["M3 1 L14 8 L3 15 Z", null]],
	pause: [["M3 1 h4 v14 h-4 z M9 1 h4 v14 h-4 z", null]],

	// ---- bottom navigation ------------------------------------------------
	// The reactor: a grid of tiles.
	reactor: [["M1 1 h6 v6 h-6 z M9 1 h6 v6 h-6 z M1 9 h6 v6 h-6 z M9 9 h6 v6 h-6 z", null]],
	// Upgrades: an arrow going up.
	upgrades: [["M8 0 L15 8 h-4 v8 h-6 v-8 h-4 z", null]],
	// Experiments: a flask.
	experiments: [["M4 0 h8 v2 h-2 v4 l4 9 v1 h-12 v-1 l4 -9 v-4 h-2 z", null]],
	// Goals: a tick.
	goals: [["M2 8 l2 -2 l3 3 l7 -7 l2 2 l-9 9 z", null]],
	// Options: sliders.
	options: [["M1 2 h14 v2 h-14 z M1 7 h14 v2 h-14 z M1 12 h14 v2 h-14 z", null],
		["M4 0 h2 v6 h-2 z M10 5 h2 v6 h-2 z M5 10 h2 v6 h-2 z", null]],
};

/**
 * One icon, as an <svg>. Coloured icons carry the original's dark outline;
 * monochrome ones inherit the text colour so an active tab lights up for free.
 */
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
