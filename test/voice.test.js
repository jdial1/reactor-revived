import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { newState, serialize, deserialize } from "../www/js/state.js";
import { fileEntry } from "../www/js/records.js";
import { OBJECTIVES } from "../www/js/objectives.js";
import { NOTES } from "../www/js/notes.js";
import { TROPHIES } from "../www/js/records.js";
import { PARTS } from "../www/js/parts.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const source = readdirSync(new URL("../www/js/", import.meta.url))
	.filter((f) => f.endsWith(".js")).map((f) => read(`../www/js/${f}`)).join("\n");

test("the log book files entries without a word, on the real board only", () => {
	const s = newState(() => 1);
	fileEntry(s, "Supplied: Heat Vent.");
	assert.deepEqual(s.entries.map((e) => e.text), ["Supplied: Heat Vent."]);
	const back = deserialize(serialize(s), () => 1);
	assert.equal(back.entries[0].text, "Supplied: Heat Vent.", "entries ride along in the save");
	for (let i = 0; i < 50; i++) fileEntry(s, `Entry ${i}.`);
	assert.equal(s.entries.length, 40, "the book keeps the last forty");
	s.planner = true;
	fileEntry(s, "From the planner.");
	assert.notEqual(s.entries.at(-1).text, "From the planner.", "the planner files nothing");
});

test("every string the Voice Guide accepted is in the build", () => {
	const guide = read("../docs/soul-interview.md");
	const voice = guide.slice(guide.indexOf("### 7.5 Voice Guide"), guide.indexOf("### 7.6 Sensory Palette"));
	// Each "Accepted:" cell holds one or more quoted strings; where the build
	// differs on purpose, the cell says so and quotes what was built.
	const accepted = voice.split("\n").filter((row) => row.includes("| Accepted: ")).flatMap((row) => {
		let cell = row.slice(row.indexOf("Accepted: ")).split(" |")[0];
		if (cell.includes("In the build")) cell = cell.slice(cell.lastIndexOf(": "));
		return [...cell.matchAll(/"([^"]+)"/g)].map(([, text]) => text);
	});
	assert.ok(accepted.length >= 13, `found ${accepted.length} accepted strings`);
	for (const line of accepted) {
		// A placeholder such as \<part\> stands for a name the game fills in.
		for (const piece of line.split(/\\?<[^>]+\\?>/).map((p) => p.trim()).filter((p) => p.length > 3)) {
			assert.ok(source.includes(piece), `not in www/js: ${piece}`);
		}
	}
});

test("nothing the player reads raises its voice", () => {
	const lines = [
		...OBJECTIVES.flatMap((o) => [o.title, o.note]),
		...Object.values(NOTES).flatMap(([title, , line]) => [title, line]),
		...TROPHIES.flatMap(([, name, how]) => [name, how]),
		...PARTS.map((p) => p.desc),
	].filter(Boolean);
	for (const line of lines) assert.ok(!line.includes("!"), `an exclamation mark: ${line}`);
	// Toasts and labels written straight into the interface.
	for (const [, text] of source.matchAll(/(?:toast|textContent:)\s*\(?\s*["`]([^"`]*)["`]/g)) {
		assert.ok(!text.includes("!"), `an exclamation mark: ${text}`);
	}
});
