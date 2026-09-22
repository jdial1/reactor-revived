import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize, place } from "../www/js/state.js";
import { tileAt, compile } from "../www/js/sim.js";
import { forecast } from "../www/js/forecast.js";
import { takeSnapshot, snapshotFor, rollBack, layoutOfSnapshot } from "../www/js/snapshots.js";
import { applyLayout } from "../www/js/layout.js";
import { LESSONS, LESSON_AT } from "../www/js/lessons.js";
import { OBJECTIVES } from "../www/js/objectives.js";

test("finishing a goal files a save state with what the reactor was doing", () => {
	const s = newState(() => 1);
	s.money = 500;
	place(s, 5, 5, "uranium1");
	place(s, 5, 6, "vent1");
	s.objective = 1;
	const snap = takeSnapshot(s, 0, 1234);
	assert.equal(snap.title, OBJECTIVES[0].title);
	assert.equal(snap.stats.parts, 2);
	assert.equal(snap.stats.power, 1);
	assert.equal(snap.save.snapshots, undefined); // no save states inside save states
	assert.equal(snapshotFor(s, 0), snap);
	// Finishing the same goal again replaces it rather than stacking.
	takeSnapshot(s, 0);
	assert.equal(s.snapshots.length, 1);
});

test("rolling back restores that moment and forgets what came after", () => {
	const s = newState(() => 1);
	s.money = 500;
	place(s, 0, 0, "uranium1");
	s.objective = 3;
	takeSnapshot(s, 2);
	s.money = 99999;
	place(s, 0, 1, "vent1");
	s.objective = 6;
	takeSnapshot(s, 5);

	const back = rollBack(s, snapshotFor(s, 2));
	assert.equal(back.objective, 3);
	assert.equal(tileAt(back, 0, 0).id, "uranium1");
	assert.equal(tileAt(back, 0, 1).id, null);
	assert.deepEqual(back.snapshots.map((x) => x.objective), [2]);
});

test("save states ride in the save, and a snapshot's board can be rebuilt", () => {
	const s = newState(() => 1);
	s.money = 500;
	place(s, 2, 2, "uranium1");
	takeSnapshot(s, 0);
	const back = deserialize(JSON.parse(JSON.stringify(serialize(s))), () => 1);
	assert.equal(back.snapshots.length, 1);

	const fresh = newState(() => 1);
	fresh.money = 500;
	const r = applyLayout(fresh, layoutOfSnapshot(back.snapshots[0]));
	assert.equal(r.placed, 1);
	assert.equal(tileAt(fresh, 2, 2).id, "uranium1");
});

test("every example layout holds, makes power, and opens at a real goal", () => {
	for (const [name, lesson] of Object.entries(LESSONS)) {
		const s = newState(() => 1);
		for (const [r, c, id] of lesson.tiles) Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });
		compile(s);
		const f = forecast(s);
		assert.equal(f.failTick, 0, `${name} fails at ${f.failTick}: ${f.failed}`);
		assert.ok(f.power > 0, name);
		assert.ok(f.profit > 0, name);
	}
	for (const [at, name] of Object.entries(LESSON_AT)) {
		assert.ok(OBJECTIVES[at], at);
		assert.ok(LESSONS[name], name);
	}
});
