import { test } from "node:test";
import assert from "node:assert/strict";
import { UPGRADES, sectionOf, maxLevel, TILE_ROW_LABEL } from "../www/js/upgrades.js";

const rows = new Map();
for (const u of UPGRADES.filter((x) => x.row)) rows.set(u.row, [...(rows.get(u.row) ?? []), u]);
const shorts = (row) => [...rows.get(row)].sort((a, b) => a.slot - b.slot).map((u) => u.short);

test("every fuel's upgrades are one row of three: Power, Time, Autobuy", () => {
	const fuels = [...rows.keys()].filter((row) => rows.get(row)[0].cellType);
	assert.ok(fuels.length >= 6);
	for (const fuel of fuels) {
		assert.deepEqual(shorts(fuel), ["Power", "Time", "Autobuy"], fuel);
		// Nothing else in a fuel's section, so its row is the whole section.
		for (const u of UPGRADES) if (sectionOf(u) === fuel) assert.equal(u.row, fuel, `${u.id} would sit beside the row`);
	}
});

test("the part families' upgrades are tile rows too, each tile in its place", () => {
	assert.deepEqual(shorts("reflectors"), ["Power", "Time", "Autobuy"]);
	assert.deepEqual(shorts("vents"), ["Rate", "By plating", "By capacitor"]);
	assert.deepEqual(shorts("exchangers"), ["Rate", "By plating", "By capacitor"]);
	assert.deepEqual(shorts("capacitors"), ["Capacity", "Replace"]);
	assert.deepEqual(rows.get("capacitors").map((u) => u.slot).sort(), [0, 2], "Replace keeps Autobuy's column");
	assert.deepEqual(shorts("accelerators"), ["Basic", "Advanced", "Super", "Wonderous", "Ultimate", "Black Hole"]);
	assert.equal(rows.get("parts").length, 9);
	assert.ok(rows.get("parts").every((u) => maxLevel(u) === 1), "the part unlocks are switches");

	for (const [row, us] of rows) {
		// One section and one page per row, one tile per slot, a name per tile.
		assert.equal(new Set(us.map(sectionOf)).size, 1, `${row} spans sections`);
		assert.equal(new Set(us.map((u) => Boolean(u.ecost))).size, 1, `${row} spans pages`);
		assert.equal(new Set(us.map((u) => u.slot)).size, us.length, `${row} has two tiles in one slot`);
		assert.equal(new Set(us.map((u) => u.short)).size, us.length, `${row} has two tiles of one name`);
		// A section holding two families' rows labels each.
		const section = sectionOf(us[0]);
		const shared = [...rows.keys()].filter((r) => sectionOf(rows.get(r)[0]) === section).length > 1;
		if (shared) assert.ok(TILE_ROW_LABEL[row], `${row} shares its section and has no label`);
	}
	// Vents share their section with lines (plating, coolant, refills), so they are labelled too.
	assert.equal(TILE_ROW_LABEL.vents, "Vents");
});
