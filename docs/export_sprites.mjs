// Export the runtime-generated part sprites as pixel data, so tooling outside
// the browser can use them.
//
// sprites.js draws into a canvas, which Node does not have. Rather than
// refactor the game for a docs script, this stubs the two canvas methods it
// actually calls and records what it painted.
//
//     node docs/export_sprites.mjs > docs/reference/sprites.json
import { PARTS } from "../www/js/parts.js";

let painted = [];

/** "#rrggbb" or "hsl(H S% L%)" to [r, g, b]. */
function rgb(css) {
	if (css.startsWith("#")) {
		const n = parseInt(css.slice(1), 16);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	}
	const [h, s, l] = css.match(/[\d.]+/g).map(Number);
	const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
	const f = (k) => {
		const t = (k + h / 30) % 12;
		return Math.round(255 * (l / 100 - a * Math.max(-1, Math.min(t - 3, 9 - t, 1))));
	};
	return [f(0), f(8), f(4)];
}

globalThis.document = {
	createElement: () => ({
		getContext: () => ({
			fillStyle: "#000",
			fillRect(x, y) {
				painted.push([x, y, ...rgb(this.fillStyle)]);
			},
		}),
		toDataURL: () => "data:,",
	}),
};

const { spriteFor } = await import("../www/js/sprites.js");

const out = {};
for (const part of PARTS) {
	painted = [];
	spriteFor(part);
	out[part.id] = painted;
}
process.stdout.write(JSON.stringify({ size: 32, sprites: out }));
