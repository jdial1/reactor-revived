// Touch input for the reactor grid. Three gestures, and none of them can
// destroy anything by accident:
//
//   tap   an empty tile places; a placed part opens its sheet, where every
//         action on it lives (sell, move, replace, refill, about)
//   drag  paints a row of the selected part onto empty tiles only
//   two fingers  pinch to zoom, drag to pan
//
// A press on a placed part is always its sheet: a tap, a slow press, a long
// press, or one that slips a few pixels. It used to turn into a paint stroke
// once a finger moved 8px, so a long press - which always wobbles - opened
// nothing. There is no long press of its own; it once sold, and a slow tap
// sold parts. While a part is being carried, nothing paints: the next press
// is where it goes.

const DRAG_SLOP = 8;
const ZOOM_RANGE = [0.6, 2.5];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const clamp = (n, [lo, hi]) => Math.min(hi, Math.max(lo, n));

/**
 * Wire the grid up. `handlers` gets {onTap, onPaint, canPaint}, each called
 * with (row, col); the caller decides what those mean. `canPaint` says whether
 * a stroke may start on that tile: an empty one, and nothing being carried.
 */
export function attachInput(board, grid, handlers) {
	const pointers = new Map();
	let mode = null; // null | "paint" | "gesture"
	let start = null;
	let held = null;
	let painted = new Set();
	let gesture = null;
	let zoom = 1;

	const tileUnder = (x, y) => {
		const node = document.elementFromPoint(x, y)?.closest(".tile");
		return node ? [Number(node.dataset.r), Number(node.dataset.c)] : null;
	};

	const reset = () => {
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
		if (!start || !held) return;
		// A press on a placed part, or while carrying one, stays a press.
		if (mode !== "paint" && !handlers.canPaint(...held)) return;

		if (mode !== "paint" && Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_SLOP) return;

		// Past the slop threshold this is a paint stroke, not a tap. The tile the
		// stroke started on counts as painted too.
		if (mode !== "paint") {
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

	let lastTap = 0;
	const end = (e) => {
		pointers.delete(e.pointerId);
		if (pointers.size > 0) return; // still gesturing with another finger
		if (mode === null && held) {
			// Two taps in a row on empty ground put the board back where it
			// started; a pinch had no way home. Never on a part: that is its sheet.
			const now = e.timeStamp;
			if (zoom !== 1 && now - lastTap < 300 && handlers.canPaint(...held)) {
				zoom = 1;
				grid.style.setProperty("--zoom", 1);
			} else {
				handlers.onTap(...held);
			}
			lastTap = now;
		}
		reset();
	};

	addEventListener("pointerup", end);
	addEventListener("pointercancel", end);
	// A long press is a press, not the browser's menu or a text selection.
	grid.addEventListener("contextmenu", (e) => e.preventDefault());
}
