import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "test-page");
const port = Number(process.env.E2E_PORT ?? 4173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

createServer(async (req, res) => {
  const path = req.url === "/" ? "/index.html" : req.url;
  const file = join(root, path ?? "/index.html");
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] ?? "text/plain" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, () => {
  console.log(`e2e test page: http://127.0.0.1:${port}`);
});
