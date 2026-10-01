import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize } from "../www/js/state.js";
import { reboot } from "../www/js/upgrades.js";
import { OBJECTIVES, checkObjectives, checkOrder, goalAt, orderTitle, orderEntry } from "../www/js/objectives.js";

// A running board making `power` a tick, without building one.
const running = (s, power) => {
	s.paused = false;
	s.cells = [{ power }];
	return s;
};

test("a revised job is cancelled when first met, asked again higher, and paid once", () => {
	const s = running(newState(() => 1), 600);
	s.objective = 14;
	assert.equal(goalAt(s).title, "Make 500 power per tick");
	const money = s.money;
	assert.equal(checkObjectives(s), false, "met as first asked: not paid");
	assert.equal(s.objective, 14);
	assert.equal(s.money, money);
	assert.deepEqual(s.revised, [14]);
	assert.equal(goalAt(s).title, "Make 750 power per tick");
	assert.equal(goalAt(s).note, "Order revised. 500 cancelled. Output required: 750 per tick.");
	assert.equal(OBJECTIVES[14].title, "Make 500 power per tick", "the list itself is not rewritten");

	assert.equal(checkObjectives(s), false, "600 does not meet 750");
	assert.equal(s.revised.length, 1, "revised once only");
	running(s, 800);
	assert.ok(checkObjectives(s));
	assert.equal(s.objective, 15);
	assert.equal(s.money, money + OBJECTIVES[14].reward);
});

test("revisions come late in the log, only raise the order, and say what they cancelled", () => {
	const revised = OBJECTIVES.flatMap((o, i) => (o.revision ? [i] : []));
	assert.ok(revised.length >= 3);
	assert.ok(revised.every((i) => i >= 10), "the start-up guide's jobs stand as asked");
	assert.ok(revised.filter((i) => i >= 20).length > revised.filter((i) => i < 20).length, "more often as the demand grows");
	for (const i of revised) {
		const { note } = OBJECTIVES[i].revision;
		assert.match(note, /^Order revised\. .+ cancelled\. /, note);
	}
	// A state that meets the raised order also meets the first one.
	const s = running(newState(() => 1), 1e3);
	s.money = 2e10;
	s.exoticParticles = 2000;
	for (const i of revised) {
		assert.ok(OBJECTIVES[i].revision.check(s) && OBJECTIVES[i].check(s), `${i} meets both`);
		const short = running(newState(() => 1), 600);
		short.money = 1.2e10;
		short.exoticParticles = 1200;
		assert.ok(OBJECTIVES[i].check(short) && !OBJECTIVES[i].revision.check(short), `${i} is raised`);
	}
});

test("a revision rides along in the save", () => {
	const s = running(newState(() => 1), 600);
	s.objective = 14;
	checkObjectives(s);
	const back = deserialize(JSON.parse(JSON.stringify(serialize(s))), () => 1);
	assert.deepEqual(back.revised, [14]);
	assert.equal(goalAt(back).title, "Make 750 power per tick");
	assert.equal(serialize(newState(() => 1)).revised, undefined, "nothing written until something is revised");
});

test("past the last job a standing order is issued above the reactor, and raised when met", () => {
	const s = running(newState(() => 1), 3e6);
	s.objective = OBJECTIVES.length - 2;
	assert.equal(checkOrder(s), false);
	assert.equal(s.order, null, "no order before the log is finished");

	s.objective = OBJECTIVES.length - 1;
	assert.equal(checkOrder(s), false, "issued, not met");
	assert.equal(s.order.target, 5e6, "a round figure above what the reactor makes");
	assert.equal(orderEntry(s.order.target), "Increase output: 5M per tick. Reason: not required.");
	assert.equal(orderTitle(s.order.target), "Increase output to 5M per tick");

	running(s, 6e6);
	s.paused = true;
	assert.equal(checkOrder(s), false, "a stopped reactor meets nothing");
	s.paused = false;
	assert.ok(checkOrder(s));
	assert.equal(s.order.met, 1);
	assert.equal(s.order.target, 1e7, "raised above what it makes now");

	// Many times over is still one order met: the next stands above it.
	running(s, 4e9);
	assert.ok(checkOrder(s));
	assert.equal(s.order.met, 2);
	assert.ok(s.order.target > 4e9);
	assert.equal(checkOrder(s), false);
});

test("the standing order never falls: not for a quiet reactor, a save, or a reboot", () => {
	const s = running(newState(() => 1), 3e6);
	s.objective = OBJECTIVES.length - 1;
	checkOrder(s);
	running(s, 5e6);
	checkOrder(s);
	const target = s.order.target;
	running(s, 0);
	checkOrder(s);
	assert.equal(s.order.target, target);
	const back = deserialize(JSON.parse(JSON.stringify(serialize(s))), () => 1);
	assert.deepEqual(back.order, s.order);
	reboot(back, false, null);
	assert.deepEqual(back.order, s.order, "a reboot keeps the order and its count");
	// A quiet station's first order is still a demand, not zero.
	const quiet = running(newState(() => 1), 0);
	quiet.objective = OBJECTIVES.length - 1;
	checkOrder(quiet);
	assert.equal(quiet.order.target, 2000);
});
