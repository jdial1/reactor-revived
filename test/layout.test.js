import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, place } from "../www/js/state.js";
import { tileAt } from "../www/js/sim.js";
import { applyUpgrades } from "../www/js/upgrades.js";
import { saveModule, modId } from "../www/js/module.js";
import { layoutCode, readLayout, applyLayout, describe } from "../www/js/layout.js";

function game(money = 1e9) {
	const s = newState(() => 1);
	s.objective = 5;
	applyUpgrades(s);
	s.money = money;
	return s;
}

test("a board round-trips through a code", () => {
	const s = game();
	place(s, 0, 0, "uranium1");
	place(s, 0, 1, "vent1");
	const code = layoutCode(s);
	assert.match(code, /^RR1\./);
	const b = game();
	const r = applyLayout(b, readLayout(code));
	assert.deepEqual(r, { placed: 2, queued: 0, taken: 0, locked: 0 });
	assert.equal(tileAt(b, 0, 0).id, "uranium1");
	assert.equal(tileAt(b, 0, 1).id, "vent1");
});

test("a code that is not one is refused", () => {
	assert.equal(readLayout("hello"), null);
	assert.equal(readLayout("RR1.!!!"), null);
	assert.equal(readLayout(""), null);
});

test("building fills empty tiles only, queues what it cannot afford, skips what is locked", () => {
	const s = game();
	place(s, 0, 0, "uranium1");
	place(s, 0, 1, "uranium1");
	place(s, 0, 2, "vent5");
	const code = layoutCode(s);

	const b = game(15);
	place(b, 0, 1, "vent1");
	b.money = 15;
	const r = applyLayout(b, readLayout(code));
	// uranium1 fits the money; vent5 is not unlocked in a fresh game; (0,1) is taken.
	assert.equal(r.placed, 1);
	assert.equal(r.taken, 1);
	assert.equal(r.locked, 1);
	assert.equal(tileAt(b, 0, 1).id, "vent1");
	assert.match(describe(r), /1 placed/);
});

test("a code carries its module designs, nested ones too, and reuses a match", () => {
	const s = game();
	s.levels.nested_casings = 1;
	applyUpgrades(s);
	const inner = saveModule(s, { name: "Café", icon: "uranium1", tint: "uranium", layout: [null, null, null, null, "uranium1", null, null, null, null] });
	const outer = saveModule(s, { name: "Box", icon: "vent1", tint: "heat", layout: [modId(inner), null, null, null, null, null, null, null, null] });
	place(s, 3, 3, modId(outer));
	const code = layoutCode(s);

	const b = game();
	b.levels.nested_casings = 1;
	applyUpgrades(b);
	saveModule(b, { name: "Other", icon: "uranium1", tint: "uranium", layout: Array(9).fill(null).map((_, i) => (i === 8 ? "vent1" : null)) });
	applyLayout(b, readLayout(code));
	assert.equal(b.modules.length, 3);
	const placed = b.stats.get(tileAt(b, 3, 3).id);
	assert.equal(placed.title, "Box");
	assert.equal(b.stats.get(placed.module.layout[0]).title, "Café");

	// The same code again builds nothing new and saves no duplicate designs.
	applyLayout(b, readLayout(code));
	assert.equal(b.modules.length, 3);
});
