// Sound. Six impacts on <audio> elements, and one hum on Web Audio, because
// only Web Audio loops without a gap and bends pitch smoothly.
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
let hot = 0;

const voiceFor = (file) => (voices[file] ??= {
	turn: 0,
	els: [0, 1].map(() => new Audio(`audio/${file}.ogg`)),
});

/** Called by the renderer; the sim never knows about any of this. */
export const setMuted = (muted) => { on = !muted; };

export function play(cue, pitch = 1) {
	const found = CUES[cue];
	// A backgrounded tab should be silent even before Android pauses it.
	if (!on || !found || typeof Audio === "undefined" || document.hidden) return;
	const [file, rate, gain] = found;
	const voice = voiceFor(file);
	const el = voice.els[voice.turn];
	voice.turn ^= 1;
	el.currentTime = 0;
	el.playbackRate = rate * pitch;
	// Heat takes the room: the hotter the reactor, the less the rest is heard.
	el.volume = gain * (1 - 0.6 * hot);
	// Before the first tap a browser refuses to play at all; there is nothing
	// to do about it and nothing worth saying.
	el.play().catch(() => {});
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
