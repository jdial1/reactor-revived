// Sound. Six files, no library, no Web Audio graph - an <audio> element per
// voice, which is all a game that plays one thud at a time needs.
//
// Everything here is a dull, low impact rather than a click or a chime: the
// sounds were picked by measuring, not by name. Each candidate was decoded and
// scored on how much of its energy survives a 220Hz low-pass and how often it
// crosses zero, and the ones that won are heavy and dull - Kenney's bells and
// beeps score bright and are not here.
//
// Some cues are one file played slower. A lower rate is a bigger, longer
// version of the same impact, which is cheaper than shipping another file and
// keeps the set sounding related.
const CUES = {
	place: ["place", 1, 0.55],
	unlock: ["place", 0.78, 0.7],
	sell: ["sell", 1, 0.5],
	deny: ["sell", 0.72, 0.35],
	coin: ["coin", 1, 0.5],
	vent: ["vent", 0.92, 0.5],
	buy: ["buy", 1, 0.55],
	goal: ["buy", 0.82, 0.7],
	boom: ["boom", 0.8, 0.9],
};

export const FILES = [...new Set(Object.values(CUES).map(([file]) => file))];

// Two elements per file, alternating: placing a row of parts quickly should
// sound like a row of parts, not like one clipped thud. Built on first use, so
// importing this module outside a browser - the tests do - costs nothing.
const voices = {};
let on = true;

const voiceFor = (file) => (voices[file] ??= {
	turn: 0,
	els: [0, 1].map(() => new Audio(`audio/${file}.ogg`)),
});

/** Called by the renderer; the sim never knows about any of this. */
export const setMuted = (muted) => { on = !muted; };

export function play(cue) {
	const found = CUES[cue];
	// A backgrounded tab should be silent even before Android pauses it.
	if (!on || !found || typeof Audio === "undefined" || document.hidden) return;
	const [file, rate, gain] = found;
	const voice = voiceFor(file);
	const el = voice.els[voice.turn];
	voice.turn ^= 1;
	el.currentTime = 0;
	el.playbackRate = rate;
	el.volume = gain;
	// Before the first tap a browser refuses to play at all; there is nothing
	// to do about it and nothing worth saying.
	el.play().catch(() => {});
}
