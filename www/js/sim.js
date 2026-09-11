// The reactor simulation. Pure: no DOM, no globals, no timers. Everything it
// needs arrives in `s` and everything it changes lives in `s`, so the whole
// thing is testable under `node --test` with no harness.
import { applyUpgrades } from "./upgrades.js";
// Room for the base grid plus the twenty levels of each expansion upgrade.
// The reactor is a fixed 12x8. The original grew from 11x14 to 32x35 through
// two upgrades, but that was a desktop game: on a phone the whole board has to
// be visible at once with tiles big enough to hit, and 12x8 already fills the
// screen. There is no room to expand into, so there is no expansion.
export const ROWS = 12;
export const COLS = 8;

export const tileAt = (s, r, c) => s.tiles[r * COLS + c];
const inGrid = (s, r, c) => r >= 0 && c >= 0 && r < ROWS && c < COLS;
// Part stats live on the state, not on the catalog: upgrades change them, and
// a pure sim must not mutate module-level data shared with every other state.
const partOf = (s, t) => (t.activated && t.id ? s.stats.get(t.id) : null);

/** Every tile inside the playable grid, row-major. */
export function* activeTiles(s) {
	for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) yield tileAt(s, r, c);
}

/** Diamond (Manhattan) neighbourhood of radius `range`, excluding the tile itself. */
function* neighbours(s, t, range) {
	for (let dr = -range; dr <= range; dr++) {
		const span = range - Math.abs(dr);
		for (let dc = -span; dc <= span; dc++) {
			if (dr === 0 && dc === 0) continue;
			if (inGrid(s, t.r + dr, t.c + dc)) yield tileAt(s, t.r + dr, t.c + dc);
		}
	}
}

/** heat_exchanger6 reaches its whole row plus the tile above and below. */
function* rowRange(s, t) {
	if (inGrid(s, t.r - 1, t.c)) yield tileAt(s, t.r - 1, t.c);
	for (let c = 0; c < COLS; c++) if (c !== t.c) yield tileAt(s, t.r, c);
	if (inGrid(s, t.r + 1, t.c)) yield tileAt(s, t.r + 1, t.c);
}

// A vent's and a coolant_cell6's real capacity is larger than its containment -
// a vent bleeds `vent` away every tick, and half of what a coolant_cell6 takes
// turns into power. The exchanger has to know that to balance sanely. The
// original repeated this if/else three times.
function effectiveContainment(p) {
	if (p.id === "coolant_cell6") return p.containment * 2;
	if (p.category === "vent") return p.containment + p.vent;
	return p.containment;
}

/**
 * Push heat into a containment part. A thermionic coolant cell keeps half and
 * turns the other half into power, which is why this returns the power made -
 * the original inlined that special case at four separate points, and in one
 * of them credited the power straight to the reactor, where Forceful Fusion
 * could no longer multiply it.
 */
function absorb(t, p, heat) {
	if (p.id !== "coolant_cell6") {
		t.heatContained += heat;
		return 0;
	}
	t.heatContained += heat / 2;
	return heat / 2;
}

// Live vent/transfer rates, scaled by capacitors and plating on the board.
const ventOf = (s, p) => p.vent * (1 + s.ventMul / 100);
const transferOf = (s, p) => p.transfer * (1 + s.transferMul / 100);

/**
 * "Recompile the reactor": rebuild adjacency and per-cell output. Runs only
 * when the layout changes - a part placed, removed, exploded, or upgraded -
 * never per tick.
 */
