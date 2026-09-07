// The DOM layer. Built once, then patched: each tile remembers the signature it
// last rendered and is only touched when that changes. The original walked all
// 1120 tiles every 100ms regardless.
import { fmt } from "./fmt.js";
import { PARTS } from "./parts.js";
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

const PAGES = [
	["reactor", "Reactor"],
	["upgrades", "Upgrades"],
	["experiments", "Experiments"],
	["objectives", "Goals"],
	["options", "Options"],
];

// Which part groups the dock shows, in order.
const DOCK_GROUPS = [
	["Cells", (p) => p.category === "cell"],
	["Power", (p) => p.category === "reflector" || p.category === "capacitor"],
	["Cooling", (p) => p.cooling],
];

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
	dom.pages.reactor.append(h("div", { id: "board" }, dom.grid));

	dom.objective = h("p", { className: "objective" });
	dom.objectiveList = h("ol", { className: "objectives" });
	dom.pages.objectives.append(dom.objective, dom.objectiveList);

	dom.upgradeList = h("div", { className: "upgrades" });
	dom.pages.upgrades.append(dom.upgradeList);

	dom.experimentList = h("div", { className: "upgrades" });
	dom.pages.experiments.append(
		h("div", { className: "reboot" },
			h("button", { className: "wide", textContent: "Reboot reactor", onclick: () => game.reboot(false) }),
			h("button", { className: "wide", textContent: "Reboot & refund all EP", onclick: () => game.reboot(true) })),
		dom.experimentList,
	);

	dom.pause = h("button", { className: "wide", onclick: game.togglePause });
	dom.pages.options.append(
		h("div", { className: "options" },
			h("button", { className: "wide", textContent: "Sell all power", onclick: game.sellAll }),
			h("button", { className: "wide", textContent: "Vent heat", onclick: game.ventHeat }),
			dom.pause,
			h("button", { className: "wide danger", textContent: "Wipe save and restart", onclick: game.wipe }),
			h("p", { className: "credit", innerHTML:
				'A clean-room rewrite of <a href="https://github.com/cwmonkey/reactor-knockoff">Reactor Knockoff</a> by cwmonkey, '
				+ 'itself based on <a href="http://www.kongregate.com/games/Cael/reactor-incremental">Reactor Incremental</a> by Cael. '
				+ 'All artwork here is generated at runtime.' })),
	);

	// ---- dock and tabs -----------------------------------------------------
	dom.dock = h("div", { id: "dock" });
	dom.tabs = h("nav", { id: "tabs" });
	for (const [id, label] of PAGES) {
		dom.tabs.append(h("button", { textContent: label, dataset: { page: id }, onclick: () => showPage(dom, id) }));
	}
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
	for (const b of dom.tabs.children) b.classList.toggle("on", b.dataset.page === id);
	// The part dock is only useful while looking at the reactor.
	dom.dock.hidden = id !== "reactor";
}

function buildDock(dom, game) {
	dom.partButtons = [];
	for (const [label, match] of DOCK_GROUPS) {
		const row = h("div", { className: "dock-group" }, h("span", { className: "dock-label", textContent: label }));
		for (const part of PARTS.filter(match)) {
			const button = h("button", {
				className: "part",
				title: part.title,
				onclick: () => game.select(part.id),
			}, h("i", { style: `background-image:url(${spriteFor(part)})` }), h("u", { textContent: fmt(part.cost) }));
			row.append(button);
			dom.partButtons.push({ button, part });
		}
		dom.dock.append(row);
	}
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
function buildGrid(dom, s, onTile) {
	dom.grid.replaceChildren();
	dom.grid.style.setProperty("--cols", s.cols);
	dom.tiles = [];
	for (const t of activeTiles(s)) {
		const heat = h("i", { className: "heat" });
		const life = h("i", { className: "life" });
		const cell = h("button", { className: "tile", dataset: { r: t.r, c: t.c } }, heat, life);
		dom.grid.append(cell);
		dom.tiles.push({ t, cell, heat, life, sig: "" });
	}
	dom.grid.onclick = (e) => {
		const cell = e.target.closest(".tile");
		if (cell) onTile(Number(cell.dataset.r), Number(cell.dataset.c));
	};
	dom.gridSize = `${s.rows}x${s.cols}`;
}

const pct = (n, d) => (d > 0 ? Math.min(100, (n / d) * 100) : 0);
// Quantising keeps a bar from triggering a repaint on every hairline change.
const quant = (n) => Math.round(n / 4) * 4;

/** Patch the whole interface to match the state. Cheap enough to run at 10fps. */
export function render(dom, s, game) {
	dom.money.textContent = `$${fmt(s.money)}`;
	dom.ep.textContent = `${fmt(s.currentExoticParticles)} EP`;
	dom.epBox.hidden = !s.currentExoticParticles && !s.exoticParticles && !s.totalExoticParticles;

	dom.power.text.textContent = `${fmt(s.power)} / ${fmt(s.maxPower)}`;
	dom.power.fill.style.width = `${pct(s.power, s.maxPower)}%`;
	dom.heat.text.textContent = `${fmt(s.heat)} / ${fmt(s.maxHeat)}`;
	dom.heat.fill.style.width = `${pct(s.heat, s.maxHeat)}%`;
	document.body.classList.toggle("hot", s.heat > s.maxHeat);
	document.body.classList.toggle("critical", s.heat > s.maxHeat * 1.5);

	if (dom.gridSize !== `${s.rows}x${s.cols}`) buildGrid(dom, s, game.onTile);

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
		button.classList.toggle("locked", Boolean(part.requires) && !s.levels[part.requires]);
		button.classList.toggle("poor", s.money < part.cost);
		button.classList.toggle("on", game.selected === part.id);
	}
	renderPage(dom, s);
}

/** The parts of the interface behind a tab, patched only while that tab is up. */
function renderPage(dom, s) {
	if (dom.page === "upgrades" || dom.page === "experiments") renderUpgrades(dom, s);
	if (dom.page === "objectives") renderObjectives(dom, s);
	if (dom.page === "options") dom.pause.textContent = s.paused ? "Resume" : "Pause";
}

function renderUpgrades(dom, s) {
	for (const { u, button, cost, level } of dom.upgradeRows) {
		const lv = s.levels[u.id];
		const price = costOf(s, u);
		button.hidden = !isUnlocked(s, u);
		button.classList.toggle("poor", (u.ecost ? s.currentExoticParticles : s.money) < price);
		cost.textContent = lv >= maxLevel(u) ? "MAX" : u.ecost ? `${fmt(price)} EP` : `$${fmt(price)}`;
		level.textContent = maxLevel(u) > 1 ? `lv ${lv}` : lv ? "owned" : "";
	}
}

function renderObjectives(dom, s) {
	dom.objective.textContent = OBJECTIVES[s.objective].title;
	dom.objectiveRows.forEach((row, i) => row.classList.toggle("done", i < s.objective));
}
