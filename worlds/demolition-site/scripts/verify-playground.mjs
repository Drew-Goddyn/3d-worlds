import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const evidenceRoot = "/Users/Drew/projects/.codex-plan-goals/3d-worlds/demolition-site/evidence";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = join(evidenceRoot, `${stamp}-verify`);
const port = Number(process.env.PORT || 4173);
const url = `http://127.0.0.1:${port}/`;

mkdirSync(runDir, { recursive: true });

const serverLog = [];
const server = spawn(process.execPath, ["server.mjs"], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"]
});

server.stdout.on("data", (chunk) => serverLog.push(chunk.toString()));
server.stderr.on("data", (chunk) => serverLog.push(chunk.toString()));

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await sleep(250);
    }
  }
  throw new Error(`server did not start at ${url}`);
}

const network = [];
const consoleMessages = [];
const pageErrors = [];
const evidence = {};

function remember(key, paths) {
  evidence[key] = paths.map((path) => path.replace(evidenceRoot + "/", "evidence/"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function canvasStats(page) {
  return page.evaluate(() => {
    window.demolitionApp?.renderForDiagnostics?.();
    const canvas = document.querySelector("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;
    const points = [
      [0.18, 0.22], [0.5, 0.22], [0.82, 0.22],
      [0.18, 0.5], [0.5, 0.5], [0.82, 0.5],
      [0.18, 0.78], [0.5, 0.78], [0.82, 0.78]
    ];
    const pixel = new Uint8Array(4);
    const colors = new Set();
    let nonBlack = 0;
    for (const [px, py] of points) {
      const x = Math.floor(width * px);
      const y = Math.floor(height * py);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      const color = `${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3]}`;
      colors.add(color);
      if (pixel[0] + pixel[1] + pixel[2] > 15) nonBlack += 1;
    }
    return { width, height, sampleCount: points.length, uniqueColors: colors.size, nonBlack };
  });
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  page.on("console", (message) => {
    consoleMessages.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    pageErrors.push(String(error.stack || error.message || error));
  });
  page.on("requestfinished", async (request) => {
    const response = await request.response();
    network.push({
      url: request.url(),
      method: request.method(),
      type: request.resourceType(),
      status: response?.status() ?? null
    });
  });
  page.on("requestfailed", (request) => {
    network.push({
      url: request.url(),
      method: request.method(),
      type: request.resourceType(),
      failure: request.failure()?.errorText || "failed"
    });
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.demolitionApp?.getDiagnostics);

  const desktopPath = join(runDir, "first-frame-desktop.png");
  await page.screenshot({ path: desktopPath, fullPage: true });
  remember("firstFrameDesktop", [desktopPath]);
  const desktopCanvasStats = await canvasStats(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await sleep(350);
  const mobilePath = join(runDir, "first-frame-mobile.png");
  await page.screenshot({ path: mobilePath, fullPage: true });
  remember("firstFrameMobile", [mobilePath]);
  const mobileCanvasStats = await canvasStats(page);
  const canvasStatsPath = join(runDir, "canvas-pixel-stats.json");
  writeFileSync(canvasStatsPath, JSON.stringify({ desktopCanvasStats, mobileCanvasStats }, null, 2));
  remember("canvasPixelStats", [canvasStatsPath]);

  await page.setViewportSize({ width: 1440, height: 900 });
  await sleep(350);

  await page.click("[data-action='swing']");
  await sleep(600);
  await page.evaluate(() => window.demolitionApp.damageBuilding("bank", 1.9));
  await sleep(450);
  const impactPath = join(runDir, "wrecking-ball-structural-impact.png");
  await page.screenshot({ path: impactPath, fullPage: true });
  remember("wreckingBallStructuralDamage", [impactPath]);

  await page.click("[data-tool='charge']");
  await sleep(250);
  const chargePath = join(runDir, "charges-on-structural-members.png");
  await page.screenshot({ path: chargePath, fullPage: true });
  remember("chargePlacementOnStructuralMembers", [chargePath]);

  await page.click("[data-action='detonate']");
  await sleep(1050);
  const detonationPath = join(runDir, "delayed-detonation-collapse.png");
  await page.screenshot({ path: detonationPath, fullPage: true });
  remember("delayedDetonation", [detonationPath]);

  await page.evaluate(() => {
    window.demolitionApp.state.timeScale = 0.1;
    document.querySelector("[data-action='slow']").classList.add("active");
  });
  await sleep(650);
  const slowPath = join(runDir, "slow-motion-active-collapse.png");
  await page.screenshot({ path: slowPath, fullPage: true });
  remember("slowMotionActiveCollapse", [slowPath]);

  await page.evaluate(() => {
    window.demolitionApp.state.timeScale = 1;
    document.querySelector("[data-action='slow']").classList.remove("active");
    const warehouse = window.demolitionApp.buildings.find((building) => building.id === "warehouse");
    warehouse.startCollapse("chain");
    window.demolitionApp.state.interaction.chainReaction = true;
  });
  await sleep(1200);
  const collapsePerformance = await page.evaluate(() => {
    const sample = window.demolitionApp.samplePerformance();
    window.demolitionApp.state.diagnostics.lastPerformanceSample = sample;
    return sample;
  });
  const chainPath = join(runDir, "chain-reaction-rubble.png");
  await page.screenshot({ path: chainPath, fullPage: true });
  remember("chainReaction", [chainPath]);

  await page.evaluate(() => {
    const midrise = window.demolitionApp.buildings.find((building) => building.id === "midrise");
    midrise.startCollapse("chain");
    midrise.ruptureWaterTower(midrise.position);
  });
  await sleep(700);
  const waterPath = join(runDir, "water-tower-rupture.png");
  await page.screenshot({ path: waterPath, fullPage: true });
  remember("waterTowerRupture", [waterPath]);

  const spanData = await page.evaluate(() => window.demolitionApp.advanceForEvidence(53, 0.1));
  const spanPath = join(runDir, "snapshot-span-diagnostics.json");
  writeFileSync(spanPath, JSON.stringify(spanData.rewind, null, 2));
  remember("snapshot60SecondSpan", [spanPath]);

  await page.click("[data-action='camera']");
  await sleep(400);
  const cameraPath = join(runDir, "action-camera-collapse.png");
  await page.screenshot({ path: cameraPath, fullPage: true });
  remember("actionCameraToggle", [cameraPath]);

  await page.selectOption("#quality", "low");
  await sleep(300);
  const lowQuality = await page.evaluate(() => window.demolitionApp.getDiagnostics().quality);
  await page.selectOption("#quality", "high");
  await sleep(300);
  const highQuality = await page.evaluate(() => window.demolitionApp.getDiagnostics().quality);
  const qualityPath = join(runDir, "quality-selector-diagnostics.json");
  writeFileSync(qualityPath, JSON.stringify({ lowQuality, highQuality }, null, 2));
  remember("qualitySelectorBehavior", [qualityPath]);

  const scrubBackData = await page.evaluate(() => {
    const app = window.demolitionApp;
    const last = app.state.snapshots.length - 1;
    app.scrubTo(Math.max(0, Math.min(last - 16, 48)));
    return app.getDiagnostics();
  });
  await sleep(250);
  const scrubBackPath = join(runDir, "timeline-scrub-backward.png");
  await page.screenshot({ path: scrubBackPath, fullPage: true });
  const scrubForwardData = await page.evaluate(() => {
    const app = window.demolitionApp;
    app.scrubTo(app.state.snapshots.length - 1);
    return app.getDiagnostics();
  });
  await sleep(250);
  const scrubForwardPath = join(runDir, "timeline-scrub-forward.png");
  await page.screenshot({ path: scrubForwardPath, fullPage: true });
  remember("timelineScrubBackwardForward", [scrubBackPath, scrubForwardPath]);

  await page.click("[data-action='rewind']");
  await page.waitForFunction(() => window.demolitionApp.getDiagnostics().interaction.fullRewindNoReload, null, { timeout: 45000 });
  await sleep(300);
  const rewindPath = join(runDir, "full-rewind-pristine-no-reload.png");
  await page.screenshot({ path: rewindPath, fullPage: true });
  remember("fullRewindPristineNoReload", [rewindPath]);

  await page.click("[data-action='reset']");
  await sleep(600);
  const resetPath = join(runDir, "reset-city-rebuild-animation.png");
  await page.screenshot({ path: resetPath, fullPage: true });
  remember("resetCityRebuildAnimation", [resetPath]);
  await sleep(1000);

  const diagnostics = await page.evaluate(() => {
    const app = window.demolitionApp;
    return app.getDiagnostics();
  });
  const diagnosticsPath = join(runDir, "diagnostics-final.json");
  writeFileSync(diagnosticsPath, JSON.stringify({ diagnostics, scrubBackData, scrubForwardData, collapsePerformance, spanData }, null, 2));
  remember("rewindDiagnostics", [diagnosticsPath]);

  const networkPath = join(runDir, "network-summary.json");
  writeFileSync(networkPath, JSON.stringify(network, null, 2));
  remember("networkSummary", [networkPath]);

  const consolePath = join(runDir, "console-log.txt");
  writeFileSync(consolePath, [...consoleMessages, ...pageErrors].join("\n"));
  remember("consoleLog", [consolePath]);

  const evidenceMapPath = join(runDir, "interaction-evidence-map.json");
  writeFileSync(evidenceMapPath, JSON.stringify(evidence, null, 2));

  const forbiddenRequests = network.filter((request) =>
    ["image", "font", "media"].includes(request.type) ||
    /\.(png|jpe?g|webp|gif|svg|avif|ico|glb|gltf|obj|fbx|hdr|exr|mp3|wav|ogg|mp4|mov|webm|woff2?|ttf|otf)(\?|$)/i.test(request.url)
  );
  const failedRequests = network.filter((request) => request.failure);
  const failedFlags = Object.entries(diagnostics.interaction).filter(([, value]) => !value).map(([key]) => key);

  assert(pageErrors.length === 0, `page errors present: ${pageErrors.join("; ")}`);
  assert(!consoleMessages.some((message) => message.startsWith("error:")), "browser console errors present");
  assert(failedRequests.length === 0, `failed requests: ${JSON.stringify(failedRequests)}`);
  assert(forbiddenRequests.length === 0, `forbidden visual/audio asset requests: ${JSON.stringify(forbiddenRequests)}`);
  assert(failedFlags.length === 0, `interaction flags missing: ${failedFlags.join(", ")}`);
  assert(desktopCanvasStats.nonBlack > 0 && desktopCanvasStats.uniqueColors > 1, "desktop canvas appears blank");
  assert(mobileCanvasStats.nonBlack > 0 && mobileCanvasStats.uniqueColors > 1, "mobile canvas appears blank");
  assert(diagnostics.rewind.capacitySeconds >= 60, "rewind capacity below 60 seconds");
  assert(diagnostics.rewind.recordedSpanSeconds >= 60, "recorded rewind span below 60 seconds");
  assert(diagnostics.rewind.snapshotCount > 10, "not enough snapshots captured");
  assert(diagnostics.rewind.registeredSystems.includes("structural members"), "rewind systems missing structural members");
  assert(diagnostics.importContract.runtimeBundler === "none", "runtime bundler must be none");
  assert(diagnostics.importContract.browserImports.every((specifier) => specifier === "three" || specifier.startsWith("three/addons/")), "bad browser imports");
  assert(diagnostics.performance.lastSample?.estimatedFps > 0, "missing performance FPS sample");
  assert(diagnostics.performance.lastSample?.activeDebris > 0, "performance sample was not taken during debris-heavy collapse");
  assert(diagnostics.performance.lastSample?.collapseActive === true, "performance sample was not taken during active collapse");

  writeFileSync(join(runDir, "verification-summary.json"), JSON.stringify({
    url,
    evidence,
    diagnostics,
    forbiddenRequests,
    failedRequests,
    consoleMessages,
    pageErrors,
    result: "passed"
  }, null, 2));

  console.log(`verification passed: ${runDir}`);
} finally {
  if (browser) await browser.close();
  writeFileSync(join(runDir, "server-log.txt"), serverLog.join(""));
  server.kill();
}
