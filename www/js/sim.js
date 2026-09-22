// The reactor simulation. Pure: no DOM, no globals, no timers - everything
// arrives in `s` and everything it changes lives in `s`.
import { applyUpgrades } from "./upgrades.js";
import { stepModule } from "./module.js";
// Fixed 12x8: the whole board has to be visible at once on a phone, so the
// original's two expansion upgrades have nothing to expand into.
export const ROWS = 12;
export const COLS = 8;

// The main board is ROWS x COLS; a module's casing runs the same sim on 3x3.
export const tileAt = (s, r, c) => s.tiles[r * s.cols + c];
const inGrid = (s, r, c) => r >= 0 && c >= 0 && r < s.rows && c < s.cols;
// Stats live on the state: a pure sim must not mutate the shared catalog.
const partOf = (s, t) => (t.activated && t.id ? s.stats.get(t.id) : null);

export function* activeTiles(s) {
	for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) yield tileAt(s, r, c);
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
	for (let c = 0; c < s.cols; c++) if (c !== t.c) yield tileAt(s, t.r, c);
	if (inGrid(s, t.r + 1, t.c)) yield tileAt(s, t.r + 1, t.c);
}

// Real capacity exceeds containment: a vent bleeds `vent` away each tick and
// a coolant_cell6 turns half of what it takes into power.
function effectiveContainment(p) {
	if (p.id === "coolant_cell6") return p.containment * 2;
	if (p.category === "vent") return p.containment + p.vent;
	return p.containment;
}

