import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isSave, deserialize } from "../www/js/state.js";
import { tick } from "../www/js/sim.js";
import { MARK_WINDOW, markOf } from "../www/js/records.js";

// Written by the 1.2 build itself (commit c9bd804, save version 3): goal 12,
// the IC2 checkerboard with a module of nine vents in its corner, Throttled
// Cells, perpetual uranium, and 120 ticks run. Before marks, incidents,
// records, and doctrine sets.
const OLD = JSON.parse(readFileSync(new URL("./fixtures/save-1.2.json", import.meta.url)));

test("a 1.2 save loads as the game it was", () => {
	assert.ok(isSave(OLD));
	const s = deserialize(OLD, () => 1);
	assert.equal(s.objective, 12);
	assert.equal(s.money, OLD.money);
	assert.equal(s.tiles.filter((t) => t.id).length, 96);
	assert.equal(s.tiles[0].id, "mod:1");
	assert.equal(s.modules.length, 1);
	assert.ok(s.perpetual.has("uranium"));
	assert.ok(s.tutorialDone);
});

test("a doctrine bought in 1.2 is the same side of its set now", () => {
	const s = deserialize(OLD, () => 1);
	assert.equal(s.levels.doctrine3, 1, "the set is owned");
	assert.equal(s.doctrines.doctrine3, "right", "Throttled Cells, not Overclocked");
	assert.ok(s.throttle);
	assert.ok(!s.overclock);
});

test("a 1.2 board runs on and earns its mark", () => {
	const s = deserialize(OLD, () => 1);
	for (let i = 0; i < 2 * MARK_WINDOW; i++) tick(s);
	assert.equal(markOf(s), "Mark I");
	assert.equal(s.incidents.length, 0);
	assert.ok(!s.hasMeltedDown);
});
