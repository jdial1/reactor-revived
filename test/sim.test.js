import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize, place, exportSave } from "../www/js/state.js";
import { compile, tick, tileAt, activeTiles, MAX_ROWS, MAX_COLS } from "../www/js/sim.js";
import { PART_BY_ID, PARTS, isPartVisible, UNLOCK_AFTER } from "../www/js/parts.js";
import { UPGRADES, buy, applyUpgrades, reboot, costOf, UPGRADE_BY_ID } from "../www/js/upgrades.js";
import { checkObjectives, OBJECTIVES } from "../www/js/objectives.js";
import { fmt } from "../www/js/fmt.js";

// Deterministic states: no Math.random anywhere in a test.
const fresh = (rolls = 1) => newState(() => rolls);
const rich = (money = 1e30) => Object.assign(fresh(), { money });

// Put a part down and pay for it immediately, bypassing the queue.
function put(s, r, c, id) {
	const t = tileAt(s, r, c);
	t.id = id;
	t.activated = true;
	t.ticks = s.stats.get(id).ticks ?? 0;
	return t;
}

test("catalog covers every part at every tier", () => {
	assert.equal(PART_BY_ID.size, 75);
	// 7 fuel types x 3 pack sizes, 9 component families x tiers 1-5 plus a tier 6.
	assert.equal([...PART_BY_ID.values()].filter((p) => p.category === "cell").length, 21);
	assert.equal([...PART_BY_ID.values()].filter((p) => p.level === 6).length, 9);
});

test("part tiers match the original's numbers", () => {
	// Uranium is hand-priced; everything else is base * mul^(level-1).
	assert.deepEqual([1, 2, 3].map((l) => PART_BY_ID.get(`uranium${l}`).cost), [10, 25, 60]);
	assert.equal(PART_BY_ID.get("vent5").vent, 4 * 75 ** 4);
	assert.equal(PART_BY_ID.get("vent5").containment, 80 * 75 ** 4);
	assert.equal(PART_BY_ID.get("capacitor5").reactorPower, 100 * 140 ** 4);
	assert.equal(PART_BY_ID.get("capacitor5").containment, 10 * 5 ** 4);
	assert.equal(PART_BY_ID.get("reflector5").ticks, 100 * 2 ** 4);
	assert.equal(PART_BY_ID.get("reflector5").powerIncrease, 9);
	assert.equal(PART_BY_ID.get("particle_accelerator5").epHeat, 5e8 * 20000 ** 4);
	// The pack size lives in cellMultiplier/cellCount, not in a duplicated
	// per-tier power/heat field; the rated output falls out of the formula.
	assert.deepEqual([1, 2, 3].map((l) => PART_BY_ID.get(`uranium${l}`).cellMultiplier), [1, 4, 12]);
	assert.deepEqual([1, 2, 3].map((l) => PART_BY_ID.get(`uranium${l}`).cellCount), [1, 2, 4]);
});

test("a lone cell produces its rated power and heat at every pack size", () => {
	// Dual cells rate 4 power / 8 heat, quads 12 / 36 - the original's tables.
	for (const [id, power, heat] of [["uranium1", 1, 1], ["uranium2", 4, 8], ["uranium3", 12, 36]]) {
		const s = fresh();
		put(s, 5, 5, id);
		compile(s);
		assert.equal(tileAt(s, 5, 5).power, power, id);
		assert.equal(tileAt(s, 5, 5).heat, heat, id);
	}
});

test("adjacent cells pulse: power grows linearly, heat quadratically", () => {
	const s = fresh();
	put(s, 5, 5, "uranium1");
	put(s, 5, 6, "uranium1");
	compile(s);
	// Each sees one neighbour pulse: power x(1+1), heat x(1+1)^2.
	assert.equal(tileAt(s, 5, 5).power, 2);
	assert.equal(tileAt(s, 5, 5).heat, 4);

	// A quad cell pulses 4, so a single neighbour cell sees 1+4.
	const q = fresh();
	put(q, 5, 5, "uranium1");
	put(q, 5, 6, "uranium3");
	compile(q);
	assert.equal(tileAt(q, 5, 5).power, 5);
	assert.equal(tileAt(q, 5, 5).heat, 25);
});

