// Sound. Impacts on <audio> elements, and one hum on Web Audio, because only
// Web Audio loops without a gap and bends pitch smoothly.
//
// The impacts from Kenney's pack were picked for depth - how much of their
// energy survives a 220Hz low-pass - and on a desk speaker they are deep. A
// phone plays next to nothing under 300 Hz, so on a phone what is left of an
// impact is its edge. The old coin, on the sell bar - the most-pressed control
// in the game - was clunky: nine-tenths of its weight under 250 Hz, four or five
// hits in a row with the key's click ahead of it, and bright and loud on a phone.
// It is now one light mallet note (tools/synth_sounds.py), a single round hit
// where a phone speaker plays, and the buy clack a drier wooden tok. Graded
// through a model of a phone's speaker, both were an F and are an A (README,
// Sound).
//
// A cue is one file or a family. A family is cycled - every variant once, in a
// shuffled order, never the same one twice running - and every play is nudged
// a little in pitch and level, so a run of taps is a run of different toks
// rather than one sound repeated. A cue can play slower: a lower rate is a
// bigger, longer version of the same impact. Nothing that is only filed in the
// log makes a sound.
const family = (name, n) => Array.from({ length: n }, (_, i) => `${name}-${i + 1}.wav`);

const CUES = {
	place: ["place.ogg", 1, 0.55],
	sell: ["sell.ogg", 1, 0.5],
	// The sell bar, and an order signed off: one light mallet note on a wooden
	// bar, six of them on a pentatonic scale.
	coin: [family("tally", 6), 1, 0.3],
	vent: ["vent.ogg", 0.92, 0.5],
	// The plant computer's clack: a heavier key going home, four of them.
	buy: [family("key", 4), 1, 0.5],
	boom: ["boom.ogg", 0.8, 0.9],
	// The first stage of a key on the plant computer: the place impact, played
	// fast and quiet, is a short click before the clack (Soul Interview 5.5).
	click: ["place.ogg", 1.9, 0.22],
	// The printer's head: the same impact, very fast and very quiet, over and
	// over, is a dot-matrix chatter.
	print: ["place.ogg", 3.4, 0.07],
};

// How far a play may drift: three percent in pitch, and up to 1.5 dB quieter.
const DRIFT = 0.03;
const SOFTEN = 0.84;

const filesOf = ([file]) => (Array.isArray(file) ? file : [file]);
export const FILES = [...new Set(Object.values(CUES).flatMap(filesOf))];

// Two elements per file, alternating: placing a row of parts quickly should
// sound like a row of parts, not like one clipped thud. Per cue, not per file:
// the click is the place impact played fast, and must not cut off the clack
// that follows it. Built on first use, so importing this module outside a
// browser - the tests do - costs nothing.
const voices = {};
let on = true;
let hot = 0;

const voiceFor = (cue, file) => (voices[`${cue}:${file}`] ??= {
	turn: 0,
	els: [0, 1].map(() => new Audio(`audio/${file}`)),
});

// Each family's place in its cycle: a shuffled order, and how far through it.
const cycles = {};

/** The next variant of a cue: every one once per round, never one twice running. */
export function nextVariant(cue, random = Math.random) {
	const files = filesOf(CUES[cue]);
	if (files.length === 1) return files[0];
	const c = (cycles[cue] ??= { order: [], at: 0, last: null });
	if (c.at >= c.order.length) {
		c.order = files.map((f) => [random(), f]).sort((a, b) => a[0] - b[0]).map(([, f]) => f);
		// A new round never opens with the sound that closed the last one.
		if (c.order[0] === c.last) c.order.push(c.order.shift());
		c.at = 0;
	}
	c.last = c.order[c.at++];
	return c.last;
}

/** Called by the renderer; the sim never knows about any of this. */
export const setMuted = (muted) => { on = !muted; };

export function play(cue, pitch = 1) {
	const found = CUES[cue];
	// A backgrounded tab should be silent even before Android pauses it.
	if (!on || !found || typeof Audio === "undefined" || document.hidden) return;
	const [, rate, gain] = found;
	const voice = voiceFor(cue, nextVariant(cue));
	const el = voice.els[voice.turn];
	voice.turn ^= 1;
	el.currentTime = 0;
	el.playbackRate = rate * pitch * (1 + (Math.random() * 2 - 1) * DRIFT);
	// Heat takes the room: the hotter the reactor, the less the rest is heard.
	el.volume = gain * (SOFTEN + Math.random() * (1 - SOFTEN)) * (1 - 0.6 * hot);
	// Before the first tap a browser refuses to play at all; there is nothing
	// to do about it and nothing worth saying.
	el.play().catch(() => {});
}

/** A key pressed through: a click, then the cue as its clack. One tap, two stages. */
export function press(cue) {
	play("click");
	setTimeout(() => play(cue), 70);
}

// The machine's own voice: a loop that climbs in pitch and loudness with heat.
// Needs a gesture before a browser will start it, so it is built on the first.
let ctx = null;
let hum = null;

async function wake() {
	if (ctx || typeof AudioContext === "undefined") return;
	ctx = new AudioContext();
	const gain = ctx.createGain();
	gain.gain.value = 0;
	gain.connect(ctx.destination);
	// A slow tremor on the hum, as deep as the heat is climbing: a board in
	// balance hums steady, one building toward failure beats.
	const lfo = ctx.createOscillator();
	const depth = ctx.createGain();
	lfo.frequency.value = 2.5;
	depth.gain.value = 0;
	lfo.connect(depth).connect(gain.gain);
	lfo.start();
	hum = { gain, depth, src: null };
	try {
		const buf = await ctx.decodeAudioData(await (await fetch("audio/hum.webm")).arrayBuffer());
		const src = ctx.createBufferSource();
		src.buffer = buf;
		src.loop = true;
		src.connect(gain);
		src.start();
		hum.src = src;
	} catch { /* no hum is a quieter game, not a broken one */ }
}
if (typeof addEventListener === "function") addEventListener("pointerdown", wake, { once: true });

/**
 * Heat as a fraction of maximum, whether the reactor is running at all, and how
 * much of late the heat has been climbing (0 to 1).
 */
export function setHeat(f, running, rising = 0, held = false) {
	hot = Math.min(1, Math.max(0, f));
	if (!hum?.src) return;
	if (ctx.state === "suspended") ctx.resume().catch(() => {});
	const live = on && running && !document.hidden;
	const t = ctx.currentTime;
	// A board that has earned Mark I settles to a lower, quieter drone.
	const level = live ? (0.12 + 0.3 * hot) * (held ? 0.7 : 1) : 0;
	hum.gain.gain.setTargetAtTime(level, t, 0.4);
	hum.depth.gain.setTargetAtTime(level * 0.6 * Math.min(1, Math.max(0, rising)), t, 0.8);
	hum.src.playbackRate.setTargetAtTime((0.75 + 0.55 * hot + 0.2 * Math.max(0, Math.min(f, 2) - 1)) * (held ? 0.94 : 1), t, 0.6);
}
