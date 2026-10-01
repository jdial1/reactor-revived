import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { newState, serialize, deserialize } from "../www/js/state.js";
import { OBJECTIVES } from "../www/js/objectives.js";
import { NOTES } from "../www/js/notes.js";
import { TROPHIES } from "../www/js/records.js";
import { PARTS } from "../www/js/parts.js";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const source = readdirSync(new URL("../www/js/", import.meta.url))
	.filter((f) => f.endsWith(".js")).map((f) => read(`../www/js/${f}`)).join("\n");

test("the log book is gone: an old save's entries are dropped, not carried", () => {
	const old = { ...serialize(newState(() => 1)), entries: [{ tick: 1, text: "Supplied: Heat Vent." }] };
	const s = deserialize(JSON.parse(JSON.stringify(old)), () => 1);
	assert.equal(s.entries, undefined);
	assert.equal(serialize(s).entries, undefined);
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
		...OBJECTIVES.flatMap((o) => [o.title, o.note, o.revision?.title, o.revision?.note]),
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

test("the log's voice drifts from manual sections to bare demands", () => {
	const notes = OBJECTIVES.map((o) => o.note);
	// Jobs 0-9 are pages of an old start-up guide; from job 10 on, none are.
	for (const note of notes.slice(0, 10)) assert.match(note, /^Section \d+\.\d+\. /, note);
	for (const note of notes.slice(10)) assert.doesNotMatch(note, /^Section /, note);
	// No pleasantries at any point, and the demands only get shorter.
	for (const note of notes) assert.doesNotMatch(note, /\b(please|thank|kindly|sorry)\b/i, note);
	const words = (list) => list.reduce((n, note) => n + note.split(/\s+/).length, 0) / list.length;
	assert.ok(words(notes.slice(20, 30)) < words(notes.slice(10, 20)), "the last ten are terser than the middle ten");
	assert.ok(words(notes.slice(10, 20)) < words(notes.slice(0, 10)), "the work orders are terser than the manual");
});
