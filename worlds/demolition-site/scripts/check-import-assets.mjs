import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const denyExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif", ".ico",
  ".glb", ".gltf", ".obj", ".fbx", ".hdr", ".exr",
  ".mp3", ".wav", ".ogg", ".mp4", ".mov", ".webm", ".woff", ".woff2", ".ttf", ".otf"
]);
const textExtensions = new Set([".html", ".css", ".js", ".mjs", ".json", ".md"]);
const ignoredDirs = new Set(["node_modules", ".git"]);
const files = [];
const problems = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (ignoredDirs.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else {
      files.push(full);
    }
  }
}

walk(root);

for (const file of files) {
  const rel = relative(root, file);
  const ext = extname(file).toLowerCase();
  if (denyExtensions.has(ext)) {
    problems.push(`prohibited asset file: ${rel}`);
  }
  if (!textExtensions.has(ext)) continue;
  if (rel === "package-lock.json") continue;
  const source = readFileSync(file, "utf8");
  const runtimeSource = rel === "index.html" || rel === "styles.css" || rel.startsWith("src/");
  if (runtimeSource && /url\s*\(/i.test(source)) problems.push(`css/url reference: ${rel}`);
  if (runtimeSource && /from\s+["']https?:/i.test(source)) problems.push(`direct remote import: ${rel}`);
  if (runtimeSource && /https?:\/\/(?!cdn\.jsdelivr\.net\/npm\/three@0\.185\.0\/)/i.test(source)) {
    problems.push(`remote URL outside allowed Three.js code CDN: ${rel}`);
  }
  if (/from\s+["']three["']/.test(source) === false && rel.startsWith("src/") && source.includes("THREE")) {
    problems.push(`possible Three.js global usage instead of import map: ${rel}`);
  }
}

const index = readFileSync(join(root, "index.html"), "utf8");
const importMapIndex = index.indexOf('type="importmap"');
const moduleIndex = index.indexOf('type="module"');
if (importMapIndex === -1 || moduleIndex === -1 || importMapIndex > moduleIndex) {
  problems.push("index.html import map must appear before module script");
}
if (!index.includes('"three": "https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.module.js"')) {
  problems.push('index.html must map "three" to pinned 0.185.0 module');
}
if (!index.includes('"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/"')) {
  problems.push('index.html must map "three/addons/" to pinned 0.185.0 addons');
}

const appSource = readFileSync(join(root, "src/main.js"), "utf8");
const badThreeImports = [...appSource.matchAll(/from\s+["']([^"']*three[^"']*)["']/gi)]
  .map((match) => match[1])
  .filter((specifier) => specifier !== "three" && !specifier.startsWith("three/addons/"));
if (badThreeImports.length) problems.push(`bad Three.js imports: ${badThreeImports.join(", ")}`);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log("import-map and asset checks passed");
