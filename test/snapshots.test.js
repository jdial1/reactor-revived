import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize, place } from "../www/js/state.js";
import { tileAt, compile, tick } from "../www/js/sim.js";
import { forecast } from "../www/js/forecast.js";
import * as snapshots from "../www/js/snapshots.js";
const { takeSnapshot, snapshotFor, layoutOfSnapshot } = snapshots;
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

test("there is no rolling the game back: a meltdown is final", () => {
	assert.equal(snapshots.rollBack, undefined);
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
		// The lab runs the floor's rules, so a fixture says what it owns: every rebuy.
		s.perpetual = new Set([...s.stats.values()].map((p) => (p.category === "cell" ? p.type : p.category)));
		for (const [r, c, id] of lesson.tiles) Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });
		compile(s);
		const f = forecast(s);
		assert.equal(f.failTick, 0, `${name} fails at ${f.failTick}: ${f.failed}`);
		assert.equal(f.mark, 1, `${name} should be a Mark I: an example never teaches a board that is still heating`);
		assert.ok(f.power > 0, name);
		assert.ok(f.profit > 0, name);
	}
	for (const [at, name] of Object.entries(LESSON_AT)) {
		assert.ok(OBJECTIVES[at], at);
		assert.ok(LESSONS[name], name);
	}
});

// The balance of the example builds, pinned: what each makes, what it costs,
// and how long it takes to pay back. A change to the sim or the parts that
// moves these moves the game's balance, and should be a decision, not a
// side effect. Direct cooling is the cheapest per cell; indirect pays back
// about 2.3x slower - the gap Reactor Incremental players complained about.
const BALANCE = {
	direct: { power: 16, cost: 1280, payback: 160 },
	indirect: { power: 4, cost: 740, payback: 370 },
	exchangers: { power: 12, cost: 1920, payback: 240 },
	chain: { power: 4, cost: 1750, payback: 875 },
	heatpipe: { power: 12, cost: 5760, payback: 720 },
};

test("the example builds' balance is pinned, and each conserves its heat", () => {
	for (const [name, lesson] of Object.entries(LESSONS)) {
		const s = newState(() => 1);
		// The lab runs the floor's rules, so a fixture says what it owns: every rebuy.
		s.perpetual = new Set([...s.stats.values()].map((p) => (p.category === "cell" ? p.type : p.category)));
		for (const [r, c, id] of lesson.tiles) Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });
		compile(s);
		const f = forecast(s);
		// Everything the cells make is vented; nothing is made from rounding.
		const made = s.cells.reduce((a, t) => a + t.heatMade, 0);
		assert.ok(Math.abs(f.vented - made) < 0.2, `${name}: vented ${f.vented}, made ${made}`);
		const want = BALANCE[name];
		if (!want) continue;
		assert.equal(f.power, want.power, `${name} power`);
		assert.equal(f.cost, want.cost, `${name} cost`);
		assert.ok(Math.abs(f.payback - want.payback) < 1, `${name} payback ${f.payback}`);
	}
});

test("the lab runs the floor's rules: every example forecasts as it runs", () => {
	for (const [name, lesson] of Object.entries(LESSONS)) {
		const s = newState(() => 1);
		s.perpetual = new Set([...s.stats.values()].map((p) => (p.category === "cell" ? p.type : p.category)));
		s.money = 1e30;
		for (const [r, c, id] of lesson.tiles) Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });
		compile(s);
		const f = forecast(s);
		// The floor: the same board, run for real for the forecast's horizon.
		let power = 0;
		let lost = 0;
		for (let i = 0; i < 600; i++) {
			tick(s);
			power += s.rate.power;
			lost += s.exploded.length;
			s.exploded.length = 0;
		}
		assert.equal(lost, 0, `${name} was forecast to hold and lost parts`);
		assert.ok(Math.abs(power / 600 - f.power) < 1e-9, `${name}: forecast ${f.power}, ran ${power / 600}`);
	}
});

test("every example's broken twin does not hold, and the example does", async () => {
	const { BROKEN, brokenTiles } = await import("../www/js/lessons.js");
	for (const name of Object.keys(LESSONS)) {
		assert.ok(BROKEN[name], `${name} has a broken twin`);
		const board = (tiles) => {
			const s = newState(() => 1);
			s.perpetual = new Set([...s.stats.values()].map((p) => (p.category === "cell" ? p.type : p.category)));
			for (const [r, c, id] of tiles) Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });
			compile(s);
			return forecast(s);
		};
		assert.equal(board(LESSONS[name].tiles).mark, 1, `${name} holds`);
		const broken = board(brokenTiles(name));
		assert.notEqual(broken.mark, 1, `${name}'s broken copy should not hold`);
	}
});
