// Wiring: the four loops and the handful of actions the UI can trigger.
// The original ran the same four chained setTimeouts; there is nothing wrong
// with that, and it keeps the sim on a fixed 1s beat independent of frame rate.
import { load, save, newState, place } from "./state.js";
import { compile, tick, tileAt, remove } from "./sim.js";
import { buy as buyUpgrade, reboot as rebootState } from "./upgrades.js";
import { checkObjectives } from "./objectives.js";
import { buildUI, buildGrid, render } from "./ui.js";

const UI_MS = 100;
const SAVE_MS = 60000;
const OBJECTIVE_MS = 2000;

let s = load();
let dom;

const game = {
	selected: "uranium1",

	select(id) {
		game.selected = id;
	},

	onTile(r, c) {
		const t = tileAt(s, r, c);
		// Tapping an occupied tile sells it; tapping an empty one places the
		// selected part. Phase 4 replaces this with the full gesture set.
		if (t.id) {
			const p = s.stats.get(t.id);
			if (p && t.activated) s.money += p.cost;
			remove(s, t);
			compile(s);
		} else {
			const p = s.stats.get(game.selected);
			if (p.requires && !s.levels[p.requires]) return;
			place(s, r, c, game.selected);
		}
	},

	buy(id) {
		buyUpgrade(s, id);
		compile(s);
	},

	reboot(refund) {
		if (!confirm(refund ? "Reboot and refund every Exotic Particle ever earned?" : "Reboot the reactor?")) return;
		rebootState(s, refund);
		compile(s);
	},

	sellAll() {
		s.money += s.power;
		s.power = 0;
		s.soldPower = true;
	},

	ventHeat() {
		s.heat = Math.max(0, s.heat - s.manualHeatReduce);
		if (s.heat === 0) s.soldHeat = true;
	},

	togglePause() {
		s.paused = !s.paused;
	},

	wipe() {
		if (!confirm("Delete your save and start over?")) return;
		s = newState();
		save(s);
		boot();
	},
};

function boot() {
	dom = buildUI(game);
	buildGrid(dom, s, game.onTile);
	render(dom, s, game);
}

// The reactor's own beat. Reschedules itself because Improved Chronometers
// changes the interval.
function gameLoop() {
	if (!s.paused) tick(s);
	setTimeout(gameLoop, s.loopWait);
}

boot();
gameLoop();
setInterval(() => render(dom, s, game), UI_MS);
setInterval(() => checkObjectives(s), OBJECTIVE_MS);
setInterval(() => save(s), SAVE_MS);

// Saving on the way out matters more on a phone than in a browser tab: Android
// can kill the process without warning once the app is backgrounded.
addEventListener("visibilitychange", () => {
	if (document.visibilityState === "hidden") save(s);
});
