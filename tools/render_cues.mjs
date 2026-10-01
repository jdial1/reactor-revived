// Render each cue as the game plays it - its file, at its rate and gain - to raw
// 32-bit float PCM, decoded by the browser exactly as the game decodes it. With
// the dev server running (node tools/serve.js) and Playwright installed:
//
//   node tools/render_cues.mjs '[["coin","audio/tally-1.wav",1,0.28]]' /tmp/out
//   python3 tools/grade_sounds.py --dir /tmp/out coin
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require("/opt/node22/lib/node_modules/playwright"); }
const { chromium } = playwright;
const cues = JSON.parse(process.argv[2]);
const out = process.argv[3];
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:8080/");
const res = await page.evaluate(async (cues) => {
	const sr = 44100;
	const out = {};
	for (const [name, file, rate, gain] of cues) {
		const data = await (await fetch(file)).arrayBuffer();
		const probe = new OfflineAudioContext(1, sr, sr);
		const buf = await probe.decodeAudioData(data);
		const len = Math.ceil(buf.duration / rate * sr) + 2205;
		const ctx = new OfflineAudioContext(1, len, sr);
		const src = ctx.createBufferSource();
		src.buffer = buf;
		src.playbackRate.value = rate;
		const g = ctx.createGain();
		g.gain.value = gain;
		src.connect(g).connect(ctx.destination);
		src.start();
		const r = await ctx.startRendering();
		out[name] = Array.from(r.getChannelData(0));
	}
	return out;
}, cues);
for (const [k, v] of Object.entries(res)) writeFileSync(`${out}/${k}.f32`, Buffer.from(new Float32Array(v).buffer));
await browser.close();
console.log("rendered", Object.keys(res).join(" "));
