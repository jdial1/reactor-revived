// Wiring: the four loops and the handful of actions the UI can trigger.
// The original ran the same four chained setTimeouts; there is nothing wrong
// with that, and it keeps the sim on a fixed 1s beat independent of frame rate.
import { load, save, newState, place, exportSave as saveText, deserialize } from "./state.js";
import { compile, tick, tileAt, remove } from "./sim.js";
import { isPartVisible } from "./parts.js";
import { buy as buyUpgrade, reboot as rebootState } from "./upgrades.js";
import { checkObjectives } from "./objectives.js";
import { buildUI, render, ask, inspect } from "./ui.js";
import { loadPacks } from "./art.js";
import { attachInput } from "./input.js";

// Set when a page change paused the game, so returning can undo exactly that.
let autoPaused = false;

const UI_MS = 100;
const SAVE_MS = 60000;
const OBJECTIVE_MS = 2000;

let s = load();
let dom;

/** Put the selected part on one tile, buying or queueing it. */
function placeAt(r, c) {
	const t = tileAt(s, r, c);
	if (t.id) return;
	if (!isPartVisible(s, s.stats.get(game.selected))) return;
	place(s, r, c, game.selected);
}

/** Take a part off a tile, refunding it if it was paid for. */
function sellAt(r, c) {
	const t = tileAt(s, r, c);
	if (!t.id) return;
	if (t.activated) s.money += s.stats.get(t.id).cost;
	remove(s, t);
	compile(s);
}

const game = {
	selected: "uranium1",

	select(id) {
		game.selected = id;
	},

	// `pack` mirrors the saved setting so the dock can be built before a state
	// exists; changing it rebuilds every sprite on screen.
	get pack() {
		return s.artPack;
	},

	setArtPack(id) {
		s.artPack = id;
		save(s);
		boot();
	},

	// A tap places on empty ground and inspects what is already there.
	onTap(r, c) {
		if (tileAt(s, r, c).id) inspect(s, tileAt(s, r, c), () => sellAt(r, c));
		else placeAt(r, c);
	},

	// A long press sells, the touch equivalent of the original's right-click.
	onHold(r, c) {
		sellAt(r, c);
	},

	// Dragging paints or clears along the stroke.
	onPaint(r, c) {
		if (tileAt(s, r, c).id) sellAt(r, c);
		else placeAt(r, c);
	},

	buy(id) {
		buyUpgrade(s, id);
		compile(s);
	},

	reboot(refund) {
		ask(refund ? "Reboot and refund every Exotic Particle ever earned?" : "Reboot the reactor?", () => {
			rebootState(s, refund);
			compile(s);
		});
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
		autoPaused = false; // an explicit choice outranks the automatic one
	},

	// The reactor only runs while it is being watched. Stepping away to shop or
	// read the goals pauses it; coming back resumes - but only if leaving is
	// what paused it, so a deliberate pause survives a trip to another tab.
	viewing(page) {
		if (page === "reactor") {
			if (!autoPaused) return;
			s.paused = false;
			autoPaused = false;
		} else if (!s.paused) {
			// Only latch on the way out of a running game. Walking from one
			// page to another must not re-decide it, or the second hop reads
			// its own pause as deliberate and the reactor never restarts.
			s.paused = true;
			autoPaused = true;
		}
	},

	// Android owns the file picker; the game only hands over or receives text.
	get canTransfer() {
		return typeof Android !== "undefined";
	},

	exportSave() {
		Android.exportSave(saveText(s));
	},

	importSave() {
		Android.importSave();
	},

	wipe() {
		ask("Delete your save and start over?", () => {
			s = newState();
			save(s);
			boot();
		});
	},
};

function boot() {
	dom = buildUI(game);
	// render() builds the grid itself the first time it sees a size mismatch.
	render(dom, s, game);
	attachInput(dom.board, dom.grid, game);
}

// The reactor's own beat. Reschedules itself because Improved Chronometers
// changes the interval.
function gameLoop() {
	if (!s.paused) tick(s);
	setTimeout(gameLoop, s.loopWait);
}

await loadPacks();
boot();
gameLoop();
setInterval(() => render(dom, s, game), UI_MS);
setInterval(() => checkObjectives(s), OBJECTIVE_MS);
setInterval(() => save(s), SAVE_MS);

// Called by the Android side once the player has picked a file to load.
window.importSave = (json) => {
	try {
		s = deserialize(JSON.parse(json));
	} catch {
		return; // not one of ours; leave the running game alone
	}
	save(s);
	boot();
};

// Saving on the way out matters more on a phone than in a browser tab: Android
// can kill the process without warning once the app is backgrounded.
addEventListener("visibilitychange", () => {
	if (document.visibilityState === "hidden") save(s);
});
