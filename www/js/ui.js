// The DOM layer. Built once, then patched: a tile is touched only when its
// signature changes.
import { fmt } from "./fmt.js";
import { PARTS, isPartVisible, unlockProgress } from "./parts.js";
import { UPGRADES, costOf, isUnlocked, kindOf, maxLevel, nextLevel } from "./upgrades.js";
import { OBJECTIVES } from "./objectives.js";
import { artFor } from "./art.js";
import { icon } from "./icons.js";
import { ROWS, COLS, activeTiles, sellValue } from "./sim.js";

function h(tag, { dataset, ...props } = {}, ...kids) {
	// `dataset` is getter-only, so it cannot ride along with Object.assign.
	const node = Object.assign(document.createElement(tag), props);
	Object.assign(node.dataset, dataset);
	for (const k of kids.flat()) node.append(k);
	return node;
}

/**
 * A number on digit wheels, the way a mechanical counter or an EarthBound HP
 * readout does it. Each digit is one element holding "0123456789" stacked as
 * lines; showing a digit is a translate, and the transition rolls it.
 *
 * Wheels only ever turn one way. The strip is two cycles of ten, so 9 -> 0
 * rolls forward onto the second cycle and is quietly rewound afterwards rather
 * than spinning backwards through eight digits.
 */
const DIGITS = [...Array(20).keys()].map((i) => i % 10).join(String.fromCharCode(10));

function roller(className) {
	const el = h("span", { className: `roll ${className}` });
	const wheels = [];

	return {
		el,
		set(text) {
			if (wheels.length !== text.length) {
				el.replaceChildren();
				wheels.length = 0;
				for (const ch of text) {
					const face = h("b", { textContent: /\d/.test(ch) ? DIGITS : ch });
					const cell = h("i", { className: `wheel${/\d/.test(ch) ? " digit" : ""}` }, face);
					el.append(cell);
					wheels.push({ cell, face, pos: 0, digit: null });
				}
			}
			text.split("").forEach((ch, i) => {
				const w = wheels[i];
				// Only digits get a window; "1.234K" frames five of its six cells.
				w.cell.classList.toggle("digit", /\d/.test(ch));
				if (!/\d/.test(ch)) {
					if (w.digit !== ch) {
						w.face.textContent = ch;
						w.face.style.transform = "";
						w.digit = ch;
						w.pos = 0;
					}
					return;
				}
				if (w.digit === null || !/\d/.test(w.digit)) {
					w.face.textContent = DIGITS;
					w.digit = null;
				}
				const want = Number(ch);
				if (w.digit === ch) return;
				// Past the second cycle, snap back a cycle without a transition.
				if (w.pos >= 10) {
					w.face.style.transition = "none";
					w.pos -= 10;
					w.face.style.transform = `translateY(${-w.pos}em)`;
					void w.face.offsetHeight;
					w.face.style.transition = "";
				}
				w.pos = want > w.pos ? want : want + 10;
				w.face.style.transform = `translateY(${-w.pos}em)`;
				w.digit = ch;
			});
		},
	};
}

/** A row of buttons where exactly one is lit: the page tabs and the dock's. */
function tabStrip(id, items, onPick) {
	const el = h("div", { id });
	for (const [value, label, glyph] of items) {
		const button = h("button", { dataset: { value }, onclick: () => onPick(value) });
		if (glyph) button.append(icon(glyph));
		button.append(h("span", { textContent: label }));
		el.append(button);
	}
	el.select = (value, pages) => {
		for (const b of el.children) {
			const on = b.dataset.value === value;
			b.classList.toggle("on", on);
			// Tabs say which page you are on; the dock's say which set is open.
			b.setAttribute(pages ? "aria-current" : "aria-pressed", pages ? (on ? "page" : "false") : String(on));
		}
		for (const [key, page] of Object.entries(pages)) page.classList.toggle("showing", key === value);
	};
	return el;
}

// [id, label, icon]
const PAGES = [
	["reactor", "Reactor", "reactor"],
	["upgrades", "Upgrades", "upgrades"],
	["experiments", "Experiments", "experiments"],
	["options", "Options", "options"],
];

