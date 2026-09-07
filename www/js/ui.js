// The DOM layer. Built once, then patched: each tile remembers the signature it
// last rendered and is only touched when that changes. The original walked all
// 1120 tiles every 100ms regardless.
import { fmt } from "./fmt.js";
import { PARTS, isPartVisible } from "./parts.js";
import { UPGRADES, costOf, isUnlocked, maxLevel } from "./upgrades.js";
import { OBJECTIVES } from "./objectives.js";
import { spriteFor } from "./sprites.js";
import { activeTiles } from "./sim.js";

/** Make an element, set properties, append children. */
function h(tag, { dataset, ...props } = {}, ...kids) {
	// `dataset` is getter-only, so it cannot ride along with Object.assign.
	const node = Object.assign(document.createElement(tag), props);
	Object.assign(node.dataset, dataset);
	for (const k of kids.flat()) node.append(k);
	return node;
}

/**
 * A row of buttons where exactly one is lit. The page tabs, the fill modes and
 * the dock tabs are all this; the original wrote each of them out separately.
 */
function tabStrip(id, items, onPick) {
	const el = h("div", { id });
	for (const [value, label] of items) {
		el.append(h("button", { textContent: label, dataset: { value }, onclick: () => onPick(value) }));
	}
	el.select = (value) => {
		for (const b of el.children) b.classList.toggle("on", b.dataset.value === value);
	};
	return el;
}

const PAGES = [
	["reactor", "Reactor"],
	["upgrades", "Upgrades"],
	["experiments", "Experiments"],
	["objectives", "Goals"],
	["options", "Options"],
];

// The dock's own tabs. Inside each, parts sit one family per row with the
// tiers running across, so a row reads vent 1, vent 2, vent 3...
const DOCK_TABS = [
	["Cells", (p) => p.category === "cell"],
	["Power", (p) => p.category === "reflector" || p.category === "capacitor"],
	["Cooling", (p) => p.cooling],
];

// Fuels are their own families so uranium and plutonium never share a row.
const familyOf = (p) => (p.category === "cell" ? p.type : p.category);

export function buildUI(game) {
	const dom = {};
	const root = document.getElementById("app");
	root.replaceChildren();

	// ---- stat bar ----------------------------------------------------------
	const meter = (id, label) => {
		const fill = h("i", { className: "fill" });
		const text = h("b", {});
		dom[id] = { fill, text };
		return h("div", { className: `meter ${id}` }, h("span", { textContent: label }), h("div", { className: "bar" }, fill), text);
	};

	dom.money = h("b", {});
	dom.ep = h("b", {});
	dom.epBox = h("span", { className: "ep" }, dom.ep);
	root.append(
		h("header", { id: "stats" },
			meter("power", "PWR"),
			meter("heat", "HEAT"),
			h("div", { className: "purse" }, h("span", { className: "cash" }, dom.money), dom.epBox),
		),
	);

	// ---- pages -------------------------------------------------------------
	const main = h("main", {});
	dom.pages = {};
	for (const [id] of PAGES) {
		dom.pages[id] = h("section", { className: "page", id: `page-${id}` });
		main.append(dom.pages[id]);
	}
	root.append(main);

	dom.grid = h("div", { id: "grid" });
	dom.board = h("div", { id: "board" }, dom.grid);
	dom.pages.reactor.append(dom.board);

	dom.objective = h("p", { className: "objective" });
	dom.objectiveList = h("ol", { className: "objectives" });
	dom.pages.objectives.append(dom.objective, dom.objectiveList);

	dom.upgradeList = h("div", { className: "upgrades" });
	dom.pages.upgrades.append(dom.upgradeList);

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
			h("p", { className: "credit", innerHTML:
				'A clean-room rewrite of <a href="https://github.com/cwmonkey/reactor-knockoff">Reactor Knockoff</a> by cwmonkey, '
				+ 'itself based on <a href="http://www.kongregate.com/games/Cael/reactor-incremental">Reactor Incremental</a> by Cael. '
				+ 'All artwork here is generated at runtime.' })),
	);

	// ---- dock and tabs -----------------------------------------------------
	// The three controls worth reaching for mid-game sit above the parts, where
	// a thumb already is.
	dom.pause = h("button", { onclick: game.togglePause });
	dom.actions = h("div", { id: "actions" },
		h("button", { textContent: "Sell", onclick: game.sellAll }),
		h("button", { textContent: "Vent", onclick: game.ventHeat }),
		dom.pause);
	dom.dock = h("div", { id: "dock" }, dom.actions);
	dom.tabs = tabStrip("tabs", PAGES, (id) => showPage(dom, id));
	root.append(h("footer", {}, dom.dock, dom.tabs));

	buildDock(dom, game);
	buildUpgrades(dom, game);
	buildObjectiveList(dom);
	showPage(dom, "reactor");
	return dom;
}

function showPage(dom, id) {
	dom.page = id;
	for (const [pid] of PAGES) dom.pages[pid].classList.toggle("showing", pid === id);
	dom.tabs.select(id);
	// The part dock is only useful while looking at the reactor.
	dom.dock.hidden = id !== "reactor";
}

