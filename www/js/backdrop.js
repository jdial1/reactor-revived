// The valley outside the control room: one painting per season, made for
// Reactor Revival in the manner of Simon Stålenhag. Operator time is the
// player's time, so the season is the calendar's and night is the clock's:
// by day the light comes through the fog, by night only the room's own lamps.
const SEASONS = ["winter", "winter", "spring", "spring", "spring", "summer",
	"summer", "summer", "autumn", "autumn", "autumn", "winter"];

/** Which painting, and whether it is night, at a moment. */
export function backdropFor(date) {
	const hour = date.getHours();
	return { src: `backdrops/${SEASONS[date.getMonth()]}.webp`, night: hour < 7 || hour >= 19 };
}
