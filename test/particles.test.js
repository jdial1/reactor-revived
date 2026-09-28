import { test } from "node:test";
import assert from "node:assert/strict";
import { newState } from "../www/js/state.js";
import { compile, tick, tileAt } from "../www/js/sim.js";

function board(tiles) {
	const s = newState(() => 0);
	s.money = 1e30;
	s.perpetual = new Set([...s.stats.values()].map((p) => (p.category === "cell" ? p.type : p.category)));
	for (const [r, c, id] of tiles) Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });
	compile(s);
	return s;
}

test("particles count as far as the board handles its heat", () => {
	// An accelerator farm - one dual seaborgium cell between two accelerators -
	// sheds what it makes once warm, and keeps nearly every particle it rolls.
	// (It was the example at goal 22; the game now teaches only its numbers.)
	const farm = board([[1, 2, "particle_accelerator1"], [1, 3, "seaborgium2"], [1, 4, "particle_accelerator1"]]);
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