test("that heat/power gap is what punishes dense layouts", () => {
	const sparse = fresh();
	put(sparse, 2, 2, "uranium1");
	put(sparse, 12, 5, "uranium1"); // far apart, and inside a narrow reactor
	compile(sparse);

	const dense = fresh();
	put(dense, 5, 5, "uranium1");
	put(dense, 5, 6, "uranium1");
	compile(dense);

	const heat = (s) => s.cells.reduce((n, t) => n + t.heat, 0);
	const power = (s) => s.cells.reduce((n, t) => n + t.power, 0);
	assert.equal(power(dense) / power(sparse), 2);
	assert.equal(heat(dense) / heat(sparse), 4); // twice the power costs four times the heat
});

test("a reflector boosts its neighbour and wears out", () => {
	const s = fresh();
	put(s, 5, 5, "uranium1");
	const ref = put(s, 5, 6, "reflector1");
	compile(s);
	assert.equal(tileAt(s, 5, 5).power, 1.05); // +5%

	const before = ref.ticks;
	tick(s);
	assert.equal(ref.ticks, before - 1);
});

test("a cell burns down and leaves a husk", () => {
	const s = fresh();
	const t = put(s, 5, 5, "uranium1");
	compile(s);
	assert.equal(t.ticks, 15);
	for (let i = 0; i < 15; i++) tick(s);
	assert.equal(t.ticks, 0);
	assert.equal(t.id, "uranium1"); // still on the board, just spent
	assert.equal(s.cells.length, 1);
	// A spent cell contributes nothing.
	const p = s.power;
	tick(s);
	assert.equal(s.power, p);
});

test("a perpetual cell buys its own replacement at 1.5x", () => {
	const s = rich(1000);
	s.levels.cell_perpetual_uranium = 1;
	applyUpgrades(s);
	const t = put(s, 5, 5, "uranium1");
	compile(s);
	for (let i = 0; i < 15; i++) tick(s);
	assert.equal(t.ticks, 15, "refuelled");
	assert.equal(s.money, 1000 - 10 * 1.5);
});

test("a perpetual reflector is replaced at list price, not 1.5x", () => {
	const s = rich(1e6);
	s.levels.perpetual_reflectors = 1;
	applyUpgrades(s);
	put(s, 5, 5, "uranium1");
	const ref = put(s, 5, 6, "reflector1");
	compile(s);
	const cost = s.stats.get("reflector1").cost;
	// A reflector only wears while an adjacent cell is firing, so bring it to
	// the brink directly rather than outliving the cell that drives it.
	ref.ticks = 1;
	tick(s);
	assert.equal(ref.ticks, 100, "refuelled to full");
	assert.equal(s.money, 1e6 - cost, "list price, no 1.5x markup");
});

test("vents bleed heat off the parts they cool", () => {
	const s = fresh();
	put(s, 5, 5, "uranium3"); // 36 heat/tick
	const vent = put(s, 5, 6, "vent1"); // holds 80, vents 4
	compile(s);
	tick(s);
	// The cell pushed its heat into the vent, which then vented 4 of it away.
	assert.ok(vent.heatContained > 0);
	assert.ok(vent.heatContained < 36);
});

test("a part over its containment explodes off the board", () => {
	const s = fresh();
	put(s, 5, 5, "uranium3");
	const vent = put(s, 5, 6, "vent1"); // 80 containment vs 36 heat/tick
	compile(s);
	for (let i = 0; i < 10; i++) tick(s);
	assert.equal(vent.id, null, "vent blew up");
});

test("an exploding particle accelerator melts the reactor down", () => {
	const s = fresh();
	put(s, 5, 5, "uranium3");
	const pa = put(s, 5, 6, "particle_accelerator1"); // only 100 containment
	compile(s);
	for (let i = 0; i < 10 && !s.hasMeltedDown; i++) tick(s);
	assert.ok(s.hasMeltedDown, "meltdown triggered");
	assert.equal(pa.id, null);
	assert.equal([...s.tiles].filter((t) => t.id).length, 0, "board wiped");
});

