// Dev server for www/. `node tools/serve.js`, then open http://localhost:8080.
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

const ROOT = new URL("../www/", import.meta.url);
const MIME = { html: "text/html", js: "text/javascript", css: "text/css", json: "application/json", svg: "image/svg+xml", png: "image/png" };

createServer(async (req, res) => {
	const path = new URL(req.url, "http://x").pathname.replace(/^\/+/, "") || "index.html";
	const file = new URL(path, ROOT);
	if (!file.href.startsWith(ROOT.href)) return res.writeHead(403).end();
	try {
		await stat(file);
	} catch {
		return res.writeHead(404).end("not found");
	}
	res.writeHead(200, { "content-type": MIME[path.split(".").pop()] ?? "application/octet-stream" });
	createReadStream(file).pipe(res);
}).listen(8080, () => console.log("http://localhost:8080"));
