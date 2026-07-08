import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname);
const port = Number(process.env.PORT || 4173);

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"]
]);

function fileFor(urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
  const requested = safePath === "/" ? "/index.html" : safePath;
  const file = resolve(join(root, requested));
  if (!file.startsWith(root)) return null;
  return file;
}

const server = createServer((req, res) => {
  const file = fileFor(req.url || "/");
  if (!file) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const stat = statSync(file);
    if (!stat.isFile()) throw new Error("not a file");
    res.writeHead(200, {
      "Content-Type": types.get(extname(file)) || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Demolition playground: http://127.0.0.1:${port}/`);
});