// [label, the categories it holds]. Split by what a part does, not by what is
// left over - "everything that is not a cell" was 42 parts in one tab.
const DOCK_TABS = [
	["Cells", ["cell"]],
	["Power", ["reflector", "capacitor"]],
	["Cooling", ["vent", "coolant_cell", "reactor_plating"]],
	["Transfer", ["heat_exchanger", "heat_inlet", "heat_outlet"]],
	["Exotic", ["particle_accelerator"]],
];

// Who handed this game down, oldest first; the last entry is this one.
// [name, url, what it contributed]
const LINEAGE = [
	["IndustrialCraft 2", null,
		"Minecraft mod, 2011. Its nuclear reactor is the original puzzle: fuel rods heat their "
		+ "neighbours, vents and exchangers move that heat around, and a full grid melts down."],
	["IC2 Reactor Planner", "https://forum.industrial-craft.net/thread/2147-new-reactor-planner-made-by-talonius/",
		"by Talonius. A desktop tool for laying a reactor out and simulating it before mining "
		+ "anything. The grid stops being a build and becomes a puzzle you solve on its own."],
	["Reactor Incremental", "http://www.kongregate.com/games/Cael/reactor-incremental",
		"by Cael, 2014. The planner made into an idle game: sell the power, buy upgrades, reboot "
		+ "for Exotic Particles. Every number this game uses starts here."],
	["Reactor Knockoff", "https://github.com/cwmonkey/reactor-knockoff",
		"by cwmonkey. Incremental rebuilt in HTML5 - no engine, no build step. The direct parent "
		+ "of this one, and the version the balance is checked against."],
	["Reactor Revival", null,
		"a later remake in the same line. Its part artwork is what you are looking at on the board."],
	["Reactor Revived", null,
		"this one: a clean-room rewrite for a phone, no dependencies, no network."],
];

// Fuels are their own families so uranium and plutonium never share a row.
const familyOf = (p) => (p.category === "cell" ? p.type : p.category);

