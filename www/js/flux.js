// Time Flux, from Reactor Knockoff: time spent away is banked, not simulated
// behind your back, and spent as speed when you choose. Knockoff ran its
// catch-up with no progress and no way out (issue #23); here the bank is
// always on screen, counts down as it goes, and one tap stops it.

/** Eight hours: enough for a night, not enough to skip the game. */
export const FLUX_CAP = 8 * 60 * 60 * 1000;
/** Ticks per beat while spending: ten times speed. */
export const FLUX_SPEED = 10;
/** Absences shorter than this are just a glance away. */
const NOTICE = 60 * 1000;

/**
 * Bank the time since the game was last seen running. Returns what was banked,
 * in ms, so the caller can say so.
 */
export function bankTime(s, now) {
	const away = s.lastSeen ? Math.max(0, now - s.lastSeen) : 0;
	s.lastSeen = now;
	if (away < NOTICE) return 0;
	const before = s.flux;
	s.flux = Math.min(FLUX_CAP, s.flux + away);
	return s.flux - before;
}

/** How many extra ticks to run this beat, taken out of the bank. */
export function spendFlux(s) {
	if (!s.fluxOn || s.paused) return 0;
	const n = Math.min(FLUX_SPEED - 1, Math.floor(s.flux / s.loopWait));
	s.flux -= n * s.loopWait;
	if (n === 0) s.fluxOn = false;
	return n;
}

/** 7h 5m, 12m 30s, 45s. */
export function span(ms) {
	const sec = Math.floor(ms / 1000);
	const h = Math.floor(sec / 3600);
	const m = Math.floor((sec % 3600) / 60);
	const s = sec % 60;
	return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
}
