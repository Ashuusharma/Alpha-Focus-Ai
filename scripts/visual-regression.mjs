import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "artifacts", "visual-baselines");

const PAGES = [
  { slug: "dashboard", route: "/dashboard" },
  { slug: "result", route: "/result" },
  { slug: "alpha-credits", route: "/alpha-credits" },
  { slug: "shop", route: "/shop" },
  { slug: "checkout", route: "/checkout" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

function ensureOutput() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function capture(page, slug, route, viewportName) {
  const safeRoute = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
  const fileName = `${slug}-${safeRoute}-${viewportName}.png`;
  const outPath = path.join(OUT_DIR, fileName);
  await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: outPath, fullPage: true });
  return outPath;
}

async function main() {
  ensureOutput();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const captured = [];
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const target of PAGES) {
      const outPath = await capture(page, target.slug, target.route, viewport.name);
      captured.push(path.relative(process.cwd(), outPath));
      process.stdout.write(`Captured ${path.basename(outPath)}\n`);
    }
  }

  await browser.close();

  process.stdout.write("\nVisual baseline capture complete.\n");
  for (const item of captured) {
    process.stdout.write(`- ${item}\n`);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack || ""}` : JSON.stringify(error);
  console.error("visual-regression failed");
  console.error(message);
  process.exit(1);
});
