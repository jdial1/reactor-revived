// Example layouts the log shows as the goals reach the point where each one is
// the thing to learn next: cooling a cell directly, sending its heat through
// the reactor to vents elsewhere, and spreading a hot block's heat across many
// cheap vents with exchangers instead of paying for the next tier.
// Each is a list of [row, col, part]. A test holds every one to its promise.

const V = "vent1";
const U = "uranium1";
const X = "heat_exchanger1";
const O = "heat_outlet1";

/** Draw a layout from rows of letters: U cell, V vent, X exchanger, O outlet. */
function draw(rows) {
	const key = { U, V, X, O };
	const tiles = [];
	rows.forEach((line, r) => [...line].forEach((ch, c) => {
		if (key[ch]) tiles.push([r, c, key[ch]]);
	}));
	return tiles;
}

export const LESSONS = {
	direct: {
		title: "Direct cooling",
		text: "Every cell touches the vents that take its heat, so none of it reaches the reactor. Each pair of cells has six vents of its own. Turn on Flow in the planner and compare what a cell in a pair makes with what one alone would.",
		tiles: draw([
			"",
			".VV..VV.",
			"VUUVVUUV",
			".VV..VV.",
			"",
			".VV..VV.",
			"VUUVVUUV",
			".VV..VV.",
		]),
	},
	indirect: {
		title: "Indirect cooling",
		text: "These cells touch nothing but each other, so all their heat goes into the reactor. Outlets on the far side pull it back out into the vents around them. The cells can be packed as tight as you like; what you pay for is enough outlets and vents to keep up.",
		tiles: draw([
			"",
			"..UU....",
			"",
			"",
			"",
			".V...V..",
			"VOV.VOV.",
			".V...V..",
		]),
	},
	exchangers: {
		title: "Spreading heat with exchangers",
		text: "A block of four cells makes more heat than the vents touching it can shed. Exchangers around it hold the heat and even it out across a whole ring of first-tier vents - many cheap vents doing the work of a few expensive ones, before the next tier is worth buying.",
		tiles: draw([
			"...VV...",
			"..VXXV..",
			".VXUUXV.",
			".VXUUXV.",
			"..VXXV..",
			"...VV...",
		]),
	},
};

/** The lesson each goal opens, by goal index: shown once, when it becomes the next job. */
export const LESSON_AT = { 6: "direct", 10: "indirect", 14: "exchangers" };
