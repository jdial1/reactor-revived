// The valley outside the control room: one painting per season by day, made
// for Reactor Revival in the manner of Simon Stålenhag, and one per season by
// night, the designer's night set of the plant with only its windows lit
// (docs/asset-packs.md, pack 5). Operator time is the player's time, so the
// season is the calendar's and night is the clock's.
const SEASONS = ["winter", "winter", "spring", "spring", "spring", "summer",
	"summer", "summer", "autumn", "autumn", "autumn", "winter"];

/** Which painting, and whether it is night, at a moment. */
export function backdropFor(date) {
	const hour = date.getHours();
	const night = hour < 7 || hour >= 19;
	return { src: `backdrops/${SEASONS[date.getMonth()]}${night ? "-night" : ""}.webp`, night };
}
