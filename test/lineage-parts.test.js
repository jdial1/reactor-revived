import { test } from "node:test";
import assert from "node:assert/strict";
import { newState } from "../www/js/state.js";
import { compile, tick, tileAt, stored } from "../www/js/sim.js";
import { applyUpgrades, reboot } from "../www/js/upgrades.js";
import { forecast } from "../www/js/forecast.js";
import { isPartVisible, PART_BY_ID } from "../www/js/parts.js";
import { refillCost } from "../www/js/ui.js";

function game() {
	const s = newState(() => 1);
	s.objective = 30;
	s.money = 1e30;
	s.perpetual.add("uranium");
	return s;
}
const put = (s, r, c, id) => Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });

test("a component vent holds nothing and bleeds each part it touches", () => {
	const s = game();
	const coolant = [put(s, 5, 3, "coolant_cell1"), put(s, 5, 5, "coolant_cell1")];
	const cv = put(s, 5, 4, "component_vent1");
	compile(s);
	for (const c of coolant) c.heatContained = 100;
	tick(s);
	const rate = s.stats.get("component_vent1").vent;
	for (const c of coolant) assert.equal(c.heatContained, 100 - rate, "each neighbour loses the vent's rate");
	assert.equal(cv.vented, rate * 2);
	assert.equal(cv.heatContained, 0, "it holds nothing");
	// A cell beside it cannot dump heat into it: it has nowhere to keep it.
	const t = game();
	put(t, 5, 5, "uranium1");
	put(t, 5, 6, "component_vent1");
	compile(t);
	tick(t);
	assert.equal(t.heat, t.stats.get("uranium1").baseHeat, "the cell's heat goes to the reactor");
});

test("a hull vent draws from the reactor's pool wherever it sits", () => {
	const s = game();
	const hv = put(s, 0, 0, "hull_vent1");
	compile(s);
	s.heat = 50;
	tick(s);
	const p = s.stats.get("hull_vent1");
	assert.equal(s.heat, 50 - p.transfer);
	assert.equal(hv.vented, Math.min(p.vent, p.transfer));
	assert.ok(Math.abs(s.rate.held + hv.vented) < 1e-9, "the pool's loss is the vent's shed");
});

test("a condensator fills and fails, unless it is paid to empty", () => {
	const unpaid = game();
	put(unpaid, 5, 5, "uranium3");
	const c = put(unpaid, 5, 6, "condensator1");
	compile(unpaid);
	c.heatContained = c.heatContained + unpaid.stats.get("condensator1").containment - 1;
	for (let i = 0; i < 5; i++) tick(unpaid);
	assert.equal(tileAt(unpaid, 5, 6).id, null, "full and not refilled, it fails");
	assert.ok(unpaid.heat > 0, "and its heat stays in the reactor");

	const paid = game();
	paid.money = 1e9; // small enough that a refill's price shows
	paid.levels.perpetual_condensators = 1;
	applyUpgrades(paid);
	paid.perpetual.add("uranium");
	put(paid, 5, 5, "uranium3");
	const d = put(paid, 5, 6, "condensator1");
	compile(paid);
	const p = paid.stats.get("condensator1");
	d.heatContained = p.containment - 1;
	const before = paid.money;
	tick(paid);
	assert.equal(tileAt(paid, 5, 6).id, "condensator1", "refilled, it stands");
	assert.ok(d.heatContained < p.containment);
	assert.equal(before - paid.money, p.cost, "at its list price");
	const r = paid.rate;
	assert.ok(Math.abs(r.heat - (r.vent + (r.converted ?? 0) + r.held)) < 1e-6, "and the ledger still balances");
});

test("the lab prices condensator refills as upkeep and never calls them a failure", () => {
	const s = game();
	s.levels.perpetual_condensators = 1;
	applyUpgrades(s);
	s.perpetual.add("uranium");
	put(s, 5, 5, "uranium1");
	put(s, 5, 6, "condensator1");
	compile(s);
	const f = forecast(s);
	assert.equal(f.failTick, 0);
	assert.equal(f.mark, 2, "paid-for storage is not a held machine");
	assert.ok(f.upkeep > 0);
	// A hand refill costs the part's price, in proportion to what it holds.
	const t = tileAt(s, 5, 6);
	t.heatContained = s.stats.get("condensator1").containment / 2;
	assert.equal(refillCost(s.stats.get("condensator1"), t), Math.ceil(s.stats.get("condensator1").cost / 2));
});

test("a Direct-only run keeps hull vents off the board; component vents stay", () => {
	const s = game();
	reboot(s, false, "direct");
	s.objective = 30;
	assert.equal(isPartVisible(s, PART_BY_ID.get("hull_vent1")), false);
	assert.equal(isPartVisible(s, PART_BY_ID.get("component_vent1")), true);
});
