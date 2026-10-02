// The desk's hardware, after the modular control panels the designer chose as
// the soul of the interface (docs/reference-control-panels.md): counters on
// drums, a needle meter, the Day / Night switch, the lamp test, the tags hung
// on keys that cannot be pressed, and Flow drawn as lit track on the board.
import { h } from "./ui.js";
import { press } from "./audio.js";
import { SWITCHES } from "./records.js";
import { deskNight } from "./backdrop.js";
import { DESK_CODES } from "./codes.js";
import { heatScale, powerLamps, LAMPS } from "./instruments.js";

// ---- label strips ------------------------------------------------------------

/** A white strip slid into the panel: a plain name, and its code. */
export const strip = (name, code) => h("small", { className: "strip" },
	name, code ? h("span", { className: "code", textContent: code }) : "");

// ---- counters ----------------------------------------------------------------
// Every operation counted on six drums, never reset. The hand controls are
// counted from the first; an automation's counter is fitted when it is bought.

const COUNTERS = [
	["sell", "Sold", () => true],
	["vent", "Vented", () => true],
	["autoSell", "Auto-sell", SWITCHES[0][2]],
	["rebuy", "Rebuy", SWITCHES[1][2]],
	["operator", "Operator", SWITCHES[2][2]],
];

const drums = (n) => String(Math.min(999999, Math.floor(n))).padStart(6, "0");

function counter(key, name) {
	const digits = [...drums(0)].map((d) => h("i", { textContent: d }));
	const el = h("span", { className: "counter", title: `${name}: operations counted, never reset` },
		h("span", { className: "drums" }, ...digits), strip(name, DESK_CODES[key]));
	return Object.assign(el, { digits, shown: "" });
}

// ---- the needle meter ------------------------------------------------------------
// A small square moving-coil meter for heat, on a scale that runs to meltdown:
// from cold at the left stop, through rated heat (100 / 100) upright, to
// meltdown at the right stop - the reactor melts past twice its rating. It is
// red from upright on. It is the heat gauge's instrument, beside its reading,
// so the desk stays one row and the board keeps its room. Its needle
// eases, as a needle does.

const SWEEP = 50; // degrees either side of upright
const METER_FACE = `<svg viewBox="0 2 40 26" aria-hidden="true">
	<path class="arc" d="M5.5 24 A17 17 0 0 1 34.5 24" />
	<path class="red" d="M20 7 A17 17 0 0 1 34.5 24" />
	${[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1].map((v) => {
		const a = ((v * 2 - 1) * SWEEP * Math.PI) / 180;
		const r1 = v % 0.5 ? 15.5 : 14;
		return `<line x1="${(20 + 17 * Math.sin(a)).toFixed(2)}" y1="${(24 - 17 * Math.cos(a)).toFixed(2)}" x2="${(20 + r1 * Math.sin(a)).toFixed(2)}" y2="${(24 - r1 * Math.cos(a)).toFixed(2)}" />`;
	}).join("")}
	<g class="needle"><line x1="20" y1="24" x2="20" y2="8" /></g>
	<circle class="pivot" cx="20" cy="24" r="1.8" />
</svg>`;

function meter() {
	const face = h("span", { className: "face" });
	face.innerHTML = METER_FACE;
	const el = h("span", { className: "meter instrument", title: `Heat meter ${DESK_CODES.meter}: rated heat upright, meltdown at the stop` }, face);
	return Object.assign(el, { needle: face.querySelector(".needle") });
}

// ---- the power bargraph ----------------------------------------------------------
// Power is stored, not swung: its instrument is a bargraph, a rising row of
// lamps behind dark glass, as a charge indicator shows its level. Each lamp is
// a tenth of the capacitors; the last two are amber, and when the store is full
// the top one blinks - output going nowhere.

function bargraph() {
	const lamps = Array.from({ length: LAMPS }, (_, i) => h("i", { style: `--i: ${i}` }));
	const el = h("span", { className: "bargraph instrument", title: `Power store ${DESK_CODES.store}: a lamp a tenth` },
		h("span", { className: "face" }, ...lamps));
	return Object.assign(el, { lamps, lit: -1 });
}

// ---- the Day / Night switch ---------------------------------------------------
// A rotary switch, as on the Polish desk's "Dzień / Noc": Day, Auto, Night,
// on the Control room plate in Options. Auto follows the clock, as the valley
// behind the board does. At night the lamps and lit keys run lower.

const LIGHT = ["auto", "day", "night"];
const LIGHT_NAME = { auto: "Auto", day: "Day", night: "Night" };

function rotary(dom) {
	const dial = h("span", { className: "rotary" }, h("span", { className: "dial" }, h("i", { className: "knob" })));
	const label = h("span", { className: "setting" });
	const el = h("button", { className: "key wide light-key", title: `Panel lights ${DESK_CODES.light}: Auto, Day or Night`, onclick: () => {
		const s = dom.game.state;
		s.panelLight = LIGHT[(LIGHT.indexOf(s.panelLight ?? "auto") + 1) % LIGHT.length];
		press("place");
	} }, dial, label);
	return Object.assign(el, { dial, label });
}

// ---- building and drawing ----------------------------------------------------------

/**
 * The desk's hardware: the power bargraph and the heat meter, for the gauges;
 * and for the Options
 * page, the counters on their own plate and the Day / Night switch, a key on
 * the Control room plate. Only the instruments are on the reactor screen: the board
 * comes first.
 */