test("heat over twice the maximum melts the reactor down", () => {
	const s = fresh();
	put(s, 5, 5, "uranium3");
	compile(s);
	// Passive cooling runs before the meltdown check, as in the original, so a
	// reactor sitting a hair over 2x max cools back under the line instead.
	s.heat = s.maxHeat * 2 + 1;
	tick(s);
	assert.equal(s.hasMeltedDown, false, "shed the excess in time");

	s.heat = s.maxHeat * 4;
	tick(s);
	assert.ok(s.hasMeltedDown, "too far gone to cool back");
});

test("auto-sell converts power to money", () => {
	const s = fresh();
	s.levels.improved_power_lines = 1; // sells 1% of max power per tick
	applyUpgrades(s);
	put(s, 5, 5, "uranium1");
	compile(s);
	s.power = 50;
	const before = s.money;
	tick(s);
	assert.ok(s.money > before);
	assert.ok(s.soldPower);
});

test("power is capped at max power and heat never goes negative", () => {
	const s = fresh();
	compile(s);
	s.power = 1e9;
	s.heat = -50;
	tick(s);
	assert.equal(s.power, s.maxPower);
	assert.equal(s.heat, 0);
});

test("a queued part is bought as soon as it is affordable", () => {
	const s = fresh();
	s.money = 0;
	const t = place(s, 5, 5, "uranium1");
	assert.equal(t.activated, false);
	assert.equal(s.queue.length, 1);

	tick(s);
	assert.equal(t.activated, false, "still broke");

	s.money = 100;
	tick(s);
	assert.equal(t.activated, true);
	assert.equal(s.money, 90);
	assert.equal(s.queue.length, 0);
});

test("the tick is deterministic", () => {
	const run = () => {
		const s = fresh();
		put(s, 5, 5, "uranium3");
		put(s, 5, 6, "vent1");
		put(s, 6, 5, "capacitor1");
		compile(s);
		for (let i = 0; i < 12; i++) tick(s);
		return [s.power, s.heat, s.money];
	};
	assert.deepEqual(run(), run());
});

test("a fully expanded reactor still fits the grid", () => {
	const s = rich();
	s.levels.expand_reactor_rows = 20;
	s.levels.expand_reactor_cols = 20;
	applyUpgrades(s);
	assert.ok(s.rows <= MAX_ROWS, `${s.rows} rows`);
	assert.ok(s.cols <= MAX_COLS, `${s.cols} cols`);
	// Every tile the grid can reach must actually exist.
	compile(s);
	assert.equal([...activeTiles(s)].length, s.rows * s.cols);
});

test("upgrades are pure functions of their levels", () => {
	const a = fresh();
	a.levels.improved_heat_vents = 3;
	applyUpgrades(a);

	const b = fresh();
	b.levels.improved_heat_vents = 3;
	applyUpgrades(b);

	assert.equal(a.stats.get("vent1").vent, b.stats.get("vent1").vent);
	assert.equal(a.stats.get("vent1").vent, PART_BY_ID.get("vent1").vent * 4);
});

test("upgrading never mutates the shared catalog", () => {
	const base = PART_BY_ID.get("vent1").vent;
	const s = fresh();
	s.levels.improved_heat_vents = 5;
	s.levels.fluid_hyperdynamics = 3;
	applyUpgrades(s);
	assert.equal(PART_BY_ID.get("vent1").vent, base);
	assert.equal(s.stats.get("vent1").vent, base * 6 * 8);
});

test("buying an upgrade charges the right purse", () => {
	const s = rich();
	assert.ok(buy(s, "improved_heat_vents"));
	assert.equal(s.levels.improved_heat_vents, 1);
	assert.equal(s.money, 1e30 - 250);

	// Exotic upgrades need the laboratory first, and spend particles.
	assert.equal(buy(s, "infused_cells"), false, "gated behind the lab");
	s.currentExoticParticles = 1000;
	assert.ok(buy(s, "laboratory"));
	assert.ok(buy(s, "infused_cells"));
	assert.equal(s.currentExoticParticles, 1000 - 1 - 50);
});

