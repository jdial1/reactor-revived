import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FILES, nextVariant } from "../www/js/audio.js";

test("a family is cycled: every variant once a round, never the same twice running", () => {
	let seed = 7;
	const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
	const plays = Array.from({ length: 60 }, () => nextVariant("coin", random));
	const family = FILES.filter((f) => f.startsWith("latch-"));
	assert.equal(family.length, 5);
	for (let i = 0; i < 60; i += 5) assert.deepEqual([...plays.slice(i, i + 5)].sort(), [...family].sort(), `round ${i / 5}`);
	for (let i = 1; i < plays.length; i++) assert.notEqual(plays[i], plays[i - 1], `repeat at ${i}`);
	assert.equal(nextVariant("place"), "place.ogg", "a single file is just itself");
});

// A wav's samples, and how much of their energy is above `hz`.
function wav(file) {
	const b = readFileSync(new URL(`../www/audio/${file}`, import.meta.url));
	const rate = b.readUInt32LE(24);
	const data = b.indexOf("data") + 8;
	const x = [];
	for (let i = data; i + 1 < b.length; i += 2) x.push(b.readInt16LE(i) / 32768);
	return { rate, x };
}
function above(x, rate, hz) {
	let n = 1;
	while (n < x.length) n *= 2;
	const re = new Float64Array(n);
	const im = new Float64Array(n);
	x.forEach((v, i) => { re[i] = v; });
	for (let i = 1, j = 0; i < n; i++) {
		let bit = n >> 1;
		for (; j & bit; bit >>= 1) j ^= bit;
		j ^= bit;
		if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
	}
	for (let len = 2; len <= n; len *= 2) {
		const ang = (-2 * Math.PI) / len;
		for (let i = 0; i < n; i += len) for (let k = 0; k < len / 2; k++) {
			const wr = Math.cos(ang * k), wi = Math.sin(ang * k);
			const a = i + k, c = i + k + len / 2;
			const tr = re[c] * wr - im[c] * wi, ti = re[c] * wi + im[c] * wr;
			re[c] = re[a] - tr; im[c] = im[a] - ti; re[a] += tr; im[a] += ti;
		}
	}
	let all = 0, high = 0;
	for (let k = 1; k < n / 2; k++) {
		const e = re[k] ** 2 + im[k] ** 2;
		all += e;
		if ((k * rate) / n > hz) high += e;
	}
	return high / all;
}

test("the synthesised clacks stay dark and short: next to nothing over 2 kHz, never clipped", () => {
	for (const f of FILES.filter((f) => f.endsWith(".wav"))) {
		const { rate, x } = wav(f);
		assert.ok(above(x, rate, 2000) < 0.02, `${f} is bright`);
		const peak = Math.max(...x.map(Math.abs));
		assert.ok(peak < 0.9, `${f} peaks at ${peak}`);
		assert.ok(x.length / rate < 0.4, `${f} is long`);
	}
});