export function buildDeskHardware(dom) {
	dom.counters = Object.fromEntries(COUNTERS.map(([key, name]) => [key, counter(key, name)]));
	dom.rotary = rotary(dom);
	dom.meter = meter();
	dom.bargraph = bargraph();
	return { meter: dom.meter, bargraph: dom.bargraph, counters: h("div", { className: "counters" }, ...Object.values(dom.counters)), rotary: dom.rotary };
}

export function renderDeskHardware(dom, s) {
	for (const [key, , owned] of COUNTERS) {
		const c = dom.counters[key];
		c.hidden = !owned(s);
		const text = drums(s.counts?.[key] ?? 0);
		if (text === c.shown) continue;
		// The drum that turned rolls; the others stay put. The first reading
		// is set, not rolled.
		if (!c.shown) {
			[...text].forEach((d, i) => { c.digits[i].textContent = d; });
			c.shown = text;
			continue;
		}
		[...text].forEach((d, i) => {
			if (c.digits[i].textContent === d) return;
			c.digits[i].textContent = d;
			c.digits[i].classList.remove("roll-in");
			void c.digits[i].offsetWidth;
			c.digits[i].classList.add("roll-in");
		});
		c.shown = text;
	}
	const mode = s.panelLight ?? "auto";
	dom.rotary.dial.dataset.mode = mode;
	dom.rotary.label.textContent = `Panel lights: ${LIGHT_NAME[mode]}`;
	document.body.classList.toggle("desk-night", deskNight(s));
	const f = heatScale(s);
	const angle = (f * 2 - 1) * SWEEP;
	if (dom.meterAngle !== angle) {
		dom.meterAngle = angle;
		dom.meter.needle.style.transform = `rotate(${angle.toFixed(1)}deg)`;
		dom.meter.classList.toggle("over", f > 0.5);
	}
	const lit = powerLamps(s);
	if (dom.bargraph.lit !== lit) {
		dom.bargraph.lit = lit;
		dom.bargraph.lamps.forEach((lamp, i) => lamp.classList.toggle("on", i < lit));
	}
	dom.bargraph.classList.toggle("full", s.maxPower > 0 && s.power >= s.maxPower);
}

// ---- the lamp test ---------------------------------------------------------------

/** Every lamp and lit key burns for two seconds, so no dead bulb hides as a dark one. */
export function lampTest() {
	press("click");
	document.body.classList.remove("lamp-test");
	void document.body.offsetWidth;
	document.body.classList.add("lamp-test");
	setTimeout(() => document.body.classList.remove("lamp-test"), 2000);
}

// ---- tags ------------------------------------------------------------------------

/** Hang a tag on a key that cannot be pressed, saying why; take it off when it can. */
export function tag(key, reason) {
	if (reason) key.dataset.tag = reason;
	else delete key.dataset.tag;
}

// ---- Flow as lit track ------------------------------------------------------------
// Each part that moves heat is joined to the parts it moves it to by a length
// of dark track; while Flow is on, the track lights where heat moved this tick,
// brighter and warmer the more, its lamps running the way the heat goes.

const SVG = "http://www.w3.org/2000/svg";
const svg = (tag, attrs = {}) => {
	const el = document.createElementNS(SVG, tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	return el;
};

export function buildMimic(dom, s) {
	dom.mimic = svg("svg", { class: "mimic", viewBox: `0 0 ${s.cols} ${s.rows}`, preserveAspectRatio: "none", "aria-hidden": "true" });
	dom.mimicTrack = svg("g", { class: "track" });
	dom.mimicLit = svg("g", { class: "lit" });
	dom.mimic.append(dom.mimicTrack, dom.mimicLit);
	dom.grid.append(dom.mimic);
}

const centre = (i, cols) => [(i % cols) + 0.5, Math.floor(i / cols) + 0.5];

export function renderMimic(dom, s, on) {
	s.traceFlow = on;
	if (!dom.mimic) return;
	dom.mimic.hidden = !on;
	if (!on) {
		dom.mimicSig = "";
		return;
	}
	// The track: every join along which a part can move heat.
	const joins = new Set();
	for (const t of s.tiles) {
		if (!t.id || !t.activated || !t.containments?.length) continue;
		const a = t.r * s.cols + t.c;
		for (const n of t.containments) {
			const b = n.r * s.cols + n.c;
			joins.add(a < b ? `${a}-${b}` : `${b}-${a}`);
		}
	}
	const edges = s.edges ? [...s.edges] : [];
	const sig = `${[...joins].join()}|${edges.map(([k, v]) => `${k}:${Math.round(Math.log2(v + 1))}`).join()}`;
	if (sig === dom.mimicSig) return;
	dom.mimicSig = sig;
	dom.mimicTrack.replaceChildren(...[...joins].map((j) => {
		const [a, b] = j.split("-").map(Number);
		const [x1, y1] = centre(a, s.cols);
		const [x2, y2] = centre(b, s.cols);
		return svg("line", { x1, y1, x2, y2 });
	}));
	const most = Math.max(1, ...edges.map(([, v]) => v));
	dom.mimicLit.replaceChildren(...edges.map(([key, v]) => {
		const [a, b] = key.split(">").map(Number);
		const [x1, y1] = centre(a, s.cols);
		const [x2, y2] = centre(b, s.cols);
		const k = Math.log(1 + v) / Math.log(1 + most);
		const line = svg("line", { x1, y1, x2, y2 });
		line.style.opacity = (0.35 + 0.65 * k).toFixed(2);
		line.style.stroke = `color-mix(in srgb, var(--heat) ${Math.round(k * 100)}%, var(--bulb-hot))`;
		return line;
	}));
}
