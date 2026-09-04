import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const playgroundRoot = new URL("../app/playground/", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete demolition playground shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>District 08 — Demolition Rewind<\/title>/i);
  assert.match(html, /Interactive demolition district/);
  assert.match(html, /TONNAGE DROPPED/);
  assert.match(html, /HOLD REWIND/);
  assert.match(html, /RESTORE CITY/);
  assert.match(html, /type="importmap"/);
  assert.match(html, /three@0\.180\.0\/build\/three\.module\.js/);
  assert.match(html, /three@0\.180\.0\/examples\/jsm\//);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("keeps procedural assets, simulation, and rewind inside the standalone project", async () => {
  const [layout, packageJson, workflow, files] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../AGENTS.md", import.meta.url), "utf8"),
    readdir(playgroundRoot),
  ]);

  const sourceFiles = files.filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"));
  const sources = await Promise.all(
    sourceFiles.map((file) => readFile(new URL(file, playgroundRoot), "utf8")),
  );
  const source = sources.join("\n");

  assert.match(packageJson, /"three": "0\.180\.0"/);
  assert.match(layout, /type="importmap"/);
  assert.ok(layout.indexOf("<head>") < layout.indexOf("<body>"));
  assert.match(workflow, /Sol: executive lane/);
  assert.match(workflow, /Terra: systems lane/);
  assert.match(workflow, /Luna: experience lane/);
  assert.match(source, /class DemolitionSimulation/);
  assert.match(source, /class CinematicEffects/);
  assert.match(source, /createDistrict/);
  assert.match(source, /RecordedFrame/);
  assert.doesNotMatch(source, /https?:\/\//i);
  assert.doesNotMatch(source, /\.(?:glb|gltf|fbx|obj|png|jpe?g|webp|mp3|wav)["']/i);

  const previewFiles = await readdir(new URL("../app/", import.meta.url));
  assert.ok(!previewFiles.includes("_sites-preview"));
});
