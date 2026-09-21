// The Modules page: saved designs, and the 3x3 editor that makes them. A design
// never changes once saved - "Edit" opens a copy - so a module already on the
// board is always the module it was when it was placed.
import { h, ask } from "./ui.js";
import { fmt } from "./fmt.js";
import { artFor } from "./art.js";
import { PARTS, isPartVisible } from "./parts.js";
import { SIZE, readout, modId, inUse, fits } from "./module.js";

// The colours a casing can wear: the fuels', then the gauges'.
const TINTS = ["uranium", "plutonium", "thorium", "seaborgium", "dolorium", "nefastium", "protium", "power", "heat", "ep", "cash"];
const EMPTY = () => Array(SIZE * SIZE).fill(null);

/** Small numbers keep their decimals; a module at 25% makes fractions. */
const num = (v) => (Math.abs(v) < 1000 ? String(Math.round(v * 100) / 100) : fmt(v));
const signed = (v) => `${v < 0 ? "-" : "+"}${num(Math.abs(v))}`;
/** Heat into the reactor beside a cold one, and beside one at its limit. */
const heatRange = (cold, hot) => (num(cold) === num(hot) ? signed(cold) : `${signed(cold)} cold, ${signed(hot)} hot`);

export function buildModulesPage(dom, game) {
	dom.modList = h("div", { className: "modules" });
	dom.modSummary = h("p", { className: "ep-status" });
	dom.modNew = h("button", { className: "wide", textContent: "New module", onclick: () => openEditor(dom, game) });
	dom.modBrowse = h("div", {}, dom.modSummary, dom.modNew, dom.modList);
	dom.modEditor = h("div", { className: "mod-editor", hidden: true });
	dom.pages.modules.append(dom.modBrowse, dom.modEditor);
	dom.modSig = "";
}

/** A casing's face: its icon, framed in its tint. */
export const face = (p, className = "mod-face") =>
	h("i", { className, style: `background-image:url(${p.art});--mtint:var(--${p.tint})` });

/** What a design does, in one line. */
function summary(s, p) {
	const e = s.casingEff;
	const upkeep = p.ticks ? p.rebuy / p.ticks : 0;
	return [
		`+${num(p.modPower * e)} power`,
		`${heatRange(p.modHeat, p.modHeatHot)} heat`,
		p.modEP ? `+${num(p.modEP * e)} EP` : null,
		`${p.modPower * e - upkeep < 0 ? "-" : "+"}$${num(Math.abs(p.modPower * e - upkeep))}/tick`,
	].filter(Boolean).join("  ");
}

export function renderModules(dom, s, game) {
	dom.modSummary.textContent = `Casings pass on ${Math.round(s.casingEff * 100)}% of what their parts make.`
		+ (s.maxNest > 1 ? ` Modules nest ${s.maxNest} deep.` : "");
	if (!dom.modEditor.hidden) return renderEditor(dom, s);

	// Rebuilt only when the designs or their measurements change.
	const sig = s.modules.map((m) => {
		const p = s.stats.get(modId(m));
		return `${m.id}:${p.modPower}:${p.failTick}:${inUse(s, m)}:${s.casingEff}`;
	}).join("|");
	if (sig === dom.modSig) return;
	dom.modSig = sig;

	dom.modList.replaceChildren(...[...s.modules].reverse().map((m) => {
		const p = s.stats.get(modId(m));
		const used = inUse(s, m);
		return h("div", { className: "module-row" },
			face(p),
			h("div", {},
				h("b", { textContent: m.name }),
				h("small", { textContent: summary(s, p) }),
				h("small", {
					className: p.failTick ? "unstable" : "",
					textContent: `${p.ticks ? `lasts ${fmt(p.ticks)} ticks, rebuys for $${fmt(p.rebuy)}` : "no fuel"}`
						+ (p.failTick ? ` - fails at tick ${fmt(p.failTick)}` : ""),
				})),
			h("div", { className: "row" },
				h("button", { textContent: "Edit as copy", onclick: () => openEditor(dom, game, m) }),
				h("button", {
					className: "danger", textContent: "Delete", disabled: used,
					title: used ? "On the board or inside another design" : "",
					onclick: () => ask(`Delete ${m.name}?`, () => { game.deleteModule(m); dom.modSig = ""; }, "Delete"),
				})));
	}));
}

function openEditor(dom, game, from) {
	const s = game.state;
	const firstCell = from?.layout.find((id) => id && s.stats.get(id)?.category === "cell");
	dom.draft = {
		name: from ? `${from.name} 2` : `Module ${s.nextModuleId}`,
		icon: from?.icon ?? firstCell ?? "uranium1",
		tint: from?.tint ?? "uranium",
		layout: from ? [...from.layout] : EMPTY(),
		pick: "uranium1",
		sig: "",
	};
	dom.modBrowse.hidden = true;
	dom.modEditor.hidden = false;
	buildEditor(dom, game);
}

function closeEditor(dom) {
	dom.modEditor.hidden = true;
	dom.modBrowse.hidden = false;
	dom.modSig = "";
}

