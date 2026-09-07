// The DOM layer. Built once, then patched: each tile remembers the signature it
// last rendered and is only touched when that changes. The original walked all
// 1120 tiles every 100ms regardless.
import { fmt } from "./fmt.js";
import { PARTS, isPartVisible, unlockProgress } from "./parts.js";
import { UPGRADES, costOf, isUnlocked, kindOf, maxLevel, nextLevel } from "./upgrades.js";
import { OBJECTIVES } from "./objectives.js";
import { artFor, availablePacks, PACKS } from "./art.js";
import { icon } from "./icons.js";
import { ROWS, COLS, activeTiles, sellValue } from "./sim.js";

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
	for (const [value, label, glyph] of items) {
		const button = h("button", { dataset: { value }, onclick: () => onPick(value) });
		if (glyph) button.append(icon(glyph));
		button.append(h("span", { textContent: label }));
		el.append(button);
	}
	/** Light up one button and show its matching page. */
	el.select = (value, pages) => {
		for (const b of el.children) b.classList.toggle("on", b.dataset.value === value);
		for (const [key, page] of Object.entries(pages)) page.classList.toggle("showing", key === value);
	};
	return el;
}

// [id, label, icon]
const PAGES = [
	["reactor", "Reactor", "reactor"],
	["upgrades", "Upgrades", "upgrades"],
	["experiments", "Experiments", "experiments"],
	["objectives", "Goals", "goals"],
	["options", "Options", "options"],
];

// The dock's own tabs. Inside each, parts sit one family per row with the
// tiers running across, so a row reads vent 1, vent 2, vent 3...
// [label, the categories it holds]. Split by what a part does to the sim, not
// by what is left over: "Cooling" used to be every category that was not a cell
// or a capacitor, which put plating and particle accelerators - neither of them
// cooling - in with the vents, 42 parts in one tab.
const DOCK_TABS = [
	["Cells", ["cell"]],
	["Power", ["reflector", "capacitor"]],
	["Cooling", ["vent", "coolant_cell", "reactor_plating"]],
	["Transfer", ["heat_exchanger", "heat_inlet", "heat_outlet"]],
	["Exotic", ["particle_accelerator"]],
];

// Fuels are their own families so uranium and plutonium never share a row.
const familyOf = (p) => (p.category === "cell" ? p.type : p.category);

export function buildUI(game) {
	const dom = {};
	const root = document.getElementById("app");
	root.replaceChildren();

	// ---- stat bar ----------------------------------------------------------
	const meter = (id, glyph, onclick, title) => {
		const fill = h("i", { className: "fill" });
		const text = h("b", {});
		dom[id] = { fill, text };
		// The bar is the button: glyph and reading sit inside it, painted over
		// the fill. Two bars this size are a better target than two small
		// buttons were, and the thing you press is the thing it acts on.
		return h("button", { className: `meter ${id}`, onclick, title },
			fill, icon(glyph, "icon stat"), text);
	};

	dom.money = h("b", {});
	dom.ep = h("b", {});
	dom.epBox = h("span", { className: "ep" }, dom.ep);
	// The readout sits with the buttons that change it, at the bottom where a
	// thumb already is. All the top of the screen owes the player is what to
	// aim for next.
	// The coin says "money"; the number does not need a currency symbol too.
	dom.purse = h("div", { className: "purse" }, icon("cash", "icon coin"), h("span", { className: "cash" }, dom.money), dom.epBox);

	// Pause is the only control left that acts on nothing in particular, so it
	// goes in the corner rather than taking a row of its own.
	dom.pauseLabel = h("span", {});
	dom.pauseIcon = h("span", { className: "swap" }, icon("pause"));
	dom.pause = h("button", { className: "pause", onclick: game.togglePause }, dom.pauseIcon, dom.pauseLabel);

	dom.objective = h("p", { className: "objective" });
	root.append(h("header", { id: "goal" }, dom.objective, dom.pause));

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

	dom.objectiveList = h("ol", { className: "objectives" });
	dom.pages.objectives.append(dom.objectiveList);

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

	// Any game in the lineage can skin this one; the packs that shipped with
	// this build are listed in parts/packs.json.
	dom.artPack = h("select", { className: "wide", onchange: (e) => game.setArtPack(e.target.value) });
	for (const id of availablePacks()) {
		dom.artPack.append(h("option", { value: id, textContent: PACKS[id].label }));
	}

	dom.pages.options.append(
		h("div", { className: "options" },
			h("label", { className: "field" }, h("span", { textContent: "Part artwork" }), dom.artPack),
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
				+ 'Part artwork belongs to those games and to Reactor Revival. The generated pack is drawn at runtime.' })),
	);

	// ---- dock and tabs -----------------------------------------------------
	// Power, what it earned, and heat - in that order, so the money sits
	// between the bar that makes it and the bar that threatens it.
	dom.actions = h("div", { id: "actions" },
		meter("power", "power", game.sellAll, "Sell all power"),
		dom.purse,
		meter("heat", "heat", game.ventHeat, "Vent heat"));
	// The bar stays put on every page - the readout in it is most wanted on the
	// Upgrades page, where the money is being spent. Only the parts hide.
	dom.dock = h("div", { id: "dock" });
	dom.tabs = tabStrip("tabs", PAGES, (id) => { showPage(dom, id); game.viewing(id); });
	root.append(h("footer", {}, dom.actions, dom.dock, dom.tabs));

	buildDock(dom, game);
	buildUpgrades(dom, game);
	buildObjectiveList(dom);
	showPage(dom, "reactor");
	return dom;
}

