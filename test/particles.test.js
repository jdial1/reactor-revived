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

	// The same accelerator fed by a cell with nothing to shed the heat: it rolls
	// as well while it fills, but the board handles none of what it makes.
	const hoard = board([[5, 3, "uranium1"], [5, 4, "particle_accelerator1"]]);
	for (let i = 0; i < 50 && !hoard.hasMeltedDown; i++) tick(hoard);
	assert.equal(hoard.exoticParticles, 0, "heat stored toward a failure earns nothing");
});
