import { test } from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { backdropFor } from "../www/js/backdrop.js";

const at = (iso) => backdropFor(new Date(iso));

test("the valley follows the calendar and the clock", () => {
	assert.equal(at("2026-01-10T12:00").src, "backdrops/winter.webp");
	assert.equal(at("2026-04-14T12:00").src, "backdrops/spring.webp");
	assert.equal(at("2026-07-01T12:00").src, "backdrops/summer.webp");
	assert.equal(at("2026-10-10T12:00").src, "backdrops/autumn.webp");
	assert.equal(at("2026-12-01T12:00").src, "backdrops/winter.webp");
	assert.equal(at("2026-04-14T11:00").night, false);
	assert.equal(at("2026-04-14T19:00").night, true, "after seven, the room's own lamps");
	assert.equal(at("2026-04-14T06:59").night, true);
});

test("every season has its painting, and the four stay small", () => {
	let total = 0;
	for (const season of ["spring", "summer", "autumn", "winter"]) {
		const { size } = statSync(new URL(`../www/backdrops/${season}.webp`, import.meta.url));
		assert.ok(size < 80_000, `${season} is ${size} bytes`);
		total += size;
	}
	assert.ok(total < 200_000, `the valley weighs ${total} bytes`);
});
