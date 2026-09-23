// Wiring: the loops, and the actions the UI can trigger.
import { load, save, newState, place, exportSave as saveText, deserialize, serialize, isSave } from "./state.js";
import { compile, tick, tileAt, remove, spill, activeTiles, sellValue, movePart } from "./sim.js";
import { isPartVisible } from "./parts.js";
import { buy as buyUpgrade, reboot as rebootState, applyUpgrades } from "./upgrades.js";
import { checkObjectives, OBJECTIVES } from "./objectives.js";
import { buildUI, render, ask, inspect, flash, toast, goalMet, rebootDialog } from "./ui.js";
import { toolsAllowed, award, TROPHIES, restrictionLabel, markLine, perCell } from "./records.js";
import { fmt } from "./fmt.js";
import { attachInput } from "./input.js";
import { saveModule, deleteModule, modId, isAncestor } from "./module.js";
import { layoutCode, readLayout, applyLayout, describe, layoutOf, contextNote } from "./layout.js";
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

/**
 * Take a part off a tile, refunding whatever life is left in it. The heat it
 * held stays behind in the reactor: selling a full vent does not cool anything.
 */
function sellTile(t) {
	if (!t.id) return;
	s.money += sellValue(s, t);
	spill(s, t);
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

/** The tile a part is being carried from, lit until it lands or is dropped. */
let moving = null;

function endMove() {
	if (moving) dom.tiles[moving.r * s.cols + moving.c]?.cell.classList.remove("moving-from");
	moving = null;
}

const game = {
	selected: "uranium1",

	/** Pick a part up; the next tap on an empty tile puts it down there. */
	startMove(r, c) {
		endMove();
		const t = tileAt(s, r, c);
		if (!t.id) return;
		moving = { r, c };
		dom.tiles[r * s.cols + c]?.cell.classList.add("moving-from");
		toast(`Tap an empty tile to move the ${s.stats.get(t.id).title} there`, "reactor");
	},

	select(id) {
		game.selected = id;
	},

	// A tap places on empty ground and inspects what is already there.
	onTap(r, c) {
		const t = tileAt(s, r, c);
		// Carrying a part: an empty tile takes it, anything else puts it back.
		if (moving) {
			const from = tileAt(s, moving.r, moving.c);
			endMove();
			if (!t.id && movePart(s, from, t)) play("place");
			return;
		}
		if (!t.id) return placeAt(r, c);
		// Hold the id, not the tile: selling clears t.id mid-scan.
		const kind = t.id;
		inspect(s, t, {
			game,
			sell: () => sellAt(r, c),
			move: () => game.startMove(r, c),
			sellKind: () => sellEvery((x) => x.id === kind),
			sellAll: () => sellEvery(() => true),
		});
	},

	// A long press sells, the touch equivalent of the original's right-click.
	onHold(r, c) {
		endMove();
		sellAt(r, c);
	},

	// Dragging paints or clears along the stroke.
	onPaint(r, c) {
		endMove();
		if (tileAt(s, r, c).id) sellAt(r, c);
		else placeAt(r, c);
	},

	buy(id) {
		const row = dom.upgradeRows.find((r) => r.u.id === id);
		if (!buyUpgrade(s, id)) {
			// It used to say nothing at all, which reads as a tap that missed.
			flash(row?.button, "denied");
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
		s.receipt = null;
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

	// A design travels with its claim: the mark and power it had when copied.
	layoutCode: () => [markLine(s), layoutCode(s)].filter(Boolean).join("\n"),

	/** The records, trophies and board as plain text, to keep or share. */
	summary() {
		const r = s.records;
		const lines = [
			"Reactor Revived - records",
			`Most power from a Mark I board: ${r.markOne ? fmt(r.markOne) : "none yet"}`,
			`Best Mark I efficiency: ${r.efficiency ? `${perCell(r.efficiency)} power per cell` : "none yet"}`,
			`Peak power, any board: ${fmt(r.maxPower)}`,
			...(s.restored ? ["This run was restored from a save."] : []),
			`Longest run without a failure: ${fmt(r.longest)} ticks`,
			`Hottest held: ${Math.round(r.hottest * 100)}% of the limit`,
			`Meltdowns: ${r.meltdowns}`,
			`Exotic Particles ever: ${fmt(s.totalExoticParticles + s.exoticParticles)}`,
			...Object.entries(r.speed).flatMap(([run, times]) =>
				Object.entries(times).map(([rung, t]) => `${restrictionLabel(run === "open" ? null : run)} run to ${fmt(Number(rung))} power: ${fmt(t)} ticks`)),
			`Trophies: ${s.trophies.length} of ${TROPHIES.length}`,
			...TROPHIES.filter(([id]) => s.trophies.includes(id)).map(([, name]) => `  ${name}`),
			"Board:",
			game.layoutCode(),
		];
		return lines.join("\n");
	},

	replaceAll(from, to) {
		if (!replaceAll(s, from, to)) return;
		// The board shows the new parts; it does not need saying twice.
		play("buy");
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
		// The only thing the lab changes: money. Everything else runs as the floor
		// does, so what holds here holds there.
		s.money = Infinity;
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
		if (/^(mark[\s-]?i|mark[\s-]?1|ic2)$/i.test(String(code).trim())) award(s, "mark");
		const said = describe(applyLayout(s, layout));
		play("place");
		// The claim the code came with, and whether it was made under this game's
		// upgrades; the board earns its own mark by running either way.
		return [said, layout.claim && `It claims: ${layout.claim}.`, contextNote(s, layout)].filter(Boolean).join(" ");
	},

	saveModule(design) {
		const m = saveModule(s, design);
		if (isAncestor(m.name)) award(s, "ancestor");
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
		}, "Delete", true);
	},
};

function boot() {
	moving = null;
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
		// The last job done: the log is finished, and the next run is offered.
		if (s.objective === OBJECTIVES.length - 1 && award(s, "done")) {
			ask("The log is finished. Reboot, and pick a rule for the next run?", () => game.reboot(false), "Reboot", true);
		}
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
	// A save is a way back past a meltdown. Hardcore has no way back.
	if (theGame().restriction === "hardcore" || saved.restriction === "hardcore") {
		toast("A Hardcore run cannot be restored from a save", "options");
		return;
	}
	ask(`Replace your current game with this save ($${fmt(saved.money ?? 0)})?`, () => {
		s = deserialize(saved);
		// Marked for the rest of the run: the next reboot starts a clean one.
		s.restored = true;
		real = null;
		save(s);
		boot();
		toast("Save imported", "options");
	}, "Replace", true);
};

// Android can kill the process without warning once backgrounded.
addEventListener("visibilitychange", () => {
	if (document.visibilityState === "hidden") {
		theGame().lastSeen = Date.now();
		save(theGame());
	} else welcomeBack();
});
