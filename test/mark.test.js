import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize } from "../www/js/state.js";
import { compile, tick, tileAt } from "../www/js/sim.js";
import { reboot } from "../www/js/upgrades.js";
import { readLayout, applyLayout, layoutCode } from "../www/js/layout.js";
import { MARK_WINDOW, markOf, markLine, lastIncident } from "../www/js/records.js";
import { forecast } from "../www/js/forecast.js";

function game() {
	const s = newState(() => 1);
	s.objective = 30;
	s.money = 1e30;
	s.perpetual.add("uranium");
	return s;
}
const put = (s, r, c, id) => Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });
const run = (s, n) => { for (let i = 0; i < n; i++) tick(s); return s; };

test("the old checkerboard earns Mark I by running, and its power is the record", () => {
	const s = game();
	applyLayout(s, readLayout("mark i"));
	compile(s);
	run(s, MARK_WINDOW - 1);
	assert.equal(markOf(s), null, "a mark is earned over the whole window, not guessed early");
	run(s, MARK_WINDOW);
	assert.equal(markOf(s), "Mark I");
	assert.equal(s.records.markOne, s.rate.power);
	assert.ok(s.mark.trend < 0.01, "a held board is not climbing");
	assert.match(markLine(s), /^Mark I · \d+ power\/tick$/);
});

test("a board still filling a tank is Mark II, and its heat is climbing", () => {
	const s = game();
	put(s, 5, 5, "uranium1");
	put(s, 5, 6, "coolant_cell1");
	compile(s);
	run(s, MARK_WINDOW + 5);
	assert.equal(markOf(s), "Mark II");
	assert.ok(s.mark.trend > 0.9);
	assert.equal(s.records.markOne, 0);
});

test("a part lost to heat is Mark III and an incident; the player's change starts again", () => {
	const s = game();
	put(s, 5, 5, "uranium3");
	put(s, 5, 6, "vent1");
	compile(s);
	run(s, 10);
	assert.equal(markOf(s), "Mark III");
	assert.equal(s.incidents.length, 1);
	assert.match(lastIncident(s), /^Basic Heat Vent at row 6, column 7, \d+ ticks ago, holding \d+ of 80 heat\.$/);
	// Selling the cell is a redesign, not an accident.
	tileAt(s, 5, 5).id = null;
	put(s, 5, 5, "uranium1");
	compile(s);
	tick(s);
	assert.equal(markOf(s), null);
	assert.equal(s.mark.since, s.runTicks - 1);
});

test("the planner, a forecast and a reboot leave the mark alone or clear it", () => {
	const s = game();
	applyLayout(s, readLayout("mark i"));
	compile(s);
	run(s, MARK_WINDOW + 1);
	const before = JSON.stringify(s.mark);
	forecast(s);
	assert.equal(JSON.stringify(s.mark), before, "the lab predicts; it does not rate the floor");
	const saved = deserialize(JSON.parse(JSON.stringify(serialize(s))));
	assert.equal(markOf(saved), "Mark I", "a mark rides in the save");
	saved.planner = true;
	assert.equal(markOf(saved), null, "the planner shows forecasts, not marks");
	reboot(s);
	assert.equal(s.mark, null);
	assert.deepEqual(s.incidents, []);
});

test("a meltdown leaves a receipt, and still wipes the board clean", () => {
	const s = game();
	put(s, 5, 4, "uranium3");
	put(s, 5, 5, "vent1");
	for (let c = 0; c < 4; c++) put(s, 0, c, "uranium3");
	compile(s);
	for (let i = 0; i < 5000 && !s.hasMeltedDown; i++) tick(s);
	assert.ok(s.hasMeltedDown);
	assert.ok(s.tiles.every((t) => !t.id), "nothing is left on the board");
	assert.match(s.receipt[0], /^Ran [\d,.KMB]+ ticks since the board last changed\.$/);
	assert.match(s.receipt[1], /^First part lost: Basic Heat Vent at row 6, column 6/);
	assert.ok(s.receipt.some((l) => l.startsWith("Last tick: cells made")));
});

test("a shared code can carry its header line, and old codes still build", () => {
	const s = game();
	applyLayout(s, readLayout("mark i"));
	const code = layoutCode(s);
	assert.deepEqual(readLayout(`Mark I · 48 power/tick\n${code}`), readLayout(code));
	assert.equal(readLayout("Mark I · 48 power/tick"), null);
	assert.ok(readLayout(code).tiles.length === 96);
});
