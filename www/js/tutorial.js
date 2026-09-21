// The guided tutorial: cards that point at the real interface, and a few steps
// that wait for the player to do the thing rather than read about it. The game
// keeps running underneath - the overlay takes no taps except on its own card.
import { h, ask, say } from "./ui.js";
import { some, adjacentToCell } from "./objectives.js";

const cell = (p) => p.category === "cell";

// { target: selector to spotlight or null, title, text, waitFor?: (s) => bool, doing?: what to do }
export const STEPS = [
	{ target: null, title: "Welcome to the reactor",
	  text: "You run the reactor at Harrow Station, cold for eleven years, and the town below it wants its power back. Fuel cells make power, which you sell for money, which buys better parts. They also make heat, and heat is what ends reactors. This walks you through every part of it. Skip any time - it lives in Options." },
	{ target: "#grid", title: "The grid",
	  text: "Twelve rows, eight columns. Tap an empty tile to place the part selected in the dock. Drag to paint a line of them. Long press a part to sell it. Pinch to zoom; double tap to zoom back out." },
	{ target: ".part.on", title: "Place a fuel cell",
	  text: "Uranium is selected in the dock below. It costs $10, which is exactly what you have.",
	  doing: "Tap any empty tile on the grid.",
	  waitFor: (s) => some(s, cell) },
	{ target: "#grid", title: "What a cell does",
	  text: "Every second a cell makes power and heat, and uses up one tick of its life. The bar across the top of its tile is that life draining; when it runs out the cell is spent. A bar along the bottom of a tile is heat the part is holding." },
	{ target: "#rates", title: "Watch the line",
	  text: "The line above the bars is what the reactor does every second: power made, heat made, heat vented and moved. It is the most honest thing on the screen. Put a second cell right beside your first and watch what it does to that line - then decide what you think about packing cells together.",
	  doing: "Place a second cell touching the first.",
	  waitFor: (s) => adjacentToCell(s, cell) },
	{ target: ".gauge.power", title: "Selling power",
	  text: "Power collects here until it reaches the maximum, and then it stops - anything over the cap is wasted, and the bar pulses to tell you. Tap the bar to sell everything in it.",
	  doing: "Tap the power bar.",
	  waitFor: (s) => s.soldPower },
	{ target: ".gauge.heat", title: "Heat",
	  text: "Heat collects in the reactor too. Over its maximum the screen starts to shake; at twice the maximum the reactor melts down and every part is lost. Tapping the bar vents a little by hand.",
	  doing: "Tap the heat bar until it reads 0.",
	  waitFor: (s) => s.soldHeat },
	{ target: "#dock-tabs", title: "Vents",
	  text: "Tapping by hand does not scale. A Vent, under Cooling, takes heat from the parts around it and bleeds some away every second. A vent that fills up past its own limit explodes, so it has to be able to keep up. Place one now; if you cannot afford the $50 yet, place it anyway - it waits, dashed, and buys itself once the money arrives.",
	  doing: "Put a Vent on a tile next to your cell.",
	  waitFor: (s) => adjacentToCell(s, (p) => p.category === "vent") },
	{ target: "#dock-tabs", title: "Moving heat around",
	  text: "Transfer parts move heat without destroying it. A Heat Exchanger evens heat out between itself and its neighbours, pulling from whatever is fuller. An Inlet pulls heat out of the parts beside it into the reactor's shared pool. An Outlet pushes heat from that pool into the parts beside it - ideally vents." },
	{ target: "#dock-tabs", title: "Holding heat",
	  text: "A Coolant Cell is a big tank: it soaks up heat and does nothing else, which buys time. Reactor Plating holds a little heat and raises the reactor's maximum heat, so you can run hotter before anything shakes." },
	{ target: "#dock-tabs", title: "More power",
	  text: "A Capacitor raises the maximum power the bar can hold, so less is wasted between sells. A Reflector sits beside cells and makes them produce more, but wears out as they pulse into it. Both live under Power." },
	{ target: "#grid", title: "When parts fail",
	  text: "Every part that holds heat has a limit. Push past it and the part explodes and is gone - the heat it held goes back into the reactor. Watch the bars along the bottom of your tiles: a full one is a part about to go. Tap any placed part to see exactly what it is doing, what it would sell for, and to sell one, all of that kind, or everything." },
	{ target: ".part.next", title: "Unlocking tiers",
	  text: "Parts come in tiers. The strip under a part shows the next tier and how many of the current one you still need to place to unlock it - 0/10 means place ten. Higher tiers hold, vent and produce far more, and cost far more." },
	{ target: '#tabs button[data-value="upgrades"]', title: "Upgrades",
	  text: "Upgrades make every part better at once, and they stay through a reboot. The badge shows how many you can afford. Raised rows are affordable, flat ones are not yet, and each row shows the number it changes and what it becomes. Perpetual upgrades rebuy spent cells for you automatically." },
	{ target: "#goal .objective", title: "The log",
	  text: "This line is the next job on the operator's log, with what it pays and a bar when it has a count to reach. Tap it to read the whole log - who asked for what, and why. It follows this tutorial's order, then carries on long after it." },
	{ target: '#tabs button[data-value="experiments"]', title: "Starting over, stronger",
	  text: "Late on, Particle Accelerators turn heat into Exotic Particles. Rebooting the reactor from Experiments banks them and wipes the board and your money, but the particles buy research that makes the next reactor better than this one could ever be. That is the long game." },
	{ target: null, title: "That is everything",
	  text: "Place cells, keep the heat moving, sell the power, buy the upgrade that lets you pack in one more cell. Good luck - and watch the heat bar." },
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
