// The station file: the log's orders and the letters, in one sequence, as they
// came (Soul Interview 6.3: story only in letters and the log). Each order is a
// document with a sender, and the senders are the letters' own institutions, so
// the jobs and the story are one correspondence. The documents drift with the
// log's voice (3.2, 3.4): pages of the translated manual for the first ten jobs
// (the `drawings` letter says only sections 1 to 4 were translated), work
// orders from the valley for the next ten, then demands nobody signs. The
// standing order is unsigned too, until the `works` letter says who it is for.
// Pure: no DOM.
import { OBJECTIVES, goalAt } from "./objectives.js";
import { LETTERS, LETTER_BY_ID, letterWaiting, fileLetter } from "./letters.js";
import { NOTES } from "./notes.js";
import { fmt } from "./fmt.js";

const LAST = OBJECTIVES.length - 1;
const NOT_STATED = "From: not stated";

// Who issued work orders 11 to 20 (jobs 10-19), from what each asks for.
const WORK_ORDER_FROM = [
	"Harrow Clinic",              // clinic load, overnight
	"Regional Energy Authority",  // the station clock
	"Regional Energy Authority",  // inspection due
	"Harrow Town Clerk",          // winter reserve
	"Harrow Rail Yard",           // replacing diesel
	"Harrow Supply",              // uranium stock
	"Harrow Co-operative",        // co-op load
	"Regional Energy Authority",  // a second valley on the grid
	"Harrow Town Clerk",          // houses on candles
	"Harrow Supply",              // thorium delivery
];

const no = (i) => String(i + 1).padStart(2, "0");

/**
 * What kind of document job `i` is: its heading, the line under it (where it
 * came from), and the word stamped on it once done.
 */
export function docket(i) {
	if (i < 10) return { kind: "manual", head: "Operating manual", byline: "Translated", stamp: "Confirmed" };
	if (i < 20) return { kind: "order", head: `Work order ${no(i)}`, byline: `From: ${WORK_ORDER_FROM[i - 10]}`, stamp: "Supplied" };
	if (i < LAST) return { kind: "demand", head: `Demand ${no(i)}`, byline: NOT_STATED, stamp: "Supplied" };
	return { kind: "notice", head: "Notice", byline: NOT_STATED, stamp: "" };
}

/** The standing order's sender: unsigned until the `works` letter has come. */
export const standingByline = (s) => ((s.letters ?? []).includes("works") ? "From: Harrow Works" : NOT_STATED);

/**
 * The file as it stands, oldest first. Each item is `{ key, at }`: `at` is the
 * job it belongs to, so the log can fold everything before the current one. A
 * letter sits just before the order it came with; letters after the log is
 * finished follow the standing order, and the notice of completion comes
 * before the courier, who only comes once everything is done.
 */
export function storyFile(s) {
	const now = Math.min(s.objective, LAST);
	const got = s.letters ?? [];
	const items = [];
	const notes = s.fieldNotes ?? [];
	// Only orders off the printer are in the file.
	const last = Math.min(s.shown ?? now, now);
	for (let i = 0; i <= last; i++) {
		for (const l of LETTERS) if (l.job === i && got.includes(l.id)) items.push({ key: `letter:${l.id}`, at: i });
		for (const n of notes) if (Math.min(n.at, last) === i) items.push({ key: `note:${n.id}`, at: i });
		items.push({ key: `job:${i}`, at: i });
	}
	if (s.order) items.push({ key: "standing", at: LAST });
	const late = got.filter((id) => LETTERS.find((l) => l.id === id)?.job === undefined);
	for (const id of late) {
		if (id === "courier" && s.records?.complete) items.push({ key: "complete", at: LAST });
		items.push({ key: `letter:${id}`, at: LAST });
	}
	if (s.records?.complete && !late.includes("courier")) items.push({ key: "complete", at: LAST });
	return items;
}

// ---- the printer --------------------------------------------------------------
// Everything new reaches the log through the station's printer: the next order
// once the last is signed off, the next letter once the last is opened, the
// next field note once the last is signed off. One thing waits at a time on
// each, orders first; the delay and the printing itself are the interface's
// (printer-ui.js). Nothing prints in the planner.

/** What the printer has waiting, orders first. */
export function waiting(s) {
	if (s.planner || s.sealed) return [];
	const out = [];
	if (s.shown < s.objective && s.objective <= LAST) out.push({ channel: "order", id: s.objective });
	const letter = letterWaiting(s);
	if (letter) out.push({ channel: "letter", id: letter.id });
	const notes = s.fieldNotes ?? [];
	if (s.notesDue?.length && notes.every((n) => n.claimed)) out.push({ channel: "note", id: s.notesDue[0] });
	return out;
}

/** Off the printer and into the log. */
export function fileItem(s, { channel, id }) {
	if (channel === "order") s.shown = Math.max(s.shown, id);
	else if (channel === "letter") fileLetter(s, id);
	else if (channel === "note" && s.notesDue.includes(id)) {
		s.notesDue = s.notesDue.filter((x) => x !== id);
		s.fieldNotes.push({ id, at: Math.min(s.objective, LAST) });
	}
}

/** What the printer prints: a heading, the line under it, and the body. */
export function printout(s, { channel, id }) {
	if (channel === "order") {
		const d = docket(id);
		const o = goalAt(s, id);
		const pay = o.reward ? `Payment: $${fmt(o.reward)}` : o.epReward ? `Payment: ${fmt(o.epReward)} EP` : "";
		return { head: d.head, byline: d.byline, lines: [o.title, o.note, pay].filter(Boolean) };
	}
	if (channel === "letter") {
		const l = LETTER_BY_ID.get(id);
		return { head: "Letter", byline: `From: ${l.from}`, lines: [l.found, l.mark, ...l.lines].filter(Boolean) };
	}
	const [who, , text] = NOTES[id];
	return { head: "Field note", byline: who, lines: [text] };
}
