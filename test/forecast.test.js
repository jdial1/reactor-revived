import { test } from "node:test";
import assert from "node:assert/strict";
import { newState } from "../www/js/state.js";
import { tileAt, compile } from "../www/js/sim.js";
import { forecast } from "../www/js/forecast.js";
import { replaceQuote, replaceAll } from "../www/js/layout.js";

function board(parts, money = 1e9) {
	const s = newState(() => 1);
	s.money = money;
	for (const [r, c, id] of parts) {
		const t = tileAt(s, r, c);
		Object.assign(t, { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });
	}
	compile(s);
	return s;
}

test("an empty board has nothing to say", () => {
	assert.deepEqual(forecast(board([])), { parts: 0 });
});

test("a cooled cell holds and pays", () => {
	const s = board([[5, 5, "uranium1"], [4, 5, "vent1"], [6, 5, "vent1"], [5, 4, "vent1"], [5, 6, "vent1"]]);
	const f = forecast(s);
	assert.equal(f.failTick, 0);
	assert.equal(f.power, 1);
	assert.ok(f.profit < f.power); // fuel is not free
	// The real board was not touched.
	assert.equal(tileAt(s, 5, 5).ticks, s.stats.get("uranium1").ticks);
	assert.equal(s.heat, 0);
});

test("a board that cannot hold says when, and what goes first", () => {
	const s = board([[5, 5, "plutonium1"], [5, 6, "vent1"]]);
	const f = forecast(s);
	assert.ok(f.failTick > 0);
	assert.equal(f.failed, s.stats.get("vent1").title);
});

test("bare cells heat the reactor, and the forecast follows it to meltdown", () => {
	const s = board([[5, 5, "plutonium1"], [5, 6, "plutonium1"]]);
	const f = forecast(s);
	assert.ok(f.heat > 0);
	assert.equal(f.failed, "meltdown");
});

test("a swap is forecast on a copy, and replace-all is priced and paid all at once", () => {
	const s = board([[5, 5, "plutonium1"], [5, 6, "vent1"], [5, 4, "vent1"]]);
	s.placed.vent1 = 10;
	const before = forecast(s);
	const after = forecast(s, ["vent1", "vent2"]);
	assert.ok(before.failTick > 0);
	assert.ok(after.failTick === 0 || after.failTick > before.failTick);
	assert.equal(tileAt(s, 5, 6).id, "vent1");

	const q = replaceQuote(s, "vent1", "vent2");
	assert.equal(q.count, 2);
	assert.equal(q.cost, 2 * s.stats.get("vent2").cost);
	assert.equal(q.net, q.cost - q.refund);
	const money = s.money;
	assert.equal(replaceAll(s, "vent1", "vent2"), true);
	assert.equal(tileAt(s, 5, 6).id, "vent2");
	assert.equal(tileAt(s, 5, 4).id, "vent2");
	assert.equal(s.money, money - q.net);

	const poor = board([[0, 0, "vent1"]], 0);
	assert.equal(replaceAll(poor, "vent1", "vent5"), false);
	assert.equal(tileAt(poor, 0, 0).id, "vent1");
});

test("a failure further off than a hundred thousand ticks counts as holding", () => {
	// One quad cell and nothing to cool it: the reactor warms, but its own
	// passive cooling keeps it from ever getting anywhere near a meltdown.
	const s = board([[9, 1, "uranium3"]]);
	const f = forecast(s);
	assert.equal(f.failTick, 0);
	assert.ok(f.heat > 0, "it is warming");
});