function buildDock(dom, game) {
	dom.partButtons = [];
	dom.dockRows = [];
	dom.dockPages = {};
	dom.dockTabs = tabStrip("dock-tabs", DOCK_TABS.map(([label]) => [label, label]), (label) => showDock(dom, label));
	const body = h("div", { id: "dock-body" });

	for (const [label] of DOCK_TABS) {
		const match = DOCK_TABS.find(([l]) => l === label)[1];
		const page = h("div", { className: "dock-page" });
		dom.dockPages[label] = page;
		body.append(page);

		// One row per family, tiers in order across it.
		let family = null;
		let row = null;
		for (const part of PARTS.filter(match)) {
			if (familyOf(part) !== family) {
				family = familyOf(part);
				row = h("div", { className: "dock-row" });
				page.append(row);
				dom.dockRows.push(row);
			}
			const button = h("button", {
				className: "part",
				title: part.title,
				onclick: () => game.select(part.id),
			}, h("i", { style: `background-image:url(${spriteFor(part)})` }),
				h("em", { textContent: part.short }),
				h("u", { textContent: fmt(part.cost) }));
			row.append(button);
			dom.partButtons.push({ button, part, row });
		}
	}

	dom.dock.append(dom.dockTabs, body);
	showDock(dom, DOCK_TABS[0][0]);
}

function showDock(dom, label) {
	dom.dockTab = label;
	for (const [name] of DOCK_TABS) dom.dockPages[name].classList.toggle("showing", name === label);
	dom.dockTabs.select(label);
}