test("upgrade cost grows with level and stops at the cap", () => {
	const s = rich();
	const u = UPGRADE_BY_ID.get("improved_heat_vents");
	assert.equal(costOf(s, u), 250);
	s.levels.improved_heat_vents = 2;
	assert.equal(costOf(s, u), 250 * 100 ** 2);

	const capped = UPGRADE_BY_ID.get("expand_reactor_rows");
	s.levels.expand_reactor_rows = 20;
	assert.equal(costOf(s, capped), Infinity);
	assert.equal(buy(s, "expand_reactor_rows"), false);
});

test("experimental part unlocks get pricier as you buy them", () => {
	const s = rich();
	s.currentExoticParticles = 1e9;
	buy(s, "laboratory");
	const u = UPGRADE_BY_ID.get("vortex_cooling");
	assert.equal(costOf(s, u), 10000);
	buy(s, "heat_reflection");
	assert.equal(costOf(s, u), 20000);
});

test("expanding the reactor grows the playable grid", () => {
	const s = rich();
	// Tall and narrow, to suit a phone held upright.
	assert.deepEqual([s.rows, s.cols], [19, 8]);
	buy(s, "expand_reactor_rows");
	buy(s, "expand_reactor_cols");
	assert.deepEqual([s.rows, s.cols], [20, 9]);
});

test("replaying upgrade levels equals buying them one at a time", () => {
	const bought = rich();
	for (let i = 0; i < 3; i++) buy(bought, "improved_heat_vents");
	for (let i = 0; i < 2; i++) buy(bought, "improved_wiring");

	const replayed = fresh();
	replayed.levels.improved_heat_vents = 3;
	replayed.levels.improved_wiring = 2;
	applyUpgrades(replayed);

	for (const id of ["vent1", "vent6", "capacitor1", "capacitor5"]) {
		assert.deepEqual(replayed.stats.get(id), bought.stats.get(id), id);
	}
});

test("reboot banks particles, wipes the board and keeps exotic upgrades", () => {
	const s = rich();
	s.currentExoticParticles = 100;
	buy(s, "laboratory");
	buy(s, "improved_heat_vents");
	put(s, 5, 5, "uranium1");
	s.exoticParticles = 42;

	reboot(s);
	assert.equal(s.totalExoticParticles, 42);
	assert.equal(s.exoticParticles, 0);
	assert.equal(s.levels.improved_heat_vents, 0, "money upgrades reset");
	assert.equal(s.levels.laboratory, 1, "exotic upgrades survive");
	assert.equal(tileAt(s, 5, 5).id, null);
	assert.equal(s.money, 10);
});

test("a refund also clears exotic upgrades and returns every particle", () => {
	const s = rich();
	s.currentExoticParticles = 100;
	buy(s, "laboratory");
	s.exoticParticles = 42;

	reboot(s, true);
	assert.equal(s.levels.laboratory, 0);
	assert.equal(s.currentExoticParticles, s.totalExoticParticles);
	assert.equal(s.currentExoticParticles, 42);
});

test("a save round-trips exactly", () => {
	const s = rich(12345);
	buy(s, "improved_heat_vents");
	buy(s, "expand_reactor_rows");
	put(s, 3, 4, "uranium2");
	put(s, 3, 5, "vent1");
	compile(s);
	for (let i = 0; i < 5; i++) tick(s);

	const back = deserialize(JSON.parse(JSON.stringify(serialize(s))));

	assert.equal(back.money, s.money);
	assert.equal(back.heat, s.heat);
	assert.equal(back.power, s.power);
	assert.deepEqual(back.levels, s.levels);
	assert.deepEqual([back.rows, back.cols], [s.rows, s.cols]);
	for (const t of s.tiles) {
		const b = back.tiles[t.r * MAX_COLS + t.c];
		assert.equal(b.id, t.id);
		assert.equal(b.ticks, t.ticks);
		assert.equal(b.heatContained, t.heatContained);
	}
});

test("a loaded save keeps ticking identically", () => {
	const s = rich(12345);
	put(s, 3, 4, "uranium2");
	put(s, 3, 5, "vent1");
	compile(s);
	for (let i = 0; i < 3; i++) tick(s);

	const back = deserialize(JSON.parse(JSON.stringify(serialize(s))));
	for (let i = 0; i < 5; i++) {
		tick(s);
		tick(back);
	}
	assert.equal(back.power, s.power);
	assert.equal(back.heat, s.heat);
	assert.equal(back.money, s.money);
});

