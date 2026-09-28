import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize } from "../www/js/state.js";
import { compile } from "../www/js/sim.js";
import { PARTS } from "../www/js/parts.js";
import { UPGRADES, maxLevel, applyUpgrades } from "../www/js/upgrades.js";
import { OBJECTIVES } from "../www/js/objectives.js";
import { outstanding, isComplete, COMPLETE_ENTRY } from "../www/js/complete.js";

/** A station with everything done: the log, every part, every upgrade, a full board. */
function everything() {
	const s = newState(() => 1);
	s.objective = OBJECTIVES.length - 1;
	for (const u of UPGRADES) s.levels[u.id] = maxLevel(u);
	for (const p of PARTS) s.placed[p.id] = 1000;
	applyUpgrades(s);
	for (const t of s.tiles) Object.assign(t, { id: "vent1", activated: true });
	compile(s);
	return s;
}

test("everything done is complete, and nothing less is", () => {
	assert.deepEqual(outstanding(everything()), []);
	assert.ok(isComplete(everything()));
	assert.ok(!isComplete(newState(() => 1)), "a new station is not");

	const log = everything();
	log.objective -= 1;
	assert.deepEqual(outstanding(log), ["jobs on the log"]);

	const upgrade = everything();
	upgrade.levels.chronometer -= 1;
	assert.deepEqual(outstanding(upgrade), ["upgrades below their rating"]);

	const tile = everything();
	tile.tiles[40].id = null;
	assert.deepEqual(outstanding(tile), ["empty tiles"]);

	const unpaid = everything();
	unpaid.tiles[40].activated = false;
	assert.deepEqual(outstanding(unpaid), ["empty tiles"], "a part waiting for money is not a filled tile");
});

test("complete is a record kept for good, and its line speaks in the station's voice", () => {
	const s = newState(() => 1);
	assert.equal(s.records.complete, null);
	s.records.complete = { ticks: 1234 };
	assert.deepEqual(deserialize(JSON.parse(JSON.stringify(serialize(s))), () => 1).records.complete, { ticks: 1234 });
	// Robotic and plain: no praise, no exclamation, and the demand goes on.
	assert.ok(!COMPLETE_ENTRY.includes("!"));
	assert.match(COMPLETE_ENTRY, /Demand continues\.$/);
});
