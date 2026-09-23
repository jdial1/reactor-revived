// The reactor's working tools, on screen: the verdict line, the heat-flow
// overlay, replace-all, save states and the example layouts.
import { h, ask } from "./ui.js";
import { fmt } from "./fmt.js";
import { artFor } from "./art.js";
import { COLS } from "./sim.js";
import { PARTS, isPartVisible } from "./parts.js";
import { forecast } from "./forecast.js";
import { replaceQuote } from "./layout.js";
import { LESSONS } from "./lessons.js";
import { modId } from "./module.js";
import { markOf, MARK_MEANS, MARK_WINDOW, lastIncident, ticks } from "./records.js";

/** fmt() drops decimals; a vent at 4.5 or a module at 0.25 needs them. */
const num = (v) => (Math.abs(v) < 1000 ? String(Math.round(v * 10) / 10) : fmt(v));
const signed = (v) => `${v < 0 ? "-" : "+"}${num(Math.abs(v))}`;
const money = (v) => `${v < 0 ? "-" : ""}$${fmt(Math.abs(v))}`;

/** A layout drawn small: [tile index, part id] pairs on the 12x8 board. */
export function miniBoard(s, tiles) {
	const cells = Array.from({ length: s.tiles.length }, () => h("i", {}));
	for (const [i, id] of tiles) {
		const p = s.stats.get(id);
		if (p && cells[i]) cells[i].style.backgroundImage = `url(${p.art ?? artFor(p)})`;
	}
	return h("div", { className: "mini-board", style: `--cols:${COLS}` }, ...cells);
}

/** How long a board takes to earn back what it cost. */
const payback = (f) => (!f.parts ? null : Number.isFinite(f.payback) ? `pays back in ${fmt(Math.ceil(f.payback))} ticks` : "never pays back");

/** "Holds" or "Fails at tick 41 - Heat Vent", the heart of every verdict. */
const holds = (f) => (!f.failTick ? "Holds"
	: `Fails at tick ${f.estimated ? "~" : ""}${fmt(f.failTick)}${f.failed === "meltdown" ? " - meltdown" : f.failed ? ` - ${f.failed}` : ""}`);

// ---- the verdict line -----------------------------------------------------

export function buildVerdict(dom, game) {
	// On the real board the line is a record, and tapping it explains the mark.
	dom.verdictText = h("span", { onclick: () => { if (!game.state.planner) markSheet(game.state); } });
	dom.flowToggle = h("button", { className: "tool flow-toggle", ariaPressed: "false", title: "Show each part's heat in, out and vented", onclick: () => {
		const on = document.body.classList.toggle("flow");
		dom.flowToggle.setAttribute("aria-pressed", String(on));
	} }, "Flow");
	dom.verdictBar = h("div", { id: "verdict" }, dom.verdictText, dom.flowToggle);
	dom.verdictSig = "";
	return dom.verdictBar;
}

/**
 * Measured again only when the layout or the upgrades change, and a moment
 * after they stop changing, so painting a row of parts runs it once.
 */
export function renderVerdict(dom, s) {
	// The forecast is the planner's, as it was in IC2: the real reactor is
	// where you find out. Flow and the tool buttons stay on both.
	if (!s.planner) {
		const line = floorLine(s);
		if (dom.verdictSig !== `real:${line}`) {
			dom.verdictSig = `real:${line}`;
			clearTimeout(dom.verdictTimer);
			dom.verdictBar.classList.toggle("holds", s.mark?.grade === 1);
			dom.verdictBar.classList.toggle("fails", s.mark?.grade === 3);
			dom.verdictText.textContent = line;
			dom.verdictText.role = line ? "button" : null;
			dom.verdictText.tabIndex = line ? 0 : -1;
		}
		return;
	}
	dom.verdictText.role = null;
	dom.verdictText.tabIndex = -1;
	const sig = `${s.stats.size}|${JSON.stringify(s.levels).length}|${s.tiles.map((t) => (t.id ? `${t.id}${t.activated ? "" : "?"}` : "")).join()}`;
	if (sig === dom.verdictSig) return;
	dom.verdictSig = sig;
	clearTimeout(dom.verdictTimer);
	dom.verdictTimer = setTimeout(() => {
		const f = forecast(s);
		dom.verdict = f;
		const bar = dom.verdictBar;
		bar.classList.toggle("fails", Boolean(f.failTick));
		bar.classList.toggle("holds", Boolean(f.parts) && !f.failTick);
		const fan = f.parts >= 12 && s.tiles.every((t) => !t.id || s.stats.get(t.id).category === "vent");
		dom.verdictText.textContent = !f.parts ? "Place parts to see what this layout does"
			: fan ? "A very expensive fan"
			: [
				holds(f),
				`${num(f.power)} power`,
				Math.abs(f.heat) >= 0.05 ? `reactor ${signed(f.heat)} heat` : null,
				`${money(f.profit)}/tick after fuel`,
				payback(f),
			].filter(Boolean).join("  ·  ");
	}, 350);
}

