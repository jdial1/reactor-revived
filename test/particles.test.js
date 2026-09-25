import { test } from "node:test";
import assert from "node:assert/strict";
import { newState } from "../www/js/state.js";
import { compile, tick, tileAt } from "../www/js/sim.js";
import { LESSONS } from "../www/js/lessons.js";

function board(tiles) {
	const s = newState(() => 0);
	s.money = 1e30;
	s.perpetual = new Set([...s.stats.values()].map((p) => (p.category === "cell" ? p.type : p.category)));
	for (const [r, c, id] of tiles) Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });
	compile(s);
	return s;
}

test("particles count as far as the board handles its heat", () => {
	// The example accelerator farm sheds what it makes once warm, and keeps
	// nearly every particle it rolls.
	const farm = board(LESSONS.epfarm.tiles);
	for (let i = 0; i < 2000; i++) tick(farm);
	assert.ok(farm.exoticParticles > 0, "a holding farm makes particles");

	// The same cell and accelerator, with a big coolant tank beside the cell
	// taking half its heat and shedding none: the board handles less of what it
	// makes, and keeps fewer of the particles it rolls.
	const alone = board([[5, 3, "uranium1"], [5, 4, "particle_accelerator1"]]);
	const hoard = board([[5, 3, "uranium1"], [5, 4, "particle_accelerator1"], [5, 2, "coolant_cell5"]]);
	for (let i = 0; i < 200; i++) {
		tick(alone);
		tick(hoard);
	}
	assert.ok(hoard.exoticParticles < alone.exoticParticles, `${hoard.exoticParticles} vs ${alone.exoticParticles}`);
});