export function buildUI(game) {
	const dom = {};
	const root = document.getElementById("app");
	root.replaceChildren();

	const meter = (id, glyph, onclick, title) => {
		// `fill` covers what is *not* full, pinning the colours to their share.
		const fill = h("i", { className: "unfilled" });
		const text = h("b", {});
		dom[id] = { fill, text };
		const el = h("button", { className: `meter ${id}`, onclick, title },
			fill, icon(glyph, "icon stat"), text);
		el.setAttribute("aria-label", title);
		dom[id].el = el;
		return el;
	};

	dom.money = roller("cash");
	dom.ep = roller("");
	dom.epBox = h("span", { className: "ep" }, dom.ep.el);
	// Money on top, particles under: on one line they read as one long number.
	dom.purse = h("div", { className: "purse" },
		h("div", { className: "money-row" }, icon("cash", "icon coin"), dom.money.el),
		dom.epBox);

	dom.pauseLabel = h("span", {});
	dom.pauseIcon = h("span", { className: "swap" }, icon("pause"));
	dom.pause = h("button", { className: "pause", onclick: game.togglePause }, dom.pauseIcon, dom.pauseLabel);

	dom.goalText = h("span", {});
	dom.goalBar = h("i", { className: "goal-bar" });
	dom.objective = h("button", {
		className: "objective",
		title: "Show every goal",
		onclick: () => showGoals(dom),
	});
	dom.objective.setAttribute("aria-haspopup", "dialog");
	dom.objective.setAttribute("aria-expanded", "false");
	dom.objective.append(dom.goalText, dom.goalBar);
	root.append(h("header", { id: "goal" }, dom.objective, dom.pause));
	// One polite live region for the whole game: goals met, meltdowns, unlocks.
	root.append(h("p", { id: "say", className: "sr-only" , role: "status" }));

	const main = h("main", {});
	dom.pages = {};
	for (const [id] of PAGES) {
		dom.pages[id] = h("section", { className: "page", id: `page-${id}` });
		main.append(dom.pages[id]);
	}
	root.append(main);

	root.append(h("a", { className: "skip", href: "#dock", textContent: "Skip to parts" }));
	dom.grid = h("div", { id: "grid" });
	dom.board = h("div", { id: "board" }, dom.grid);
	dom.pages.reactor.append(dom.board);

	dom.objectiveList = h("ol", { className: "objectives" });
	dom.goalSheet = h("dialog", { className: "sheet goals", ariaLabel: "Goals" },
		h("h2", { textContent: "Goals" }),
		dom.objectiveList,
		h("div", { className: "row" },
			h("button", { textContent: "Close", onclick: () => dom.goalSheet.close() })));
	root.append(dom.goalSheet);

	dom.upgradeList = h("div", { className: "upgrades" });
	dom.upgradeEmpty = h("p", { className: "empty", textContent:
		"Nothing you can afford yet. Sell power by tapping the power bar." });
	dom.pages.upgrades.append(dom.upgradeEmpty, dom.upgradeList);

	dom.experimentList = h("div", { className: "upgrades" });
	dom.epStatus = h("p", { className: "ep-status" });
	dom.pages.experiments.append(
		dom.epStatus,
		h("div", { className: "reboot" },
			h("button", { className: "wide", textContent: "Reboot reactor", onclick: () => game.reboot(false) }),
			h("button", { className: "wide", textContent: "Reboot & refund all EP", onclick: () => game.reboot(true) })),
		dom.experimentList,
	);

	dom.pages.options.append(
		h("div", { className: "options" },
			// Only Android can open a file picker, so in a browser these would
			// be two buttons that do nothing.
			...(game.canTransfer ? [
				h("button", { className: "wide", textContent: "Export save to a file", onclick: game.exportSave }),
				h("button", { className: "wide", textContent: "Import save from a file", onclick: game.importSave }),
			] : []),
			h("button", { className: "wide danger", textContent: "Wipe save and restart", onclick: game.wipe }),
			h("h3", { className: "credit-head", textContent: "Where this came from" }),
			h("ol", { className: "lineage" }, LINEAGE.map(([name, url, what], i) =>
				h("li", { className: i === LINEAGE.length - 1 ? "here" : "" },
					h("b", {}, url ? h("a", { href: url, textContent: name }) : name),
					h("i", { textContent: what })))),
			h("p", { className: "credit" },
				"Interface skinned from ",
				h("a", { href: "https://opengameart.org/content/sci-fi-user-interface-elements",
					textContent: "Sci-fi User Interface Elements" }),
				" by Buch (CC0) - the same pack Knockoff used.")),
	);

	// A slim line of what the reactor did this tick, under the totals that say
	// where it stands.
	dom.rates = {};
	const rateCell = (id, glyph, title) => {
		const value = h("b", {});
		dom.rates[id] = value;
		const cell = h("span", { className: `rate ${id}`, title }, icon(glyph, "icon"), value);
		cell.setAttribute("aria-label", title);
		return cell;
	};
	dom.rateBar = h("div", { id: "rates" },
		rateCell("power", "power", "Power generated per tick"),
		rateCell("heat", "heat", "Heat generated per tick"),
		rateCell("vent", "vent", "Heat vented per tick"),
		rateCell("inlet", "inlet", "Heat drawn in per tick"),
		rateCell("outlet", "outlet", "Heat pushed out per tick"));

	// dock and tabs
	// Money between the bar that makes it and the bar that threatens it.
	dom.actions = h("div", { id: "actions" },
		meter("power", "power", game.sellAll, "Sell all power"),
		dom.purse,
		meter("heat", "heat", game.ventHeat, "Vent heat"));
	dom.dock = h("div", { id: "dock", tabIndex: -1 });
	dom.tabs = tabStrip("tabs", PAGES, (id) => { showPage(dom, id); game.viewing(id); });
	dom.pips = {};
	for (const id of ["upgrades", "experiments"]) {
		const button = [...dom.tabs.children].find((b) => b.dataset.value === id);
		dom.pips[id] = button.appendChild(h("span", { className: `pip ${id}`, hidden: true }));
	}
	root.append(h("footer", {}, dom.rateBar, dom.actions, dom.dock, dom.tabs));

	buildDock(dom, game);
	buildUpgrades(dom, game);
	buildObjectiveList(dom);
	showPage(dom, "reactor");
	return dom;
}

function showPage(dom, id) {
	dom.page = id;
	dom.tabs.select(id, dom.pages);
	dom.dock.hidden = id !== "reactor";
}

