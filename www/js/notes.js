// Field notes: what a part does that its description does not say, written
// into its sheet the first time the player sees it happen on the real board.
// Knowledge is collected by playing, the way players of this line wrote their
// wikis - never handed out in advance.

// id -> [who it is about, which parts it belongs on, the note]
export const NOTES = {
	reflector: ["Neutron reflectors", (p) => p.category === "reflector",
		"Wears down by one each time a cell beside it pulses, and is gone when it reaches zero."],
	thermionic: ["Thermionic coolant", (p) => p.id === "coolant_cell6",
		"Turns half of the heat it takes in straight into power."],
	selfheat: ["Extreme capacitors", (p) => p.id === "capacitor6",
		"Heats itself by half of what the power lines sell."],
	particles: ["Particle accelerators", (p) => p.category === "particle_accelerator",
		"Makes Exotic Particles from the heat it holds - the fuller, the more, up to half full - and spends a hundredth of that heat each tick doing it. They count only as far as the board handles the heat it makes. One that overflows melts the reactor down."],
	burn: ["Extreme vents", (p) => p.id === "vent6",
		"Pays for every point of heat it vents with a point of power."],
	singularity: ["Black hole accelerators", (p) => p.id === "particle_accelerator6",
		"Drags heat out of the reactor itself, one power for each point."],
	protium: ["Protium", (p) => p.type === "protium",
		"Each spent cell leaves particles behind that make every later protium cell stronger."],
	buyout: ["Perpetual capacitors", (p) => p.category === "capacitor",
		"Bought itself out of an overheat for ten times its price, and dumped the heat into the reactor."],
};

/** The player saw this happen. The planner, forecasts and casings do not count. */
export function observe(s, id) {
	if (!s.notes || s.planner || s.sealed || s.notes.includes(id)) return;
	s.notes.push(id);
}

/** The notes the player has earned for a part. */
export const notesFor = (s, p) => Object.entries(NOTES)
	.filter(([id, [, belongs]]) => s.notes?.includes(id) && belongs(p))
	.map(([, [, , text]]) => text);
