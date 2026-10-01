import { test } from "node:test";
import assert from "node:assert/strict";
import { attachInput } from "../www/js/input.js";

// A board of 40px tiles, and pointer events made by hand: no browser needed.
const TILE = 40;
const win = new EventTarget();
globalThis.addEventListener = win.addEventListener.bind(win);
globalThis.document = {
	elementFromPoint: (x, y) => ({ closest: () => ({ dataset: { r: Math.floor(y / TILE), c: Math.floor(x / TILE) } }) }),
};

function rig(occupied, { carrying = false } = {}) {
	const grid = new EventTarget();
	grid.style = { setProperty() {} };
	const calls = [];
	attachInput({ scrollLeft: 0, scrollTop: 0 }, grid, {
		onTap: (r, c) => calls.push(["tap", r, c]),
		onPaint: (r, c) => calls.push(["paint", r, c]),
		canPaint: (r, c) => !carrying && !occupied.has(`${r},${c}`),
	});
	let t = 0;
	const fire = (target, type, x, y) => {
		const e = new Event(type);
		Object.assign(e, { pointerId: 1, clientX: x, clientY: y });
		Object.defineProperty(e, "timeStamp", { value: (t += 500) });
		target.dispatchEvent(e);
	};
	// A press at (x, y) that drifts by (dx, dy) before it lifts.
	const press = (x, y, dx = 0, dy = 0) => {
		fire(grid, "pointerdown", x, y);
		if (dx || dy) fire(win, "pointermove", x + dx, y + dy);
		fire(win, "pointerup", x + dx, y + dy);
	};
	return { calls, press };
}

test("a press on a placed part is always its sheet, however it slips", () => {
	const { calls, press } = rig(new Set(["1,1"]));
	press(60, 60);
	press(60, 60, 15, 8);    // a long press that wobbles
	press(60, 60, 50, 0);    // one that slides off onto the next tile
	assert.deepEqual(calls, [["tap", 1, 1], ["tap", 1, 1], ["tap", 1, 1]]);
});

test("a drag from empty ground still paints a row", () => {
	const { calls, press } = rig(new Set());
	press(20, 20, 90, 0);
	assert.deepEqual(calls, [["paint", 0, 0], ["paint", 0, 2]]);
});

test("while a part is carried nothing paints: the press is where it goes", () => {
	const { calls, press } = rig(new Set(), { carrying: true });
	press(100, 100, 14, 6);
	assert.deepEqual(calls, [["tap", 2, 2]]);
});
