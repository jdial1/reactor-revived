// Wiring: the loops, and the actions the UI can trigger.
import { load, save, newState, place, exportSave as saveText, deserialize } from "./state.js";
import { compile, tick, tileAt, remove, activeTiles, sellValue } from "./sim.js";
import { isPartVisible } from "./parts.js";
import { buy as buyUpgrade, reboot as rebootState } from "./upgrades.js";
import { checkObjectives, OBJECTIVES } from "./objectives.js";
import { buildUI, render, ask, inspect, flash, toast, goalMet } from "./ui.js";
import { attachInput } from "./input.js";
import { saveModule, deleteModule, modId } from "./module.js";
import { play, setMuted } from "./audio.js";
import { startTutorial, renderTutorial } from "./tutorial.js";

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
	play("place");
}

/** Take a part off a tile, refunding whatever life is left in it. */
function sellTile(t) {
	if (!t.id) return;
	s.money += sellValue(s, t);
	remove(s, t);
	play("sell");
}

function sellAt(r, c) {
	sellTile(tileAt(s, r, c));
	compile(s);
}

/** Clear every tile the test matches, recompiling once at the end. */
function sellEvery(match) {
	for (const t of activeTiles(s)) if (t.id && match(t)) sellTile(t);
	compile(s);
}

const game = {
	selected: "uranium1",

	select(id) {
		game.selected = id;
	},

	// A tap places on empty ground and inspects what is already there.
	onTap(r, c) {
		const t = tileAt(s, r, c);
		if (!t.id) return placeAt(r, c);
		// Hold the id, not the tile: selling clears t.id mid-scan.
		const kind = t.id;
		inspect(s, t, {
			sell: () => sellAt(r, c),
			sellKind: () => sellEvery((x) => x.id === kind),
			sellAll: () => sellEvery(() => true),
		});
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
		const row = dom.upgradeRows.find((r) => r.u.id === id);
		if (!buyUpgrade(s, id)) {
			// It used to say nothing at all, which reads as a tap that missed.
			flash(row?.button, "denied");
			play("deny");
			return;
		}
		compile(s);
		play("buy");
	},

	reboot(refund) {
		ask(refund ? "Reboot and refund every Exotic Particle ever earned?" : "Reboot the reactor?", () => {
			rebootState(s, refund);
			compile(s);
		});
	},

	sellAll() {
		if (s.power <= 0) return;         // nothing to sell; do not flash a lie
		s.money += s.power;
		s.power = 0;
		s.soldPower = true;
		play("coin");
	},

	ventHeat() {
		if (s.heat <= 0) return;
		const shed = Math.min(s.heat, s.manualHeatReduce);
		s.heat -= shed;
		if (s.heat === 0) s.soldHeat = true;
		play("vent");
	},

	// The board is empty, so there is nothing left making heat to watch cool.
	clearMeltdown() {
		s.hasMeltedDown = false;
		s.heat = 0;
		compile(s);
	},

	togglePause() {
		s.paused = !s.paused;
		autoPaused = false; // an explicit choice outranks the automatic one
	},

	// Leaving the reactor pauses it, coming back resumes - but only if leaving is
	// what paused it, so a deliberate pause survives a trip to another tab.
	viewing(page) {
		if (page === "reactor") {
			if (!autoPaused) return;
			s.paused = false;
			autoPaused = false;
		} else if (!s.paused) {
			// Latch only on the way out of a running game, or the second hop reads
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

	toggleSound() {
		s.muted = !s.muted;
		setMuted(s.muted);
		if (!s.muted) play("place");   // hear what you just turned on
	},

	get muted() {
		return Boolean(s.muted);
	},

	startTutorial,

	get state() {
		return s;
	},

	saveModule(design) {
		const m = saveModule(s, design);
		game.selected = modId(m);
		play("buy");
	},

	deleteModule(m) {
		if (!deleteModule(s, m)) return;
		if (game.selected === modId(m)) game.selected = "uranium1";
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
	setMuted(s.muted);
	dom = buildUI(game);
	// render() builds the grid itself the first time it sees a size mismatch.
	render(dom, s, game);
	attachInput(dom.board, dom.grid, game);
	if (!s.tutorialDone) startTutorial();
}

// The reactor's own beat. Reschedules itself because Improved Chronometers
// changes the interval.
function gameLoop() {
	if (!s.paused) tick(s);
	setTimeout(gameLoop, s.loopWait);
}

boot();
gameLoop();
setInterval(() => {
	render(dom, s, game);
	renderTutorial(s);
}, UI_MS);
setInterval(() => {
	// The goal that is about to be met, captured before the counter moves on.
	const done = OBJECTIVES[s.objective];
	if (checkObjectives(s)) goalMet(dom, done.title);
}, OBJECTIVE_MS);
setInterval(() => save(s), SAVE_MS);

// Android calls these back when the picker has actually done something, so the
// confirmation is the file existing rather than the button being pressed.
window.saved = () => toast("Save exported", "options");

// Called by the Android side once the player has picked a file to load.
window.importSave = (json) => {
	try {
		s = deserialize(JSON.parse(json));
	} catch {
		return; // not one of ours; leave the running game alone
	}
	save(s);
	boot();
	toast("Save imported", "options");
};

// Android can kill the process without warning once backgrounded.
addEventListener("visibilitychange", () => {
	if (document.visibilityState === "hidden") save(s);
});