function buildEditor(dom, game) {
	const d = dom.draft;
	const name = h("input", { className: "mod-name", value: d.name, maxLength: 24, ariaLabel: "Module name",
		oninput: () => { d.name = name.value; } });
	const slots = d.layout.map((_, i) => h("button", { className: "slot", ariaLabel: `Slot ${i + 1}`, onclick: () => {
		const id = d.pick === "empty" || d.layout[i] === d.pick ? null : d.pick;
		const next = [...d.layout];
		next[i] = id;
		if (id && !fits(game.state, next)) return;
		d.layout = next;
		d.sig = "";
	} }));
	dom.modEd = {
		slots,
		grid: h("div", { className: "mod-grid" }, ...slots),
		icons: h("div", { className: "mod-strip" }),
		tints: h("div", { className: "mod-tints" }, ...TINTS.map((t) => h("button", {
			className: "swatch", title: t, ariaLabel: t, style: `--mtint:var(--${t})`,
			onclick: () => { d.tint = t; d.sig = ""; },
		}))),
		picker: h("div", { className: "mod-strip" }),
		stats: h("dl", {}),
		preview: h("i", { className: "mod-face big" }),
	};
	const e = dom.modEd;
	dom.modEditor.replaceChildren(
		h("div", { className: "mod-head" }, e.preview, name),
		h("small", { textContent: "Icon" }), e.icons,
		h("small", { textContent: "Colour" }), e.tints,
		h("div", { className: "mod-body" }, e.grid, e.stats),
		h("small", { textContent: "Place - tap a slot; tap it again, or use Empty, to clear" }), e.picker,
		h("div", { className: "row" },
			h("button", { textContent: "Cancel", onclick: () => closeEditor(dom) }),
			h("button", { className: "wide", textContent: "Save module", onclick: () => {
				if (!d.layout.some(Boolean)) return;
				game.saveModule({ name: d.name, icon: d.icon, tint: d.tint, layout: d.layout });
				closeEditor(dom);
			} })));
	e.pickSig = "";
}

/** The parts a casing may hold: whatever the dock offers, and designs that fit. */
function choices(s, layout) {
	const parts = PARTS.filter((p) => isPartVisible(s, s.stats.get(p.id))).map((p) => s.stats.get(p.id));
	const mods = s.modules.map((m) => s.stats.get(modId(m)));
	return [...parts, ...mods.map((p) => ({ p, ok: fits(s, [...layout.filter(Boolean), p.id]) }))];
}

function renderEditor(dom, s) {
	const d = dom.draft;
	const e = dom.modEd;
	const art = (id) => {
		const p = s.stats.get(id);
		return p ? `url(${p.art ?? artFor(p)})` : "";
	};

	// The strips only change when what is on offer changes.
	const offer = choices(s, d.layout);
	const offerSig = offer.map((o) => (o.p ? `${o.p.id}${o.ok}` : o.id)).join() + d.pick + d.icon;
	if (offerSig !== e.pickSig) {
		e.pickSig = offerSig;
		const pickButton = (p, ok = true) => {
			const b = h("button", { className: `part${d.pick === p.id ? " on" : ""}`, title: p.title, disabled: !ok,
				onclick: () => { d.pick = p.id; e.pickSig = ""; } },
			h("i", { style: `background-image:${art(p.id)}` }), h("em", { textContent: p.short }));
			return b;
		};
		e.picker.replaceChildren(
			h("button", { className: `part${d.pick === "empty" ? " on" : ""}`, onclick: () => { d.pick = "empty"; e.pickSig = ""; } },
				h("i", {}), h("em", { textContent: "Empty" })),
			...offer.map((o) => (o.p ? pickButton(o.p, o.ok) : pickButton(o))));
		e.icons.replaceChildren(...offer.filter((o) => !o.p).map((p) => h("button", {
			className: `part${d.icon === p.id ? " on" : ""}`, title: p.title,
			onclick: () => { d.icon = p.id; d.sig = ""; e.pickSig = ""; },
		}, h("i", { style: `background-image:${art(p.id)}` }))));
	}

	const sig = `${d.layout}|${d.icon}|${d.tint}|${JSON.stringify(s.levels)}`;
	if (sig === d.sig) return;
	d.sig = sig;

	e.slots.forEach((slot, i) => { slot.style.backgroundImage = d.layout[i] ? art(d.layout[i]) : ""; });
	e.preview.style.backgroundImage = art(d.icon);
	e.preview.style.setProperty("--mtint", `var(--${d.tint})`);
	for (const b of e.tints.children) b.classList.toggle("on", b.title === d.tint);

	const r = readout(s, d.layout);
	const rows = [
		["Power", `+${num(r.power)}/tick`],
		["Heat, cold reactor", `${signed(r.heat)}/tick`],
		["Heat, at its limit", `${signed(r.heatHot)}/tick`],
		["Vented inside", `${num(r.vented)}/tick`],
		r.ep ? ["Particles", `+${num(r.ep)}/tick`] : null,
		["Money", `${r.money < 0 ? "-" : "+"}$${num(Math.abs(r.money))}/tick`],
		["Life", r.life ? `${fmt(r.life)} ticks` : "no fuel"],
		["Costs", `$${fmt(r.cost)}`],
		["Casing", `${Math.round(s.casingEff * 100)}%`],
		["Holds", r.failTick ? `fails at tick ${fmt(r.failTick)}` : "yes"],
	].filter(Boolean);
	e.stats.replaceChildren(...rows.flatMap(([k, v]) =>
		[h("dt", { textContent: k }), h("dd", { textContent: v, className: k === "Holds" && r.failTick ? "unstable" : "" })]));
}