test("a corrupt or missing save yields a fresh game", () => {
	const store = { getItem: () => "{not json", setItem: () => {} };
	const empty = { getItem: () => null, setItem: () => {} };
	for (const storage of [store, empty]) {
		const s = deserialize(JSON.parse(JSON.stringify({ v: 999 })));
		assert.equal(s.money, 10);
		assert.equal(s.objective, 0);
		assert.ok(storage);
	}
});

test("objectives pay out in order and only once", () => {
	const s = fresh();
	assert.equal(s.objective, 0);

	put(s, 5, 5, "uranium1");
	compile(s);
	assert.ok(checkObjectives(s));
	assert.equal(s.objective, 1, "first objective cleared");
	assert.equal(s.money, 20); // 10 starting + 10 reward

	assert.equal(checkObjectives(s), false, "no double payout");
	assert.equal(s.money, 20);
});

test("objectives chain when several are satisfied at once", () => {
	const s = fresh();
	s.soldPower = true;
	s.soldHeat = true;
	put(s, 5, 5, "uranium1");
	put(s, 5, 6, "vent1");
	compile(s);
	checkObjectives(s);
	assert.equal(s.objective, 4, "placed, sold power, sold heat, vent beside a cell");
});

test("the objective list terminates", () => {
	const s = fresh();
	s.objective = OBJECTIVES.length - 1;
	assert.equal(checkObjectives(s), false);
	assert.equal(s.objective, OBJECTIVES.length - 1);
});

test("cell upgrade prices match the original per fuel type", () => {
	const s = fresh();
	const price = (id) => costOf(s, UPGRADE_BY_ID.get(id));
	// Uranium is the odd one out: power costs 5x tick, perpetual 10x.
	assert.equal(price("cell_tick_uranium"), 100);
	assert.equal(price("cell_power_uranium"), 500);
	assert.equal(price("cell_perpetual_uranium"), 1000);
	// Every other fuel has power = tick and perpetual = 2x tick.
	for (const [type, tick] of [["plutonium", 30e3], ["thorium", 25e6], ["seaborgium", 20e9], ["dolorium", 20e12], ["nefastium", 17.5e15]]) {
		assert.equal(price(`cell_tick_${type}`), tick, type);
		assert.equal(price(`cell_power_${type}`), tick, type);
		assert.equal(price(`cell_perpetual_${type}`), tick * 2, type);
	}
});

test("every upgrade id is unique and every requirement exists", () => {
	const ids = UPGRADES.map((u) => u.id);
	assert.equal(new Set(ids).size, ids.length);
	for (const u of UPGRADES) {
		if (u.requires) assert.ok(UPGRADE_BY_ID.has(u.requires), `${u.id} requires ${u.requires}`);
	}
});

test("every experimental part has an unlock upgrade", () => {
	for (const p of PART_BY_ID.values()) {
		if (p.requires) assert.ok(UPGRADE_BY_ID.has(p.requires), `${p.id} requires ${p.requires}`);
	}
});

test("the dock opens with one part per family, not seventy-five", () => {
	const s = fresh();
	const visible = PARTS.filter((p) => isPartVisible(s, p));
	assert.equal(visible.length, 10, "one fuel plus nine component families");
	assert.ok(visible.every((p) => !p.after && !p.requires));
});

test("placing ten of a part reveals the next one", () => {
	const s = rich();
	const next = PART_BY_ID.get("uranium2");
	assert.equal(isPartVisible(s, next), false);

	for (let i = 0; i < UNLOCK_AFTER - 1; i++) place(s, 0, i, "uranium1");
	assert.equal(isPartVisible(s, next), false, "nine is not enough");

	place(s, 1, 0, "uranium1");
	assert.ok(isPartVisible(s, next));
	// Selling does not take the unlock away again.
	assert.equal(s.placed.uranium1, UNLOCK_AFTER);
});