/**
 * Push heat into a containment part. A thermionic coolant cell keeps half and
 * turns the rest into power, which is why this returns the power made.
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

/** Rebuild adjacency and per-cell output. Only when the layout changes. */
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

		if (p.category === "module") continue;
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
			if (s.diagonalPulse && p.category === "cell") {
				for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
					if (!inGrid(s, t.r + dr, t.c + dc)) continue;
					const n = tileAt(s, t.r + dr, t.c + dc);
					const np = partOf(s, n);
					if (np?.category === "cell" && n.ticks !== 0) t.neighbourCells.push(n);
				}
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
		// Power scales with the pulse count, heat with its square. That gap is the
		// whole game. With no neighbours this reduces to the cell's rated output.
		let pulses = 0;
		for (const n of t.neighbourCells) pulses += s.stats.get(n.id).pulses;
		t.heat = (p.baseHeat * (p.cellMultiplier + pulses) ** 2) / p.cellCount;
		t.power = p.basePower * (p.cellMultiplier + pulses);
		if (s.isolatedCores && !t.neighbourCells.length) t.power *= 3;
		if (s.overclock) {
			t.power *= 1.5;
			t.heat *= 2;
		}

		let powerBonus = 0;
		let heatBonus = 0;
		for (const n of t.reflectors) {
			const rp = s.stats.get(n.id);
			powerBonus += rp.powerIncrease;
			heatBonus += rp.heatIncrease ?? 0;
		}
		t.power *= 1 + powerBonus / 100;
		t.heat *= 1 + heatBonus / 100;
		t.heatMade = t.heat;

		// A cell pre-distributes its heat into the containment parts around it;
		// whatever is left over goes to the reactor. Split exactly: Knockoff
		// rounded each share up, so 4 heat over 3 vents put 6 into them and
		// sent -2 to the reactor - heat from nothing, which Flow made visible.
		if (t.containments.length) {
			const share = t.heat / t.containments.length;
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
		// What each tile did this tick, for the heat-flow overlay.
		t.made = 0;
		t.heatIn = 0;
		t.heatOut = 0;
		t.vented = 0;
		const p = partOf(s, t);
		if (!p) continue;

		if (p.category === "cell" && t.ticks === 0) {
			refill(s, t, p);
			continue;
		}

		// A module runs its own 3x3 against this reactor's pool. Heat crosses at
		// full strength, both ways; power and particles are cut to the casing's
		// efficiency.
		if (p.category === "module") {
			if (p.ticks && t.ticks === 0) {
				refill(s, t, p);
				continue;
			}
			const out = stepModule(s, t, p);
			powerAdd += out.power * s.casingEff;
			heatAdd += out.heat;
			// A casing that dumps heat made it; one that pulls heat is cooling.
			if (out.heat > 0) {
				t.made = out.heat;
				rate.heat += out.heat;
			} else {
				t.heatIn = -out.heat;
				rate.outlet -= out.heat;
			}
			t.ep = (t.ep ?? 0) + out.ep * s.casingEff;
			if (t.ep >= 1) {
				s.exoticParticles += Math.floor(t.ep);
				t.ep %= 1;
			}
			t.age = (t.age ?? 0) + 1;
			if (out.failed) {
				explode(s, t, p);
				continue;
			}
			if (p.ticks && --t.ticks === 0) expire(s, t, p);
			continue;
		}

		if (p.category === "cell") {
			const throttled = s.throttle && s.heat > s.maxHeat * 0.8 ? 0.5 : 1;
			powerAdd += t.power * throttled;
			heatAdd += t.heat * throttled;
			// Made, not what is left after the vents beside it took their share -
			// the leftover can round below zero, and "heat made: -2" is a lie.
			t.made = t.heatMade * throttled;
			rate.heat += t.made;
			t.ticks--;
			for (const n of t.reflectors) wear(s, n);
			if (t.ticks === 0) expire(s, t, p);
		}

		if (p.containment) {
			t.heatIn += t.heat;
			powerAdd += absorb(t, p, t.heat);
		}

		if (p.category === "particle_accelerator" && t.heatContained) rollExoticParticles(s, t, p);

		if (p.transfer && t.containments.length) {
			if (p.category === "heat_inlet") inlets.push(t);
			else if (p.category === "heat_exchanger") exchangers.push(t);
			else if (p.category === "heat_outlet") outlets.push(t);
		}
		if (p.id === "capacitor6") extremeCapacitors.push(t);
	}

	for (const t of inlets) {
		const pull = transferOf(s, partOf(s, t));
		for (const n of t.containments) {
			const moved = Math.min(pull, n.heatContained);
			n.heatContained -= moved;
			n.heatOut += moved;
			t.heatIn += moved;
			t.heatOut += moved;
			heatAdd += moved;
			rate.inlet += moved;
		}
	}
	s.heat += heatAdd;

	// With the operator bought, outlets only push heat out above the limit, which
	// is what lets Forceful Fusion be held.
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
			t.heatIn += share;
			t.heatOut += share;
			n.heatIn += share;
			heatRemove += share;
			rate.outlet += share;
		}
	}
	s.heat -= heatRemove;

	// Passive cooling. Under the limit it is a trickle; over it, the reactor
	// dumps the excess into every containment part it has. A casing has no
	// reactor around it: its pool is what leaks out.
	if (s.heat > 0 && !s.sealed) {
		const trickle = s.maxHeat / 10000;
		let reduce = trickle;
		if (s.heat > s.maxHeat) {
			reduce = Math.max((s.heat - s.maxHeat) / 20, trickle);
			const per = reduce / (s.rows * s.cols);
			for (const t of activeTiles(s)) {
				const p = partOf(s, t);
				if (!p?.containment) continue;
				t.heatIn += per;
				powerAdd += absorb(t, p, per);
			}
		}
		s.heat -= reduce;
	}

	// Forceful Fusion: a hot reactor generates more power.
	if (s.heatPowerMul && s.heat > 1000 && !s.sealed) {
		powerAdd *= 1 + s.heatPowerMul * (Math.log(s.heat) / Math.log(1000) / 100);
	}
	s.power += powerAdd;
	rate.power = powerAdd;
	s.rate = rate;

	if (!s.sealed) buyQueued(s);

	for (const t of activeTiles(s)) {
		const p = partOf(s, t);
		if (!p?.containment) continue;

		if (p.vent) {
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
				t.heatIn += moved;
			}
		}

		if (t.heatContained > p.containment) explode(s, t, p);
	}

	if (s.sealed) {
		if (s.dirty) compile(s);
		return s;
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
	if (s.reflectorLattice) return;
	t.ticks--;
	if (t.ticks === 0) expire(s, t, partOf(s, t));
}