export function compile(s) {
	s.transferMul = 0;
	s.ventMul = 0;
	s.maxPower = s.baseMaxPower;
	s.maxHeat = s.baseMaxHeat;
	s.statOutlet = 0;
	s.cells = [];

	for (const t of activeTiles(s)) {
		t.heat = 0;
		t.power = 0;
		t.containments = [];
		t.neighbourCells = [];
		t.reflectors = [];

		const p = partOf(s, t);
		if (!p) continue;

		// A spent cell contributes nothing and reaches nothing.
		if (p.category !== "cell" || t.ticks) {
			for (const n of p.id === "heat_exchanger6" ? rowRange(s, t) : neighbours(s, t, p.range ?? 1)) {
				const np = partOf(s, n);
				if (!np) continue;
				if (np.containment) {
					// Vents and thermionic cells are preferred sinks, so they
					// come first when heat is shared out.
					if (p.category === "vent" || p.id === "coolant_cell6") t.containments.unshift(n);
					else t.containments.push(n);
				} else if (np.category === "cell" && n.ticks !== 0) t.neighbourCells.push(n);
				else if (np.category === "reflector") t.reflectors.push(n);
			}
		}

		if (p.category === "capacitor") {
			s.transferMul += p.level * s.transferCapacitorMul;
			s.ventMul += p.level * s.ventCapacitorMul;
		} else if (p.category === "reactor_plating") {
			s.transferMul += p.level * s.transferPlatingMul;
			s.ventMul += p.level * s.ventPlatingMul;
		}

		if (p.category === "heat_outlet") s.statOutlet += p.transfer * t.containments.length;
		if (p.category === "cell") s.cells.push(t);
		if (p.reactorPower) s.maxPower += p.reactorPower;
		if (p.reactorHeat) s.maxHeat += p.reactorHeat;
		// Charged plating raises max power by its heat bonus too.
		if (p.id === "reactor_plating6") s.maxPower += p.reactorHeat;
	}

	for (const t of s.cells) {
		const p = partOf(s, t);
		// Adjacent cells pulse into this one: power scales linearly with the
		// pulse count, heat quadratically. That gap is the whole game. With no
		// neighbours this reduces to the cell's own rated output, so unlike the
		// original there is no second branch for the lone-cell case.
		let pulses = 0;
		for (const n of t.neighbourCells) pulses += s.stats.get(n.id).pulses;
		t.heat = (p.baseHeat * (p.cellMultiplier + pulses) ** 2) / p.cellCount;
		t.power = p.basePower * (p.cellMultiplier + pulses);

		let powerBonus = 0;
		let heatBonus = 0;
		for (const n of t.reflectors) {
			const rp = s.stats.get(n.id);
			powerBonus += rp.powerIncrease;
			heatBonus += rp.heatIncrease ?? 0;
		}
		t.power *= 1 + powerBonus / 100;
		t.heat *= 1 + heatBonus / 100;

		// A cell pre-distributes its heat into the containment parts around it;
		// whatever is left over goes to the reactor.
		if (t.containments.length) {
			const share = Math.ceil(t.heat / t.containments.length);
			for (const n of t.containments) {
				t.heat -= share;
				n.heat += share;
			}
		}
	}

	s.statOutlet *= 1 + s.transferMul / 100;
	return s;
}

