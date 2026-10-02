// The DOM layer. Built once, then patched: a tile is touched only when its
// signature changes.
import { heatScale } from "./instruments.js";
import { fmt, compact } from "./fmt.js";
import { PARTS, PART_BY_ID, isPartVisible, unlockProgress, modulesOpen, categoryOpen } from "./parts.js";
import { UPGRADES, SECTIONS, sectionOf, costOf, isUnlocked, kindOf, maxLevel, nextLevel, TILE_ROW_LABEL } from "./upgrades.js";
import { OBJECTIVES, goalAt, orderTitle, orderEntry, orderProgress } from "./objectives.js";
import { artFor } from "./art.js";
import { icon } from "./icons.js";
import { play, press, setHeat } from "./audio.js";
import { ROWS, COLS, activeTiles, sellValue } from "./sim.js";
import { modId, heatFill } from "./module.js";
import { span } from "./flux.js";
import { buildVerdict, renderVerdict, replaceDialog, snapshotDialog, lessonDialog, ledgerSheet } from "./tools-ui.js";
import { guideDialog, familyOf as guideFamily, FAMILIES } from "./guide.js";
import { snapshotFor } from "./snapshots.js";
import { LESSON_AT, BENCHES } from "./lessons.js";
import { RUNGS, RESTRICTIONS, TROPHIES, restrictionLabel, toolsAllowed, award, perCell, SWITCHES } from "./records.js";
import { backdropFor } from "./backdrop.js";
import { NOTES, notesFor } from "./notes.js";
import { LETTERS, readLetter } from "./letters.js";
import { docket, standingByline, storyFile } from "./story.js";
import { COMPLETE_ENTRY } from "./complete.js";
import { buildPrinter, tickPrinter } from "./printer-ui.js";
import { claimNote } from "./notes.js";
import { strip, buildDeskHardware, renderDeskHardware, lampTest, tag, buildMimic, renderMimic } from "./desk-ui.js";
import { plantCode, DESK_CODES } from "./codes.js";
import { buildModulesPage, renderModules, face } from "./modules-ui.js";