function buildDock(dom, game) {
	dom.partButtons = [];
	dom.dockCols = [];
	dom.dockPages = {};
	dom.dockTabs = tabStrip("dock-tabs", DOCK_TABS.map(([label]) => [label, label]), (label) => showDock(dom, label));
	const body = h("div", { id: "dock-body" });

	for (const [tab, categories] of DOCK_TABS) {
		const page = h("div", { className: "dock-page" });
		dom.dockPages[tab] = page;
		body.append(page);

		let family = null;
		let column = null;
		for (const part of PARTS.filter((p) => categories.includes(p.category))) {
			if (familyOf(part) !== family) {
				family = familyOf(part);
				column = h("div", { className: "dock-col" });
				page.append(column);
				dom.dockCols.push(column);
			}
			const label = h("em", { textContent: part.short });
			const button = h("button", {
				className: "part",
				title: part.title,
				onclick: () => {
					game.select(part.id);
					// Say so, rather than letting the tap look ignored.
					if (button.classList.contains("poor")) {
						flash(button, "denied");
						toast(`${part.title} costs $${fmt(part.cost)}`, "cash");
					}
				},
			}, h("i", { style: `background-image:url(${artFor(part)})` }),
				label,
				h("u", { textContent: fmt(part.cost) }));
			// Prepending puts the newest tier on top, and the locked tier that
			// comes after them all above it.
			column.prepend(button);
			dom.partButtons.push({ button, part, label, tab });
		}
	}

	dom.dock.append(dom.dockTabs, body);
	showDock(dom, DOCK_TABS[0][0]);
}

const showDock = (dom, label) => {
	dom.dockTab = label;
	dom.dockTabs.select(label, dom.dockPages);
};

/**
 * Remove a transient element on animationend, or after a deadline: a hidden tab
 * pauses animations and animationend never comes.
 */
function removeAfter(el, ms) {
	const kill = () => el.remove();
	el.addEventListener("animationend", kill);
	setTimeout(kill, ms);
}

function say(text) {
	const live = document.getElementById("say");
	if (live) live.textContent = text;
}

export function floatText(text, anchor, colour) {
	if (!anchor) return;
	const box = anchor.getBoundingClientRect();
	const el = h("span", { className: "floater", textContent: text });
	el.style.color = colour;
	el.style.left = `${box.left + box.width / 2}px`;
	el.style.top = `${box.top + box.height / 4}px`;
	removeAfter(el, 1500);
	document.body.append(el);
}

export function toast(text, glyph) {
	document.getElementById("toast")?.remove();
	const el = h("div", { id: "toast" }, glyph ? icon(glyph) : [], h("span", { textContent: text }));
	removeAfter(el, 3200);
	document.body.append(el);
	say(text);
}

/**
 * Flash an element to confirm it did something. The class has to come off again:
 * the meter wash has no opacity of its own, so it stayed on as a solid slab.
 */
export const flash = (el, cls) => {
	if (!el) return;
	el.classList.remove(cls);
	void el.offsetWidth;              // restart the animation if it is running
	el.classList.add(cls);
	const done = () => el.classList.remove(cls);
	el.addEventListener("animationend", done, { once: true });
	setTimeout(done, 1200);           // animationend never fires on a hidden tab
};

function meltdownNotice(onAcknowledge) {
	const dialog = h("dialog", { className: "sheet meltdown" },
		h("h2", { textContent: "Meltdown" }),
		h("i", { textContent: "Heat passed twice what the reactor could hold. Every part in it was destroyed." }),
		h("div", { className: "row" },
			h("button", { className: "wide danger", textContent: "Restart the reactor", onclick: () => dialog.close() })));
	dialog.addEventListener("close", () => { dialog.remove(); onAcknowledge(); });
	document.body.append(dialog);
	dialog.showModal();
}

