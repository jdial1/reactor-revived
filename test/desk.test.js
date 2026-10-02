import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize } from "../www/js/state.js";
import { compile, tick, tileAt } from "../www/js/sim.js";
import { PARTS } from "../www/js/parts.js";
import { applyUpgrades, reboot } from "../www/js/upgrades.js";
import { plantCode, DESK_CODES } from "../www/js/codes.js";
import { deskNight } from "../www/js/backdrop.js";

const fresh = () => newState(() => 1);
const put = (s, r, c, id) => Object.assign(tileAt(s, r, c), { id, activated: true, ticks: s.stats.get(id).ticks ?? 0 });

test("every part and every instrument has its own plant code", () => {
	const codes = PARTS.map(plantCode);
	assert.equal(new Set(codes).size, PARTS.length, "no two parts share a code");
	for (const c of codes) assert.match(c, /^(CL|PW|CO|TR|EX|MD)-[A-Z]{1,2}\d+$/, c);
	assert.equal(plantCode(PARTS.find((p) => p.id === "vent1")), "CO-V1");
	assert.equal(plantCode(PARTS.find((p) => p.id === "uranium3")), "CL-UR4");
	const desk = Object.values(DESK_CODES);
	assert.equal(new Set(desk).size, desk.length);
	for (const c of desk) assert.match(c, /^[A-Z]{2}\d{2}$/);
});

test("the counters count operations, never reset, and keep through a save", () => {
	const s = fresh();
	s.money = 1e12;
	s.levels.improved_power_lines = 1;
	applyUpgrades(s);
	put(s, 0, 0, "uranium1");
	compile(s);
	for (let i = 0; i < 5; i++) tick(s);
	assert.ok(s.counts.autoSell > 0, "auto-sell counted each time it sold");
	const sold = s.counts.autoSell;
	s.counts.sell = 7;
	reboot(s);
	assert.equal(s.counts.autoSell, sold, "a reboot does not reset the drums");
	assert.equal(s.counts.sell, 7);
	const back = deserialize(JSON.parse(JSON.stringify(serialize(s))), () => 1);
	assert.deepEqual(back.counts, s.counts);
	// An old save without counters starts them at nought.
	const old = serialize(fresh());
	delete old.counts;
	assert.deepEqual(deserialize(old, () => 1).counts, { sell: 0, vent: 0, autoSell: 0, rebuy: 0, operator: 0 });
});

test("the planner counts nothing", () => {
	const s = fresh();
	s.levels.improved_power_lines = 1;
	applyUpgrades(s);
	s.planner = true;
	put(s, 0, 0, "uranium1");
	compile(s);
	for (let i = 0; i < 5; i++) tick(s);
	assert.equal(s.counts.autoSell, 0);
});

test("Flow traces heat along each join only while it is on", () => {
	const s = fresh();
	put(s, 1, 1, "uranium1");
	put(s, 1, 2, "vent1");
	put(s, 0, 1, "vent1");
	compile(s);
	tick(s);
	assert.equal(s.edges, null, "nothing is traced with Flow off");
	s.traceFlow = true;
	tick(s);
	const at = (r, c) => r * s.cols + c;
	assert.ok(s.edges.get(`${at(1, 1)}>${at(1, 2)}`) > 0, "the cell's heat runs to the vent beside it");
	assert.ok(s.edges.get(`${at(1, 1)}>${at(0, 1)}`) > 0);
	for (const key of s.edges.keys()) {
		const [a, b] = key.split(">").map(Number);
		const d = Math.abs(a - b);
		assert.ok(d === 1 || d === s.cols, `${key} joins neighbours`);
	}
});

test("the desk runs at night by its switch, or by the clock on Auto", () => {
	const noon = new Date(2026, 6, 1, 12), late = new Date(2026, 6, 1, 22);
	assert.equal(deskNight({ panelLight: "auto" }, noon), false);
	assert.equal(deskNight({ panelLight: "auto" }, late), true);
	assert.equal(deskNight({}, late), true, "an old save is on Auto");
	assert.equal(deskNight({ panelLight: "day" }, late), false);
	assert.equal(deskNight({ panelLight: "night" }, noon), true);
	assert.equal(fresh().panelLight, "auto");
});

test("the heat meter runs to meltdown: rated heat is half way", async () => {
	const { heatScale, powerLamps, LAMPS } = await import("../www/js/instruments.js");
	const at = (heat, maxHeat = 1000) => heatScale({ heat, maxHeat });
	assert.equal(at(0), 0);
	assert.equal(at(1000), 0.5, "100 / 100 is the middle of the scale");
	assert.equal(at(2000), 1, "twice the rating is meltdown, the stop");
	assert.equal(at(5000), 1);
	assert.equal(at(-5), 0);
	assert.equal(heatScale({ heat: 10, maxHeat: 0 }), 0);
	// The sim melts the reactor past twice its rating: the stop is the end.
	const s = fresh();
	put(s, 0, 0, "uranium1");
	compile(s);
	s.heat = 2 * s.maxHeat + 1;
	tick(s);
	assert.ok(s.hasMeltedDown);

	const lamps = (power, maxPower = 100) => powerLamps({ power, maxPower });
	assert.equal(LAMPS, 10);
	assert.equal(lamps(0), 0);
	assert.equal(lamps(1), 1, "any power lights the first lamp");
	assert.equal(lamps(30), 3);
	assert.equal(lamps(31), 4);
	assert.equal(lamps(100), 10);
	assert.equal(lamps(500), 10);
	assert.equal(lamps(5, 0), 0);
});

test("the LED readouts place figures in fixed positions, points on their digits", async () => {
	const { ledCells, SEGMENTS, LED_DIGITS } = await import("../www/js/instruments.js");
	const { compact } = await import("../www/js/fmt.js");
	const show = (t) => ledCells(t).cells.map((c) => c.ch + (c.dp ? "." : "")).join("|");
	assert.equal(LED_DIGITS, 4);
	assert.equal(show("1.5K"), " | |1.|5");
	assert.equal(ledCells("1.5K").unit, "K");
	assert.equal(show("960"), " |9|6|0");
	assert.equal(ledCells("960").unit, "");
	assert.equal(show("0"), " | | |0");
	assert.equal(ledCells("2.7Qa").unit, "Qa");
	// Every figure compact() gives fits the four positions, and every character
	// in it has segments.
	for (const n of [0, 4.8, 75, 999, 1234, 29040, 166400, 2748000, 1.5e15, 9.99e32]) {
		const { cells } = ledCells(compact(n));
		assert.equal(cells.length, LED_DIGITS);
		assert.ok(compact(n).replace(/[.A-Za-z]/g, "").length <= LED_DIGITS, compact(n));
		for (const c of cells) assert.ok(c.ch in SEGMENTS, `${compact(n)}: ${c.ch}`);
	}
});
