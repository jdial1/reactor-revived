import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize } from "../www/js/state.js";
import { compile, tick, tileAt } from "../www/js/sim.js";
import { applyUpgrades } from "../www/js/upgrades.js";
import { SWITCHES } from "../www/js/records.js";
import { forecast } from "../www/js/forecast.js";

function game(levels = {}) {
	const s = newState(() => 1);
	s.objective = 30;
	s.money = 1e9;
	Object.assign(s.levels, levels);
	applyUpgrades(s);
	return s;
}
const put = (s, r, c, id) => Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });
const owned = (s) => SWITCHES.filter(([, , has]) => has(s)).map(([f]) => f);

test("a switch shows only once its system is bought", () => {
	assert.deepEqual(owned(game()), []);
	assert.deepEqual(owned(game({ improved_power_lines: 1 })), ["sellOn"]);
	assert.deepEqual(owned(game({ cell_perpetual_uranium: 1 })), ["rebuyOn"]);
	assert.deepEqual(owned(game({ heat_control_operator: 1 })), ["operatorOn"]);
	const manual = game({ cell_perpetual_uranium: 1 });
	manual.restriction = "manual";
	assert.deepEqual(owned(manual), [], "a Manual feed run has nothing to switch");
});

test("selling switched off sells nothing; switched on, it sells", () => {
	const s = game({ improved_power_lines: 5 });
	put(s, 5, 5, "uranium1");
	compile(s);
	s.sellOn = false;
	for (let i = 0; i < 10; i++) tick(s);
	assert.equal(s.money, 1e9, "nothing sold while off");
	s.sellOn = true;
	tick(s);
	assert.ok(s.money > 1e9, "selling resumes");
});

test("rebuying switched off leaves a spent cell spent, on the floor and in the lab", () => {
	const s = game({ cell_perpetual_uranium: 1 });
	put(s, 5, 5, "uranium1");
	compile(s);
	s.rebuyOn = false;
	const life = s.stats.get("uranium1").ticks;
	for (let i = 0; i < life + 5; i++) tick(s);
	assert.equal(tileAt(s, 5, 5).ticks, 0, "spent, not rebought");
	const on = game({ cell_perpetual_uranium: 1 });
	put(on, 5, 5, "uranium1");
	compile(on);
	for (let i = 0; i < life + 5; i++) tick(on);
	assert.ok(tileAt(on, 5, 5).ticks > 0, "rebought while on");
	// The planner's forecast runs the floor's rules, switches included.
	const lab = game({ cell_perpetual_uranium: 1 });
	put(lab, 5, 5, "uranium1");
	compile(lab);
	const withRebuy = forecast(lab).power;
	lab.rebuyOn = false;
	assert.ok(forecast(lab).power < withRebuy, "the lab stops rebuying too");
});

test("a switch is a change to the machine: the mark starts again", () => {
	const s = game({ improved_power_lines: 1 });
	put(s, 5, 5, "uranium1");
	put(s, 5, 6, "vent1");
	compile(s);
	for (let i = 0; i < 20; i++) tick(s);
	const since = s.mark.since;
	s.sellOn = false;
	tick(s);
	assert.ok(s.mark.since > since, "switching restarts the mark");
});

test("the switches ride along in the save", () => {
	const s = game();
	Object.assign(s, { sellOn: false, rebuyOn: false, operatorOn: true });
	const back = deserialize(serialize(s), () => 1);
	assert.deepEqual([back.sellOn, back.rebuyOn, back.operatorOn], [false, false, true]);
	const fresh = deserialize(serialize(game()), () => 1);
	assert.deepEqual([fresh.sellOn, fresh.rebuyOn, fresh.operatorOn], [true, true, false], "selling and rebuying start on");
});