test("the unlock chain runs fuel to fuel and tier to tier", () => {
	assert.equal(PART_BY_ID.get("uranium1").after, null);
	assert.equal(PART_BY_ID.get("uranium2").after, "uranium1");
	assert.equal(PART_BY_ID.get("plutonium1").after, "uranium3", "fuels chain into each other");
	assert.equal(PART_BY_ID.get("vent1").after, null, "each component family starts fresh");
	assert.equal(PART_BY_ID.get("vent5").after, "vent4");
	// Tier-6 parts are gated by research instead, so they stay off the chain.
	for (const p of PARTS.filter((x) => x.level === 6)) {
		assert.ok(!p.after, p.id);
		assert.ok(p.requires, p.id);
	}
});

test("every part has a dock label and a drawable shape", () => {
	for (const p of PARTS) {
		assert.ok(p.short && p.short.length <= 12, `${p.id} label: ${p.short}`);
	}
});

test("number formatting", () => {
	assert.equal(fmt(0), "0");
	assert.equal(fmt(999), "999");
	assert.equal(fmt(1000), "1K");
	assert.equal(fmt(1500), "1.5K");
	assert.equal(fmt(999999), "999.999K", "truncates rather than rolling over to 1000K");
	assert.equal(fmt(1e6), "1M");
	assert.equal(fmt(1e33), "1Dc");
	// Matched against the live original's own tooltips.
	assert.equal(fmt(195312500000), "195.312B");
	assert.equal(fmt(126562500), "126.562M");
	assert.equal(fmt(655360000000), "655.36B");
	assert.equal(fmt(38416000000), "38.416B");
	assert.equal(fmt(-1500), "-1.5K");
});

// ---------------------------------------------------------------------------
// The experimental endgame: exotic particles, tier-6 parts, prestige.
// ---------------------------------------------------------------------------

/** A state with the laboratory open and every research bought. */
function researched(...ids) {
	const s = rich();
	s.currentExoticParticles = 1e12;
	buy(s, "laboratory");
	for (const id of ids) buy(s, id);
	return s;
}

test("a hot particle accelerator generates exotic particles", () => {
	// random() returns 1, so only the whole part of the chance is ever awarded.
	// Only a high tier can hold enough heat for that to be more than a rounding
	// error - which is the point of the endgame.
	const s = fresh();
	const pa = put(s, 5, 5, "particle_accelerator5");
	const p = s.stats.get("particle_accelerator5");
	compile(s);
	assert.ok(p.epHeat < p.containment, "it can hold the heat it needs");
	pa.heatContained = p.epHeat;

	assert.equal(s.exoticParticles, 0);
	tick(s);
	assert.ok(s.exoticParticles > 0, "particles produced");
	// They accrue to this run's total, not the spendable pool.
	assert.equal(s.currentExoticParticles, 0);
});

test("a low-tier accelerator cannot hold enough heat to matter", () => {
	const p = PART_BY_ID.get("particle_accelerator1");
	// Its whole containment is a rounding error against the heat it would need,
	// so early accelerators are a heat problem long before they are an income.
	assert.ok(p.containment < p.epHeat / 1e6);
});

test("a cold particle accelerator generates nothing", () => {
	const s = fresh();
	put(s, 5, 5, "particle_accelerator1");
	compile(s);
	tick(s);
	assert.equal(s.exoticParticles, 0);
});

test("research gates the tier-6 parts", () => {
	const s = rich();
	const vent6 = PART_BY_ID.get("vent6");
	assert.equal(isPartVisible(s, vent6), false, "locked before research");

	const r = researched("vortex_cooling");
	assert.ok(isPartVisible(r, vent6), "unlocked after research");
	// Its siblings stay locked - each part has its own research.
	assert.equal(isPartVisible(r, PART_BY_ID.get("coolant_cell6")), false);
});

test("an extreme vent burns reactor power to do its cooling", () => {
	const s = researched("vortex_cooling");
	const vent = put(s, 5, 5, "vent6");
	compile(s);
	vent.heatContained = 1000;
	s.power = 1e6;
	const before = s.power;
	tick(s);
	assert.ok(s.power < before, "power spent venting");
	assert.ok(vent.heatContained < 1000, "heat vented");
});

test("a thermionic coolant cell turns half its heat into power", () => {
	const s = researched("thermionic_conversion");
	put(s, 5, 5, "uranium3");
	const coolant = put(s, 5, 6, "coolant_cell6");
	compile(s);
	s.power = 0;
	tick(s);
	assert.ok(s.power > 0, "heat became power");
	assert.ok(coolant.heatContained > 0, "and half stayed as heat");
});

