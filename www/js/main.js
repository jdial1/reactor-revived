// Wiring: the loops, and the actions the UI can trigger.
import { load, save, newState, place, exportSave as saveText, deserialize, serialize, isSave } from "./state.js";
import { compile, tick, tileAt, remove, activeTiles, sellValue } from "./sim.js";
import { isPartVisible } from "./parts.js";
import { buy as buyUpgrade, reboot as rebootState, applyUpgrades } from "./upgrades.js";
import { checkObjectives, OBJECTIVES } from "./objectives.js";
import { buildUI, render, ask, inspect, flash, toast, goalMet, rebootDialog } from "./ui.js";
import { toolsAllowed } from "./records.js";
import { fmt } from "./fmt.js";
import { attachInput } from "./input.js";
import { saveModule, deleteModule, modId } from "./module.js";
import { layoutCode, readLayout, applyLayout, describe, layoutOf } from "./layout.js";
import { bankTime, spendFlux, span } from "./flux.js";
import { takeSnapshot, layoutOfSnapshot } from "./snapshots.js";
import { replaceAll } from "./layout.js";
import { play, setMuted } from "./audio.js";
import { startTutorial, renderTutorial } from "./tutorial.js";

// Set when a page change paused the game, so returning can undo exactly that.
let autoPaused = false;

const UI_MS = 100;
const SAVE_MS = 60000;
const OBJECTIVE_MS = 2000;

let s = load();
let dom;
// While planning, `s` is a free copy of the board and this is the real game.
let real = null;
let coldTaps = 0;
const theGame = () => real ?? s;

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
			game,
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

	// A reboot can take a rule for the run it starts: nothing carries over but
	// the rule's name on the goal line and a record if the run is fast.
	reboot(refund) {
		rebootDialog(refund, (restriction) => {
			rebootState(s, refund, restriction);
			compile(s);
		});
	},

	sellAll() {
		if (s.power <= 0) return;         // nothing to sell; do not flash a lie
		s.money += s.power * s.sellMul;
		s.power = 0;
		s.soldPower = true;
		play("coin");
	},

	ventHeat() {
		if (s.heat <= 0) {
			// Ten taps on a cold reactor earn a word about it.
			coldTaps++;
			if (coldTaps === 10) toast("It is already cold.", "heat");
			return;
		}
		coldTaps = 0;
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

	/** Put one side of a bought doctrine set in force. Free, any time. */
	pickDoctrine(id, side) {
		if (!(s.levels[id] > 0)) return;
		s.doctrines[id] = side;
		applyUpgrades(s);
		compile(s);
		play("place");
	},

	toggleFlux() {
		s.fluxOn = !s.fluxOn && s.flux >= s.loopWait;
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

	layoutCode: () => layoutCode(s),

	replaceAll(from, to) {
		if (!replaceAll(s, from, to)) return;
		play("buy");
		toast(`Replaced with ${s.stats.get(to).title}`, "reactor");
	},

	rebuildSnapshot(snap) {
		if (!toolsAllowed(s)) return;
		toast(describe(applyLayout(s, layoutOfSnapshot(snap))), "reactor");
		play("place");
	},


	// A copy of the board where everything is free and nothing is kept. Money
	// is infinite, goals do not count, and saves keep writing the real game.
	// With a layout (an example, say) the copy starts from that instead of the
	// board. As a click handler it gets an event, which is not a layout.
	startPlanner(layout) {
		if (real || !toolsAllowed(s)) return;
		const plan = layout?.tiles ? layout : null;
		real = s;
		s = deserialize(serialize(real));
		if (plan) for (const t of s.tiles) if (t.id) remove(s, t);
		s.planner = true;
		s.money = Infinity;
		// Spent parts rebuy themselves, so a plan keeps its shape while it runs.
		s.perpetual = new Set([...s.stats.values()].map((p) => (p.category === "cell" ? p.type : p.category)));
		s.paused = false;
		if (plan) applyLayout(s, plan);
		boot();
	},

	buildPlan() {
		if (!real) return;
		const plan = layoutOf(s);
		s = real;
		real = null;
		const said = describe(applyLayout(s, plan));
		boot();
		play("place");
		toast(said, "reactor");
	},

	discardPlan() {
		if (!real) return;
		s = real;
		real = null;
		boot();
	},

	/** Build a pasted code onto the board; null when it is not a code. */
	buildLayout(code) {
		if (!toolsAllowed(s)) return "Not in a hardcore run - the real board is the only board";
		const layout = readLayout(code);
		if (!layout) return null;
		const said = describe(applyLayout(s, layout));
		play("place");
		return said;
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
// Nothing runs while the game is out of sight: that time is banked as Time Flux
// instead, and spent at ten times speed when the player turns it on.
function gameLoop() {
	if (!document.hidden) {
		if (!s.paused) {
			tick(s);
			for (let n = spendFlux(s); n > 0; n--) tick(s);
		}
		theGame().lastSeen = Date.now();
	}
	setTimeout(gameLoop, s.loopWait);
}

/** Bank the time away, and say so if there was any. */
function welcomeBack() {
	const banked = bankTime(theGame(), Date.now());
	if (banked) toast(`Away ${span(banked)} - banked as Time Flux`, "flux");
}

boot();
welcomeBack();
gameLoop();
setInterval(() => {
	render(dom, s, game);
	renderTutorial(s);
}, UI_MS);
setInterval(() => {
	// The goal that is about to be met, captured before the counter moves on.
	const done = OBJECTIVES[s.objective];
	if (!s.planner && checkObjectives(s)) {
		goalMet(dom, done.title);
		// A save state for the job just done, to come back to from the log.
		takeSnapshot(s, s.objective - 1);
	}
}, OBJECTIVE_MS);
setInterval(() => save(theGame()), SAVE_MS);

// Android calls these back when the picker has actually done something, so the
// confirmation is the file existing rather than the button being pressed.
window.saved = () => toast("Save exported", "options");

// Called by the Android side once the player has picked a file to load. A file
// that is not a save we can read is refused, and one that is still asks first:
// importing replaces the game in front of you.
window.importSave = (json) => {
	let saved = null;
	try {
		saved = JSON.parse(json);
	} catch {
		// not JSON at all
	}
	if (!isSave(saved)) {
		toast("That file is not a Reactor Revived save this version can read", "options");
		return;
	}
	ask(`Replace your current game with this save ($${fmt(saved.money ?? 0)})?`, () => {
		s = deserialize(saved);
		save(s);
		boot();
		toast("Save imported", "options");
	}, "Replace");
};

// Android can kill the process without warning once backgrounded.
addEventListener("visibilitychange", () => {
	if (document.visibilityState === "hidden") {
		theGame().lastSeen = Date.now();
		save(theGame());
	} else welcomeBack();
});
