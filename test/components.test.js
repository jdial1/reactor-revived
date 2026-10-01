import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

// The interface is a small set of components (docs/ui-components.md). Their look
// is set once, from tokens, so a screen cannot drift into a look of its own.
const css = readFileSync(new URL("../www/css/app.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const root = css.slice(css.indexOf(":root {"), css.indexOf("}", css.indexOf(":root {")) + 1);
const rest = css.replace(root, "");
const marker = readFileSync(new URL("../www/css/app.css", import.meta.url), "utf8").indexOf("==== Components");
const js = readdirSync(new URL("../www/js/", import.meta.url)).filter((f) => f.endsWith(".js"))
	.map((f) => readFileSync(new URL(`../www/js/${f}`, import.meta.url), "utf8")).join("\n");

test("the components' colours are tokens, named once in :root", () => {
	const tokens = ["key-face", "key-face-in", "key-edge", "key-ink", "key-ink-off", "key-ink-lit", "lamp-off",
		"plating", "plating-hi", "plating-lo", "tray", "plate", "plate-ink", "plate-ink-dim", "card-ink", "card-rule",
		"bin-face", "frame-face", "flux-ink", "danger-ink", "manila", "slip", "envelope", "stamp-ink", "cash-ink", "seal",
		"bulb-hot", "bulb", "bulb-dim", "lens-off", "legend-off", "legend-lit"];
	for (const t of tokens) {
		const m = root.match(new RegExp(`--${t}:\\s*(#[0-9a-f]+)`, "i"));
		assert.ok(m, `--${t} is not in :root`);
		// The edge is also the board's outline colour; the rest belong to components only.
		if (t !== "key-edge") assert.ok(!rest.toLowerCase().includes(m[1].toLowerCase()), `${m[1]} (--${t}) is written out outside :root`);
	}
});

test("no steel frame is left: nothing is drawn with border-image", () => {
	assert.ok(!/border-image/.test(css));
	assert.ok(!/ui\/(button|panel)/.test(css));
});

test("each component's look is set in one place, the Components section", () => {
	assert.ok(marker > 0, "no Components section");
	const full = readFileSync(new URL("../www/css/app.css", import.meta.url), "utf8");
	for (const c of ["key", "lamp", "nameplate", "panel", "card", "bin", "stamp"]) {
		const starts = [...full.matchAll(new RegExp(`^\\.${c}\\s*[,{]`, "gm"))].map((m) => m.index);
		assert.ok(starts.length > 0, `.${c} is never defined`);
		assert.ok(starts.every((i) => i > marker), `.${c} is styled outside Components`);
	}
});

test("the old per-screen button looks are gone", () => {
	for (const sel of ["button.wide", "#tabs button", "#dock-tabs button", ".selector-key", ".ep-status"])
		assert.ok(!css.includes(sel), `${sel} is still styled`);
});

test("every control the screens build is a component", () => {
	// A wide action, a small tool and a selector are all keys; a part is in a bin.
	assert.ok(!/className: "wide/.test(js), "a wide button that is not a key");
	const classes = [...js.matchAll(/h\("button", \{\s*className: [`"]([^`"]*)[`"]/g)].map((m) => m[1].split(/\s+/));
	for (const c of classes) {
		if (c.includes("part")) assert.ok(c.includes("bin"), `a part not in a bin: ${c.join(" ")}`);
		if (["switch", "tool", "pause"].some((k) => c.includes(k))) assert.ok(c.includes("key"), `a control that is not a key: ${c.join(" ")}`);
	}
});