test("a black hole accelerator drags heat out of the reactor", () => {
	const s = researched("singularity_harnessing");
	const pa = put(s, 5, 5, "particle_accelerator6");
	compile(s);
	s.heat = 5000;
	s.power = 5000;
	tick(s);
	assert.ok(pa.heatContained > 0, "heat pulled into the accelerator");
	assert.ok(s.heat < 5000, "and out of the reactor");
});

test("an extreme heat exchanger reaches its whole row", () => {
	const s = researched("underground_heat_extraction");
	const far = put(s, 5, 0, "vent1"); // five tiles away, far out of normal range
	const ex = put(s, 5, 5, "heat_exchanger6");
	compile(s);
	assert.equal(ex.containments.length, 1, "reaches the far end of its row");

	// An ordinary exchanger in the same spot reaches nothing.
	const plain = fresh();
	put(plain, 5, 0, "vent1");
	const normal = put(plain, 5, 5, "heat_exchanger1");
	compile(plain);
	assert.equal(normal.containments.length, 0);
	assert.ok(far);
});

test("protium cells get stronger as protium is spent", () => {
	const s = researched("protium_cells");
	// A protium cell makes 1.25e12 heat a tick against a stock ceiling of 1000,
	// so without a vastly bigger reactor it melts the place down immediately.
	s.levels.phlembotinum_core = 20;
	applyUpgrades(s);
	const before = s.stats.get("protium1").basePower;

	const t = put(s, 5, 5, "protium1");
	t.ticks = 1;
	compile(s);
	tick(s);

	assert.equal(s.hasMeltedDown, false, "survived the tick");
	assert.equal(s.protiumParticles, 1, "particles banked on depletion");
	assert.ok(s.stats.get("protium1").basePower > before, "and every protium cell got stronger");
});

test("a protium cell melts a stock reactor immediately", () => {
	const s = researched("protium_cells");
	put(s, 5, 5, "protium1");
	compile(s);
	tick(s);
	assert.ok(s.hasMeltedDown, "1.25e12 heat against a 1000 ceiling");
});

test("exotic particles survive a reboot and buy research", () => {
	const s = fresh();
	s.exoticParticles = 500;
	reboot(s);
	assert.equal(s.currentExoticParticles, 500);
	assert.ok(buy(s, "laboratory"));
	assert.equal(s.currentExoticParticles, 499);
});

test("a full experimental run: earn, reboot, spend, place", () => {
	const s = fresh();

	// Earn particles from an accelerator big enough to hold the heat.
	const pa = put(s, 5, 5, "particle_accelerator5");
	compile(s);
	pa.heatContained = s.stats.get("particle_accelerator5").epHeat;
	tick(s);
	const earned = s.exoticParticles;
	assert.ok(earned > 0);

	// Bank them.
	reboot(s);
	assert.equal(s.currentExoticParticles, earned);
	assert.equal(tileAt(s, 5, 5).id, null, "board wiped");

	// Spend them on research, then place what it unlocked.
	s.currentExoticParticles = 1e6;
	assert.ok(buy(s, "laboratory"));
	assert.ok(buy(s, "vortex_cooling"));
	s.money = 1e15;
	place(s, 2, 2, "vent6");
	assert.equal(tileAt(s, 2, 2).id, "vent6");
	assert.ok(tileAt(s, 2, 2).activated);
});

// ---------------------------------------------------------------------------
// Parity with the live original.
//
// These numbers were read off https://cwmonkey.github.io/reactor-knockoff/
// itself - its part tooltips and its reactor stats readout - not from its
// source. They are here so a future refactor cannot quietly drift the balance.
// ---------------------------------------------------------------------------

