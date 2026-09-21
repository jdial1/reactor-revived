import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize, place } from "../www/js/state.js";
import { compile, tick, tileAt } from "../www/js/sim.js";
import { buy, applyUpgrades } from "../www/js/upgrades.js";
import { profile, readout, saveModule, deleteModule, inUse, depthOf, fits, modId } from "../www/js/module.js";

const EMPTY = Array(9).fill(null);
const at = (pairs) => {
	const l = [...EMPTY];
	for (const [i, id] of Object.entries(pairs)) l[i] = id;
	return l;
};

function unlocked(extra = {}) {
	const s = newState(() => 1);
	s.levels.laboratory = 1;
	s.objective = 5;
	Object.assign(s.levels, extra);
	applyUpgrades(s);
	s.money = 1e30;
	s.currentExoticParticles = 1e30;
	return s;
}

test("one uranium cell in a casing is a uranium cell at 25%", () => {
	const s = unlocked();
	const p = profile(s, at({ 4: "uranium1" }));
	const u = s.stats.get("uranium1");
	assert.equal(p.power, u.basePower);
	assert.equal(p.heat, u.baseHeat);
	assert.equal(p.life, u.ticks);
	assert.equal(p.cost, u.cost);
	assert.equal(p.failTick, 0);
	const r = readout(s, at({ 4: "uranium1" }));
	assert.equal(r.power, u.basePower * 0.25);
	assert.equal(r.money, u.basePower * 0.25 - (u.cost * 1.5) / u.ticks);
});

test("the square law holds inside a casing", () => {
	const s = unlocked();
	const two = profile(s, at({ 3: "uranium1", 4: "uranium1" }));
	assert.equal(two.power, 2 * 2); // each cell pulses twice
	assert.equal(two.heat, 2 * 4);  // and heats by the square
});

test("vents inside a casing keep its heat in", () => {
	const s = unlocked();
	const open = profile(s, at({ 4: "uranium1" }));
	const vented = profile(s, at({ 1: "vent1", 3: "vent1", 4: "uranium1", 5: "vent1", 7: "vent1" }));
	assert.ok(vented.heat < open.heat);
	assert.ok(vented.vented > 0);
	assert.equal(vented.failTick, 0);
});

test("a casing that cannot hold its heat fails, and says when", () => {
	const s = unlocked();
	// Plutonium into a single first-tier vent: the vent fills and blows.
	const p = profile(s, at({ 4: "plutonium1", 5: "vent1" }));
	assert.ok(p.failTick > 0);
	assert.ok(p.failTick < s.stats.get("plutonium1").ticks);
});

test("research raises casing efficiency to 60%", () => {
	const s = unlocked();
	assert.equal(s.casingEff, 0.25);
	for (let i = 0; i < 7; i++) assert.ok(buy(s, "casing_tolerances"));
	assert.ok(Math.abs(s.casingEff - 0.6) < 1e-9);
	assert.equal(buy(s, "casing_tolerances"), false);
});

test("a saved module is a part the board can place and run", () => {
	const s = unlocked();
	const m = saveModule(s, { name: "Core", icon: "uranium1", tint: "uranium", layout: at({ 4: "uranium1" }) });
	const p = s.stats.get(modId(m));
	assert.equal(p.category, "module");
	assert.equal(p.title, "Core");
	place(s, 0, 0, modId(m));
	s.heat = 0;
	s.power = 0;
	tick(s);
	assert.equal(s.power, 0.25);
	// Heat is not cut by the casing: it crosses whole.
	assert.equal(s.rate.heat, 1);
	assert.equal(tileAt(s, 0, 0).ticks, p.ticks - 1);
});

test("the casing is sealed: outside cells do not pulse into it", () => {
	const s = unlocked();
	const m = saveModule(s, { name: "Core", icon: "uranium1", tint: "uranium", layout: at({ 4: "uranium1" }) });
	place(s, 0, 0, modId(m));
	place(s, 0, 1, "uranium1");
	compile(s);
	assert.equal(tileAt(s, 0, 1).neighbourCells.length, 0);
	assert.equal(tileAt(s, 0, 1).power, s.stats.get("uranium1").basePower);
});

test("a spent module rebuys itself only when every fuel inside is perpetual", () => {
	const s = unlocked({ cell_perpetual_uranium: 1 });
	const m = saveModule(s, { name: "Core", icon: "uranium1", tint: "uranium", layout: at({ 4: "uranium1" }) });
	place(s, 0, 0, modId(m));
	const t = tileAt(s, 0, 0);
	t.ticks = 1;
	s.money = 1000;
	tick(s);
	const p = s.stats.get(modId(m));
	assert.equal(t.id, modId(m));
	assert.equal(t.ticks, p.ticks);
	assert.equal(s.money, 1000 - p.rebuy);

	// Without the perpetual upgrade a spent module is cleared like a cell.
	const bare = unlocked();
	const n = saveModule(bare, { name: "Core", icon: "uranium1", tint: "uranium", layout: at({ 4: "uranium1" }) });
	place(bare, 0, 0, modId(n));
	tileAt(bare, 0, 0).ticks = 1;
	tick(bare);
	assert.equal(tileAt(bare, 0, 0).id, null);
});

test("an unstable module blows on its predicted tick", () => {
	const s = unlocked();
	const m = saveModule(s, { name: "Bomb", icon: "plutonium1", tint: "heat", layout: at({ 4: "plutonium1", 5: "vent1" }) });
	const p = s.stats.get(modId(m));
	place(s, 0, 0, modId(m));
	for (let i = 1; i < p.failTick; i++) tick(s);
	assert.equal(tileAt(s, 0, 0).id, modId(m));
	tick(s);
	assert.equal(tileAt(s, 0, 0).id, null);
});

