import { test } from "node:test";
import assert from "node:assert/strict";
import { newState } from "../www/js/state.js";
import { OBJECTIVES } from "../www/js/objectives.js";
import { LETTERS, checkLetters } from "../www/js/letters.js";
import { docket, standingByline, storyFile } from "../www/js/story.js";

const LAST = OBJECTIVES.length - 1;

test("the orders drift as the log's voice does: manual, work orders, unsigned demands", () => {
	const kinds = OBJECTIVES.map((_, i) => docket(i).kind);
	assert.deepEqual(kinds.slice(0, 10), Array(10).fill("manual"));
	assert.deepEqual(kinds.slice(10, 20), Array(10).fill("order"));
	assert.deepEqual(kinds.slice(20, LAST), Array(LAST - 20).fill("demand"));
	assert.equal(kinds[LAST], "notice");
	for (let i = 20; i <= LAST; i++) assert.equal(docket(i).byline, "From: not stated", `demand ${i + 1} is signed`);
	// The work orders come from the valley, and mostly from the institutions
	// that also write the letters: one correspondence, not two.
	const senders = OBJECTIVES.slice(10, 20).map((_, i) => docket(i + 10).byline.replace("From: ", ""));
	const writers = new Set(LETTERS.map((l) => l.from.split(",")[0]));
	assert.ok(senders.filter((s) => writers.has(s)).length >= 6, senders.join(", "));
	for (const d of OBJECTIVES.map((_, i) => docket(i))) for (const text of [d.head, d.byline, d.stamp]) {
		assert.ok(!text.includes("!"));
		assert.doesNotMatch(text, /\b(you|your|thank|please|well done)\b/i, text);
	}
});

test("a letter is filed just before the order it came with", () => {
	const s = newState(() => 1);
	s.objective = 13;
	checkLetters(s);
	const keys = storyFile(s).map((it) => it.key);
	assert.equal(keys.at(-1), "job:13", "the current order is last");
	assert.equal(keys.at(-2), "letter:clock", "with the letter that came with it just above");
	assert.ok(keys.indexOf("letter:suspension") === keys.indexOf("job:2") - 1);
	assert.ok(!keys.includes("job:14"), "what comes after is unwritten");
	for (const l of LETTERS.filter((l) => s.letters.includes(l.id))) {
		assert.equal(storyFile(s).find((it) => it.key === `letter:${l.id}`).at, l.job);
	}
});

test("past the log: the standing order, then the late letters, the notice before the courier", () => {
	const s = newState(() => 1);
	s.objective = LAST;
	checkLetters(s);
	s.order = { target: 5e6, met: 2 };
	assert.equal(standingByline(s), "From: not stated", "unsigned until the works letter says who it is for");
	s.order.met = 3;
	s.records.complete = { ticks: 1 };
	checkLetters(s);
	assert.equal(standingByline(s), "From: Harrow Works");
	const keys = storyFile(s).map((it) => it.key);
	assert.deepEqual(keys.slice(-6), ["letter:unregistered", `job:${LAST}`, "standing", "letter:works", "complete", "letter:courier"]);
	assert.equal(new Set(keys).size, keys.length, "nothing filed twice");
});