// The tap that opens a sheet is followed, on a phone, by the browser's own
// click at the same spot - which lands on whatever button the sheet has just
// put under the finger: Sell this one, Move, Sell all. So a sheet takes no
// clicks for its first moments. Every sheet in the game opens with showModal,
// so this is done once, for all of them.
const SETTLE_MS = 350;
const openedAt = new WeakMap();
if (typeof HTMLDialogElement !== "undefined") {
	const showModal = HTMLDialogElement.prototype.showModal;
	HTMLDialogElement.prototype.showModal = function () {
		openedAt.set(this, performance.now());
		return showModal.call(this);
	};
	document.addEventListener("click", (e) => {
		const sheet = e.target instanceof Element && e.target.closest("dialog");
		if (sheet && performance.now() - (openedAt.get(sheet) ?? -Infinity) < SETTLE_MS) {
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	}, true);
}

export function h(tag, { dataset, ...props } = {}, ...kids) {
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
	let busy = false;
	let waiting = null;

	const api = {
		el,
		/**
		 * Wind every drum back down to zero, the far end first, then flip them
		 * up to the real figure - an odometer being reset and caught out.
		 * Readings that arrive meanwhile wait until it is done.
		 */
		rewind(done) {
			if (busy) return;
			const drums = wheels.filter((w) => w.cell.classList.contains("digit"));
			if (!drums.length) return;
			busy = true;
			// Slow enough to watch every drum go: an odometer, not a slot machine.
			const down = 1800;
			const stagger = 140;
			drums.forEach((w, i) => {
				if (w.pos >= 10) {
					w.face.style.transition = "none";
					w.pos -= 10;
					w.face.style.transform = `translateY(${-w.pos}em)`;
					void w.face.offsetHeight;
				}
				// From the last digit back, so it reads as a counter running down.
				w.face.style.transition = `transform ${down}ms cubic-bezier(0.4, 0, 0.2, 1) ${(drums.length - 1 - i) * stagger}ms`;
				w.pos = 0;
				w.face.style.transform = "translateY(0)";
			});
			const flipAt = down + drums.length * stagger + 500;
			setTimeout(() => {
				drums.forEach((w, i) => {
					w.face.style.transition = `transform 320ms steps(3) ${i * 90}ms`;
					w.pos = Number(w.digit);
					w.face.style.transform = `translateY(${-w.pos}em)`;
				});
				setTimeout(() => {
					for (const w of drums) w.face.style.transition = "";
					busy = false;
					if (waiting !== null) api.set(waiting);
					waiting = null;
					done?.();
				}, 320 + drums.length * 90 + 120);
			}, flipAt);
		},
		set(text) {
			if (busy) {
				waiting = text;
				return;
			}
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
	return api;
}

/** A row of buttons where exactly one is lit: the page tabs and the dock's. */
/** A zone of the desk, named white on black, with its zone number. */
const zonePlate = (name, code) => h("div", { className: "zone-plate" },
	h("b", { textContent: name }), h("span", { textContent: code }));

function tabStrip(id, items, onPick) {
	// A bank of lit keys, square, centred: each a lens with its icon behind the
	// glass and its name printed on it. Backlit, it can be pressed; dark, it
	// cannot yet. The chosen one latches (see Components, app.css). Every key
	// is always there, as on a finished desk; what is not open yet is unlit.
	const el = h("div", { id, className: "selector" });
	// One size of lettering for the bank, set by its longest name, so every
	// name fits its glass at any width (Components, app.css).
	el.style.setProperty("--chars", Math.max(...items.map(([, label]) => label.length)));
	for (const [value, label, glyph, art] of items) {
		// A selector key: a quiet click, and no clack - nothing on the board moves.
		const behind = art ? h("i", { className: "art", style: `background-image:url(${art})` }) : icon(glyph);
		const button = h("button", { className: "key lit", ariaLabel: label, dataset: { value }, onclick: () => { play("click"); onPick(value); } },
			h("span", { className: "lens" }, behind, h("span", { className: "legend", textContent: label })));
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
	["modules", "Modules", "modules"],
	["options", "Options", "options"],
];

// [label, the categories it holds]. Split by what a part does, not by what is
// left over - "everything that is not a cell" was 42 parts in one tab.
const DOCK_TABS = [
	["Cells", ["cell"]],
	["Power", ["reflector", "capacitor"]],
	["Cooling", ["vent", "component_vent", "coolant_cell", "condensator", "reactor_plating"]],
	["Transfer", ["heat_exchanger", "heat_inlet", "heat_outlet", "hull_vent"]],
	["Exotic", ["particle_accelerator"]],
	// Filled from the saved designs, not the catalog.
	["Modules", ["module"]],
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
		"a later remake in the same line. Its part artwork, and the valley behind the board by day, are what you are looking at."],
	["Reactor Revived", null,
		"this one: a clean-room rewrite for a phone, no dependencies, no network. Its icons, and the valley by night, were drawn for it."],
];

// Fuels are their own families so uranium and plutonium never share a row.
const familyOf = (p) => (p.category === "cell" ? p.type : p.category);

export function buildUI(game) {
	const dom = {};
	const root = document.getElementById("app");
	root.replaceChildren();
	// The desk's instruments, counters and Day / Night switch (desk-ui.js).
	const hardware = buildDeskHardware(dom);

	// A gauge is a label, a reading and one plain bar - the way Incremental and
	// Knockoff showed them. The bar is the button. An instrument, if it has one,
	// sits at its side.
	const gauge = (id, label, onclick, title, instrument = null) => {
		const fill = h("i", {});
		const text = h("b", {});
		// The name on a label strip slid into the desk, with its plant code.
		const name = h("span", { textContent: label });
		const el = h("button", { className: `gauge ${id}`, onclick, title },
			...(instrument ? [instrument] : []),
			h("span", { className: "reading" }, strip(name, DESK_CODES[id]), text),
			h("span", { className: "track" }, fill));
		el.setAttribute("aria-label", title);
		dom[id] = { el, fill, text, name };
		return el;
	};

	dom.money = roller("cash");
	dom.ep = roller("");
	dom.epBox = h("span", { className: "ep" }, dom.ep.el);
	// Money on top, particles under: on one line they read as one long number.
	dom.purse = h("div", { className: "purse" }, dom.money.el, dom.epBox);
	// Ten quick taps on the money and the drums wind back to zero, then flip up
	// to the real figure, like an odometer someone tried to wind back.
	let taps = [];
	dom.money.el.addEventListener("click", () => {
		const now = Date.now();
		taps = [...taps.filter((t) => now - t < 3000), now];
		if (taps.length < 10) return;
		taps = [];
		play("sell");
		dom.money.rewind(() => play("coin"));
	});

	// The reactor's on switch: a lamp lit while it runs, and the word for its state.
	dom.pauseLabel = h("span", {});
	dom.pause = h("button", { className: "key switch pause reactor-switch", onclick: game.togglePause }, dom.pauseLabel);

	dom.goalText = h("span", {});
	dom.runTag = h("b", { className: "run-tag", hidden: true });
	dom.goalBar = h("i", { className: "goal-bar" });
	// The goal line: tapped, it opens the log - or, when the order is met,
	// signs it off and is paid.
	dom.objective = h("button", {
		className: "objective",
		title: "Show every goal",
		onclick: () => (dom.game.state.met && !dom.game.state.planner ? dom.game.claim() : showGoals(dom)),
	});
	dom.objective.setAttribute("aria-haspopup", "dialog");
	dom.objective.setAttribute("aria-expanded", "false");
	dom.objective.append(dom.runTag, dom.goalText, dom.goalBar);
	// The planner: a free copy of the board to try things on, as the IC2
	// planners let you. Build puts it onto the real board; Discard forgets it.
	dom.plan = h("button", { className: "key small tool", ariaLabel: "Plan", title: "Try a layout for free", onclick: game.startPlanner }, icon("plan"), h("span", { className: "label", textContent: "Plan" }));
	dom.planBuild = h("button", { className: "key small tool", onclick: game.buildPlan }, "Build");
	dom.planDiscard = h("button", { className: "key small tool", onclick: game.discardPlan }, "Discard");
	// Banked time, counting down while it is spent; the same tap stops it.
	dom.fluxText = h("span", {});
	dom.flux = h("button", { className: "key pause flux", title: "Time Flux: run banked time at ten times speed", onclick: game.toggleFlux },
		icon("flux"), dom.fluxText);
	// The header is the goal and the clock: time banked, and time stopped.
	root.append(h("header", { id: "goal" }, dom.objective, dom.flux, dom.pause));
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

	// The station file: the orders and the letters in one sequence, as they
	// came (story.js). Everything before the current order folds into one line,
	// except a letter not yet read; what comes after it stays unwritten until it
	// is the current one.
	dom.fileList = h("ol", { className: "file" });
	dom.doneToggle = h("button", { className: "done-toggle", ariaExpanded: "false", onclick: () => {
		const open = dom.fileList.classList.toggle("open");
		dom.doneToggle.setAttribute("aria-expanded", String(open));
	} });
	dom.goalSheet = h("dialog", { className: "sheet goals", ariaLabel: "Operator's log" },
		h("h2", { textContent: "Harrow Station - operator's log" }),
		dom.doneToggle,
		dom.fileList,
		h("div", { className: "row" },
			h("button", { textContent: "Close", onclick: () => dom.goalSheet.close() })));
	root.append(dom.goalSheet);

	dom.upgradeList = h("div", { className: "upgrades" });
	dom.upgradeEmpty = h("p", { className: "empty", textContent:
		"Nothing you can afford yet. Sell power by tapping the power bar." });
	// Upgrades and research are authorised on the plant computer, a terminal in
	// the control room, not bought from a shop (Soul Interview 4.3, 5.5).
	dom.terminals = {
		upgrades: terminal("Maintenance", dom.upgradeEmpty, dom.upgradeList),
		experiments: terminal("Research", dom.experimentList = h("div", { className: "upgrades" })),
	};
	dom.pages.upgrades.append(dom.terminals.upgrades.el);

	// Controls grouped on a labelled plate, as a control room groups them.
	const plate = (label, ...keys) => h("section", { className: "panel plate-group" },
		h("h4", { className: "nameplate plate-label", textContent: label }), h("div", { className: "keys" }, ...keys));

	dom.pages.experiments.append(
		// The core reboot: the heaviest control in the plant, on its own plate.
		plate("Core reboot",
			h("button", { className: "key wide", textContent: "Reboot reactor", onclick: () => game.reboot(false) }),
			h("button", { className: "key wide", textContent: "Reboot, refund all EP", onclick: () => game.reboot(true) })),
		dom.terminals.experiments.el,
	);

	// The station office: its controls grouped on plates, a switch with a lamp
	// for the sound, and the record kept on a card.
	const sound = h("button", { className: "key switch sound-switch", onclick: () => {
		game.toggleSound();
		lampSound();
	} }, "Sound");
	const lampSound = () => {
		sound.classList.toggle("on", !game.muted);
		sound.setAttribute("aria-pressed", String(!game.muted));
	};
	lampSound();
	dom.pages.options.append(
		h("div", { className: "options" },
			plate("Station record",
				// Only Android can open a file picker, so in a browser these would
				// be two buttons that do nothing.
				...(game.canTransfer ? [
					h("button", { className: "key wide", textContent: "Export save to a file", onclick: game.exportSave }),
					h("button", { className: "key wide", textContent: "Import save from a file", onclick: game.importSave }),
				] : []),
				h("button", { className: "key wide", textContent: "Copy records as text", onclick: () => showCode(game.summary(), "Records") })),
			dom.layoutTools = plate("Layout codes",
				h("button", { className: "key wide", textContent: "Copy layout code", onclick: () => showCode(game.layoutCode()) }),
				h("button", { className: "key wide", textContent: "Build from a code", onclick: () => askCode(game.buildLayout) })),
			plate("Manuals",
				h("button", { className: "key wide", textContent: "Parts guide", onclick: () => guideDialog(game.state) }),
				h("button", { className: "key wide", textContent: "How to play", onclick: () => {
					showPage(dom, "reactor");
					game.startTutorial();
				} })),
			// Every operation on the desk, counted on drums and never reset.
			h("section", { className: "panel plate-group" },
				h("h4", { className: "nameplate plate-label", textContent: "Counters" }), hardware.counters),
			plate("Control room", sound,
				// Every lamp and lit key burns at once: a dead bulb never passes for a dark one.
				h("button", { className: "key wide", textContent: "Lamp test", onclick: lampTest }),
				hardware.rotary,
				h("button", { className: "key wide danger", textContent: "Wipe save and restart", onclick: game.wipe })),
			h("section", { className: "card record-card" },
				h("h3", { className: "credit-head", textContent: "Records" }),
				dom.records = h("dl", { className: "records" }),
				h("h3", { className: "credit-head", textContent: "Trophies" }),
				dom.trophyCase = h("ul", { className: "trophies" })),
			h("h3", { className: "credit-head", textContent: "Where this came from" }),
			h("ol", { className: "lineage" }, LINEAGE.map(([name, url, what], i) =>
				h("li", { className: i === LINEAGE.length - 1 ? "here" : "" },
					h("b", {}, url ? h("a", { href: url, textContent: name }) : name),
					h("i", { textContent: what })))),
			h("p", { className: "credit" },
				"The first interface was cut from ",
				h("a", { href: "https://opengameart.org/content/sci-fi-user-interface-elements",
					textContent: "Sci-fi User Interface Elements" }),
				" by Buch (CC0), the same pack Knockoff used; the plating, keys and plates are this game's own. Sounds from ",
				h("a", { href: "https://kenney.nl/assets/impact-sounds", textContent: "Kenney's Impact Sounds" }),
				" and ",
				h("a", { href: "https://kenney.nl/assets/sci-fi-sounds", textContent: "Sci-fi Sounds" }),
				", light from ",
				h("a", { href: "https://kenney.nl/assets/light-masks", textContent: "Light Masks" }),
				" and ",
				h("a", { href: "https://kenney.nl/assets/particle-pack", textContent: "Particle Pack" }),
				" (all CC0).")),
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
	// Tapping the line opens its ledger: the same tick, split by kind.
	dom.rateBar = h("div", { id: "rates", role: "button", tabIndex: 0, title: "The ledger for this tick", onclick: () => ledgerSheet(game.state) },
		rateCell("power", "power", "Power generated per tick"),
		rateCell("heat", "heat", "Heat generated per tick"),
		rateCell("vent", "vent", "Heat vented per tick"),
		rateCell("inlet", "inlet", "Heat drawn in per tick"),
		rateCell("outlet", "outlet", "Heat pushed out per tick"),
		// The ledger's last column: made = vented (and turned to power) + held.
		rateCell("held", "held", "Heat the board held this tick: made, less vented and turned to power"));

	// dock and tabs
	// Money between the bar that makes it and the bar that threatens it: one
	// row, so the board keeps its room. The heat meter sits in the heat gauge.
	dom.actions = h("div", { id: "actions" },
		gauge("power", "Power", game.sellAll, "Sell all power", hardware.bargraph),
		dom.purse,
		gauge("heat", "Heat", game.ventHeat, "Vent heat", hardware.meter));
	dom.dock = h("div", { id: "dock", tabIndex: -1 });
	dom.tabs = tabStrip("tabs", PAGES, (id) => showPage(dom, id));
	dom.pips = {};
	for (const id of ["upgrades", "experiments"]) {
		const button = [...dom.tabs.children].find((b) => b.dataset.value === id);
		dom.pips[id] = button.appendChild(h("span", { className: `lamp on pip ${id}`, hidden: true }));
	}
	// The board's tools sit on the strip that says what the board does.
	const verdict = buildVerdict(dom, game);
	verdict.append(dom.plan, dom.planBuild, dom.planDiscard);
	// The panel: a lamp and a switch for each automated system the player owns.
	dom.switches = SWITCHES.map(([field, label]) => h("button", { className: "key small switch", hidden: true,
		ariaPressed: "false", onclick: () => game.toggleSwitch(field) }, label));
	dom.panel = h("div", { id: "switches", hidden: true, ariaLabel: "Automation" }, ...dom.switches);
	// One strip, not two: the switches sit on the verdict line, between what the
	// board does and the tools that change it.
	dom.verdictText.after(dom.panel);
	// The page keys' zone, named on an inverse plate, as a desk's zones are.
	const pagesZone = zonePlate("Station", "Z3");
	root.append(h("footer", {}, verdict, dom.rateBar, dom.actions, dom.dock, pagesZone, dom.tabs));

	dom.game = game;
	buildPrinter(dom);
	buildDock(dom, game);
	buildUpgrades(dom, game);
	buildModulesPage(dom, game);
	buildFile(dom);
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
	// Behind each family's glass, the first part of the family; Modules, its icon.
	const behind = { Cells: "uranium1", Power: "capacitor1", Cooling: "vent1", Transfer: "heat_exchanger1", Exotic: "particle_accelerator1" };
	dom.dockTabs = tabStrip("dock-tabs", DOCK_TABS.map(([label]) => [label, label, "modules",
		behind[label] && artFor(PART_BY_ID.get(behind[label]))]), (label) => showDock(dom, label, true));
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
			const info = h("span", { className: "info" });
			const button = h("button", {
				className: "bin part numbers",
				title: part.title,
				onclick: () => {
					game.select(part.id);
					// Say so, rather than letting the tap look ignored.
					// A flash, and no sound: a mistake takes nothing away from the hum.
					if (button.classList.contains("poor")) flash(button, "denied");
				},
			}, h("i", { style: `background-image:url(${artFor(part)})` }),
				label, info,
				h("u", { textContent: fmt(part.cost) }));
			// Prepending puts the newest tier on top, and the locked tier that
			// comes after them all above it.
			column.prepend(button);
			dom.partButtons.push({ button, part, label, info, tab });
		}
	}

	dom.dock.append(zonePlate("Parts issue", "Z2"), dom.dockTabs, body);
	showDock(dom, DOCK_TABS[0][0]);
}

/**
 * Open a dock tab. Tapping the tab that is already open folds the parts away,
 * giving the board the room; tapping any tab again brings them back.
 */
const showDock = (dom, label, tapped = false) => {
	dom.dockFolded = tapped && label === dom.dockTab && !dom.dockFolded;
	dom.dockTab = label;
	dom.dockTabs.select(label, dom.dockPages);
	dom.dock.classList.toggle("folded", dom.dockFolded);
	for (const b of dom.dockTabs.querySelectorAll("button[data-value]")) {
		b.setAttribute("aria-expanded", String(b.dataset.value === label && !dom.dockFolded));
	}
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

export function say(text) {
	const live = document.getElementById("say");
	if (live) live.textContent = text;
}

/** A goal met is a tick on the goal line, not a toast. */
export function goalMet(dom, title) {
	flash(dom.objective, "met");
	say(`Met - ${title}. Sign off on the goal line.`);
}

/** Signed off and paid; the next order goes to the printer. */
export function goalClaimed(dom, title) {
	flash(dom.objective, "signed");
	say(`Signed off - ${title}`);
}

/** The job was met as first asked, and has been asked again higher. */
export function goalRevised(dom, title) {
	flash(dom.objective, "revised");
	say(`Order revised - ${title}`);
}

export function toast(text, glyph) {
	document.getElementById("toast")?.remove();
	const el = h("div", { id: "toast" }, glyph ? icon(glyph) : [], h("span", { textContent: text }));
	removeAfter(el, 3200);
	document.body.append(el);
	say(text);
}

/** Flash an element; the class has to come off again for the next one. */
export const flash = (el, cls) => {
	if (!el) return;
	el.classList.remove(cls);
	void el.offsetWidth;              // restart the animation if it is running
	el.classList.add(cls);
	const done = () => el.classList.remove(cls);
	el.addEventListener("animationend", done, { once: true });
	setTimeout(done, 1200);           // animationend never fires on a hidden tab
};

function meltdownNotice(lines, onAcknowledge) {
	const dialog = h("dialog", { className: "sheet meltdown" },
		h("h2", { textContent: "Meltdown" }),
		h("i", { textContent: "Core heat exceeded twice rated capacity. All components destroyed." }),
		// The receipt: read off the ledger as the reactor fell. Words, not wreckage.
		lines?.length ? h("ul", { className: "receipt" }, ...lines.map((l) => h("li", { textContent: l }))) : "",
		h("div", { className: "row" },
			h("button", { className: "key wide", textContent: "Begin start-up", onclick: () => dialog.close() })));
	dialog.addEventListener("close", () => { dialog.remove(); onAcknowledge(); });
	document.body.append(dialog);
	dialog.showModal();
}

/** A modal question. Replaces confirm(), which Android renders as a system dialog. */
/** Text selected and ready to copy: a layout code, or the records. */
export function showCode(code, title = "Layout code") {
	const box = h("textarea", { className: "code", readOnly: true, value: code, rows: 5 });
	const copy = h("button", { textContent: "Copy", onclick: async () => {
		box.select();
		try {
			await navigator.clipboard.writeText(code);
			copy.textContent = "Copied";
		} catch {
			// No clipboard access: the text is selected, so a long press copies it.
			copy.textContent = "Selected - copy it";
		}
	} });
	const dialog = h("dialog", { className: "sheet", ariaLabel: title },
		h("h2", { textContent: title }),
		h("i", { textContent: title === "Layout code"
			? "The whole board, and any module designs on it. Paste it into Build from a layout code - here or in anyone's game."
			: "Everything this reactor has done, as text to keep or share." }),
		box,
		h("div", { className: "row" }, h("button", { textContent: "Close", onclick: () => dialog.close() }), copy));
	dialog.addEventListener("close", () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
	box.select();
}

/** Paste a code and build it; `build` returns what happened, in words. */
function askCode(build) {
	const box = h("textarea", { className: "code", rows: 5, placeholder: "RR1..." });
	const note = h("p", { className: "note" });
	const dialog = h("dialog", { className: "sheet", ariaLabel: "Build from a layout code" },
		h("h2", { textContent: "Build from a layout code" }),
		h("i", { textContent: "Fills empty tiles only. Parts you cannot afford yet wait for the money; parts you have not unlocked are left out." }),
		box, note,
		h("div", { className: "row" },
			h("button", { textContent: "Cancel", onclick: () => dialog.close() }),
			h("button", { textContent: "Build", onclick: () => {
				const said = build(box.value);
				if (said === null) {
					note.textContent = "That is not a layout code.";
					return;
				}
				dialog.close();
				toast(said, "reactor");
			} })));
	dialog.addEventListener("close", () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
	box.focus();
}

/**
 * A yes-or-cancel question. Red only when yes loses something for good (a save,
 * a run, a design): warning colours are kept for real danger.
 */
export function ask(question, onYes, yes = "Do it", danger = false) {
	const dialog = h("dialog", { className: "ask", ariaLabel: question },
		h("p", { textContent: question }),
		h("div", { className: "row" },
			h("button", { textContent: "Cancel", onclick: () => dialog.close() }),
			h("button", { className: danger ? "danger" : "", textContent: yes, onclick: () => { dialog.close(); onYes(); } })));
	dialog.addEventListener("close", () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
	// The safe choice takes focus, so a stray Enter cancels rather than wipes.
	dialog.querySelector("button")?.focus();
}

// fmt() drops decimals, and a module at 25% makes fractions.
const exact = (v) => (Math.abs(v) < 1000 ? String(Math.round(v * 100) / 100) : fmt(v));

/** Emptying a condensator by hand costs its price, in proportion to what it holds. */
export const refillCost = (p, t) => Math.ceil(p.cost * Math.min(1, t.heatContained / p.containment));

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
		["Parts full", p.category === "module" ? `${Math.round(heatFill(s, t) * 100)}% on average` : null],
		// What this part does where it sits: the capacitors and plating it touches
		// are counted in, so the sheet agrees with the board.
		["Vents", p.vent ? `${exact(p.vent * (1 + (t.ventMul ?? 0) / 100))}/tick${p.category === "component_vent" ? " from each part it touches" : ""}` : null],
		[p.category === "hull_vent" ? "Draws from the reactor" : "Transfers",
			p.transfer ? `${exact(p.transfer * (1 + (t.transferMul ?? 0) / 100))}/tick` : null],
		// An outlet the operator is holding back says so, rather than looking dead.
		["Waiting", p.category === "heat_outlet" && s.heatControlOperator && s.heat <= s.maxHeat
			? "Heat Control Operator is on: nothing is pushed until the reactor is over its limit" : null],
		["Boosted by neighbours", (t.ventMul || t.transferMul) ? `+${fmt(Math.max(t.ventMul ?? 0, t.transferMul ?? 0))}%` : null],
		["Refill costs", p.category === "condensator" ? `$${fmt(refillCost(p, t))}` : null],
		["Max power", p.reactorPower ? `+${fmt(p.reactorPower)}` : null],
		["Max heat", p.reactorHeat ? `+${fmt(p.reactorHeat)}` : null],
		["Power", p.category === "module" ? `+${exact(p.modPower * s.casingEff)}/tick` : null],
		["Heat", p.category === "module" ? `${exact(p.modHeat)} cold, ${exact(p.modHeatHot)} at the limit` : null],
		["Fails at", p.failTick ? `tick ${fmt(p.failTick)} (at ${fmt(t.age ?? 0)})` : null],
	];

	const dialog = h("dialog", { className: "sheet", ariaLabel: p.title },
		// Named twice: the part, and its plant code on the plate beside it.
		h("h2", {}, p.title, h("span", { className: "code", textContent: plantCode(p) })),
		h("i", { textContent: p.desc ?? "" }),
		...notesFor(s, p).map((text) => h("p", { className: "field-note", textContent: text })),
		p.category === "module" ? h("div", { className: "mod-grid mini" }, ...p.module.layout.map((id) => {
			const q = id && s.stats.get(id);
			return h("i", { className: "slot", style: q ? `background-image:url(${q.art ?? artFor(q)})` : "" });
		})) : "",
		h("dl", {}, rows.filter(([, v]) => v !== null).flatMap(([k, v]) => [h("dt", { textContent: k }), h("dd", { textContent: v })])),
		h("div", { className: "sheet-actions" }, [
			h("button", { textContent: sameKind > 1 ? `Replace or upgrade all ${sameKind}` : "Replace or upgrade",
				onclick: () => { dialog.close(); replaceDialog(s, p, sell.game); } }),
			h("button", { textContent: "Move", onclick: () => { dialog.close(); sell.move(); } }),
			h("button", { textContent: `About ${FAMILIES.find(([k]) => k === guideFamily(p))?.[1].toLowerCase() ?? "this part"}`,
				onclick: () => { dialog.close(); guideDialog(s, guideFamily(p)); } }),
			p.category === "condensator" && t.heatContained > 0 && h("button", {
				textContent: `Refill for $${fmt(refillCost(p, t))}`,
				disabled: s.money < refillCost(p, t),
				onclick: () => { dialog.close(); sell.refill(); },
			}),
			h("button", { textContent: "Sell this one", onclick: () => { dialog.close(); sell.sell(); } }),
			sameKind > 1 && h("button", { textContent: `Sell all ${sameKind} ${p.title}s`, onclick: () => { dialog.close(); sell.sellKind(); } }),
			// One tap that empties the board deserves a second one.
			placed.length > sameKind && h("button", { textContent: `Sell everything (${placed.length} parts)`,
				onclick: () => { dialog.close(); ask(`Sell all ${placed.length} parts?`, sell.sellAll); } }),
		].filter(Boolean)),
		h("div", { className: "row" },
			h("button", { textContent: "Close", onclick: () => dialog.close() })));
	dialog.addEventListener("close", () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
}

/** The plant computer's housing: a plate, a lamp, and a screen that scrolls. */
function terminal(title, ...contents) {
	const lamp = h("i", { className: "lamp", role: "img" });
	// Not a live region: the budget changes every tick. A purchase is said once.
	const prompt = h("p", { className: "prompt" });
	const el = h("div", { className: "computer" },
		h("div", { className: "nameplate plate" },
			h("b", { textContent: "Plant computer" }), h("span", { textContent: title }), lamp),
		h("div", { className: "screen" }, prompt, ...contents));
	return { el, lamp, prompt };
}

/** A purchase the computer took: the row answers, and the prompt says what was done. */
export function authorised(dom, s, u) {
	const row = dom.upgradeRows.find((r) => r.u.id === u.id);
	flash(row?.button, "authorised");
	const lv = s.levels[u.id];
	const text = `Authorised: ${u.title}${maxLevel(u) > 1 ? `, level ${lv}` : ""}.`;
	dom.authorised = { text, page: dom.page, until: Date.now() + 4000 };
	say(text);
}

function buildUpgrades(dom, game) {
	dom.upgradeRows = [];
	// One heading and list per section and page, in SECTIONS order; a fuel's
	// heading carries its cell.
	dom.upgradeSections = [];
	const sectionFor = new Map();
	for (const experiments of [false, true]) {
		for (const [id, title, fuel] of SECTIONS) {
			if (!UPGRADES.some((u) => Boolean(u.ecost) === experiments && sectionOf(u) === id)) continue;
			const list = h("div", { className: "upgrades" });
			// The heading folds its section away; the count says what is in there
			// to buy, so a folded section still speaks up.
			const count = h("b", { className: "count" });
			const head = h("button", { className: "section-head", ariaExpanded: "true", onclick: () => {
				const open = list.hidden;
				list.hidden = !open;
				head.setAttribute("aria-expanded", String(open));
			} },
			fuel ? h("i", { style: `background-image:url(${artFor(PART_BY_ID.get(`${fuel}1`))})` }) : "",
			h("span", { textContent: title }), count);
			const el = h("section", { className: "upgrade-section" }, h("h3", {}, head), list);
			(experiments ? dom.experimentList : dom.upgradeList).append(el);
			const entry = { el, list, count, rows: [] };
			dom.upgradeSections.push(entry);
			sectionFor.set(`${experiments}:${id}`, entry);
		}
	}
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
		// A part family's upgrades share one row as condensed tiles (TILE_ROWS in
		// upgrades.js): the heading or the row's label names the family, so a
		// tile says only what it moves. Its full name and description stay in its
		// label and tooltip.
		const tile = Boolean(u.row);
		const button = tile
			? h("button", { className: "upgrade tile", title: u.desc, ariaLabel: `${u.title}. ${u.desc}`, onclick: () => game.buy(u.id) },
				h("b", { textContent: u.short }), delta, h("span", {}, cost, level))
			: h("button", { className: "upgrade", onclick: () => game.buy(u.id) },
				badge,
				h("b", { textContent: u.title }),
				h("i", { textContent: u.desc }),
				delta,
				h("span", {}, cost, level));
		const row = { u, button, cost, level, delta, was, now, tile };
		dom.upgradeRows.push(row);
		const section = sectionFor.get(`${Boolean(u.ecost)}:${sectionOf(u)}`);
		section.rows.push(row);
		if (tile) {
			section.tileRows ??= new Map();
			let tiles = section.tileRows.get(u.row);
			if (!tiles) {
				const label = TILE_ROW_LABEL[u.row];
				tiles = h("div", { className: "tiles", role: "group", ariaLabel: label ?? u.row });
				section.tileRows.set(u.row, tiles);
				// Tile rows lead their section: they are its main families, and the
				// single upgrades follow as lines.
				if (!section.tileArea) section.list.prepend(section.tileArea = h("div", { className: "tile-area" }));
				section.tileArea.append(...(label ? [h("h4", { className: "tile-label", textContent: label })] : []), tiles);
				tiles.rows = [];
				tiles.label = tiles.previousElementSibling?.classList.contains("tile-label") ? tiles.previousElementSibling : null;
			}
			// Its own place in the row, three to a line, gaps kept.
			button.style.gridColumn = String(u.slot % 3 + 1);
			button.style.gridRow = String(Math.floor(u.slot / 3) + 1);
			tiles.append(button);
			tiles.rows.push(row);
		} else section.list.append(button);
		// A doctrine set's two sides, beside the row that buys it: readable
		// before buying, switchable after.
		if (u.set) {
			row.sides = ["left", "right"].map((side) => h("button", {
				className: "side", dataset: { side },
				onclick: () => game.pickDoctrine(u.id, side),
			}, h("b", { textContent: u.set[side].title }),
			h("span", { className: "nums" }, ...u.set[side].nums.map(([text, kind, down]) =>
				h("em", { className: `${kind}${down ? " down" : ""}`, textContent: text }))),
			h("i", { textContent: u.set[side].desc })));
			row.sideBox = h("div", { className: "sides" }, ...row.sides);
			section.list.append(row.sideBox);
		}
	}
}

/**
 * A document in the file: a heading and where it came from, the order itself,
 * what it pays, and a stamp once it is done. The kind (manual page, work
 * order, demand, notice) is its class, and decides its paper.
 */
function paper(kind, head, byline, ...body) {
	const by = h("span", { className: "byline", textContent: byline });
	const stamp = h("span", { className: "stamp", hidden: true });
	const el = h("li", { className: `card docket ${kind}` },
		h("header", {}, h("span", { className: "head", textContent: head }), by), ...body, stamp);
	return Object.assign(el, { by, stamp });
}

/** Every order, every letter, the standing order and the notice, built once. */
function buildFile(dom) {
	dom.file = new Map();
	dom.keepOut = new Set();
	dom.dockets = OBJECTIVES.map((o, i) => {
		const load = h("button", { className: "key small snap", textContent: "Saved - load", hidden: true });
		const lesson = LESSON_AT[i] && h("button", { className: "key small snap",
			textContent: BENCHES[LESSON_AT[i]] ? "See its numbers" : "See an example layout",
			onclick: () => {
				const s = dom.game.state;
				if (!s.lessonsSeen.includes(LESSON_AT[i])) s.lessonsSeen.push(LESSON_AT[i]);
				lessonDialog(s, LESSON_AT[i], dom.game);
			} });
		const d = docket(i);
		// A revised order keeps its first ask, struck through, over the new one.
		const was = h("s", { className: "was", textContent: o.title, hidden: true });
		const title = h("b", { textContent: o.title });
		const after = h("p", { className: "revision", hidden: true });
		const pay = o.reward ? `Payment: $${fmt(o.reward)}` : o.epReward ? `Payment: ${fmt(o.epReward)} EP` : "";
		const row = paper(d.kind, d.head, d.byline, was, title, h("p", { textContent: o.note }), after,
			pay ? h("small", { className: "pay", textContent: pay }) : "", lesson || "", load);
		Object.assign(row, { load, heading: title, was, after, done: d.stamp });
		dom.file.set(`job:${i}`, row);
		return row;
	});
	dom.standing = paper("order standing", "Standing order", "");
	dom.standing.append(dom.standing.heading = h("b", {}), dom.standing.note = h("p", {}), dom.standing.met = h("small", { className: "pay" }));
	dom.file.set("standing", dom.standing);
	dom.file.set("complete", paper("notice", "Notice", "From: not stated", h("p", { textContent: COMPLETE_ENTRY })));
	// Signing off: one key, on whichever order is met.
	dom.signOff = h("button", { className: "key wide sign-off", hidden: true, onclick: () => dom.game.claim() });
	// A field note, printed: signed off, it is written into its parts' sheets.
	for (const [id, [who, , text]] of Object.entries(NOTES)) {
		const sign = h("button", { className: "key wide sign-off", textContent: "Sign off: enter in the parts guide",
			onclick: () => { if (claimNote(dom.game.state, id)) press("click"); } });
		const el = paper("fieldnote", "Field note", who, h("p", { textContent: text }), sign);
		dom.file.set(`note:${id}`, Object.assign(el, { sign }));
	}
	for (const l of LETTERS) dom.file.set(`letter:${l.id}`, letterSlip(dom, l));
}

/**
 * A letter: an envelope that says who it is from and how it came, opened in
 * place to the typed sheet; read once opened.
 */
function letterSlip(dom, l) {
	const seal = h("i", { className: "seal", title: "Unread" });
	const summary = h("summary", {}, h("span", { className: "from", textContent: l.from }),
		h("span", { className: "postmark", textContent: l.found ? "Found" : "Received" }), seal);
	const slip = h("details", { className: "card letter" }, summary,
		h("div", { className: "sheet-body" },
			l.found ? h("small", { className: "found", textContent: l.found }) : "",
			l.mark ? h("small", { className: "mark", textContent: l.mark }) : "",
			...l.lines.map((line) => h("p", { textContent: line }))));
	slip.addEventListener("toggle", () => {
		if (!slip.open) return;
		// The live game, not the one the file was drawn from: a save may have
		// been loaded since.
		readLetter(dom.game.state, l.id);
		slip.classList.remove("unread");
		// Read now, but not folded away while the log is open on it.
		dom.keepOut.add(l.id);
	});
	return slip;
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
		// A light mask over the art: what the part is doing, rather than a number.
		const glow = h("i", { className: "glow" });
		const cell = h("button", { className: "tile", dataset: { r: t.r, c: t.c } }, glow, fan, heat, life);
		cell.setAttribute("role", "gridcell");
		cell.setAttribute("aria-label", `row ${t.r + 1} column ${t.c + 1}, empty`);
		// Ninety-six tab stops is not navigation. One way in, arrows to move.
		cell.tabIndex = t.r === 0 && t.c === 0 ? 0 : -1;
		dom.grid.append(cell);
		dom.tiles.push({ t, cell, heat, life, fan, glow, sig: "", lit: "" });
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
	buildMimic(dom, s);
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
	dom.money.set(s.planner ? "PLAN" : `$${fmt(dom.shownMoney)}`);
	// Pending particles are only worth anything once a reboot banks them.
	dom.ep.set(s.exoticParticles
		? `${fmt(s.currentExoticParticles)} EP +${fmt(s.exoticParticles)}`
		: `${fmt(s.currentExoticParticles)} EP`);
	dom.epBox.hidden = !s.currentExoticParticles && !s.exoticParticles && !s.totalExoticParticles;

	dom.power.text.textContent = `${fmt(s.power)} / ${fmt(s.maxPower)}`;
	dom.power.el.setAttribute("aria-label", `Sell all power, ${fmt(s.power)} of ${fmt(s.maxPower)}`);
	// Power stops accumulating at the cap, so a full bar is output going nowhere.
	dom.power.el.classList.toggle("full", s.power >= s.maxPower && s.maxPower > 0);
	dom.power.fill.style.width = `${pct(s.power, s.maxPower)}%`;
	dom.heat.text.textContent = `${fmt(s.heat)} / ${fmt(s.maxHeat)}`;
	dom.heat.el.setAttribute("aria-label", `Vent heat, ${fmt(s.heat)} of ${fmt(s.maxHeat)}`);
	// The heat bar runs to meltdown: half full is rated heat, 100 / 100.
	dom.heat.fill.style.width = `${heatScale(s) * 100}%`;
	if (dom.pauseLabel.textContent !== (s.paused ? "Off" : "On")) {
		dom.pauseLabel.textContent = s.paused ? "Off" : "On";
		dom.pause.classList.toggle("on", !s.paused);
		dom.pause.setAttribute("aria-label", s.paused ? "Reactor off. Turn it on" : "Reactor on. Turn it off");
		dom.pause.setAttribute("aria-pressed", String(!s.paused));
	}
	if (s.hasMeltedDown && !dom.meltdownShown) {
		dom.meltdownShown = true;
		play("boom");
		flash(document.body, "melting");
		meltdownNotice(s.receipt, () => {
			dom.meltdownShown = false;
			game.clearMeltdown();
		});
	}

	const rate = s.rate ?? {};
	for (const [id, el] of Object.entries(dom.rates)) {
		const v = rate[id] ?? 0;
		el.textContent = id === "held" && Math.abs(v) >= 0.5 ? `${v > 0 ? "+" : ""}${fmt(v)}` : fmt(id === "held" ? 0 : v);
	}

	const goal = goalAt(s);
	// Past the last job, the goal line carries the standing order.
	const order = s.order && s.objective === OBJECTIVES.length - 1 && !s.planner;
	// Signed off, and the next order not yet off the printer.
	const awaiting = !s.planner && s.shown < s.objective;
	const met = !s.planner && s.met;
	const step = goal?.progress?.(s);
	const prize = goal && (goal.reward ? `  $${fmt(goal.reward)}` : goal.epReward ? `  ${fmt(goal.epReward)} EP` : "");
	dom.goalText.textContent = s.planner
		? "Planner: free, not real"
		: awaiting
			? "Awaiting the next order."
		: met
			? `Sign off: ${goal.title}${prize}`
		: order
			? orderTitle(s.order.target)
		: goal
			? `${goal.title}${step ? `  ${step[0]}/${step[1]}` : ""}${prize}`
			: "Every goal met.";
	dom.objective.classList.toggle("claim", met);
	dom.objective.classList.toggle("awaiting", awaiting);
	dom.objective.title = met ? "Sign off this order and be paid" : "Show the operator's log";
	tickPrinter(dom, s);
	document.body.classList.toggle("planning", Boolean(s.planner));
	dom.plan.hidden = Boolean(s.planner) || !toolsAllowed(s);
	dom.runTag.hidden = !(s.restriction || s.restored) || Boolean(s.planner);
	dom.runTag.textContent = [s.restriction && restrictionLabel(s.restriction), s.restored && "Restored"].filter(Boolean).join(" · ");
	dom.layoutTools.hidden = !toolsAllowed(s);
	renderNotes(dom, s);
	dom.flux.hidden = !s.fluxOn && s.flux < s.loopWait;
	dom.fluxText.textContent = span(s.flux);
	dom.flux.classList.toggle("on", Boolean(s.fluxOn));
	dom.flux.setAttribute("aria-pressed", String(Boolean(s.fluxOn)));
	dom.planBuild.hidden = !s.planner;
	dom.planDiscard.hidden = !s.planner;
	// Dark in the planner, and Modules dark until casings are authorised.
	for (const b of dom.tabs.children) {
		if (b.dataset.value === "reactor") continue;
		b.disabled = Boolean(s.planner) || b.dataset.locked === "true";
		tag(b, s.planner ? "Planner" : b.dataset.locked === "true" ? "Unissued" : null);
	}
	dom.goalBar.style.setProperty("--p", awaiting ? 0 : met ? 1 : order ? orderProgress(s) : step ? step[0] / step[1] : 0);
	dom.tabs.firstElementChild.classList.toggle("paused", s.paused);
	// Heat is something you see and hear, not read: the board warms, the
	// feedback goes quiet, and the hum climbs.
	const f = s.maxHeat > 0 ? s.heat / s.maxHeat : 0;
	const warm = Math.round(Math.min(f, 1) * 20) / 20;
	if (warm !== dom.warm) {
		dom.warm = warm;
		document.body.style.setProperty("--hot", warm);
		document.body.style.setProperty("--quiet", 1 - 0.6 * warm);
	}
	// The valley behind the board: the season's painting, dark after seven.
	const outside = backdropFor(new Date());
	if (outside.src !== dom.backdrop) {
		dom.backdrop = outside.src;
		// Used from app.css, so the path is from css/.
		dom.board.style.setProperty("--backdrop", `url(../${outside.src})`);
	}
	dom.board.classList.toggle("night", outside.night);
	// Once everything is complete, the valley stays lit (Soul Interview 4.6).
	dom.board.classList.toggle("lit", Boolean(s.records?.complete));
	document.body.classList.toggle("near", f > 0.8);
	setHeat(f, !s.paused && (s.rate?.power ?? 0) > 0, s.planner ? 0 : s.mark?.trend ?? 0, !s.planner && s.mark?.grade === 1);
	document.body.classList.toggle("hot", s.heat > s.maxHeat);
	document.body.classList.toggle("critical", s.heat > s.maxHeat * 1.5);

	if (!dom.tiles) buildGrid(dom, s);
	renderSwitches(dom, s);
	renderLocks(dom, s);
	renderVerdict(dom, s);
	renderSecrets(dom, s);
	dom.flowOn = document.body.classList.contains("flow");
	renderMimic(dom, s, dom.flowOn && dom.page === "reactor");
	renderDeskHardware(dom, s);
	renderLesson(dom, s);

	if (dom.page !== "reactor") {
		renderPage(dom, s);
		return;
	}

	// Drained, so each explosion animates once however often this runs.
	const blew = s.exploded.length > 0 && !s.hasMeltedDown;
	if (blew) {
		dom.chain = dom.lastBlast === s.runTicks - 1 ? (dom.chain ?? 1) + 1 : 1;
		dom.lastBlast = s.runTicks;
		// One blast is a loss; a run of them on consecutive ticks is a show.
		if (dom.chain > 1) play("boom", Math.min(2, 0.9 + 0.12 * dom.chain));
		if (dom.chain >= 5) award(s, "chain");
	}
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
		const heat = p?.category === "module" ? quant(heatFill(s, t) * 100)
			: p?.containment ? quant(pct(t.heatContained, p.containment)) : 0;
		const life = p?.ticks ? quant(pct(t.ticks, p.ticks)) : 0;
		// Flow is lit track between the parts now (desk-ui.js), not figures on them.
		const venting = Boolean(p?.vent) && t.vented > 0;
		row.fan.classList.toggle("spinning", venting);
		const lit = !p || !t.activated ? ""
			: p.category === "cell" ? (t.ticks ? `bar${p.cellCount}` : "")
			: p.category === "module" ? (p.modPower > 0 && (!p.ticks || t.ticks) ? "bar1" : "")
			: p.category === "particle_accelerator" ? (t.heatContained > 0 ? "orb" : "")
			: venting ? "puff" : "";
		if (lit !== row.lit) {
			row.lit = lit;
			row.glow.className = lit ? `glow ${lit}` : "glow";
			const hue = p?.category === "module" ? p.tint : p?.type;
			row.glow.style.setProperty("--tint", hue ? `var(--${hue}, var(--power))` : "");
		}

		const sig = `${t.id}|${t.activated}|${heat}|${life}`;
		if (sig === row.sig) continue;
		row.sig = sig;

		row.cell.setAttribute("aria-label", p
			? `row ${t.r + 1} column ${t.c + 1}, ${p.title}${t.activated ? "" : ", unpaid"}`
			: `row ${t.r + 1} column ${t.c + 1}, empty`);

		const art = p ? `url(${artFor(p)})` : "";
		// A part arriving settles into its tile, once; the first render only draws.
		if (row.lastId !== undefined && t.id && t.activated && (row.lastId !== t.id || !row.wasActive)) flash(row.cell, "settle");
		row.lastId = t.id ?? null;
		row.wasActive = t.activated;
		row.cell.style.backgroundImage = art;
		row.fan.style.backgroundImage = p?.vent ? art : "";
		const queued = Boolean(t.id) && !t.activated;
		row.cell.classList.toggle("queued", queued);
		row.cell.classList.toggle("vacant", !t.id);
		row.cell.title = queued ? `Waiting for $${fmt(p.cost)}` : "";
		row.cell.classList.toggle("spent", Boolean(p?.ticks) && (p.category === "cell" || p.category === "module") && !t.ticks);
		row.cell.classList.toggle("module", p?.category === "module");
		if (p?.category === "module") row.cell.style.setProperty("--mtint", `var(--${p.tint})`);
		row.heat.style.width = `${heat}%`;
		// Grey until abnormal: a heat bar takes colour only past four-fifths full.
		row.cell.classList.toggle("hot", heat > 80);
		row.cell.style.setProperty("--warm", heat / 100);
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

		if (visible && row.wasLocked) flash(button, "unlocked");
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
	renderDockModules(dom, s, game);
	// Each part's numbers, redrawn when the upgrades change them.
	if (dom.infoFor !== s.stats) {
		dom.infoFor = s.stats;
		for (const row of dom.partButtons) row.info.replaceChildren(...partInfo(s.stats.get(row.part.id)));
	}
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
		pip.hidden = !n || Boolean(s.planner);
		pip.textContent = n > 1 ? n : "";
		pip.classList.toggle("many", n > 1);
		pip.setAttribute("aria-label", n === 1 ? "1 affordable" : `${n} affordable`);
	}
}

function renderPage(dom, s) {
	renderPips(dom, s);
	renderFile(dom, s);
	if (dom.page === "modules") renderModules(dom, s, dom.game);
	if (dom.page === "upgrades" || dom.page === "experiments") renderUpgrades(dom, s);
	if (dom.page === "options") {
		renderRecords(dom, s);
		renderTrophies(dom, s);
	}
}

/** How many out-of-reach upgrades to leave visible as a preview. */
const PREVIEW_COUNT = 3;

function renderUpgrades(dom, s) {
	const onThisPage = ({ u }) => Boolean(u.ecost) === (dom.page === "experiments");
	const outOfReach = [];
	const buyable = [];

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
		// A switch tile (Autobuy) has no level: owned, it says On where the price
		// was; not yet, its "off -> on" already says what it does.
		if (row.tile && maxLevel(u) === 1) {
			if (lv) cost.textContent = "On";
			level.textContent = "";
		}

		// Measured, not declared. A switch has nothing to show and says so.
		// A doctrine set's two sides say what it does; a single delta cannot.
		// A switch tile has no measured change; it says what buying it turns on.
		const step = u.set ? null : nextLevel(s, u) ?? (row.tile && !lv ? { from: "off", to: "on" } : null);
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
		if (row.sides) {
			const chosen = owned ? (s.doctrines[u.id] ?? "left") : null;
			for (const b of row.sides) {
				b.disabled = !owned;
				b.classList.toggle("on", b.dataset.side === chosen);
				b.setAttribute("aria-pressed", String(b.dataset.side === chosen));
			}
		}
		button.classList.toggle("preview", false);
		if (!shown && unlocked) outOfReach.push({ row, price });
		if (affordable && lv < maxLevel(u)) buyable.push(row);
	}

	if (dom.page === "upgrades") dom.upgradeEmpty.hidden = buyable.length > 0;

	// The terminal: its lamp lit while anything on this screen can be authorised,
	// and its prompt saying the budget, or what was just authorised.
	const term = dom.terminals[dom.page];
	term.lamp.classList.toggle("on", buyable.length > 0);
	term.lamp.ariaLabel = buyable.length ? "Ready: within budget" : "Nothing within budget";
	const last = dom.authorised?.page === dom.page && dom.authorised.until > Date.now() && dom.authorised.text;
	const line = last || (dom.page === "experiments"
		? `Research. ${fmt(s.currentExoticParticles)} EP available.${s.exoticParticles ? ` ${fmt(s.exoticParticles)} pending: reboot to bank them.` : ""}`
		: `Maintenance. Budget: $${fmt(s.money)}.`);
	if (term.prompt.textContent !== line) term.prompt.textContent = line;

	outOfReach.sort((a, b) => a.price - b.price);
	for (const { row } of outOfReach.slice(0, PREVIEW_COUNT)) {
		row.button.hidden = false;
		row.button.classList.add("preview");
	}

	// A tile row shows whole once any of it shows: the rest as previews, so
	// every tile keeps its place. A row with nothing showing takes its label.
	for (const section of dom.upgradeSections) {
		for (const tiles of section.tileRows?.values() ?? []) {
			const any = tiles.rows.some((r) => !r.button.hidden);
			if (any) {
				for (const r of tiles.rows) {
					if (!r.button.hidden || !isUnlocked(s, r.u)) continue;
					r.button.hidden = false;
					r.button.classList.add("preview");
				}
			}
			tiles.hidden = !any;
			if (tiles.label) tiles.label.hidden = !any;
		}
	}

	// A section with nothing showing is not a heading over nothing.
	for (const row of dom.upgradeRows) if (row.sideBox) row.sideBox.hidden = row.button.hidden;
	for (const section of dom.upgradeSections) {
		section.el.hidden = section.rows.every((r) => r.button.hidden);
		const n = section.rows.filter((r) => buyable.includes(r)).length;
		section.count.textContent = n ? String(n) : "";
		section.count.title = n ? `${n} affordable` : "";
	}
}

/** A lamp lit for each automated system that is running; hidden until bought. */
function renderSwitches(dom, s) {
	let any = false;
	SWITCHES.forEach(([field, label, owned], i) => {
		const b = dom.switches[i];
		const has = owned(s);
		const on = field === "operatorOn" ? Boolean(s.operatorOn) : s[field] !== false;
		any ||= has;
		b.hidden = !has;
		b.classList.toggle("on", on);
		b.setAttribute("aria-pressed", String(on));
		b.title = `${label}: ${on ? "running" : "off"}`;
	});
	dom.panel.hidden = !any;
}

function renderFile(dom, s) {
	// The order in hand: while the next is on the printer, the one just signed.
	const now = Math.min(s.objective, s.shown, OBJECTIVES.length - 1);
	dom.dockets.forEach((row, i) => {
		const o = OBJECTIVES[i];
		const done = i < s.objective;
		const revised = Boolean(o.revision && s.revised?.includes(i));
		row.classList.toggle("done", done);
		// Past the last job the standing order is what the room waits on.
		row.classList.toggle("current", i === s.objective && !s.order);
		const snap = done && snapshotFor(s, i);
		row.load.hidden = !snap || !toolsAllowed(s);
		if (snap) row.load.onclick = () => snapshotDialog(s, snap, dom.game);
		const title = goalAt(s, i).title;
		if (row.heading.textContent !== title) row.heading.textContent = title;
		row.was.hidden = !revised;
		row.after.textContent = revised ? o.revision.note : "";
		row.after.hidden = !revised;
		const stamp = done ? row.done : revised ? "Revised" : "";
		row.stamp.textContent = stamp;
		row.stamp.hidden = !stamp;
	});
	const met = s.met && !s.planner && dom.dockets[s.objective];
	if (met) {
		const o = goalAt(s);
		dom.signOff.textContent = `Sign off${o.reward ? `: $${fmt(o.reward)}` : o.epReward ? `: ${fmt(o.epReward)} EP` : ""}`;
		if (dom.signOff.parentElement !== met) met.append(dom.signOff);
	}
	dom.signOff.hidden = !met;
	for (const n of s.fieldNotes ?? []) {
		const el = dom.file.get(`note:${n.id}`);
		if (!el) continue;
		el.sign.hidden = Boolean(n.claimed);
		el.stamp.textContent = n.claimed ? "Entered" : "";
		el.stamp.hidden = !n.claimed;
		el.classList.toggle("current", !n.claimed);
	}
	dom.standing.classList.toggle("current", Boolean(s.order));
	if (s.order) {
		dom.standing.by.textContent = standingByline(s);
		dom.standing.heading.textContent = orderTitle(s.order.target);
		dom.standing.note.textContent = orderEntry(s.order.target);
		dom.standing.met.textContent = `Met since the log closed: ${s.order.met}.`;
	}
	// The sequence changes only when something is filed; a letter's state is
	// kept on its slip, so redrawing never closes one the player has open.
	const items = storyFile(s);
	const read = s.lettersRead ?? [];
	const claimed = (s.fieldNotes ?? []).filter((n) => n.claimed).map((n) => n.id);
	const sig = `${items.map((it) => it.key).join()}|${read.join()}|${claimed.join()}|${now}`;
	if (sig === dom.fileSig) return;
	dom.fileSig = sig;
	let past = 0;
	let letters = 0;
	let notes = 0;
	const top = dom.fileList.scrollTop;
	dom.fileList.replaceChildren(...items.map(({ key, at }) => {
		const el = dom.file.get(key);
		const id = key.startsWith("letter:") && key.slice(7);
		// A letter not opened, or a field note not signed off, is still open.
		const unread = (id && !read.includes(id)) || (key.startsWith("note:") && !claimed.includes(key.slice(5)));
		el.classList.toggle("unread", Boolean(unread));
		el.classList.toggle("now", at === now);
		// A letter not yet read stays out of the fold, wherever it was filed.
		const folded = at < now && !unread && !dom.keepOut.has(id || key);
		el.classList.toggle("past", folded);
		if (folded) key.startsWith("job:") ? past++ : key.startsWith("note:") ? notes++ : letters++;
		return el;
	}));
	dom.fileList.scrollTop = top;
	dom.doneToggle.hidden = !(past + letters + notes);
	const count = (n, one, many) => (n ? `, ${n} ${n === 1 ? one : many}` : "");
	dom.doneToggle.textContent = `Filed: ${past} ${past === 1 ? "order" : "orders"}${count(letters, "letter", "letters")}${count(notes, "field note", "field notes")}`;
}

function showGoals(dom) {
	dom.goalSheet.showModal();
	dom.objective.setAttribute("aria-expanded", "true");
	// Seen: the goal line's lamp goes out.
	dom.objective.classList.remove("alert");
	dom.goalSheet.addEventListener("close", () => {
		dom.objective.setAttribute("aria-expanded", "false");
		// What was read while it was open folds away next time.
		dom.keepOut.clear();
		dom.fileSig = "";
	}, { once: true });
	// To the first letter not yet read, or else the first thing filed with the
	// current order: its letters, then the order.
	dom.fileList.querySelector(".unread, .now")?.scrollIntoView({ block: "start" });
}

// Which categories open each dock tab. A tab shows once any of them has.
const TAB_CATEGORIES = Object.fromEntries(DOCK_TABS);

/**
 * Tabs appear as the log reaches the job that needs them, so a new game opens
 * on one cell and one tab; each is announced when it arrives.
 */
function renderLocks(dom, s) {
	const tabs = DOCK_TABS.map(([label]) => label).filter((label) => TAB_CATEGORIES[label].some((c) => categoryOpen(s, c))
		// A Direct-only run has nothing to put in Transfer.
		&& !(label === "Transfer" && s.restriction === "direct"));
	const sig = tabs.join();
	if (sig !== dom.tabsOpen) {
		// The first look at a station sets the keys as they are; after that, a
		// key coming on is a bulb catching.
		const first = dom.tabsOpen === undefined;
		dom.tabsOpen = sig;
		// Not open yet: there, but dark.
		for (const b of dom.dockTabs.querySelectorAll("button[data-value]")) {
			const was = b.disabled;
			b.disabled = !tabs.includes(b.dataset.value);
			if (!first && was && !b.disabled) warmUp(b);
			// A tag hung on a dark key says why it is dark.
			tag(b, !b.disabled ? null
				: b.dataset.value === "Transfer" && s.restriction === "direct" ? "Direct run" : "Unissued");
		}
		if (!tabs.includes(dom.dockTab)) showDock(dom, DOCK_TABS[0][0]);
	}
	const open = modulesOpen(s);
	if (dom.modulesOpen === open) return;
	const first = dom.modulesOpen === undefined;
	dom.modulesOpen = open;
	const key = dom.tabs.querySelector('[data-value="modules"]');
	key.dataset.locked = String(!open);
	key.disabled = !open || Boolean(s.planner);
	if (!first && open && !key.disabled) warmUp(key);
	if (!open && dom.page === "modules") {
		showPage(dom, "reactor");
	}
	if (!open && dom.dockTab === "Modules") showDock(dom, DOCK_TABS[0][0]);
}

/**
 * A key unlocked: its bulb catches - a few flickers, then it holds. Not on
 * loading a station, and not for the planner's keys coming back on.
 */
function warmUp(key) {
	flash(key, "warming");
}

/** The dock's Modules tab: one button per saved design, newest first. */
function renderDockModules(dom, s, game) {
	const page = dom.dockPages.Modules;
	const sig = s.modules.map((m) => m.id).join() + s.restriction;
	if (sig !== dom.dockModSig) {
		dom.dockModSig = sig;
		dom.moduleButtons = [...s.modules].reverse().filter((m) => isPartVisible(s, s.stats.get(modId(m)))).map((m) => {
			const p = s.stats.get(modId(m));
			const button = h("button", { className: "bin part", title: p.title, onclick: () => {
				game.select(p.id);
				if (button.classList.contains("poor")) flash(button, "denied");
			} }, face(p, "mod-face"), h("em", { textContent: p.short }), h("u", { textContent: fmt(p.cost) }));
			return { button, p };
		});
		page.replaceChildren(...[dom.moduleButtons.length
			? dom.moduleButtons.map((b) => h("div", { className: "dock-col" }, b.button))
			: h("p", { className: "empty", textContent: "No designs yet. Make one on the Modules page." })].flat());
	}
	for (const { button, p } of dom.moduleButtons) {
		button.classList.toggle("poor", s.money < p.cost);
		button.classList.toggle("on", game.selected === p.id);
		button.setAttribute("aria-pressed", String(game.selected === p.id));
	}
}

/**
 * An example layout waits on its job in the log, marked with a dot on the goal
 * line until it has been opened. It never opens itself: the player is trusted
 * to look when they want to.
 */
function renderLesson(dom, s) {
	const name = LESSON_AT[s.objective];
	dom.objective.classList.toggle("has-example", Boolean(name) && !s.planner && !s.lessonsSeen.includes(name));
}

// Small numbers keep their decimals: a vent at 4.5, a reflector at 5%.
// The dock's corners have room for about five characters each.
const brief = (v) => compact(v);

/**
 * A part's numbers for the dock's numbers mode, one per corner, each with the
 * rate bar's icon and a colour for what it measures: power blue, heat red,
 * life purple, money green. [corner, icon, text, kind]; money is always the
 * bottom right.
 */
function partInfo(p) {
	if (!p) return [];
	const c = [];
	const heat = (corner, glyph, v) => c.push([corner, glyph, brief(v), "heat"]);
	const power = (corner, v, suffix = "") => c.push([corner, "power", `${brief(v)}${suffix}`, "power"]);
	const life = (v) => c.push(["bl", "ticks", brief(v), "ticks"]);
	switch (p.category) {
		case "cell":
			power("tl", p.basePower * p.cellMultiplier);
			heat("tr", "heat", (p.baseHeat * p.cellMultiplier ** 2) / p.cellCount);
			life(p.ticks);
			break;
		case "vent": heat("tl", "vent", p.vent); heat("tr", "heat", p.containment); break;
		case "heat_exchanger": heat("tl", "outlet", p.transfer); heat("tr", "heat", p.containment); break;
		case "heat_inlet": heat("tl", "inlet", p.transfer); break;
		case "heat_outlet": heat("tl", "outlet", p.transfer); break;
		case "coolant_cell": heat("tr", "heat", p.containment); break;
		case "component_vent": heat("tl", "vent", p.vent); break;
		case "hull_vent": heat("tl", "vent", p.vent); heat("tr", "heat", p.containment); heat("bl", "outlet", p.transfer); break;
		case "condensator": heat("tr", "heat", p.containment); break;
		case "reactor_plating": heat("tl", "heat", p.reactorHeat); break;
		case "capacitor": power("tl", p.reactorPower); heat("tr", "heat", p.containment); break;
		case "reflector": power("tl", p.powerIncrease, "%"); life(p.ticks); break;
		case "particle_accelerator": heat("tl", "heat", p.epHeat); heat("tr", "vent", p.containment); break;
		default: break;
	}
	c.push(["br", "cash", compact(p.cost), "money"]);
	return c.map(([corner, glyph, text, kind]) =>
		h("span", { className: `${corner} ${kind}` }, glyph ? icon(glyph, "icon") : "", text));
}

const ticks = (n) => `${fmt(n)} ticks`;

/** The statistics page Reactor Incremental had: what this player has done. */
function renderRecords(dom, s) {
	const r = s.records;
	const placed = Object.values(s.placed).reduce((a, n) => a + n, 0);
	const rows = [
		// Stamina first: output from a board that holds is the prestige number.
		["Most power from a Mark I board", r.markOne ? fmt(r.markOne) : "none yet"],
		["Best Mark I efficiency", r.efficiency ? `${perCell(r.efficiency)} power per cell` : "none yet"],
		// Fastest from a reboot to a held board, per kind of run.
		...Object.entries(r.markRun ?? {}).map(([run, t]) => [`${restrictionLabel(run === "open" ? null : run)} run to Mark I`, ticks(t)]),
		["Peak power, any board", fmt(r.maxPower)],
		["Longest run without a failure", ticks(r.longest)],
		["Hottest held", `${Math.round(r.hottest * 100)}% of the limit`],
		["Meltdowns", String(r.meltdowns)],
		["Parts placed", fmt(placed)],
		["Exotic Particles ever", fmt(s.totalExoticParticles + s.exoticParticles)],
		["Field notes", `${s.notes.length} of ${Object.keys(NOTES).length}`],
		...(s.restored ? [["This run", "Restored from a save"]] : []),
		...(r.complete ? [["Log, parts, upgrades and board", "All complete"]] : []),
		...(s.order ? [["Standing orders met", String(s.order.met)]] : []),
		["Letters", `${(s.letters ?? []).length} of ${LETTERS.length}`],
	];
	// Fastest to each rung of power per tick, per kind of run, counted from its reboot.
	for (const [run, times] of Object.entries(r.speed)) {
		for (const rung of RUNGS) {
			if (times[rung]) rows.push([`${restrictionLabel(run === "open" ? null : run)} run to ${fmt(rung)} power`, ticks(times[rung])]);
		}
	}
	const sig = JSON.stringify(rows);
	if (sig === dom.recordsSig) return;
	dom.recordsSig = sig;
	dom.records.replaceChildren(...rows.flatMap(([k, v]) => [h("dt", { textContent: k }), h("dd", { textContent: v })]));
}

/** Every field note filed: a trophy of its own. */
function renderNotes(dom, s) {
	if (s.notes.length === Object.keys(NOTES).length) award(s, "notes");
}

/** Reboot, with the choice of a rule for the run it starts. */
export function rebootDialog(refund, onGo) {
	let chosen = null;
	const options = [[null, "Open", "No rule. Build however you like."], ...RESTRICTIONS].map(([id, label, what]) => {
		const b = h("button", { className: "side", onclick: () => {
			chosen = id;
			for (const o of options) o.classList.toggle("on", o === b);
		} }, h("b", { textContent: label }), h("i", { textContent: what }));
		if (id === null) b.classList.add("on");
		return b;
	});
	const dialog = h("dialog", { className: "sheet", ariaLabel: "Reboot" },
		h("h2", { textContent: refund ? "Reboot and refund every Exotic Particle?" : "Reboot the reactor?" }),
		h("i", { textContent: "The next run can take a rule. Its fastest times are kept apart in Records." }),
		h("div", { className: "reboot-rules" }, ...options),
		h("div", { className: "row" },
			h("button", { textContent: "Cancel", onclick: () => dialog.close() }),
			h("button", { className: "danger", textContent: "Reboot", onclick: () => { dialog.close(); onGo(chosen); } })));
	dialog.addEventListener("close", () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
}

/**
 * Things the board does for a player who builds well, never announced.
 * Cold fusion: power made while the reactor and every part sit at no heat at
 * all, for a full minute. Critical mass: a cell with live cells on all eight
 * sides - the block pulses as one while it lasts.
 */
function renderSecrets(dom, s) {
	if (s.planner) return;
	if (dom.secretTick !== s.runTicks) {
		dom.secretTick = s.runTicks;
		const cold = (s.rate?.power ?? 0) > 0 && s.heat === 0
			&& s.tiles.every((t) => !t.id || !t.heatContained);
		dom.coldFor = cold ? (dom.coldFor ?? 0) + 1 : 0;
	}
	const fusion = dom.coldFor >= 60;
	if (fusion) award(s, "cold");
	if (fusion !== dom.fusion) {
		dom.fusion = fusion;
		document.body.classList.toggle("cold-fusion", fusion);
		dom.heat.name.textContent = fusion ? "Cold fusion" : "Heat";
	}

	const sig = s.tiles.map((t) => (t.id && t.ticks ? t.id : "")).join();
	if (sig === dom.massSig) return;
	dom.massSig = sig;
	const live = (r, c) => {
		const t = s.tiles[r * COLS + c];
		return r >= 0 && c >= 0 && r < ROWS && c < COLS && t.activated && t.ticks > 0 && s.stats.get(t.id)?.category === "cell";
	};
	const massed = new Set();
	for (let r = 1; r < ROWS - 1; r++) {
		for (let c = 1; c < COLS - 1; c++) {
			let full = true;
			for (let dr = -1; dr <= 1 && full; dr++) for (let dc = -1; dc <= 1 && full; dc++) full = live(r + dr, c + dc);
			if (!full) continue;
			for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) massed.add((r + dr) * COLS + c + dc);
		}
	}
	dom.tiles.forEach((row, i) => row.cell.classList.toggle("critical-mass", massed.has(i)));
	if (massed.size) award(s, "mass");
}

/** The trophy case: earned ones say how; the rest are ??? until they are. */
function renderTrophies(dom, s) {
	const sig = s.trophies.join();
	if (sig === dom.trophySig) return;
	dom.trophySig = sig;
	dom.trophyCase.replaceChildren(...TROPHIES.map(([id, name, how]) => {
		const won = s.trophies.includes(id);
		return h("li", { className: won ? "won" : "" },
			h("b", { textContent: won ? name : "???" }),
			won ? h("small", { textContent: how }) : "");
	}));
}
