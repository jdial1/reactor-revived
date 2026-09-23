import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize } from "../www/js/state.js";
import { compile, tick, tileAt } from "../www/js/sim.js";
import { reboot } from "../www/js/upgrades.js";
import { isPartVisible } from "../www/js/parts.js";
import { forecast } from "../www/js/forecast.js";
import { saveModule, modId } from "../www/js/module.js";
import { toolsAllowed } from "../www/js/records.js";
import { notesFor } from "../www/js/notes.js";

function game() {
	const s = newState(() => 1);
	s.objective = 30;
	s.money = 1e30;
	return s;
}
const put = (s, r, c, id) => Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });

test("a Direct-only run cannot place transfer parts, nor a module that holds one", () => {
	const s = game();
	const pipe = saveModule(s, { name: "Pipe", icon: "vent1", tint: "heat", layout: [null, null, null, null, "heat_outlet1", null, null, null, null] });
	reboot(s, false, "direct");
	s.objective = 30;
	assert.equal(isPartVisible(s, s.stats.get("heat_outlet1")), false);
	assert.equal(isPartVisible(s, s.stats.get("vent1")), true);
	assert.equal(isPartVisible(s, s.stats.get(modId(pipe))), false);
});

test("a Uranium-only run keeps every other fuel off the dock; hardcore takes the tools", () => {
	const s = game();
	s.placed.uranium3 = 10;
	reboot(s, false, "uranium");
	s.objective = 30;
	s.placed.uranium3 = 10;
	assert.equal(isPartVisible(s, s.stats.get("plutonium1")), false);
	assert.equal(isPartVisible(s, s.stats.get("uranium1")), true);
	reboot(s, false, "hardcore");
	assert.equal(toolsAllowed(s), false);
	reboot(s, false, null);
	assert.equal(toolsAllowed(s), true);
});

test("records follow the real reactor, and a forecast leaves them alone", () => {
	const s = game();
	put(s, 5, 5, "uranium1");
	compile(s);
	tick(s);
	assert.equal(s.records.maxPower, 1);
	assert.equal(s.records.longest, 1);
	const before = JSON.stringify(s.records);
	forecast(s);
	assert.equal(JSON.stringify(s.records), before, "a forecast is not the real reactor");
});

test("an explosion ends a clean run; a meltdown is counted once", () => {
	const s = game();
	const v = put(s, 5, 5, "vent1");
	compile(s);
	tick(s);
	tick(s);
	assert.equal(s.records.streak, 2);
	v.heatContained = s.stats.get("vent1").containment * 10;
	tick(s);
	assert.equal(s.records.streak, 0);
	assert.equal(s.records.longest, 2);
	s.heat = s.maxHeat * 3;
	tick(s);
	assert.equal(s.records.meltdowns, 1);
});

test("each run is timed to each rung of power, once, from its reboot", () => {
	const s = game();
	reboot(s, false, "direct");
	s.objective = 30;
	tick(s);
	tick(s);
	// A quad plutonium cell alone makes 1,800 power a tick.
	put(s, 5, 5, "plutonium3");
	compile(s);
	tick(s);
	const ran = s.runTicks;
	assert.equal(s.records.speed.direct[1000], ran);
	tick(s);
	assert.equal(s.records.speed.direct[1000], ran, "a rung is timed once per run");
	const back = deserialize(JSON.parse(JSON.stringify(serialize(s))), () => 1);
	assert.equal(back.records.speed.direct[1000], ran);
	assert.equal(back.restriction, "direct");
});

test("a field note is earned by seeing the quirk, once, and only on the real board", () => {
	const s = game();
	put(s, 5, 5, "uranium1");
	const r = put(s, 5, 6, "reflector1");
	compile(s);
	forecast(s);
	assert.deepEqual(s.notes, [], "a forecast sees nothing");
	r.ticks = 1;
	tick(s);
	assert.deepEqual(s.notes, ["reflector"]);
	assert.equal(notesFor(s, s.stats.get("reflector2")).length, 1);
	assert.equal(notesFor(s, s.stats.get("vent1")).length, 0);
});

test("manual feed switches off every rebuy; casingless keeps modules off the board", async () => {
	const { isPartVisible: visible } = await import("../www/js/parts.js");
	const s = game();
	s.levels.cell_perpetual_uranium = 1;
	const { applyUpgrades } = await import("../www/js/upgrades.js");
	applyUpgrades(s);
	reboot(s, false, "manual");
	s.money = 1e9;
	const t = put(s, 5, 5, "uranium1");
	compile(s);
	t.ticks = 1;
	tick(s);
	tick(s);
	assert.equal(tileAt(s, 5, 5).ticks, 0, "a spent cell stays spent");
	const m = saveModule(s, { name: "Box", icon: "uranium1", tint: "uranium", layout: [null, null, null, null, "uranium1", null, null, null, null] });
	reboot(s, false, "casingless");
	s.objective = 30;
	assert.equal(visible(s, s.stats.get(modId(m))), false);
});

test("trophies are won on the real board, once, and a meltdown right after a reboot is one", async () => {
	const { award, TROPHIES } = await import("../www/js/records.js");
	const s = game();
	assert.equal(TROPHIES.length, 12);
	assert.equal(award(s, "mark"), true);
	assert.equal(award(s, "mark"), false, "once");
	reboot(s, false, null);
	s.heat = s.maxHeat * 3;
	tick(s);
	assert.ok(s.trophies.includes("fuse"));
	const f = game();
	for (let c = 0; c < 8; c++) put(f, 0, c, "vent1");
	for (let c = 0; c < 4; c++) put(f, 1, c, "vent1");
	compile(f);
	for (let i = 0; i < 60; i++) tick(f);
	assert.ok(f.trophies.includes("fan"));
	forecast(f);
	const back = deserialize(JSON.parse(JSON.stringify(serialize(f))), () => 1);
	assert.deepEqual(back.trophies, f.trophies);
});