/** One second of reactor. Mutates and returns `s`; sets s.dirty when the layout changed. */
export function tick(s) {
	// What this tick moved, for the readout. Totals say where the reactor is;
	// these say what it is doing.
	const rate = { power: 0, heat: 0, vent: 0, inlet: 0, outlet: 0 };
	let powerAdd = 0;
	// A perpetual capacitor that saved itself last tick dumps its heat now.
	let heatAdd = s.heatAddNextTick;
	let heatRemove = 0;
	s.heatAddNextTick = 0;
	s.dirty = false;
	s.meltdown = false;
	// Tiles that blew up this tick, for the UI to animate. The renderer empties
	// it; the sim only ever appends.
	s.exploded = [];

	const inlets = [];
	const exchangers = [];
	const outlets = [];
	const extremeCapacitors = [];

	for (const t of activeTiles(s)) {
		const p = partOf(s, t);
		if (!p) continue;

		// A husk sits at zero waiting for auto-buy to afford it again.
		if (p.category === "cell" && t.ticks === 0) {
			refill(s, t, p);
			continue;
		}

		if (p.category === "cell") {
			powerAdd += t.power;
			heatAdd += t.heat;
			t.ticks--;
			for (const n of t.reflectors) wear(s, n);
			if (t.ticks === 0) expire(s, t, p);
		}

		if (p.containment) powerAdd += absorb(t, p, t.heat);

		if (p.category === "particle_accelerator" && t.heatContained) rollExoticParticles(s, t, p);

		if (p.transfer && t.containments.length) {
			if (p.category === "heat_inlet") inlets.push(t);
			else if (p.category === "heat_exchanger") exchangers.push(t);
			else if (p.category === "heat_outlet") outlets.push(t);
		}
		if (p.id === "capacitor6") extremeCapacitors.push(t);
	}

	// Inlets pull heat out of their neighbours and into the reactor.
	for (const t of inlets) {
		const pull = transferOf(s, partOf(s, t));
		for (const n of t.containments) {
			const moved = Math.min(pull, n.heatContained);
			n.heatContained -= moved;
			heatAdd += moved;
			rate.inlet += moved;
		}
	}
	s.heat += heatAdd;

	// With the Heat Control Operator bought, outlets only push heat out when the
	// reactor is actually over its limit - which is what lets Forceful Fusion be
	// held. This used to be `s.heatControlled && s.heatControlOperator`, and
	// nothing in the game could ever set the first of those, so a $1M upgrade
	// did nothing at all.
	const maxShared = s.heatControlOperator
		? (s.heat > s.maxHeat ? (s.heat - s.maxHeat) / s.statOutlet : 0)
		: s.heat / s.statOutlet;

	for (const t of exchangers) powerAdd += balance(s, t);

	for (const t of outlets) {
		const push = transferOf(s, partOf(s, t));
		for (const n of t.containments) {
			let share = Math.min(push, (s.heat / s.statOutlet) * push, maxShared * push);
			const np = s.stats.get(n.id);
			if (s.heatOutletControlled && np.vent) {
				share = Math.min(share, ventOf(s, np) - n.heatContained);
			}
			powerAdd += absorb(n, np, share);
			heatRemove += share;
			rate.outlet += share;
		}
	}
	s.heat -= heatRemove;

	// Passive cooling. Under the limit it is a trickle; over it, the reactor
	// dumps the excess into every containment part it has.
	if (s.heat > 0) {
		const trickle = s.maxHeat / 10000;
		let reduce = trickle;
		if (s.heat > s.maxHeat) {
			reduce = Math.max((s.heat - s.maxHeat) / 20, trickle);
			const per = reduce / (ROWS * COLS);
			for (const t of activeTiles(s)) {
				const p = partOf(s, t);
				if (p?.containment) powerAdd += absorb(t, p, per);
			}
		}
		s.heat -= reduce;
	}

	// Forceful Fusion: a hot reactor generates more power.
	if (s.heatPowerMul && s.heat > 1000) {
		powerAdd *= 1 + s.heatPowerMul * (Math.log(s.heat) / Math.log(1000) / 100);
	}
	s.power += powerAdd;
	rate.power = powerAdd;
	rate.heat = heatAdd;
	s.rate = rate;

	buyQueued(s);

	for (const t of activeTiles(s)) {
		const p = partOf(s, t);
		if (!p?.containment) continue;

		if (p.vent) {
			// An extreme vent burns reactor power to do its cooling.
			const shed = p.id === "vent6"
				? Math.min(ventOf(s, p), t.heatContained, s.power)
				: Math.min(ventOf(s, p), t.heatContained);
			if (p.id === "vent6") s.power -= shed;
			t.heatContained -= shed;
			// Recorded per tile as well as in total: a vent that moved heat this
			// tick is one the board should show turning.
			t.vented = shed;
			rate.vent += shed;
		}

		// A black hole accelerator actively drags heat out of the reactor,
		// paying one power per heat.
		if (p.id === "particle_accelerator6") {
			const moved = Math.min(transferOf(s, p), s.power, s.heat);
			if (moved > 0) {
				s.power -= moved;
				s.heat -= moved;
				t.heatContained += moved;
			}
		}

		if (t.heatContained > p.containment) explode(s, t, p);
	}

	sell(s, extremeCapacitors);

	s.power = Math.min(s.power, s.maxPower);
	s.heat = Math.max(s.heat, 0);
	if (s.meltdown) s.heat = s.maxHeat * 2 + 1;

	if (s.meltdown || s.heat > s.maxHeat * 2) meltdown(s);

	// Spending protium permanently strengthens every protium cell, so the
	// derived part stats have to be rebuilt before the layout is recompiled.
	if (s.statsDirty) {
		applyUpgrades(s);
		s.statsDirty = false;
		s.dirty = true;
	}
	if (s.dirty) compile(s);
	return s;
}

/** A reflector loses a pulse each time an adjacent cell fires, then dies. */
function wear(s, t) {
	t.ticks--;
	if (t.ticks === 0) expire(s, t, partOf(s, t));
}

/** Whether auto-buy owns this part and will replace it when it runs out. */
const replaces = (s, p) =>
	s.perpetual.has(p.category === "cell" ? p.type : p.category);

/** Buy a spent part again in place. True if it was refilled. */
function refill(s, t, p) {
	const price = p.cost * (p.category === "cell" ? 1.5 : 1);
	if (!replaces(s, p) || s.money < price) return false;
	s.money -= price;
	t.ticks = p.ticks;
	s.dirty = true;
	return true;
}

/**
 * A cell or reflector has run out. The original wrote this twice.
 *
 * A spent part is cleared off the board. The one exception is a cell that
 * auto-buy owns but cannot currently afford: that stays as a husk, because the
 * husk is what auto-buy refills once the money is there.
 */
function expire(s, t, p) {
	const isCell = p.category === "cell";
	if (isCell && p.type === "protium") {
		s.protiumParticles += p.cellCount;
		s.statsDirty = true;
	}

	if (refill(s, t, p)) return;
	if (isCell && replaces(s, p)) {
		s.dirty = true;
		return;
	}
	remove(s, t);
}

