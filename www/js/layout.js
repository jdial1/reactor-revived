// Layout codes: a whole board as a line of text, the way IC2 planner links let
// players pass designs around. A code carries every module design its board
// uses, so it builds the same reactor in anyone's game.
import { tileAt } from "./sim.js";
import { place } from "./state.js";
import { isPartVisible } from "./parts.js";
import { modId, moduleOf, saveModule } from "./module.js";

const PREFIX = "RR1.";

// Text to base64 and back, UTF-8 safe: module names are the player's own.
const pack = (text) => btoa(String.fromCharCode(...new TextEncoder().encode(text)));
const unpack = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));

/** Every design a set of part ids needs, inner ones first. */
function designsFor(s, ids, into = []) {
	for (const id of ids) {
		const m = id && moduleOf(s, id);
		if (!m || into.includes(m)) continue;
		designsFor(s, m.layout, into);
		into.push(m);
	}
	return into;
}

/** The board as data: [tile index, part id] per tile, and the designs it uses. */
export function layoutOf(s) {
	const tiles = s.tiles.map((t, i) => [i, t.id]).filter(([, id]) => id);
	const modules = designsFor(s, tiles.map(([, id]) => id))
		.map(({ id, name, icon, tint, layout }) => ({ id, name, icon, tint, layout }));
	return { tiles, modules };
}

export const layoutCode = (s) => PREFIX + pack(JSON.stringify(layoutOf(s)));

/** A layout from a code, or null if it is not one. */
export function readLayout(code) {
	const text = String(code ?? "").trim();
	if (!text.startsWith(PREFIX)) return null;
	try {
		const layout = JSON.parse(unpack(text.slice(PREFIX.length)));
		return Array.isArray(layout?.tiles) && Array.isArray(layout?.modules) ? layout : null;
	} catch {
		return null;
	}
}

const sameDesign = (a, b) => a.name === b.name && a.icon === b.icon && a.tint === b.tint
	&& a.layout.every((id, i) => id === b.layout[i]);

/**
 * Build a layout onto a board. Only empty tiles are filled - nothing already
 * standing is sold to make room. A part the player cannot afford queues, as a
 * placed part always does; one they have not unlocked is left out.
 */
export function applyLayout(s, layout) {
	// Designs come in with their own ids; reuse an identical one, save the rest.
	const ids = new Map();
	for (const d of layout.modules) {
		const inner = d.layout.map((id) => (id && ids.get(id)) || id);
		const design = { ...d, layout: inner };
		const have = s.modules.find((m) => sameDesign(m, design));
		ids.set(`mod:${d.id}`, modId(have ?? saveModule(s, design)));
	}

	const result = { placed: 0, queued: 0, taken: 0, locked: 0 };
	for (const [i, raw] of layout.tiles) {
		const id = ids.get(raw) ?? raw;
		const t = s.tiles[i];
		if (!t) continue;
		if (t.id) {
			if (t.id !== id) result.taken++;
			continue;
		}
		const p = s.stats.get(id);
		if (!p || !isPartVisible(s, p)) {
			result.locked++;
			continue;
		}
		place(s, t.r, t.c, id);
		result[tileAt(s, t.r, t.c).activated ? "placed" : "queued"]++;
	}
	return result;
}

/** What building a layout did, in one line. */
export const describe = (r) => [
	r.placed && `${r.placed} placed`,
	r.queued && `${r.queued} waiting for money`,
	r.locked && `${r.locked} not unlocked yet`,
	r.taken && `${r.taken} tiles already taken`,
].filter(Boolean).join(", ") || "Nothing to build - the board already matches";