// ---- the floor's own line: what the board has done -------------------------

/** "Mark I · 4,210 ticks without incident", like the sign by a plant gate. */
function floorLine(s) {
	if (!s.tiles.some((t) => t.id)) return "";
	const mark = markOf(s);
	return `${mark ? `${mark} · ` : ""}${ticks(s.records?.streak ?? 0)} without incident`;
}

/** What the marks mean, and the last part the board lost. */
function markSheet(s) {
	const last = lastIncident(s);
	const dialog = modal("The board's mark",
		h("h2", { textContent: markOf(s) ?? "No mark yet" }),
		h("i", { textContent: `Earned on this board by running it: ${fmt(MARK_WINDOW)} ticks making power since it last changed, measured, not forecast. The ratings are the ones IC2's players gave their designs.` }),
		h("dl", { className: "mark-legend" }, ...MARK_MEANS.flatMap(([k, v]) => [h("dt", { textContent: k }), h("dd", { textContent: v })])),
		h("p", { className: "incident", textContent: last ? `Last incident: ${last}` : "No incidents on record." }),
		h("div", { className: "row" }, h("button", { textContent: "Close", onclick: () => dialog.close() })));
	return dialog;
}

// ---- the heat-flow overlay ------------------------------------------------

/** What a tile did with heat this tick, as the overlay prints it. */
export function flowText(t, p) {
	if (!p || !t.activated) return "";
	if (p.category === "cell") return t.made ? `+${num(t.made)}` : "";
	const lines = [];
	if (t.made) lines.push(`+${num(t.made)}`);
	if (t.heatIn) lines.push(`▼${num(t.heatIn)}`);
	if (t.heatOut) lines.push(`▲${num(t.heatOut)}`);
	if (t.vented) lines.push(`≈${num(t.vented)}`);
	return lines.join("\n");
}

// ---- replace or upgrade all -----------------------------------------------

/** The stats a part row shows, with how the new part reads beside the old. */
const PART_FIELDS = [
	["basePower", "Power"], ["baseHeat", "Heat"], ["vent", "Vents /tick"],
	["containment", "Holds"], ["transfer", "Moves /tick"], ["powerIncrease", "Boost %"],
	["reactorPower", "Max power +"], ["reactorHeat", "Max heat +"], ["ticks", "Lasts"],
	["modPower", "Power"], ["modHeat", "Heat"],
];

function modal(label, ...kids) {
	const dialog = h("dialog", { className: "sheet tool", ariaLabel: label }, ...kids);
	dialog.addEventListener("close", () => dialog.remove());
	document.body.append(dialog);
	dialog.showModal();
	return dialog;
}

/** Every visible part of the same family, or every other design for a module. */
function choicesFor(s, from) {
	if (from.category === "module") return s.modules.map((m) => s.stats.get(modId(m))).filter((p) => p.id !== from.id);
	return PARTS.map((p) => s.stats.get(p.id))
		.filter((p) => p.category === from.category && p.id !== from.id && isPartVisible(s, p));
}

