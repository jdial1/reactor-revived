import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { newState, serialize, deserialize } from "../www/js/state.js";
import { OBJECTIVES } from "../www/js/objectives.js";
import { LETTERS, MYSTERIES, dueLetters, letterWaiting, fileLetter, readLetter } from "../www/js/letters.js";

// Every letter now due, filed at once, as if the printer were instant.
const fileDue = (s) => dueLetters(s).map((l) => (fileLetter(s, l.id), l.id));

test("letters come as the log climbs, in order, each once", () => {
	const s = newState(() => 1);
	assert.deepEqual(fileDue(s), [], "nothing on day one");
	s.objective = s.shown = 2;
	assert.deepEqual(fileDue(s), ["suspension"]);
	assert.deepEqual(fileDue(s), [], "each once");
	s.objective = 13;
	assert.deepEqual(fileDue(s), [], "a letter comes with its order, once that order is off the printer");
	s.shown = 13;
	assert.deepEqual(fileDue(s), ["vacancy", "drawings", "queue", "clock"]);

	s.objective = s.shown = OBJECTIVES.length - 1;
	s.order = { target: 1e9, met: 3 };
	s.records.complete = { ticks: 1 };
	fileDue(s);
	assert.deepEqual(s.letters, LETTERS.map((l) => l.id), "every letter, in the order written");
});

test("one letter waits at a time: the next only once the last is opened", () => {
	const s = newState(() => 1);
	s.objective = s.shown = 8;
	assert.equal(letterWaiting(s).id, "suspension");
	fileLetter(s, "suspension");
	assert.equal(letterWaiting(s), null, "the suspension notice is not yet opened");
	readLetter(s, "suspension");
	assert.equal(letterWaiting(s).id, "vacancy");
});

test("the planner files no letters, and letters ride along in the save", () => {
	const plan = newState(() => 1);
	plan.planner = true;
	plan.objective = plan.shown = 20;
	assert.deepEqual(dueLetters(plan), []);

	const s = newState(() => 1);
	s.objective = s.shown = 5;
	fileDue(s);
	readLetter(s, "suspension");
	readLetter(s, "no-such-letter");
	const back = deserialize(JSON.parse(JSON.stringify(serialize(s))), () => 1);
	assert.deepEqual(back.letters, ["suspension", "vacancy"]);
	assert.deepEqual(back.lettersRead, ["suspension"]);
	assert.equal(serialize(newState(() => 1)).letters, undefined, "nothing written before the first letter");
});

test("every mystery is hinted before it is answered, and every one is answered", () => {
	const hinted = new Set();
	const answered = new Set();
	for (const l of LETTERS) {
		for (const key of [...(l.hints ?? []), ...(l.answers ?? [])]) assert.ok(MYSTERIES[key], `${l.id}: ${key}`);
		for (const key of l.answers ?? []) {
			if (!["operator", "demand", "nefastium", "crate"].includes(key)) assert.ok(hinted.has(key), `${key} is answered before any hint`);
			answered.add(key);
		}
		for (const key of l.hints ?? []) hinted.add(key);
	}
	assert.deepEqual([...answered].sort(), Object.keys(MYSTERIES).sort());
});

test("letters keep the voice: plain, never to the operator, never the law", () => {
	for (const l of LETTERS) {
		const text = [l.from, l.found, l.mark, ...l.lines].filter(Boolean).join(" ");
		assert.ok(!text.includes("!"), `${l.id}: an exclamation mark`);
		for (const word of ["square", "quadratic", "exponential", "multipl"]) assert.ok(!text.toLowerCase().includes(word), `${l.id}: ${word}`);
		// Only the power is noticed (4.1): no letter speaks to the operator.
		assert.doesNotMatch(text, /\b(you|your|thank|thanks|please|sorry|dear)\b/i, l.id);
	}
	// The courier's worry (3.1): the university's letters get shorter.
	const words = LETTERS.filter((l) => l.from.startsWith("University")).map((l) => l.lines.join(" ").split(/\s+/).length);
	for (let i = 1; i < words.length; i++) assert.ok(words[i] < words[i - 1], "each shorter than the last");
});

test("no letter ships without a row in the interview's World Laws table (7.3)", () => {
	const guide = readFileSync(new URL("../docs/soul-interview.md", import.meta.url), "utf8");
	const table = guide.slice(guide.indexOf("### 7.3 World Laws"), guide.indexOf("### 7.4 The Never List"));
	for (const l of LETTERS) assert.ok(table.includes(`| \`${l.id}\` |`), `${l.id} has no row`);
});