/** A modal question. Replaces confirm(), which Android renders as a system dialog. */
export function ask(question, onYes) {
	const dialog = h("dialog", { className: "ask", ariaLabel: question },
		h("p", { textContent: question }),
		h("div", { className: "row" },
			h("button", { textContent: "Cancel", onclick: () => dialog.close() }),
			h("button", { className: "danger", textContent: "Do it", onclick: () => { dialog.close(); onYes(); } })));
	dialog.addEventListener("close", () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
	// The safe choice takes focus, so a stray Enter cancels rather than wipes.
	dialog.querySelector("button")?.focus();
}

export function inspect(s, t, sell) {
	const p = s.stats.get(t.id);
	const placed = [...activeTiles(s)].filter((x) => x.id);
	const sameKind = placed.filter((x) => x.id === t.id).length;
	const rows = [
		["Sells for", `$${fmt(sellValue(s, t))}`],
		["Power", t.power ? fmt(t.power) : null],
		["Heat", t.heat ? fmt(t.heat) : null],
		["Life", p.ticks ? `${fmt(t.ticks)} / ${fmt(p.ticks)}` : null],
		["Heat held", p.containment ? `${fmt(t.heatContained)} / ${fmt(p.containment)}` : null],
		["Vents", p.vent ? `${fmt(p.vent)}/tick` : null],
		["Transfers", p.transfer ? `${fmt(p.transfer)}/tick` : null],
		["Max power", p.reactorPower ? `+${fmt(p.reactorPower)}` : null],
		["Max heat", p.reactorHeat ? `+${fmt(p.reactorHeat)}` : null],
	];

	const dialog = h("dialog", { className: "sheet", ariaLabel: p.title },
		h("h2", { textContent: p.title }),
		h("i", { textContent: p.desc ?? "" }),
		h("dl", {}, rows.filter(([, v]) => v !== null).flatMap(([k, v]) => [h("dt", { textContent: k }), h("dd", { textContent: v })])),
		h("div", { className: "sheet-actions" }, [
			h("button", { className: "danger", textContent: "Sell this one", onclick: () => { dialog.close(); sell.sell(); } }),
			sameKind > 1 && h("button", { className: "danger", textContent: `Sell all ${sameKind} ${p.title}s`, onclick: () => { dialog.close(); sell.sellKind(); } }),
			// One tap that empties the board deserves a second one.
			placed.length > sameKind && h("button", { className: "danger", textContent: `Sell everything (${placed.length} parts)`,
				onclick: () => { dialog.close(); ask(`Sell all ${placed.length} parts?`, sell.sellAll); } }),
		].filter(Boolean)),
		h("div", { className: "row" },
			h("button", { textContent: "Close", onclick: () => dialog.close() })));
	dialog.addEventListener("close", () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
}

function buildUpgrades(dom, game) {
	dom.upgradeRows = [];
	dom.upgradeOrder = {};
	for (const u of UPGRADES) {
		const cost = h("u", {});
		const level = h("s", {});
		// What the next level moves this from and to, filled in by the renderer.
		const was = h("s", {});
		const now = h("b", {});
		const delta = h("em", { className: "delta" }, was, now);
		const kind = kindOf(u);
		const badge = h("i", { className: `kind ${kind}`, title: kind },
			icon(kind === "utility" ? "options" : kind));
		const button = h("button", { className: "upgrade", onclick: () => game.buy(u.id) },
			badge,
			h("b", { textContent: u.title }),
			h("i", { textContent: u.desc }),
			delta,
			h("span", {}, cost, level));
		dom.upgradeRows.push({ u, button, cost, level, delta, was, now });
		(u.ecost ? dom.experimentList : dom.upgradeList).append(button);
	}
}

function buildObjectiveList(dom) {
	dom.objectiveRows = OBJECTIVES.map((o) => {
		const row = h("li", {}, h("b", { textContent: o.title }),
			h("i", { textContent: o.reward ? `$${fmt(o.reward)}` : o.epReward ? `${fmt(o.epReward)} EP` : "" }));
		dom.objectiveList.append(row);
		return row;
	});
}

function buildGrid(dom, s) {
	dom.grid.replaceChildren();
	dom.grid.setAttribute("role", "grid");
	dom.grid.setAttribute("aria-label", `Reactor, ${ROWS} rows by ${COLS} columns`);
	dom.grid.style.setProperty("--cols", COLS);
	dom.grid.style.setProperty("--rows", ROWS);
	dom.tiles = [];
	for (const t of activeTiles(s)) {
		const heat = h("i", { className: "heat" });
		const life = h("i", { className: "life" });
		// The vent's own art, blown up so only the hub shows, turning while the
		// vent is shifting heat.
		const fan = h("i", { className: "fan" });
		const cell = h("button", { className: "tile", dataset: { r: t.r, c: t.c } }, fan, heat, life);
		cell.setAttribute("role", "gridcell");
		cell.setAttribute("aria-label", `row ${t.r + 1} column ${t.c + 1}, empty`);
		// Ninety-six tab stops is not navigation. One way in, arrows to move.
		cell.tabIndex = t.r === 0 && t.c === 0 ? 0 : -1;
		dom.grid.append(cell);
		dom.tiles.push({ t, cell, heat, life, fan, sig: "", had: null });
	}
	// animationend bubbles, so one listener covers every tile.
	dom.grid.onanimationend = (e) => e.target.classList.remove("exploding");
	dom.grid.onkeydown = (e) => {
		const step = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
		if (!step || !e.target.dataset.r) return;
		const r = Math.min(ROWS - 1, Math.max(0, Number(e.target.dataset.r) + step[0]));
		const c = Math.min(COLS - 1, Math.max(0, Number(e.target.dataset.c) + step[1]));
		const next = dom.tiles[r * COLS + c].cell;
		e.target.tabIndex = -1;
		next.tabIndex = 0;
		next.focus();
		e.preventDefault();
	};
}

const pct = (n, d) => (d > 0 ? Math.min(100, (n / d) * 100) : 0);
// Quantising keeps a bar from triggering a repaint on every hairline change.
const quant = (n) => Math.round(n / 4) * 4;

export function render(dom, s, game) {
	// Money walks up to its new value over half a second: a number that jumps is
	// a number you did not see change. Only upwards, and it snaps once it is
	// within a percent - a readout that lags behind what you can spend is worse
	// than one that never moved.
	const gap = s.money - (dom.shownMoney ?? s.money);
	dom.shownMoney = gap < 0 || gap < Math.max(1, s.money * 0.01)
		? s.money
		: dom.shownMoney + gap * 0.55;
	dom.money.set(fmt(dom.shownMoney));
	// Pending particles are only worth anything once a reboot banks them.
	dom.ep.set(s.exoticParticles
		? `${fmt(s.currentExoticParticles)} EP +${fmt(s.exoticParticles)}`
		: `${fmt(s.currentExoticParticles)} EP`);
	dom.epBox.hidden = !s.currentExoticParticles && !s.exoticParticles && !s.totalExoticParticles;

	dom.power.text.textContent = `${fmt(s.power)} / ${fmt(s.maxPower)}`;
	dom.power.el.setAttribute("aria-label", `Sell all power, ${fmt(s.power)} of ${fmt(s.maxPower)}`);
	// Power stops accumulating at the cap, so a full bar is output going nowhere.
	dom.power.el.classList.toggle("full", s.power >= s.maxPower && s.maxPower > 0);
	dom.power.fill.style.left = `${pct(s.power, s.maxPower)}%`;
	dom.heat.text.textContent = `${fmt(s.heat)} / ${fmt(s.maxHeat)}`;
	dom.heat.el.setAttribute("aria-label", `Vent heat, ${fmt(s.heat)} of ${fmt(s.maxHeat)}`);
	dom.heat.fill.style.left = `${pct(s.heat, s.maxHeat)}%`;
	if (dom.pauseLabel.textContent !== (s.paused ? "Resume" : "Pause")) {
		dom.pauseLabel.textContent = s.paused ? "Resume" : "Pause";
		dom.pauseIcon.replaceChildren(icon(s.paused ? "play" : "pause"));
	}
	if (s.hasMeltedDown && !dom.meltdownShown) {
		dom.meltdownShown = true;
		flash(document.body, "melting");
		meltdownNotice(() => {
			dom.meltdownShown = false;
			game.clearMeltdown();
		});
	}

	const rate = s.rate ?? {};
	for (const [id, el] of Object.entries(dom.rates)) el.textContent = fmt(rate[id] ?? 0);

	const goal = OBJECTIVES[s.objective];
	const step = goal?.progress?.(s);
	const prize = goal && (goal.reward ? `  $${fmt(goal.reward)}` : goal.epReward ? `  ${fmt(goal.epReward)} EP` : "");
	dom.goalText.textContent = goal
		? `${goal.title}${step ? `  ${step[0]}/${step[1]}` : ""}${prize}`
		: "Every goal met.";
	dom.goalBar.style.setProperty("--p", step ? step[0] / step[1] : 0);
	dom.tabs.firstElementChild.classList.toggle("paused", s.paused);
	document.body.classList.toggle("hot", s.heat > s.maxHeat);
	document.body.classList.toggle("critical", s.heat > s.maxHeat * 1.5);

	if (!dom.tiles) buildGrid(dom, s);

	if (dom.page !== "reactor") {
		renderPage(dom, s);
		return;
	}

	// Drained, so each explosion animates once however often this runs.
	for (const i of s.exploded.splice(0)) {
		const cell = dom.tiles[i]?.cell;
		if (!cell) continue;
		cell.classList.remove("exploding");
		void cell.offsetWidth; // restart the animation if it is already running
		cell.classList.add("exploding");
	}

	for (const row of dom.tiles) {
		const { t } = row;
		const p = t.id ? s.stats.get(t.id) : null;
		const heat = p?.containment ? quant(pct(t.heatContained, p.containment)) : 0;
		const life = p?.ticks ? quant(pct(t.ticks, p.ticks)) : 0;
		row.fan.classList.toggle("spinning", Boolean(p?.vent) && t.vented > 0);

		const sig = `${t.id}|${t.activated}|${heat}|${life}`;
		if (sig === row.sig) continue;
		row.sig = sig;

		if (t.id && t.id !== row.had) flash(row.cell, "placed");
		row.had = t.id;
		row.cell.setAttribute("aria-label", p
			? `row ${t.r + 1} column ${t.c + 1}, ${p.title}${t.activated ? "" : ", unpaid"}`
			: `row ${t.r + 1} column ${t.c + 1}, empty`);

		const art = p ? `url(${artFor(p)})` : "";
		row.cell.style.backgroundImage = art;
		row.fan.style.backgroundImage = p?.vent ? art : "";
		const queued = Boolean(t.id) && !t.activated;
		row.cell.classList.toggle("queued", queued);
		row.cell.title = queued ? `Waiting for $${fmt(p.cost)}` : "";
		row.cell.classList.toggle("spent", Boolean(p) && p.category === "cell" && !t.ticks);
		row.heat.style.width = `${heat}%`;
		row.life.style.width = `${life}%`;
		// Green while there is life in it, amber at a fifth, red at a twentieth.
		row.life.style.background = life > 20 ? "" : life > 5 ? "var(--cash)" : "var(--heat)";
	}

	// One locked tier stands in for the rest, so a column never grows a row and
	// there is exactly one "what comes next" on screen rather than seven.
	const started = new Set();
	const placeholders = new Set();
	const nextFamilyShown = new Set();
	for (const row of dom.partButtons) {
		const { button, part, label, tab } = row;
		const visible = isPartVisible(s, part);
		const progress = visible ? null : unlockProgress(s, part);
		const family = familyOf(part);
		if (visible) started.add(family);

		const opensFamily = !started.has(family) && !nextFamilyShown.has(tab);
		const isNext = Boolean(progress) && !placeholders.has(family)
			&& (started.has(family) || opensFamily);
		if (isNext) {
			placeholders.add(family);
			if (!started.has(family)) nextFamilyShown.add(tab);
		}

		if (visible && row.wasLocked) {
			flash(button, "unlocked");
			toast(`${part.title} unlocked`, "upgrades");
		}
		row.wasLocked = !visible;

		button.disabled = !visible; // a placeholder is a signpost, not a part
		button.classList.toggle("locked", !visible && !isNext);
		button.classList.toggle("next", isNext);
		if (isNext) button.style.setProperty("--p", progress.have / progress.need);
		button.classList.toggle("poor", visible && s.money < part.cost);
		button.classList.toggle("on", game.selected === part.id);
		button.setAttribute("aria-pressed", String(game.selected === part.id));
		label.textContent = isNext ? `${progress.have}/${progress.need}` : part.short;
		// A greyed-out row with "4/10" on it is a riddle unless it says what the
		// ten are.
		button.title = isNext
			? `${part.title}: place ${progress.need} of the tier below to unlock (${progress.have} so far)`
			: part.title;
	}
	for (const col of dom.dockCols) col.hidden = !col.querySelector(".part:not(.locked)");
	const page = dom.dockPages[dom.dockTab];
	if (page) page.classList.toggle("more", page.scrollWidth > page.clientWidth + 4);
	renderPage(dom, s);
}

/** How many are affordable. costOf is Infinity at max level, so maxed ones
 * never count. */
function affordable(s, experiments) {
	let n = 0;
	for (const u of UPGRADES) {
		if (Boolean(u.ecost) !== experiments) continue;
		if (isUnlocked(s, u) && (u.ecost ? s.currentExoticParticles : s.money) >= costOf(s, u)) n++;
	}
	return n;
}

function renderPips(dom, s) {
	for (const [id, pip] of Object.entries(dom.pips)) {
		const n = affordable(s, id === "experiments");
		pip.hidden = !n;
		pip.textContent = n > 1 ? n : "";
		pip.classList.toggle("many", n > 1);
		pip.setAttribute("aria-label", n === 1 ? "1 affordable" : `${n} affordable`);
	}
}

function renderPage(dom, s) {
	renderPips(dom, s);
	renderObjectives(dom, s);
	if (dom.page === "upgrades" || dom.page === "experiments") renderUpgrades(dom, s);
	if (dom.page === "experiments") {
		dom.epStatus.textContent = s.exoticParticles
			? `${fmt(s.currentExoticParticles)} EP to spend, ${fmt(s.exoticParticles)} pending - reboot to bank them.`
			: `${fmt(s.currentExoticParticles)} EP to spend. Particle accelerators earn more.`;
	}
}

/** How many out-of-reach upgrades to leave visible as a preview. */
const PREVIEW_COUNT = 3;

function renderUpgrades(dom, s) {
	const onThisPage = ({ u }) => Boolean(u.ecost) === (dom.page === "experiments");
	const outOfReach = [];
	const buyable = [];
	const rest = [];

	for (const row of dom.upgradeRows) {
		// The other tab's rows are not on screen; leave them until they are.
		if (!onThisPage(row)) continue;
		const { u, button, cost, level, delta, was, now } = row;
		const lv = s.levels[u.id];
		const price = costOf(s, u);
		const owned = lv > 0;
		const unlocked = isUnlocked(s, u);
		const affordable = (u.ecost ? s.currentExoticParticles : s.money) >= price;

		cost.textContent = lv >= maxLevel(u) ? "MAX" : u.ecost ? `${fmt(price)} EP` : `$${fmt(price)}`;
		level.textContent = maxLevel(u) > 1 ? `lv ${lv}` : lv ? "owned" : "";

		// Measured, not declared. A switch has nothing to show and says so.
		const step = nextLevel(s, u);
		delta.hidden = !step;
		if (step) {
			was.textContent = step.from;
			now.textContent = step.to;
		}

		// An owned upgrade stays listed, so the price must say when the next level
		// is out of reach.
		button.classList.toggle("poor", !affordable && lv < maxLevel(u));
		row.price = price;

		const shown = unlocked && (owned || affordable);
		button.hidden = !shown;
		button.classList.toggle("preview", false);
		if (!shown && unlocked) outOfReach.push({ row, price });
		(affordable && lv < maxLevel(u) ? buyable : rest).push(row);
	}

	if (dom.page === "upgrades") dom.upgradeEmpty.hidden = buyable.length > 0;

	outOfReach.sort((a, b) => a.price - b.price);
	for (const { row } of outOfReach.slice(0, PREVIEW_COUNT)) {
		row.button.hidden = false;
		row.button.classList.add("preview");
	}

	// Buyable floats to the top. Re-appending moves nodes, so only when the order
	// actually changes.
	const ordered = [...buyable, ...rest];
	const sig = ordered.map((r) => r.u.id).join();
	if (dom.upgradeOrder[dom.page] !== sig) {
		dom.upgradeOrder[dom.page] = sig;
		(dom.page === "experiments" ? dom.experimentList : dom.upgradeList).append(...ordered.map((r) => r.button));
	}
}

function renderObjectives(dom, s) {
	dom.objectiveRows.forEach((row, i) => row.classList.toggle("done", i < s.objective));
	dom.objectiveRows.forEach((row, i) => row.classList.toggle("current", i === s.objective));
}

function showGoals(dom) {
	dom.goalSheet.showModal();
	dom.objective.setAttribute("aria-expanded", "true");
	dom.goalSheet.addEventListener("close",
		() => dom.objective.setAttribute("aria-expanded", "false"), { once: true });
	dom.objectiveList.querySelector(".current")?.scrollIntoView({ block: "center" });
}