/** Whether auto-buy owns this part and will replace it when it runs out. */
const replaces = (s, p) => p.category === "module"
	? p.consumables.length > 0 && p.consumables.every((k) => s.perpetual.has(k))
	: s.perpetual.has(p.category === "cell" ? p.type : p.category);

/** What auto-buy pays to replace a spent part. */
export const rebuyPrice = (p) =>
	p.category === "module" ? p.rebuy : p.cost * (p.category === "cell" ? 1.5 : 1);

function refill(s, t, p) {
	const price = rebuyPrice(p);
	if (!replaces(s, p) || s.money < price) return false;
	s.money -= price;
	t.ticks = p.ticks;
	t.age = 0;
	t.inner = null; // a rebuilt casing starts cold and full
	s.dirty = true;
	return true;
}

/**
 * A cell or reflector has run out. Cleared off the board, unless auto-buy owns
 * it and cannot afford it: that husk is what auto-buy refills later.
 */
function expire(s, t, p) {
	const isCell = p.category === "cell" || p.category === "module";
	if (p.type === "protium") {
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

/** What a part refunds: a fraction of list price, by how worn it is. */
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
 * Move heat toward an even fill percentage across an exchanger and its
 * neighbours. Returns the power made by any thermionic cells it fed.
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
			n.heatOut += moved;
			t.heatContained += moved;
			t.heatIn += moved;
		}
	}

	// Every share is worked out before any is paid: handed out in turn, the
	// neighbours first in scan order (up, left) took it all and the rest got
	// nothing - Knockoff's exchangers blew their far side first (issue #4).
	const wants = t.containments.map((n) => {
		const np = s.stats.get(n.id);
		const cap = effectiveContainment(np);
		const pct = n.heatContained / cap;
		let moved = pct < target ? (target - pct) * cap : 0;
		// A vent that can bleed off more than it is being offered should take
		// everything it can handle.
		if (np.category === "vent" && moved < ventOf(s, np) - n.heatContained) {
			moved = ventOf(s, np) - n.heatContained;
		}
		return Math.min(moved, rate);
	});
	const asked = wants.reduce((a, b) => a + b, 0);
	const scale = asked > t.heatContained ? t.heatContained / asked : 1;

	t.containments.forEach((n, i) => {
		const moved = wants[i] * scale;
		if (moved < 1) return;
		powerMade += absorb(n, s.stats.get(n.id), moved);
		n.heatIn += moved;
		t.heatOut += moved;
		t.heatContained = Math.max(0, t.heatContained - moved);
	});
	return powerMade;
}

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
	if (s.cascadeVents && p.category === "vent") {
		const excess = t.heatContained - p.containment;
		const taker = t.containments.find((n) => {
			const np = partOf(s, n);
			return np?.category === "vent" && np.containment - n.heatContained >= excess;
		});
		if (taker) {
			taker.heatContained += excess;
			t.heatContained -= excess;
			return;
		}
	}
	if (p.category === "particle_accelerator") s.meltdown = true;
	if (s.salvage) s.money += p.cost * 0.5;
	s.exploded.push(t.r * s.cols + t.c);
	remove(s, t);
}

function sell(s, extremeCapacitors) {
	let amount = Math.ceil(s.maxPower * s.autoSellMul);
	if (!amount) return;

	const pct = amount > s.power ? s.power / amount : 1;
	if (amount > s.power) amount = s.power;
	s.power -= amount;
	s.money += amount * s.sellMul;
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
		s.exploded.push(t.r * s.cols + t.c);
		remove(s, t);
	}
}

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
	t.age = 0;
	t.ep = 0;
	t.inner = null;
	t.saved = null;
	s.dirty = true;
}