export function replaceDialog(s, from, game) {
	const options = choicesFor(s, from);
	if (!options.length) {
		ask(`There is nothing unlocked yet to replace your ${from.title}s with.`, () => {}, "OK");
		return;
	}
	let to = options.find((p) => p.level === from.level + 1 && (from.category !== "cell" || p.type === from.type)) ?? options[0];
	const before = forecast(s);

	const picker = h("div", { className: "mod-strip" });
	const body = h("div", {});
	const go = h("button", { className: "wide" });
	const dialog = modal(`Replace every ${from.title}`,
		h("h2", { textContent: `Replace every ${from.title}` }),
		h("small", { className: "tool-label", textContent: "With" }), picker,
		body,
		h("div", { className: "row" },
			h("button", { textContent: "Cancel", onclick: () => dialog.close() }), go));

	const show = () => {
		picker.replaceChildren(...options.map((p) => h("button", {
			className: `part${p === to ? " on" : ""}`, title: p.title,
			onclick: () => { to = p; show(); },
		}, h("i", { style: `background-image:url(${p.art ?? artFor(p)})` }), h("em", { textContent: p.short }), h("u", { textContent: fmt(p.cost) }))));

		const q = replaceQuote(s, from.id, to.id);
		const after = forecast(s, [from.id, to.id]);
		const rows = [];
		for (const [field, label] of PART_FIELDS) {
			const a = from[field];
			const b = to[field];
			if ((a ?? 0) === (b ?? 0) || (a === undefined && b === undefined)) continue;
			rows.push([label, num(a ?? 0), num(b ?? 0), (b ?? 0) > (a ?? 0)]);
		}
		const board = [
			["Power /tick", num(before.power ?? 0), num(after.power ?? 0), (after.power ?? 0) >= (before.power ?? 0)],
			["Reactor heat /tick", signed(before.heat ?? 0), signed(after.heat ?? 0), (after.heat ?? 0) <= (before.heat ?? 0)],
			["Profit /tick", money(before.profit ?? 0), money(after.profit ?? 0), (after.profit ?? 0) >= (before.profit ?? 0)],
			["Pays back in", Number.isFinite(before.payback) ? `${fmt(Math.ceil(before.payback))} ticks` : "never",
				Number.isFinite(after.payback) ? `${fmt(Math.ceil(after.payback))} ticks` : "never", (after.payback ?? Infinity) <= (before.payback ?? Infinity)],
			["Holds", holds(before), holds(after), !after.failTick || (before.failTick && after.failTick > before.failTick)],
		];
		const table = (title, list) => h("div", { className: "change" },
			h("small", { className: "tool-label", textContent: title }),
			h("dl", {}, ...list.flatMap(([k, a, b, better]) => [
				h("dt", { textContent: k }),
				h("dd", {}, h("s", { textContent: a }), " → ", h("b", { className: a === b ? "same" : better ? "better" : "worse", textContent: b })),
			])));
		body.replaceChildren(
			h("p", { className: "cost" },
				`${q.count} × ${from.title}: new parts $${fmt(q.cost)}, refund $${fmt(q.refund)}. `,
				h("b", { textContent: q.net >= 0 ? `You pay $${fmt(q.net)}.` : `You get back $${fmt(-q.net)}.` })),
			rows.length ? table("Each part", rows) : "",
			table("The whole reactor", board));
		const short = s.money < q.net;
		go.disabled = short;
		go.textContent = short ? `Short by $${fmt(q.net - s.money)}` : q.net >= 0 ? `Replace all for $${fmt(q.net)}` : "Replace all";
		go.onclick = () => { dialog.close(); game.replaceAll(from.id, to.id); };
	};
	show();
}

// ---- save states ----------------------------------------------------------

export function snapshotDialog(s, snap, game) {
	const st = snap.stats;
	const dialog = modal(`Saved after ${snap.title}`,
		h("h2", { textContent: snap.title }),
		h("i", { textContent: `Saved when this job was done, ${new Date(snap.at).toLocaleString()}.` }),
		miniBoard(s, snap.save.tiles.map((t) => [t.i, t.id])),
		h("dl", {}, ...[
			["Money", `$${fmt(st.money)}`],
			["Parts", String(st.parts)],
			["Power", `${num(st.power)} /tick`],
			["Profit", `${money(st.profit)} /tick after fuel`],
			["Pays back", st.payback ? `in ${fmt(Math.ceil(st.payback))} ticks` : "never"],
			["Holds", holds(st)],
			...(st.mark ? [["Mark", st.mark]] : []),
		].flatMap(([k, v]) => [h("dt", { textContent: k }), h("dd", { textContent: v })])),
		h("div", { className: "sheet-actions" },
			h("button", { textContent: "Rebuild this layout on today's board", onclick: () => { dialog.close(); game.rebuildSnapshot(snap); } }),
			),
		h("div", { className: "row" }, h("button", { textContent: "Close", onclick: () => dialog.close() })));
	return dialog;
}

// ---- example layouts ------------------------------------------------------

/** An example layout as [tile index, part id] pairs. */
export const lessonTiles = (name) => LESSONS[name].tiles.map(([r, c, id]) => [r * COLS + c, id]);

export function lessonDialog(s, name, game) {
	const l = LESSONS[name];
	const dialog = modal(l.title,
		h("h2", { textContent: l.title }),
		h("i", { textContent: l.text }),
		miniBoard(s, lessonTiles(name)),
		h("div", { className: "row" },
			h("button", { textContent: "Close", onclick: () => dialog.close() }),
			h("button", { className: "wide", textContent: "Try it in the planner", onclick: () => {
				dialog.close();
				game.startPlanner({ tiles: lessonTiles(name), modules: [] });
			} })));
	return dialog;
}
