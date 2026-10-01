// The station's printer, on screen. What it prints and where it files is
// story.js; this is the waiting and the printing. After something is signed off
// (or a letter opened) the next one waits five to ten seconds, then comes out
// of a slot at the top of the screen on tractor-feed paper, a character at a
// time, in dots, with the head chattering across. Done, it is torn off and goes
// into the operator's log, and the goal line's lamp lights until the log is
// opened. The board keeps running underneath; the paper takes no taps.
import { h, say } from "./ui.js";
import { play } from "./audio.js";
import { waiting, fileItem, printout } from "./story.js";

const DELAY = [5000, 10000];
const CHAR_MS = 32;
const LINE_MS = 220;
const HOLD_MS = 1100;
const FILE_MS = 650;

export function buildPrinter(dom) {
	const type = h("div", { className: "type" });
	const paper = h("div", { className: "printout" }, type);
	const el = h("div", { id: "printer", hidden: true, ariaHidden: "true" },
		h("i", { className: "slot" }), h("div", { className: "feed" }, paper));
	document.body.append(el);
	dom.printer = { el, paper, type, busy: false, ready: {} };
}

const key = (item) => `${item.channel}:${item.id}`;

/** Called every render: start the next print once its delay has run out. */
export function tickPrinter(dom, s) {
	const p = dom.printer;
	if (!p || p.busy) return;
	const now = performance.now();
	const items = waiting(s);
	// A delay belongs to what is waiting; anything no longer waiting forgets it.
	for (const k of Object.keys(p.ready)) if (!items.some((it) => key(it) === k)) delete p.ready[k];
	if (document.hidden) return;
	for (const item of items) {
		p.ready[key(item)] ??= now + DELAY[0] + Math.random() * (DELAY[1] - DELAY[0]);
		if (now < p.ready[key(item)]) continue;
		delete p.ready[key(item)];
		print(dom, s, item);
		return;
	}
}

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

async function print(dom, s, item) {
	const p = dom.printer;
	p.busy = true;
	const { head, byline, lines } = printout(s, item);
	// Under the header, so the goal line stays readable above the paper.
	p.el.style.top = `${document.getElementById("goal")?.getBoundingClientRect().bottom ?? 0}px`;
	p.type.replaceChildren();
	p.paper.getAnimations().forEach((a) => a.cancel());
	p.el.hidden = false;
	p.el.classList.add("printing");
	const rows = [[head.toUpperCase(), "head"], [byline, "by"], ["", "rule"], ...lines.map((l) => [l, ""])];
	let n = 0;
	for (const [text, cls] of rows) {
		const line = h("p", { className: cls });
		const headEl = h("i", { className: "print-head" });
		line.append(headEl);
		p.type.append(line);
		for (const ch of text) {
			headEl.before(ch);
			// The head is heard, not every dot: a tick every other character.
			if (n++ % 2 === 0 && ch !== " ") play("print", 0.9 + Math.random() * 0.2);
			await wait(CHAR_MS);
		}
		headEl.remove();
		await wait(LINE_MS);
	}
	p.el.classList.remove("printing");
	await wait(HOLD_MS);
	// Torn off, and into the log behind the goal line.
	const from = p.paper.getBoundingClientRect();
	const to = dom.objective.getBoundingClientRect();
	const dx = to.left + to.width / 2 - (from.left + from.width / 2);
	const dy = to.top + to.height / 2 - (from.top + from.height / 2);
	await p.paper.animate([
		{ transform: "none", opacity: 1 },
		{ transform: `translate(${dx}px, ${dy}px) scale(0.12)`, opacity: 0 },
	], { duration: FILE_MS, easing: "ease-in", fill: "forwards" }).finished.catch(() => {});
	p.el.hidden = true;
	// The live game, not the one this print began on: a save may have been
	// loaded, or the item taken some other way, since.
	const live = dom.game.state;
	if (waiting(live).some((it) => key(it) === key(item))) {
		fileItem(live, item);
		dom.objective.classList.add("alert");
		play("click", 1.2);
		setTimeout(() => play("click", 1.5), 140);
		say(`Filed in the operator's log: ${head}, ${byline}.`);
	}
	p.busy = false;
}