function showPage(dom, id) {
	dom.page = id;
	dom.tabs.select(id, dom.pages);
	// The part dock is only useful while looking at the reactor.
	dom.dock.hidden = id !== "reactor";
}

function buildDock(dom, game) {
	dom.partButtons = [];
	dom.dockCols = [];
	dom.dockPages = {};
	dom.dockTabs = tabStrip("dock-tabs", DOCK_TABS.map(([label]) => [label, label]), (label) => showDock(dom, label));
	const body = h("div", { id: "dock-body" });

	for (const [label, categories] of DOCK_TABS) {
		const page = h("div", { className: "dock-page" });
		dom.dockPages[label] = page;
		body.append(page);

		// One column per family, its tiers stacked down it.
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
				onclick: () => game.select(part.id),
			}, h("i", { style: `background-image:url(${artFor(part, game.pack)})` }),
				label,
				h("u", { textContent: fmt(part.cost) }));
			// Prepending puts the newest tier on top, and the locked tier that
			// comes after them all above it.
			column.prepend(button);
			dom.partButtons.push({ button, part, label });
		}
	}

	dom.dock.append(dom.dockTabs, body);
	showDock(dom, DOCK_TABS[0][0]);
}

const showDock = (dom, label) => dom.dockTabs.select(label, dom.dockPages);

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
export function inspect(s, t, sell) {
	const p = s.stats.get(t.id);
	const placed = [...activeTiles(s)].filter((x) => x.id);
	const sameKind = placed.filter((x) => x.id === t.id).length;
	const rows = [
		// What it is worth now, which is not what it cost once it has been used.
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

	const dialog = h("dialog", { className: "sheet" },
		h("h2", { textContent: p.title }),
		h("i", { textContent: p.desc ?? "" }),
		h("dl", {}, rows.filter(([, v]) => v !== null).flatMap(([k, v]) => [h("dt", { textContent: k }), h("dd", { textContent: v })])),
		// Selling one at a time is fine for a mistake; clearing a whole kind, or
		// the whole board, is what you want when the layout is wrong.
		h("div", { className: "sheet-actions" }, [
			h("button", { className: "danger", textContent: "Sell this one", onclick: () => { dialog.close(); sell.sell(); } }),
			sameKind > 1 && h("button", { className: "danger", textContent: `Sell all ${sameKind} ${p.title}s`, onclick: () => { dialog.close(); sell.sellKind(); } }),
			placed.length > sameKind && h("button", { className: "danger", textContent: `Sell everything (${placed.length} parts)`, onclick: () => { dialog.close(); sell.sellAll(); } }),
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
		// Power, heat or utility, in the corner. Fixed per upgrade, so it is set
		// here once rather than by the renderer.
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

/** Build the tile grid. The reactor never resizes, so this runs once. */
function buildGrid(dom, s) {
	dom.grid.replaceChildren();
	dom.grid.style.setProperty("--cols", COLS);
	dom.grid.style.setProperty("--rows", ROWS);
	dom.tiles = [];
	for (const t of activeTiles(s)) {
		const heat = h("i", { className: "heat" });
		const life = h("i", { className: "life" });
		const cell = h("button", { className: "tile", dataset: { r: t.r, c: t.c } }, heat, life);
		dom.grid.append(cell);
		dom.tiles.push({ t, cell, heat, life, sig: "" });
	}
	// animationend bubbles, so one listener covers every tile.
	dom.grid.onanimationend = (e) => e.target.classList.remove("exploding");
}

const pct = (n, d) => (d > 0 ? Math.min(100, (n / d) * 100) : 0);
// Quantising keeps a bar from triggering a repaint on every hairline change.
const quant = (n) => Math.round(n / 4) * 4;

/** Patch the whole interface to match the state. Cheap enough to run at 10fps. */
export function render(dom, s, game) {
	dom.money.textContent = fmt(s.money);
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
	if (dom.pauseLabel.textContent !== (s.paused ? "Resume" : "Pause")) {
		dom.pauseLabel.textContent = s.paused ? "Resume" : "Pause";
		dom.pauseIcon.replaceChildren(icon(s.paused ? "play" : "pause"));
	}
	dom.objective.textContent = OBJECTIVES[s.objective]?.title ?? "Every goal met.";
	document.body.classList.toggle("hot", s.heat > s.maxHeat);
	document.body.classList.toggle("critical", s.heat > s.maxHeat * 1.5);

	if (!dom.tiles) buildGrid(dom, s);

	// Only the visible page is worth patching; the tile loop below is the one
	// that always runs, because the reactor is what the player watches.
	if (dom.page !== "reactor") {
		renderPage(dom, s);
		return;
	}

	// Play the explosions the last tick produced, then clear them so each one
	// animates exactly once however often the renderer runs.
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
		const sig = `${t.id}|${t.activated}|${heat}|${life}|${s.artPack}`;
		if (sig === row.sig) continue;
		row.sig = sig;

		row.cell.style.backgroundImage = p ? `url(${artFor(p, s.artPack)})` : "";
		row.cell.classList.toggle("queued", Boolean(t.id) && !t.activated);
		row.cell.classList.toggle("spent", Boolean(p) && p.category === "cell" && !t.ticks);
		row.heat.style.width = `${heat}%`;
		row.life.style.width = `${life}%`;
	}

	// The first locked tier in each family stands in for itself: a silhouette
	// with the placements still owed and what it will cost. The tiers behind it
	// stay hidden, so the column never grows a row it did not have before.
	// Only in a family already on screen: a family with nothing unlocked stays
	// hidden entirely, or the first screen would show every fuel in the game.
	const started = new Set();
	const placeholders = new Set();
	for (const { button, part, label } of dom.partButtons) {
		const visible = isPartVisible(s, part);
		const progress = visible ? null : unlockProgress(s, part);
		const family = familyOf(part);
		if (visible) started.add(family);
		const isNext = Boolean(progress) && started.has(family) && !placeholders.has(family);
		if (isNext) placeholders.add(family);

		button.disabled = !visible; // a placeholder is a signpost, not a part
		button.classList.toggle("locked", !visible && !isNext);
		button.classList.toggle("next", isNext);
		button.classList.toggle("poor", visible && s.money < part.cost);
		button.classList.toggle("on", game.selected === part.id);
		label.textContent = isNext ? `${progress.have}/${progress.need}` : part.short;
	}
	// Hide a family entirely until at least one of its tiers is unlocked. Tabs
	// need no such treatment: every category's tier 1 is visible from boot.
	for (const col of dom.dockCols) col.hidden = !col.querySelector(".part:not(.locked)");
	renderPage(dom, s);
}

/** The parts of the interface behind a tab, patched only while that tab is up. */
function renderPage(dom, s) {
	if (dom.page === "upgrades" || dom.page === "experiments") renderUpgrades(dom, s);
	if (dom.page === "objectives") renderObjectives(dom, s);
	if (dom.page === "options") dom.artPack.value = s.artPack;
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

		// What the next level buys, measured against this one. The upgrades that
		// only switch something on have nothing to show and say so by absence.
		const step = nextLevel(s, u);
		delta.hidden = !step;
		if (step) {
			was.textContent = step.from;
			now.textContent = step.to;
		}

		// An upgrade already owned stays on the list at every level, so the price
		// has to say when the next one is out of reach - otherwise buying level 1
		// leaves level 2 looking just as affordable at twenty times the cost.
		button.classList.toggle("poor", !affordable && lv < maxLevel(u));

		const shown = unlocked && (owned || affordable);
		button.hidden = !shown;
		button.classList.toggle("preview", false);
		if (!shown && unlocked) outOfReach.push({ row, price });
		(affordable && lv < maxLevel(u) ? buyable : rest).push(row);
	}

	outOfReach.sort((a, b) => a.price - b.price);
	for (const { row } of outOfReach.slice(0, PREVIEW_COUNT)) {
		row.button.hidden = false;
		row.button.classList.add("preview");
	}

	// What you can buy right now floats to the top, everything else keeps its
	// catalog order. Re-appending moves the nodes, so only do it when the order
	// actually changes rather than every hundred milliseconds.
	const ordered = [...buyable, ...rest];
	const sig = ordered.map((r) => r.u.id).join();
	if (dom.upgradeOrder[dom.page] !== sig) {
		dom.upgradeOrder[dom.page] = sig;
		(dom.page === "experiments" ? dom.experimentList : dom.upgradeList).append(...ordered.map((r) => r.button));
	}
}

function renderObjectives(dom, s) {
	dom.objectiveRows.forEach((row, i) => row.classList.toggle("done", i < s.objective));
}
