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

/** "Holds" or "Fails at tick 41 - Heat Vent", the heart of every verdict. */
const holds = (f) => (!f.failTick ? "Holds"
	: `Fails at tick ${f.estimated ? "~" : ""}${fmt(f.failTick)}${f.failed === "meltdown" ? " - meltdown" : f.failed ? ` - ${f.failed}` : ""}`);

// ---- the verdict line -----------------------------------------------------

export function buildVerdict(dom, game) {
	dom.verdictText = h("span", {});
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
		dom.verdictText.textContent = !f.parts ? "Place parts to see what this layout does"
			: [
				holds(f),
				`${num(f.power)} power`,
				Math.abs(f.heat) >= 0.05 ? `reactor ${signed(f.heat)} heat` : null,
				`${money(f.profit)}/tick after fuel`,
			].filter(Boolean).join("  ·  ");
	}, 350);
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
			["Holds", holds(st)],
		].flatMap(([k, v]) => [h("dt", { textContent: k }), h("dd", { textContent: v })])),
		h("div", { className: "sheet-actions" },
			h("button", { textContent: "Rebuild this layout on today's board", onclick: () => { dialog.close(); game.rebuildSnapshot(snap); } }),
			h("button", { className: "danger", textContent: "Roll the game back to here", onclick: () => {
				dialog.close();
				ask("Roll back to this point? Money, upgrades, research and every job since are lost.", () => game.rollBack(snap), "Roll back");
			} })),
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
