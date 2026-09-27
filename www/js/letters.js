// Letters: with the log book, the one channel story may use (Soul Interview
// 6.3). Optional, never required, never interrupting play: a letter is filed in
// the operator's log with one silent line in the log book, and read or not.
// They arrive as the player climbs, hinting first and answering later: every
// mystery is answered in due time (2.6, 7.7). Like the log, they speak of the
// station and the power, never to the operator. The words are drafts for the
// designer; each has a row in docs/soul-interview.md (7.3).
import { OBJECTIVES } from "./objectives.js";
import { fileEntry } from "./records.js";

const job = (n) => (s) => s.objective >= n;
const LAST = OBJECTIVES.length - 1;

// The mysteries of the Lore Bible (7.7), by key.
export const MYSTERIES = {
	closed: "Why Harrow Station closed",
	scarce: "Why operators are scarce, and the plant stayed cold",
	approval: "Why the approval never comes",
	robots: "Whether the valley's people are people",
	operator: "What the operator is",
	demand: "What the demand is for",
	particles: "What the university wants the particles for",
	nefastium: "What nefastium is",
	crate: "What came in the last crate",
	soviet: "Why a Soviet-built reactor stands in an English valley",
};

// Each letter: who it is from, when it arrives, its lines, what it hints at and
// what it answers. `found` letters were in the plant; `mark` is what the
// envelope showed when it came.
export const LETTERS = [
	{ id: "suspension", from: "Regional Energy Authority", at: job(2), found: "Found in the control-room desk.",
	  hints: ["closed", "approval"],
	  lines: ["Notice of suspension. Harrow Station.",
		"The operator of record has retired. No successor has been approved.",
		"Operation is suspended pending the approval of an operator by the Director of Appointments."] },
	{ id: "vacancy", from: "Situations Vacant, Harrow and District", at: job(5),
	  hints: ["scarce"],
	  lines: ["Operator required. Harrow Station. Immediate start.",
		"Pay above scale. Housing, fuel and every benefit.",
		"This notice has been issued weekly for eleven years. Issue 573. Applications received: 1."] },
	{ id: "drawings", from: "Harrow Supply", at: job(8),
	  hints: ["soviet"],
	  lines: ["Parts for this reactor are made to its original drawings.",
		"The drawings are not in English. Sections 1 to 4 of the operating manual have been translated.",
		"Section 5 onwards has not."] },
	{ id: "queue", from: "Regional Energy Authority", at: job(11),
	  hints: ["approval"],
	  lines: ["Application for approval: operator, Harrow Station.",
		"Received. Position in queue: 1.",
		"Awaiting the Director of Appointments."] },
	{ id: "clock", from: "Harrow Town Clerk", at: job(13),
	  hints: ["robots"],
	  lines: ["The market hall clock runs slow, by the amount the station clock did.",
		"Its keeper has wound it daily for forty-one years, without leave.",
		"He asks which clock is set by which."] },
	{ id: "torch", from: "Harrow Clinic, night ward", at: job(16),
	  hints: ["robots"],
	  lines: ["Machines run overnight: fourteen.",
		"Torch not required since the first of the month."] },
	{ id: "director", from: "Regional Energy Authority", at: job(19),
	  answers: ["approval", "closed", "scarce"],
	  lines: ["Approval of operator, Harrow Station: pending.",
		"The post of Director of Appointments is vacant.",
		"Appointments to that post are made by the Director of Appointments."] },
	{ id: "export", from: "Harrow Supply", at: job(21),
	  answers: ["soviet"],
	  lines: ["This reactor was bought under an export agreement and assembled here from crates.",
		"The other party to the agreement no longer exists.",
		"Parts continue to be made to its drawings."] },
	{ id: "programme", from: "University, Department of Physics", at: job(22),
	  hints: ["particles"],
	  lines: ["An accelerator has been installed at Harrow Station.",
		"Particles are to be collected and dispatched weekly, as set out in the programme.",
		"The programme was set by the Faculty. The Faculty has not met since."] },
	{ id: "continue", from: "University, Department of Physics", at: job(25),
	  mark: "Opened in transit. Resealed by hand.",
	  hints: ["robots"],
	  lines: ["Particles received. Continue."] },
	{ id: "signatures", from: "Harrow Supply", at: job(28),
	  answers: ["nefastium"],
	  lines: ["Nefastium is made at the university's accelerator from the particles sent there. It is not found in nature.",
		"Two signatures are required on receipt: the operator's, and a supervising officer's.",
		"Where no supervising officer is present, the operator signs for both."] },
	{ id: "objective", from: "Packing slip, the last crate", at: job(29), found: "Found in the crate.",
	  answers: ["particles", "crate"],
	  lines: ["Department of Physics programme. Objective: a reactor that runs without an operator.",
		"Contents: first parts of the series. Manual: not required."] },
	{ id: "unregistered", from: "Regional Energy Authority", at: job(LAST),
	  answers: ["operator", "robots"],
	  lines: ["Operator of record, Harrow Station: not approved.",
		"The operator is not a registered unit. Approval applies to registered units only.",
		"No action required."] },
	{ id: "works", from: "Harrow Works", at: (s) => (s.order?.met ?? 0) >= 3,
	  answers: ["demand"],
	  lines: ["Units completed this year: 1,208. Each is issued a task list and a load.",
		"The schedule has not been revised since it was issued.",
		"Increase output."] },
	{ id: "courier", from: "The courier", at: (s) => Boolean(s.records?.complete),
	  hints: ["robots"],
	  lines: ["Nothing to deliver this week.", "Came anyway."] },
];

export const LETTER_BY_ID = new Map(LETTERS.map((l) => [l.id, l]));

/** File every letter now due, in order, each with one line in the log book. */
export function checkLetters(s) {
	if (s.planner || s.sealed) return [];
	const due = LETTERS.filter((l) => !s.letters.includes(l.id) && l.at(s));
	for (const l of due) {
		s.letters.push(l.id);
		fileEntry(s, l.found ? `Letter found: ${l.from}.` : `Letter received: ${l.from}.`);
	}
	return due;
}

/** Opened in the log: read from then on. */
export function readLetter(s, id) {
	if (LETTER_BY_ID.has(id) && !s.lettersRead.includes(id)) s.lettersRead.push(id);
}
