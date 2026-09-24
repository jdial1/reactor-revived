import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize } from "../www/js/state.js";
import { compile, tick, tileAt, movePart, stored } from "../www/js/sim.js";
import { reboot } from "../www/js/upgrades.js";
import { readLayout, applyLayout, layoutCode, contextNote } from "../www/js/layout.js";
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
	assert.match(markLine(s), /^Mark I · 48 power\/tick · 1 per cell$/);
	assert.equal(s.records.efficiency, 1, "IC2's other measure: power per fuel cell");
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
	assert.deepEqual(readLayout(`Mark I · 48 power/tick\n${code}`), { ...readLayout(code), claim: "Mark I · 48 power/tick" });
	assert.equal(readLayout("Mark I · 48 power/tick"), null);
	assert.ok(readLayout(code).tiles.length === 96);
});

test("the planner names the mark a board would earn", () => {
	const s = game();
	applyLayout(s, readLayout("mark i"));
	compile(s);
	assert.equal(forecast(s).mark, 1);
	const t = game();
	put(t, 5, 5, "uranium1");
	put(t, 5, 6, "coolant_cell2");
	compile(t);
	const f = forecast(t);
	assert.equal(f.failTick, 0, "it holds for now");
	assert.equal(f.mark, 2, "but it is still filling a tank");
	const u = game();
	put(u, 5, 5, "uranium3");
	put(u, 5, 6, "vent1");
	compile(u);
	assert.equal(forecast(u).mark, 0, "a board that fails earns nothing");
});

test("a part moves with everything it holds, and the move is a redesign", () => {
	const s = game();
	applyLayout(s, readLayout("mark i"));
	compile(s);
	run(s, MARK_WINDOW + 1);
	assert.equal(markOf(s), "Mark I");
	const from = tileAt(s, 0, 1);
	from.heatContained = 3;
	const ticks = from.ticks;
	tileAt(s, 11, 7).id = null;
	compile(s);
	assert.equal(movePart(s, from, tileAt(s, 11, 7)), true);
	const to = tileAt(s, 11, 7);
	assert.equal(to.id, "vent1");
	assert.equal(to.heatContained, 3);
	assert.equal(to.ticks, ticks);
	assert.equal(from.id, null);
	assert.equal(movePart(s, to, tileAt(s, 0, 0)), false, "only onto an empty tile");
	tick(s);
	assert.equal(markOf(s), null, "a moved part is a new machine");
});

test("a code carries the upgrades and doctrines it was copied under", () => {
	const s = game();
	s.levels.chronometer = 2;
	s.doctrines.doctrine1 = "left";
	applyLayout(s, readLayout("mark i"));
	const layout = readLayout(layoutCode(s));
	assert.equal(layout.ctx.levels.chronometer, 2);
	assert.equal(contextNote(s, layout), null, "same game, nothing to say");
	const other = game();
	assert.match(contextNote(other, layout), /differs by 1 upgrade and 1 doctrine/);
	assert.equal(contextNote(other, readLayout("mark i")), null, "a name carries no context");
});

test("the ledger balances: every point of heat made is vented, converted or held", () => {
	const boards = [
		() => { const s = game(); applyLayout(s, readLayout("mark i")); return s; },
		() => { const s = game(); put(s, 5, 5, "uranium1"); put(s, 5, 6, "coolant_cell1"); return s; },
		() => { const s = game(); put(s, 5, 5, "uranium3"); put(s, 5, 6, "vent1"); put(s, 0, 0, "vent2"); return s; },
	];
	for (const make of boards) {
		const s = make();
		compile(s);
		for (let i = 0; i < 400; i++) {
			tick(s);
			if (s.hasMeltedDown) break;
			const r = s.rate;
			const out = r.vent + (r.converted ?? 0) + r.held;
			assert.ok(Math.abs(r.heat - out) < 1e-6 * Math.max(1, r.heat), `tick ${i}: made ${r.heat}, out ${out}`);
		}
	}
});

test("a part that blows or is sold leaves its heat in the reactor", () => {
	const s = game();
	put(s, 5, 5, "uranium3");
	put(s, 5, 6, "vent1");
	compile(s);
	for (let i = 0; i < 10 && s.incidents.length === 0; i++) tick(s);
	assert.equal(s.incidents.length, 1, "the vent blew");
	assert.ok(s.heat >= s.incidents[0].held, "its heat is in the pool");
});

test("a capacitor speeds only the vents it touches", async () => {
	const { applyUpgrades } = await import("../www/js/upgrades.js");
	const s = game();
	s.levels.active_venting = 10;
	applyUpgrades(s);
	const near = put(s, 5, 5, "vent1");
	const far = put(s, 0, 0, "vent1");
	put(s, 5, 6, "capacitor1");
	compile(s);
	assert.ok(near.ventMul > 0, "the vent beside the capacitor is faster");
	assert.equal(far.ventMul, 0, "one across the board is not");
	near.heatContained = far.heatContained = 50;
	tick(s);
	assert.ok(near.vented > far.vented);
});

test("the shift log keeps the board's events, and a run is timed to its first Mark I", () => {
	const s = game();
	reboot(s, false, "uranium");
	s.objective = 30;
	s.perpetual.add("uranium");
	s.money = 1e30;
	assert.match(s.log[0].text, /^Rebooted into a Uranium only run\.$/);
	applyLayout(s, readLayout("mark i"));
	compile(s);
	run(s, MARK_WINDOW + 1);
	assert.ok(s.log.some((e) => e.text === "Earned Mark I."));
	assert.equal(s.records.markRun.uranium, s.mark.from);
	// A lost part is logged in words.
	const t = game();
	put(t, 5, 5, "uranium3");
	put(t, 5, 6, "vent1");
	compile(t);
	run(t, 10);
	assert.ok(t.log.some((e) => /^Lost a Basic Heat Vent at row 6, column 7\.$/.test(e.text)));
	assert.ok(t.log.some((e) => e.text === "Down to Mark III."));
});
