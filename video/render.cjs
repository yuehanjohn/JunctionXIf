// Deterministic frame renderer. Scenes are JS modules injected into
// template.html; each defines window.SCENE = { draw(ctx,t,W,H), duration }.
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

const ROOT = __dirname;
const FPS = 30;
const W = 1920, H = 1080;

async function renderScene(browser, sceneName, durationSec) {
  const framesDir = path.join(ROOT, "build", "frames", sceneName);
  fs.mkdirSync(framesDir, { recursive: true });
  const htmlPath = "file://" + path.join(ROOT, "scenes", "template.html").replace(/\\/g, "/");

  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(htmlPath, { waitUntil: "load" });

  // preload all product screens and shared assets as base64 data URLs
  const screensDir = path.join(ROOT, "build", "product_screens");
  const assetMap = {};
  if (fs.existsSync(screensDir)) {
    const files = fs.readdirSync(screensDir);
    for (const file of files) {
      if (file.endsWith(".png") || file.endsWith(".jpg")) {
        const name = path.basename(file, path.extname(file));
        const buf = fs.readFileSync(path.join(screensDir, file));
        assetMap[name] = `data:image/png;base64,${buf.toString("base64")}`;
      }
    }
  }
  const logoPath = path.join(ROOT, "build", "if-logo.png");
  if (fs.existsSync(logoPath)) {
    const buf = fs.readFileSync(logoPath);
    assetMap["logo"] = `data:image/png;base64,${buf.toString("base64")}`;
  }

  console.log(`Preloading ${Object.keys(assetMap).length} assets into template...`);
  await page.evaluate(async (assets) => {
    window.ASSETS = {};
    const promises = Object.entries(assets).map(([key, dataUrl]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { window.ASSETS[key] = img; resolve(); };
        img.onerror = () => { window.ASSETS[key] = null; resolve(); };
        img.src = dataUrl;
      });
    });
    await Promise.all(promises);
  }, assetMap);

  const sceneSrc = fs.readFileSync(path.join(ROOT, "scenes", sceneName + ".js"), "utf8");
  await page.evaluate(sceneSrc);

  const duration = durationSec || await page.evaluate(() => window.SCENE.duration);
  const total = Math.round(duration * FPS);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const t = i / FPS;
    await page.evaluate((tt) => window.seek(tt), t);
    await page.screenshot({
      path: path.join(framesDir, String(i).padStart(5, "0") + ".png"),
      clip: { x: 0, y: 0, width: W, height: H },
    });
    if (i % 120 === 0) console.log(`  ${sceneName} ${i}/${total} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  await page.close();
  console.log(`  ${sceneName} DONE ${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

(async () => {
  const jobs = JSON.parse(fs.readFileSync(path.join(ROOT, "render-jobs.json"), "utf8"));
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=1", "--hide-scrollbars", "--mute-audio"],
  });
  for (const job of jobs) {
    console.log("scene:", job.scene, (job.duration || "auto") + "s");
    await renderScene(browser, job.scene, job.duration);
  }
  await browser.close();
})();
