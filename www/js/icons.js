// Interface icons as inline SVG - markup, not image files.
//
// The style follows the original's 16px sprites: blocky shapes on whole-pixel
// coordinates with a hard dark outline, a yellow bolt for power and a
// red-to-yellow flame for heat. Nav icons are monochrome and take their colour
// from the surrounding text, so the active tab lights up for free.

const OUTLINE = "#07090c";

// [path, fill]. A fill of null means "inherit from the text colour".
const ICONS = {
	// A lightning bolt, as in the original's power readout.
	power: [["M10 0 L3 9 h4 l-1 7 l8 -10 h-4 z", "#f2c53d"]],

	// A flame: red at the edges, yellow at the core.
	heat: [
		["M8 0 L11 4 L11 7 L13 10 L13 12 L10 16 L6 16 L3 12 L3 9 L6 5 L7 8 Z", "#e0452a"],
		["M8 5 L10 9 L10 12 L8 15 L6 12 L6 10 Z", "#f5a623"],
		["M8 9 L9 11 L9 13 L8 15 L7 13 L7 11 Z", "#f7e05a"],
	],

	// A dollar sign, for selling power.
	cash: [["M7 0 h2 v2 h4 v3 h-3 v-1 h-4 v2 h5 v1 h2 v6 h-4 v2 h-2 v-2 h-4 v-3 h3 v1 h4 v-2 h-5 v-1 h-2 v-6 h4 z", "#5ec269"]],

	// The four-way fan of a heat vent.
	vent: [["M6 0 h4 v4 l3 -1 l1 3 l-3 1 v2 l3 1 l-1 3 l-3 -1 v4 h-4 v-4 l-3 1 l-1 -3 l3 -1 v-2 l-3 -1 l1 -3 l3 1 z", "#8fd3e0"]],

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

	for (const [d, fill] of ICONS[name]) {
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", d);
		path.setAttribute("fill", fill ?? "currentColor");
		if (fill) {
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