/** A modal question. Replaces confirm(), which Android renders as a system dialog. */
export function ask(question, onYes) {
	const dialog = h("dialog", { className: "ask" },
		h("p", { textContent: question }),
		h("div", { className: "row" },
			h("button", { textContent: "Cancel", onclick: () => dialog.close() }),
			h("button", { className: "danger", textContent: "Do it", onclick: () => { dialog.close(); onYes(); } })));
	dialog.addEventListener("close", () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
}

/** What a placed part is doing right now, plus a way to sell it. */
export function inspect(s, t, onSell) {
	const p = s.stats.get(t.id);
	const rows = [
		["Sells for", `$${fmt(p.cost)}`],
		["Power", t.power ? fmt(t.power) : null],
		["Heat", t.heat ? fmt(t.heat) : null],
		["Life", p.ticks ? `${fmt(t.ticks)} / ${fmt(p.ticks)}` : null],
		["Heat held", p.containment ? `${fmt(t.heatContained)} / ${fmt(p.containment)}` : null],
		["Vents", p.vent ? `${fmt(p.vent)}/tick` : null],
		["Transfers", p.transfer ? `${fmt(p.transfer)}/tick` : null],
		["Max power", p.reactorPower ? `+${fmt(p.reactorPower)}` : null],
		["Max heat", p.reactorHeat ? `+${fmt(p.reactorHeat)}` : null],
	];

	const dialog = h("dialog", { className: "sheet" },
		h("h2", { textContent: p.title }),
		h("i", { textContent: p.desc ?? "" }),
		h("dl", {}, rows.filter(([, v]) => v !== null).flatMap(([k, v]) => [h("dt", { textContent: k }), h("dd", { textContent: v })])),
		h("div", { className: "row" },
			h("button", { textContent: "Close", onclick: () => dialog.close() }),
			h("button", { className: "danger", textContent: "Sell", onclick: () => { dialog.close(); onSell(); } })));
	dialog.addEventListener("close", () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
}

function buildUpgrades(dom, game) {
	dom.upgradeRows = [];
	for (const u of UPGRADES) {
		const cost = h("u", {});
		const level = h("s", {});
		const button = h("button", { className: "upgrade", onclick: () => game.buy(u.id) },
			h("b", { textContent: u.title }),
			h("i", { textContent: u.desc }),
			h("span", {}, cost, level));
		dom.upgradeRows.push({ u, button, cost, level });
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

/** Rebuild the tile grid. Only needed when the reactor's size changes. */
function buildGrid(dom, s) {
	dom.grid.replaceChildren();
	dom.grid.style.setProperty("--cols", s.cols);
	dom.grid.style.setProperty("--rows", s.rows);
	dom.tiles = [];
	for (const t of activeTiles(s)) {
		const heat = h("i", { className: "heat" });
		const life = h("i", { className: "life" });
		const cell = h("button", { className: "tile", dataset: { r: t.r, c: t.c } }, heat, life);
		dom.grid.append(cell);
		dom.tiles.push({ t, cell, heat, life, sig: "" });
	}
	dom.gridSize = `${s.rows}x${s.cols}`;
}

const pct = (n, d) => (d > 0 ? Math.min(100, (n / d) * 100) : 0);
// Quantising keeps a bar from triggering a repaint on every hairline change.
const quant = (n) => Math.round(n / 4) * 4;

/** Patch the whole interface to match the state. Cheap enough to run at 10fps. */
export function render(dom, s, game) {
	dom.money.textContent = `$${fmt(s.money)}`;
	// Pending particles are shown alongside the spendable ones, because they are
	// only worth anything once a reboot banks them.
	dom.ep.textContent = s.exoticParticles
		? `${fmt(s.currentExoticParticles)} EP +${fmt(s.exoticParticles)}`
		: `${fmt(s.currentExoticParticles)} EP`;
	dom.epBox.hidden = !s.currentExoticParticles && !s.exoticParticles && !s.totalExoticParticles;

	dom.power.text.textContent = `${fmt(s.power)} / ${fmt(s.maxPower)}`;
	dom.power.fill.style.width = `${pct(s.power, s.maxPower)}%`;
	dom.heat.text.textContent = `${fmt(s.heat)} / ${fmt(s.maxHeat)}`;
	dom.heat.fill.style.width = `${pct(s.heat, s.maxHeat)}%`;
	dom.pause.textContent = s.paused ? "Resume" : "Pause";
	document.body.classList.toggle("hot", s.heat > s.maxHeat);
	document.body.classList.toggle("critical", s.heat > s.maxHeat * 1.5);

	if (dom.gridSize !== `${s.rows}x${s.cols}`) buildGrid(dom, s);

	// Only the visible page is worth patching; the tile loop below is the one
	// that always runs, because the reactor is what the player watches.
	if (dom.page !== "reactor") {
		renderPage(dom, s);
		return;
	}

	for (const row of dom.tiles) {
		const { t } = row;
		const p = t.id ? s.stats.get(t.id) : null;
		const heat = p?.containment ? quant(pct(t.heatContained, p.containment)) : 0;
		const life = p?.ticks ? quant(pct(t.ticks, p.ticks)) : 0;
		const sig = `${t.id}|${t.activated}|${heat}|${life}`;
		if (sig === row.sig) continue;
		row.sig = sig;

		row.cell.style.backgroundImage = p ? `url(${spriteFor(p)})` : "";
		row.cell.classList.toggle("queued", Boolean(t.id) && !t.activated);
		row.cell.classList.toggle("spent", Boolean(p) && p.category === "cell" && !t.ticks);
		row.heat.style.width = `${heat}%`;
		row.life.style.width = `${life}%`;
	}

	for (const { button, part } of dom.partButtons) {
		button.classList.toggle("locked", !isPartVisible(s, part));
		button.classList.toggle("poor", s.money < part.cost);
		button.classList.toggle("on", game.selected === part.id);
	}
	// Hide a family entirely until at least one of its tiers is unlocked.
	for (const row of dom.dockRows) row.hidden = !row.querySelector(".part:not(.locked)");
	renderPage(dom, s);
}

/** The parts of the interface behind a tab, patched only while that tab is up. */
function renderPage(dom, s) {
	if (dom.page === "upgrades" || dom.page === "experiments") renderUpgrades(dom, s);
	if (dom.page === "objectives") renderObjectives(dom, s);
	if (dom.page === "experiments") {
		dom.epStatus.textContent = s.exoticParticles
			? `${fmt(s.currentExoticParticles)} EP to spend, ${fmt(s.exoticParticles)} pending - reboot to bank them.`
			: `${fmt(s.currentExoticParticles)} EP to spend. Particle accelerators earn more.`;
	}
}

/** How many out-of-reach upgrades to leave visible as a preview. */
const PREVIEW_COUNT = 3;

/**
 * Show what you can buy and what you own; of the rest, show only the few
 * nearest to affordable, dithered, so the list stays short but you can still
 * see what you are saving towards.
 */
function renderUpgrades(dom, s) {
	const onThisPage = ({ u }) => Boolean(u.ecost) === (dom.page === "experiments");
	const outOfReach = [];

	for (const row of dom.upgradeRows) {
		// The other tab's rows are not on screen; leave them until they are.
		if (!onThisPage(row)) continue;
		const { u, button, cost, level } = row;
		const lv = s.levels[u.id];
		const price = costOf(s, u);
		const owned = lv > 0;
		const unlocked = isUnlocked(s, u);
		const affordable = (u.ecost ? s.currentExoticParticles : s.money) >= price;

		cost.textContent = lv >= maxLevel(u) ? "MAX" : u.ecost ? `${fmt(price)} EP` : `$${fmt(price)}`;
		level.textContent = maxLevel(u) > 1 ? `lv ${lv}` : lv ? "owned" : "";

		const shown = unlocked && (owned || affordable);
		button.hidden = !shown;
		button.classList.toggle("preview", false);
		if (!shown && unlocked) outOfReach.push({ row, price });
	}

	outOfReach.sort((a, b) => a.price - b.price);
	for (const { row } of outOfReach.slice(0, PREVIEW_COUNT)) {
		row.button.hidden = false;
		row.button.classList.add("preview");
	}
}

function renderObjectives(dom, s) {
	dom.objective.textContent = OBJECTIVES[s.objective].title;
	dom.objectiveRows.forEach((row, i) => row.classList.toggle("done", i < s.objective));
}