test("nesting needs research, and efficiency multiplies per layer", () => {
	const s = unlocked();
	const inner = saveModule(s, { name: "Inner", icon: "uranium1", tint: "uranium", layout: at({ 4: "uranium1" }) });
	const layout = at({ 4: modId(inner) });
	assert.equal(depthOf(s, layout), 2);
	assert.equal(fits(s, layout), false);
	buy(s, "nested_casings");
	assert.equal(fits(s, layout), true);
	const outer = saveModule(s, { name: "Outer", icon: "uranium1", tint: "uranium", layout });
	place(s, 0, 0, modId(outer));
	s.power = 0;
	tick(s);
	assert.equal(s.power, 0.25 * 0.25);
});

test("a design in use cannot be deleted; an unused one can", () => {
	const s = unlocked({ nested_casings: 1 });
	const a = saveModule(s, { name: "A", icon: "uranium1", tint: "uranium", layout: at({ 4: "uranium1" }) });
	const b = saveModule(s, { name: "B", icon: "uranium1", tint: "uranium", layout: at({ 0: modId(a) }) });
	assert.equal(inUse(s, a), true);
	assert.equal(deleteModule(s, a), false);
	assert.equal(deleteModule(s, b), true);
	assert.equal(deleteModule(s, a), true);
	assert.equal(s.stats.has(modId(a)), false);
});

test("modules survive a save, and a version 2 save still loads", () => {
	const s = unlocked();
	const m = saveModule(s, { name: "Core", icon: "uranium1", tint: "uranium", layout: at({ 4: "uranium1" }) });
	place(s, 2, 3, modId(m));
	const back = deserialize(JSON.parse(JSON.stringify(serialize(s))), () => 1);
	assert.deepEqual(back.modules, s.modules);
	assert.equal(tileAt(back, 2, 3).id, modId(m));
	assert.equal(back.stats.get(modId(m)).modPower, s.stats.get(modId(m)).modPower);

	const old = serialize(newState(() => 1));
	old.v = 2;
	delete old.modules;
	delete old.nextModuleId;
	old.money = 1234;
	const loaded = deserialize(old, () => 1);
	assert.equal(loaded.money, 1234);
	assert.deepEqual(loaded.modules, []);
});

test("buying an upgrade re-measures every module", () => {
	const s = unlocked();
	const m = saveModule(s, { name: "Core", icon: "uranium1", tint: "uranium", layout: at({ 4: "uranium1" }) });
	const before = s.stats.get(modId(m)).modPower;
	assert.ok(buy(s, "cell_power_uranium"));
	assert.equal(s.stats.get(modId(m)).modPower, before * 2);
});

test("a module of bare cells dumps all of its heat into the reactor", () => {
	const s = unlocked();
	const layout = at({ 0: "uranium1", 1: "uranium1", 3: "uranium1", 4: "uranium1" });
	const m = saveModule(s, { name: "Stove", icon: "uranium1", tint: "heat", layout });
	place(s, 5, 5, modId(m));
	s.heat = 0;
	tick(s);
	// Four cells in a square: each pulses three times, heat 9 apiece.
	assert.equal(s.rate.heat, 4 * 9);
	assert.equal(s.stats.get(modId(m)).modHeat, 4 * 9);
});

test("an outlet inside a casing pulls heat out of the reactor", () => {
	const s = unlocked();
	const layout = at({ 1: "vent1", 3: "vent1", 4: "heat_outlet1", 5: "vent1", 7: "vent1" });
	const m = saveModule(s, { name: "Chiller", icon: "vent1", tint: "plutonium", layout });
	const p = s.stats.get(modId(m));
	// Nothing to pull beside a cold reactor; a hot one gives it plenty.
	assert.equal(p.modHeat, 0);
	assert.ok(p.modHeatHot < 0);
	place(s, 5, 5, modId(m));
	s.heat = 500;
	tick(s);
	assert.ok(s.rate.heat < 0);
	assert.ok(s.heat < 500);
});

test("a placed module's inner heat survives a save", () => {
	const s = unlocked();
	const layout = at({ 1: "vent1", 3: "vent1", 4: "heat_outlet1", 5: "vent1", 7: "vent1" });
	const m = saveModule(s, { name: "Chiller", icon: "vent1", tint: "plutonium", layout });
	place(s, 5, 5, modId(m));
	s.heat = 500;
	tick(s);
	const held = tileAt(s, 5, 5).inner.tiles.map((x) => x.heatContained);
	assert.ok(held.some((h) => h > 0));
	const back = deserialize(JSON.parse(JSON.stringify(serialize(s))), () => 1);
	back.heat = 0;
	tick(back);
	assert.deepEqual(tileAt(back, 5, 5).inner.tiles.map((x) => x.heatContained > 0), held.map((h) => h > 0));
});

test("modules open after the fifth goal, with no research", async () => {
	const { isPartVisible, modulesOpen } = await import("../www/js/parts.js");
	const s = newState(() => 1);
	s.money = 1e9;
	const m = saveModule(s, { name: "Core", icon: "uranium1", tint: "uranium", layout: at({ 4: "uranium1" }) });
	s.objective = 4;
	assert.equal(modulesOpen(s), false);
	assert.equal(isPartVisible(s, s.stats.get(modId(m))), false);
	s.objective = 5;
	assert.equal(modulesOpen(s), true);
	assert.equal(isPartVisible(s, s.stats.get(modId(m))), true);
});
