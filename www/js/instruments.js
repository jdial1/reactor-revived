// What the desk's instruments read, apart from how they are drawn. Pure: no DOM.

/**
 * Heat on the heat meter's meltdown scale: 0 is cold, 0.5 is
 * rated heat (100 / 100), 1 is meltdown - the reactor melts past twice its
 * rating (sim.js).
 */
export const heatScale = (s) => (s.maxHeat > 0 ? Math.max(0, Math.min(1, s.heat / (2 * s.maxHeat))) : 0);

/** The power bargraph's lamps. */
export const LAMPS = 10;

/** How many of the bargraph's lamps are lit: any power at all lights the first. */
export const powerLamps = (s) => (s.maxPower > 0 && s.power > 0 ? Math.max(1, Math.min(LAMPS, Math.ceil((s.power / s.maxPower) * LAMPS - 1e-9))) : 0);

// ---- LED readouts ---------------------------------------------------------------
// Power and heat read on seven-segment LEDs, as on the mimic board in the Soul
// Interview's control room: a few digits in a dark window, the unlit segments
// still faintly there, the unit beside them.

/** The segments lit for each character, a-g clockwise from the top, g the bar. */
export const SEGMENTS = {
	"0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc",
	"5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg",
	"-": "g", "e": "adefg", " ": "",
};

/** Digit positions in a readout. */
export const LED_DIGITS = 4;

/**
 * A reading as an LED shows it: the figures in fixed positions, right-aligned
 * with blank positions to their left, each decimal point lit on the digit
 * before it rather than taking a position of its own; and the unit apart.
 * "1.5K" is [" ", " ", "1.", "5"] and "K".
 */
export function ledCells(text, positions = LED_DIGITS) {
	const [, figures = "", unit = ""] = String(text).match(/^([\d.e-]*)(.*)$/) ?? [];
	const cells = [];
	for (const ch of figures) {
		if (ch === "." && cells.length) cells[cells.length - 1].dp = true;
		else cells.push({ ch, dp: false });
	}
	while (cells.length < positions) cells.unshift({ ch: " ", dp: false });
	return { cells: cells.slice(-positions), unit };
}
