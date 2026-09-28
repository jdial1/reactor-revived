import { test } from "node:test";
import assert from "node:assert/strict";
import { PARTS } from "../www/js/parts.js";
import { UPGRADE_BY_ID } from "../www/js/upgrades.js";
import { FAMILIES } from "../www/js/guide.js";
import { LESSONS, BENCHES } from "../www/js/lessons.js";

test("the parts guide covers every family, and every part has a line on its sheet", () => {
	const keys = new Set(FAMILIES.map(([k]) => k));
	for (const p of PARTS) {
		assert.ok(keys.has(p.category), `${p.category} has no guide entry`);
		assert.ok(p.desc && p.desc.length > 20, `${p.id} has no description`);
	}
	for (const [, name, , , ups] of FAMILIES) {
		for (const id of ups) assert.ok(UPGRADE_BY_ID.has(id), `${name} lists an upgrade that does not exist: ${id}`);
	}
});

test("the guide states rules, never the answers", () => {
	const text = [
		...FAMILIES.flatMap(([, , , lines]) => lines),
		...PARTS.map((p) => p.desc),
		...Object.values(LESSONS).map((l) => l.text),
		...Object.values(BENCHES).map((b) => b.text),
	].join(" ").toLowerCase();
	// The square law is the player's first discovery.
	for (const spoiler of ["square", "squared", "quadratic", "exponential"]) assert.ok(!text.includes(spoiler), spoiler);
	// Rules, not layout advice.
	for (const advice of ["you should", "put a", "place a", "best"]) assert.ok(!text.includes(advice), advice);
});

test("nothing the player reads states the square law, in the game or in the store", async () => {
	const { readFileSync } = await import("node:fs");
	const { STEPS } = await import("../www/js/tutorial.js");
	const { NOTES } = await import("../www/js/notes.js");
	const { OBJECTIVES } = await import("../www/js/objectives.js");
	// The listing's short and full descriptions, as they go into the console.
	const listing = readFileSync(new URL("../docs/play/listing.md", import.meta.url), "utf8");
	const store = listing.split("## Release notes")[0].match(/```[\s\S]*?```/g).join(" ");
	const text = [
		...STEPS.flatMap((step) => [step.title, step.text]),
		...Object.values(NOTES).map(([title, , line]) => `${title} ${line}`),
		...OBJECTIVES.flatMap((o) => [o.title, o.note, o.revision?.title ?? "", o.revision?.note ?? ""]),
		store,
	].join(" ").toLowerCase();
	for (const spoiler of ["square", "squared", "quadratic", "exponential", "multipl"]) assert.ok(!text.includes(spoiler), spoiler);
});

test("the parts datasheet copies every open family with its numbers", async () => {
	const { newState } = await import("../www/js/state.js");
	const { datasheet } = await import("../www/js/guide.js");
	const s = newState(() => 1);
	const text = datasheet(s);
	assert.match(text, /^Reactor Revived - parts datasheet/);
	assert.match(text, /FUEL CELLS/);
	assert.match(text, /Uranium Cell: power 1, heat 1, life 15, price \$10/);
	assert.ok(!text.includes("HEAT VENTS"), "a family the log has not reached stays out");
});
