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
