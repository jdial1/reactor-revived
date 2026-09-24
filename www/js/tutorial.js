// The guided tutorial: cards that point at the real interface, and a few steps
// that wait for the player to do the thing rather than read about it. The game
// keeps running underneath - the overlay takes no taps except on its own card.
import { h, ask, say } from "./ui.js";
import { some, adjacentToCell } from "./objectives.js";

const cell = (p) => p.category === "cell";

// { target: selector to spotlight or null, title, text, waitFor?: (s) => bool, doing?: what to do }
// Short on purpose: each card asks for one thing and waits for it to be done.
// Everything else is taught by the operator's log, which opens each tab as it
// gets there, and by the parts, which say what they do when tapped.
export const STEPS = [
	{ target: null, title: "Harrow Station",
	  text: "The reactor has sat cold for eleven years, and the town below wants its power back. Fuel cells make power, which sells for money, which buys better parts. They also make heat, and heat is what ends reactors. Five things to do, then the log takes over. Skip any time - it lives in Options." },
	{ target: ".part.on", title: "A fuel cell",
	  text: "Uranium is selected in the dock. It costs $10, which is exactly what you have. Tap an empty tile to place it, or drag to place a row. Tap a placed part for everything you can do with it.",
	  doing: "Place a cell on the grid.",
	  waitFor: (s) => some(s, cell) },
	{ target: "#rates", title: "The line",
	  text: "The line above the bars is what the reactor does every second: power made, heat made, heat vented and moved. It is the most honest thing on the screen. Put a second cell touching the first and watch what the line does.",
	  doing: "Place a second cell touching the first.",
	  waitFor: (s) => adjacentToCell(s, cell) },
	{ target: ".gauge.power", title: "Sell",
	  text: "Power collects here until the bar is full, and anything over is wasted. Tap the bar to sell it.",
	  doing: "Tap the power bar.",
	  waitFor: (s) => s.soldPower },
	{ target: ".gauge.heat", title: "Heat",
	  text: "Heat collects here. Over the maximum the screen shakes; at twice the maximum the reactor melts down and every part is lost. Tapping the bar vents a little by hand.",
	  doing: "Tap the heat bar until it reads 0.",
	  waitFor: (s) => s.soldHeat },
	{ target: "#dock-tabs", title: "A vent",
	  text: "Hands do not scale. A Vent, under Cooling, takes heat from the parts it touches and sheds some every second - and explodes if it fills. Where it goes is up to you; the line will say whether it is working. If you cannot afford it yet, place it anyway: it waits, dashed, and buys itself.",
	  doing: "Place a Vent.",
	  waitFor: (s) => some(s, (p) => p.category === "vent") },
	{ target: "#goal .objective", title: "The log",
	  text: "The rest is on the operator's log, one job at a time, and it opens each tab when it gets there. Tap any placed part to see exactly what it is doing. Good luck - and watch the heat bar." },
];

let step = -1;
let el = null;
let shown = -2;
// The live state, refreshed every render: a wipe or an import replaces the
// object, and a button built against the old one would finish the wrong game.
let game = null;

/** Begin from the first step. Called on a new game and from Options. */
export function startTutorial() {
	step = 0;
	shown = -2;
}

export const tutorialActive = () => step >= 0;

function finish() {
	step = -1;
	if (game) game.tutorialDone = true;
	el?.remove();
	el = null;
}

function build() {
	const ring = h("i", { className: "tut-ring" });
	const count = h("small", {});
	const title = h("h2", {});
	const text = h("p", {});
	const doing = h("p", { className: "tut-doing" });
	const back = h("button", { textContent: "Back", onclick: () => { step = Math.max(0, step - 1); } });
	const skip = h("button", { className: "tut-skip", textContent: "Skip", onclick: () =>
		ask("Skip the tutorial? You can replay it from Options.", finish, "Skip") });
	const next = h("button", { className: "tut-next", onclick: () => {
		if (step >= STEPS.length - 1) finish();
		else step++;
	} });
	const card = h("div", { className: "tut-card", role: "dialog", ariaLabel: "Tutorial" },
		count, title, text, doing, h("div", { className: "tut-row" }, back, skip, next));
	el = h("div", { className: "tut" }, ring, card);
	el.parts = { ring, card, count, title, text, doing, back, next };
	el.skip = skip;
	document.body.append(el);
}

// Once, not per build: a replayed tutorial would otherwise stack listeners.
if (typeof addEventListener === "function") {
	addEventListener("keydown", (e) => {
		if (e.key === "Escape" && step >= 0 && el && !document.querySelector("dialog[open]")) el.skip.click();
	});
}

/** Called from the render loop, so it follows the layout rather than a timer of its own. */
export function renderTutorial(s) {
	if (step < 0) return;
	game = s;
	if (!el) build();
	const { ring, card, count, title, text, doing, back, next } = el.parts;
	const current = STEPS[step];

	if (shown !== step) {
		shown = step;
		count.textContent = `${step + 1} / ${STEPS.length}`;
		title.textContent = current.title;
		text.textContent = current.text;
		back.hidden = step === 0;
		say(`${current.title}. ${current.text}`);
	}

	const waiting = Boolean(current.waitFor) && !current.waitFor(s);
	doing.hidden = !current.doing;
	doing.textContent = waiting ? current.doing : current.doing ? "Done." : "";
	doing.classList.toggle("done", !waiting);
	next.disabled = waiting;
	next.textContent = waiting ? "Waiting for you" : step === STEPS.length - 1 ? "Play" : "Next";

	// Spotlight the target if it is on screen; otherwise dim everything and
	// centre the card.
	// The first match actually on screen: the dock keeps every tab's parts in the
	// DOM, and the first .part.next in document order is usually a hidden one.
	const box = current.target && [...document.querySelectorAll(current.target)]
		.map((n) => n.getBoundingClientRect())
		.find((b) => b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < innerHeight);
	const visible = Boolean(box);
	const pad = 4;
	if (visible) {
		Object.assign(ring.style, {
			left: `${box.left - pad}px`, top: `${box.top - pad}px`,
			width: `${box.width + pad * 2}px`, height: `${box.height + pad * 2}px`,
		});
	} else {
		Object.assign(ring.style, { left: "50%", top: "50%", width: "0px", height: "0px" });
	}
	ring.classList.toggle("empty", !visible);

	// Put the card on whichever side of the target has more room.
	const below = !visible || box.top + box.height / 2 < innerHeight / 2;
	card.style.top = visible && below ? `${Math.min(box.bottom + 12, innerHeight - card.offsetHeight - 8)}px` : "";
	card.style.bottom = visible && !below ? `${Math.max(8, innerHeight - box.top + 12)}px` : "";
	card.classList.toggle("centred", !visible);
}
