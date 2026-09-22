import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, serialize, deserialize } from "../www/js/state.js";
import { bankTime, spendFlux, span, FLUX_CAP, FLUX_SPEED } from "../www/js/flux.js";

test("time away is banked, a glance away is not, and the bank is capped", () => {
	const s = newState(() => 1);
	assert.equal(bankTime(s, 1000), 0); // first run: nothing to measure from
	assert.equal(bankTime(s, 1000 + 30e3), 0);
	assert.equal(bankTime(s, 1000 + 30e3 + 2 * 3600e3), 2 * 3600e3);
	assert.equal(s.flux, 2 * 3600e3);
	bankTime(s, s.lastSeen + 100 * 3600e3);
	assert.equal(s.flux, FLUX_CAP);
});

test("flux runs at ten times speed until the bank is empty, and stops itself", () => {
	const s = newState(() => 1);
	s.flux = 25 * s.loopWait;
	assert.equal(spendFlux(s), 0); // off until turned on
	s.fluxOn = true;
	assert.equal(spendFlux(s), FLUX_SPEED - 1);
	assert.equal(spendFlux(s), FLUX_SPEED - 1);
	assert.equal(spendFlux(s), 7);
	assert.equal(spendFlux(s), 0);
	assert.equal(s.fluxOn, false);
	assert.equal(s.flux, 0);
});

test("paused means no flux either", () => {
	const s = newState(() => 1);
	Object.assign(s, { flux: 1e6, fluxOn: true, paused: true });
	assert.equal(spendFlux(s), 0);
	assert.equal(s.flux, 1e6);
});

test("the bank rides in the save", () => {
	const s = newState(() => 1);
	Object.assign(s, { flux: 12345, fluxOn: true, lastSeen: 99 });
	const back = deserialize(JSON.parse(JSON.stringify(serialize(s))), () => 1);
	assert.deepEqual([back.flux, back.fluxOn, back.lastSeen], [12345, true, 99]);
});

test("spans read like a clock", () => {
	assert.equal(span(45e3), "45s");
	assert.equal(span(750e3), "12m 30s");
	assert.equal(span(7 * 3600e3 + 5 * 60e3), "7h 5m");
});