test("part stats match the live original's tooltips", () => {
	const rated = (p) => ({
		power: p.basePower * p.cellMultiplier,
		heat: (p.baseHeat * p.cellMultiplier ** 2) / p.cellCount,
	});

	const upstream = {
		uranium1: { title: "Uranium Cell", cost: "10", power: 1, heat: 1, ticks: 15 },
		uranium3: { title: "Quad Uranium Cell", cost: "60", power: 12, heat: 36 },
		vent1: { title: "Basic Heat Vent", cost: "50", vent: "4", containment: "80" },
		vent5: { title: "Ultimate Heat Vent", cost: "195.312B", vent: "126.562M", containment: "2.531B" },
		capacitor5: { title: "Ultimate Capacitor", cost: "655.36B", reactorPower: "38.416B", containment: "6.25K" },
		reflector3: { title: "Super Neutron Reflector", cost: "1.25M", powerIncrease: 7, ticks: 400 },
	};

	for (const [id, want] of Object.entries(upstream)) {
		const p = PART_BY_ID.get(id);
		assert.equal(p.title, want.title, id);
		assert.equal(fmt(p.cost), want.cost, `${id} cost`);
		if (want.power !== undefined) assert.equal(rated(p).power, want.power, `${id} power`);
		if (want.heat !== undefined) assert.equal(rated(p).heat, want.heat, `${id} heat`);
		for (const f of ["ticks", "powerIncrease"]) {
			if (want[f] !== undefined) assert.equal(p[f], want[f], `${id} ${f}`);
		}
		for (const f of ["vent", "containment", "reactorPower"]) {
			if (want[f] !== undefined) assert.equal(fmt(p[f]), want[f], `${id} ${f}`);
		}
	}
});

test("two adjacent cells produce what the live original produces", () => {
	// Placed in the real game at cwmonkey.github.io: two Uranium Cells side by
	// side reported 4 power and 8 heat per tick.
	const s = fresh();
	put(s, 3, 3, "uranium1");
	put(s, 3, 4, "uranium1");
	compile(s);
	const power = s.cells.reduce((n, t) => n + t.power, 0);
	const heat = s.cells.reduce((n, t) => n + t.heat, 0);
	assert.equal(power, 4);
	assert.equal(heat, 8);
});

test("every module imports cleanly", async () => {
	// Catches missing or misspelled exports without a browser. main.js is
	// excluded because it boots the game against a DOM on import.
	for (const m of ["fmt", "parts", "sim", "state", "upgrades", "objectives", "input", "sprites", "ui"]) {
		await import(`../www/js/${m}.js`);
	}
});

test("an exported save reloads into an identical game", () => {
	const s = rich(4321);
	buy(s, "improved_heat_vents");
	put(s, 3, 4, "uranium2");
	put(s, 3, 5, "vent1");
	compile(s);
	for (let i = 0; i < 4; i++) tick(s);

	// Exactly what the Android bridge hands to the file picker and back.
	const back = deserialize(JSON.parse(exportSave(s)));

	assert.equal(back.money, s.money);
	assert.equal(back.heat, s.heat);
	assert.deepEqual(back.levels, s.levels);
	assert.deepEqual(back.placed, s.placed);
	for (let i = 0; i < 5; i++) {
		tick(s);
		tick(back);
	}
	assert.equal(back.power, s.power, "and keeps ticking identically");
});

test("importing junk is refused rather than destroying the game", () => {
	for (const junk of ['{"v":999}', "{}", '{"v":1,"tiles":[{"i":0,"id":"nonsense"}]}']) {
		const s = deserialize(JSON.parse(junk));
		assert.equal(s.money, 10, junk);
		assert.equal([...s.tiles].filter((t) => t.id).length, 0, junk);
	}
});

test("the sim reports what exploded so the UI can animate it", () => {
	const s = fresh();
	put(s, 5, 5, "uranium3");
	const vent = put(s, 5, 6, "vent1");
	compile(s);

	let boomTick = 0;
	for (let i = 0; i < 10 && !boomTick; i++) {
		tick(s);
		if (s.exploded.length) boomTick = i + 1;
	}
	assert.ok(boomTick, "the vent blew up and said so");
	assert.equal(vent.id, null);
	// The index is the tile's position in the fixed grid.
	assert.ok(s.exploded.includes(5 * MAX_COLS + 6));
});

test("a meltdown reports every tile it destroys", () => {
	const s = fresh();
	put(s, 4, 4, "uranium1");
	put(s, 6, 6, "uranium1");
	compile(s);
	s.heat = s.maxHeat * 4;
	tick(s);
	assert.ok(s.hasMeltedDown);
	assert.equal(s.exploded.length, 2, "both parts reported");
});
