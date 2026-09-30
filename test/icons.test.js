import { test } from "node:test";
import assert from "node:assert/strict";
import { ICON_ART } from "../www/js/icon-art.js";

test("every drawn icon is square, fully coloured, and outlined", () => {
	const names = ["power", "heat", "cash", "vent", "inlet", "outlet", "held", "flux", "ticks", "plan",
		"reactor", "upgrades", "experiments", "modules", "options"];
	assert.deepEqual(Object.keys(ICON_ART).sort(), [...names].sort());
	for (const [name, { palette, rows }] of Object.entries(ICON_ART)) {
		assert.ok(rows.every((r) => r.length === rows.length), `${name} is not square`);
		for (const r of rows) for (const c of r) assert.ok(c === "." || palette[c], `${name}: no colour for ${c}`);
		assert.ok(Object.values(palette).includes("#07090c"), `${name} has no outline`);
		assert.ok(Object.keys(palette).length <= 6, `${name} has too many colours`);
	}
});
