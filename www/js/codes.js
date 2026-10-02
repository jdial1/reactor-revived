// Plant codes: every part and every instrument on the desk named twice, as
// the panels in docs/reference-control-panels.md name theirs - a plain name,
// and a code on the label strip beside it. The family first, then the kind and
// its tier: a Basic Heat Vent is CO-V1, a Quad Uranium Cell CL-UR4. Pure: no DOM.

const FAMILY = {
	cell: "CL",
	reflector: "PW", capacitor: "PW",
	vent: "CO", component_vent: "CO", coolant_cell: "CO", condensator: "CO", reactor_plating: "CO",
	heat_exchanger: "TR", heat_inlet: "TR", heat_outlet: "TR", hull_vent: "TR",
	particle_accelerator: "EX",
	module: "MD",
};

const KIND = {
	reflector: "R", capacitor: "C",
	vent: "V", component_vent: "W", coolant_cell: "K", condensator: "D", reactor_plating: "P",
	heat_exchanger: "X", heat_inlet: "I", heat_outlet: "O", hull_vent: "H",
	particle_accelerator: "A", module: "M",
};

/** A part's plant code. */
export function plantCode(p) {
	const family = FAMILY[p.category] ?? "XX";
	if (p.category === "cell") return `${family}-${p.type.slice(0, 2).toUpperCase()}${p.cellCount}`;
	if (p.category === "module") return `${family}-M${String(p.id).replace(/\D/g, "") || "0"}`;
	return `${family}-${KIND[p.category] ?? "?"}${p.level ?? 1}`;
}

/** The desk's instruments and counters, each with its code. */
export const DESK_CODES = {
	power: "JA01", store: "JA02", money: "JC01", heat: "JB01", meter: "JB02",
	sell: "KC01", vent: "KC02", autoSell: "KC03", rebuy: "KC04", operator: "KC05",
	light: "LX01",
};
