// Everything, done: the log finished, every part on issue, every upgrade at its
// rating, and every tile of the reactor filled (Soul Interview 1.3). The content
// ends there; the demand does not (6.3). Pure: no DOM.
import { OBJECTIVES } from "./objectives.js";
import { PARTS, isPartVisible } from "./parts.js";
import { UPGRADES, maxLevel } from "./upgrades.js";

/** What is still short of everything, as plain words; empty when complete. */
export function outstanding(s) {
	const short = [];
	if (s.objective < OBJECTIVES.length - 1) short.push("jobs on the log");
	if (PARTS.some((p) => !isPartVisible(s, s.stats.get(p.id) ?? p))) short.push("parts not yet on issue");
	if (UPGRADES.some((u) => (s.levels[u.id] ?? 0) < maxLevel(u))) short.push("upgrades below their rating");
	if (s.tiles.some((t) => !t.id || !t.activated)) short.push("empty tiles");
	return short;
}

export const isComplete = (s) => outstanding(s).length === 0;

/** Filed once, in the log book, when everything is first complete. */
export const COMPLETE_ENTRY = "All listed loads supplied. All parts on issue. All systems at full rating. Demand continues.";
