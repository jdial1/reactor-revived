// Dev server for www/. `node tools/serve.js`, then open http://localhost:8080.
import { createServer } from "node:http";
import { createReadStream } from "node:fs";

const MIME = { html: "text/html", js: "text/javascript", css: "text/css", png: "image/png" };

createServer((req, res) => {
	const path = new URL(req.url, "http://x").pathname.replace(/^\/+/, "") || "index.html";
	res.writeHead(200, { "content-type": MIME[path.split(".").pop()] ?? "application/octet-stream" });
	createReadStream(new URL(`../www/${path}`, import.meta.url))
		.on("error", () => res.end("not found"))
		.pipe(res);
}).listen(8080, () => console.log("http://localhost:8080"));
