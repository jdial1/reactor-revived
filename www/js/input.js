// Touch input for the reactor grid. The original's six modifier-key macros
// become four gestures, with no mode to pick:
//
//   tap  place or inspect   long press  sell
//   drag  paint the path    two fingers  pinch to zoom, drag to pan

const LONG_PRESS_MS = 450;
const DRAG_SLOP = 8;
const ZOOM_RANGE = [0.6, 2.5];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const clamp = (n, [lo, hi]) => Math.min(hi, Math.max(lo, n));

/**
 * Wire the grid up. `handlers` gets {onTap, onPaint, onHold}, each called with
 * (row, col); the caller decides what those mean.
 */
export function attachInput(board, grid, handlers) {
	const pointers = new Map();
	let mode = null; // null | "paint" | "gesture"
	let start = null;
	let held = null;
	let holdTimer = 0;
	let painted = new Set();
	let gesture = null;
	let zoom = 1;

	let holdNode = null;
	const tileUnder = (x, y) => {
		const node = document.elementFromPoint(x, y)?.closest(".tile");
		return node ? [Number(node.dataset.r), Number(node.dataset.c)] : null;
	};
	// A gesture with a timer on it should show the timer.
	const showHold = (node) => {
		holdNode?.classList.remove("holding");
		holdNode = node;
		node?.classList.add("holding");
	};

	const cancelHold = () => {
		clearTimeout(holdTimer);
		holdTimer = 0;
		showHold(null);
	};

	const reset = () => {
		cancelHold();
		mode = null;
		start = null;
		held = null;
		gesture = null;
		painted.clear();
	};

	grid.addEventListener("pointerdown", (e) => {
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (pointers.size === 2) {
			// A second finger turns any in-flight tap or paint into a pan/zoom.
			cancelHold();
			mode = "gesture";
			painted.clear();
			const [a, b] = [...pointers.values()];
			gesture = {
				dist: dist(a, b),
				mid: mid(a, b),
				zoom,
				left: board.scrollLeft,
				top: board.scrollTop,
			};
			return;
		}
		if (pointers.size > 2) return;

		start = { x: e.clientX, y: e.clientY };
		held = tileUnder(e.clientX, e.clientY);
		if (!held) return;
		showHold(document.elementFromPoint(e.clientX, e.clientY)?.closest(".tile"));
		holdTimer = setTimeout(() => {
			holdTimer = 0;
			mode = "hold";
			showHold(null);
			handlers.onHold(...held);
		}, LONG_PRESS_MS);
	});

	// Move and release listen on the window so a finger leaving the grid still
	// finishes its gesture instead of stranding one half-done.
	addEventListener("pointermove", (e) => {
		if (!pointers.has(e.pointerId)) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (mode === "gesture" && pointers.size >= 2) {
			const [a, b] = [...pointers.values()];
			zoom = clamp((gesture.zoom * dist(a, b)) / gesture.dist, ZOOM_RANGE);
			grid.style.setProperty("--zoom", zoom);
			const now = mid(a, b);
			board.scrollLeft = gesture.left - (now.x - gesture.mid.x);
			board.scrollTop = gesture.top - (now.y - gesture.mid.y);
			return;
		}
		if (mode === "hold" || !start) return;

		if (mode !== "paint" && Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_SLOP) return;

		// Past the slop threshold this is a paint stroke, not a tap. The tile the
		// stroke started on counts as painted too.
		if (mode !== "paint") {
			cancelHold();
			mode = "paint";
			painted.add(String(held));
			handlers.onPaint(...held);
		}
		const at = tileUnder(e.clientX, e.clientY);
		if (!at) return;
		const key = String(at);
		if (painted.has(key)) return;
		painted.add(key);
		handlers.onPaint(...at);
	});

	const end = (e) => {
		pointers.delete(e.pointerId);
		if (pointers.size > 0) return; // still gesturing with another finger
		if (mode === null && held) handlers.onTap(...held);
		reset();
	};

	addEventListener("pointerup", end);
	addEventListener("pointercancel", end);
}
