import { test } from "node:test";
import assert from "node:assert/strict";
import { UPGRADES, sectionOf } from "../www/js/upgrades.js";

test("every fuel's upgrades are one row of three: Power, Time, Autobuy", () => {
	const rows = new Map();
	for (const u of UPGRADES.filter((x) => x.short)) {
		assert.equal(sectionOf(u), u.cellType, `${u.id} sits under its fuel`);
		rows.set(u.cellType, [...(rows.get(u.cellType) ?? []), u.short]);
	}
	assert.ok(rows.size >= 6);
	for (const [fuel, shorts] of rows) assert.deepEqual(shorts.sort(), ["Autobuy", "Power", "Time"], fuel);
	// Nothing else in a fuel's section, so its row is the whole section.
	for (const u of UPGRADES) if (rows.has(sectionOf(u))) assert.ok(u.short, `${u.id} would sit beside the row`);
});