/**
 * What a part refunds. A part loses value as it is used, so a vent nearly full
 * of heat or a cell down to its last tick is worth a fraction of list price -
 * selling is a refund on what is left, not a way to launder worn parts.
 */
export function sellValue(s, t) {
	if (!t.activated) return 0; // queued, never paid for
	const p = s.stats.get(t.id);
	let left = 1;
	if (p.ticks) left = Math.min(left, t.ticks / p.ticks);
	if (p.containment) left = Math.min(left, 1 - t.heatContained / p.containment);
	return Math.floor(p.cost * Math.max(0, left));
}

function rollExoticParticles(s, t, p) {
	const heat = Math.min(t.heatContained, p.epHeat);
	let chance = (Math.log(heat) / 10 ** (5 - p.level)) * (heat / p.epHeat);
	let gained = 0;
	if (chance > 1) {
		gained = Math.floor(chance);
		chance -= gained;
	}
	if (chance > s.random()) gained++;
	s.exoticParticles += gained;
}

/**
 * Heat exchangers move heat toward an even fill percentage across themselves
 * and their neighbours: pull from anything fuller than the target, push into
 * anything emptier. Returns the power made by any thermionic cells it fed.
 */
function balance(s, t) {
	let powerMade = 0;
	const p = partOf(s, t);
	const rate = transferOf(s, p);

	let capacity = p.containment;
	let contained = t.heatContained;
	for (const n of t.containments) {
		capacity += effectiveContainment(s.stats.get(n.id));
		contained += n.heatContained;
	}
	const target = contained / capacity;

	for (const n of t.containments) {
		const cap = effectiveContainment(s.stats.get(n.id));
		const pct = n.heatContained / cap;
		if (pct <= target) continue;
		const moved = Math.min((pct - target) * contained, rate, n.heatContained);
		if (moved >= 1) {
			n.heatContained -= moved;
			t.heatContained += moved;
		}
	}

	for (const n of t.containments) {
		const np = s.stats.get(n.id);
		const cap = effectiveContainment(np);
		const pct = n.heatContained / cap;
		let moved = pct < target ? (target - pct) * cap : 0;
		// A vent that can bleed off more than it is being offered should take
		// everything it can handle.
		if (np.category === "vent" && moved < ventOf(s, np) - n.heatContained) {
			moved = ventOf(s, np) - n.heatContained;
		}
		moved = Math.min(moved, rate, t.heatContained);
		if (moved < 1) continue;

		powerMade += absorb(n, np, moved);
		t.heatContained -= moved;
	}
	return powerMade;
}

/** Drain the placement queue, buying as many pending tiles as money allows. */
function buyQueued(s) {
	while (s.queue.length) {
		const t = s.queue[0];
		if (!t.id || t.activated) {
			s.queue.shift();
			continue;
		}
		const p = s.stats.get(t.id);
		if (s.money < p.cost) break;
		s.money -= p.cost;
		t.activated = true;
		countPlaced(s, t.id);
		s.queue.shift();
		s.dirty = true;
	}
}

function explode(s, t, p) {
	// A perpetual capacitor buys itself out of trouble, dumping its heat into
	// the reactor on the next tick instead of blowing up.
	if (t.heat <= 0 && p.category === "capacitor"
		&& s.perpetualCapacitors && s.money >= p.cost * 10) {
		s.money -= p.cost * 10;
		s.heatAddNextTick += t.heatContained;
		t.heatContained = 0;
		return;
	}
	if (p.category === "particle_accelerator") s.meltdown = true;
	s.exploded.push(t.r * COLS + t.c);
	remove(s, t);
}

function sell(s, extremeCapacitors) {
	let amount = Math.ceil(s.maxPower * s.autoSellMul);
	if (!amount) return;

	const pct = amount > s.power ? s.power / amount : 1;
	if (amount > s.power) amount = s.power;
	s.power -= amount;
	s.money += amount;
	s.soldPower = true;

	// Extreme capacitors heat themselves by half of what they sold.
	for (const t of extremeCapacitors) {
		t.heatContained += amount * s.autoSellMul * pct * 0.5;
	}
}

function meltdown(s) {
	s.hasMeltedDown = true;
	for (const t of activeTiles(s)) {
		if (!t.id) continue;
		s.exploded.push(t.r * COLS + t.c);
		remove(s, t);
	}
}

/** Record that a part was bought. Only ever goes up; selling does not undo it. */
export function countPlaced(s, id) {
	s.placed[id] = (s.placed[id] ?? 0) + 1;
}

export function remove(s, t) {
	t.id = null;
	t.activated = false;
	t.ticks = 0;
	t.heatContained = 0;
	t.heat = 0;
	t.power = 0;
	s.dirty = true;
}
