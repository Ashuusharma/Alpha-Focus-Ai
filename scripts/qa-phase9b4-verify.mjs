import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const MODE = process.argv[2] === "after" ? "after" : "before";
const ONLY = process.argv[3];

function loadEnvLocal(workspace) {
  const envPath = path.join(workspace, ".env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

async function shot(page, dir, name) {
  const p = path.join(dir, `${name}-${MODE}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`  saved ${p}`);
}

async function authenticate(page, baseUrl, email, password) {
  let authed = false;
  for (let attempt = 1; attempt <= 3 && !authed; attempt += 1) {
    await page.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const authPanel = page.locator("div", { hasText: "Supabase Auth Test" }).first();
    await page.getByPlaceholder("email").fill(email);
    await page.getByPlaceholder("password").fill(password);
    await authPanel.locator("button", { hasText: /^Sign Up$/ }).first().click();
    await page.waitForTimeout(2500);
    await authPanel.locator("button", { hasText: /^Sign In$/ }).first().click();
    await page.waitForTimeout(2500);
    await page.goto(`${baseUrl}/saved-scans`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    authed = !page.url().includes("/login");
  }
  if (!authed) throw new Error("auth failed");
}

async function runViewport({ width, height, label, reducedMotion }, baseUrl, outDir) {
  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("dialog", async (d) => { console.log(`[dialog] ${d.message()}`); await d.accept(); });

  try {
    const email = `qa.9b4.${label}.${Date.now()}@example.com`;
    console.log(`[${label}] auth`);
    await authenticate(page, baseUrl, email, "AlphaFlow#2026!");

    console.log(`[${label}] navigate to dashboard`);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => (document.body?.innerText || "").includes("Welcome back"), { timeout: 20000 });
    await page.waitForTimeout(800);
    await shot(page, outDir, `01-dashboard-full-${label}`);

    console.log(`[${label}] hero crop`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, `02-hero-${label}-${MODE}.png`) });
    console.log(`  saved ${path.join(outDir, `02-hero-${label}-${MODE}.png`)}`);

    console.log(`[${label}] KPI grid crop`);
    const kpiHeading = page.getByText("Clinical Signal Summary", { exact: false });
    if (await kpiHeading.isVisible().catch(() => false)) {
      await kpiHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, `03-kpi-grid-${label}-${MODE}.png`) });
      console.log(`  saved ${path.join(outDir, `03-kpi-grid-${label}-${MODE}.png`)}`);
    }

    console.log(`[${label}] AI Coach crop`);
    const aiHeading = page.getByText("What we're noticing", { exact: false });
    if (await aiHeading.isVisible().catch(() => false)) {
      await aiHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, `04-ai-coach-${label}-${MODE}.png`) });
      console.log(`  saved ${path.join(outDir, `04-ai-coach-${label}-${MODE}.png`)}`);
    }

    console.log(`[${label}] PASSED`);
  } catch (error) {
    console.error(`[${label}] FAILED: ${error.message}`);
    const url = await Promise.resolve().then(() => page.url()).catch(() => "<unknown>");
    console.error(`[${label}] FAILURE URL: ${url}`);
    const body = await page.locator("body").innerText({ timeout: 4000 }).catch((e) => `<failed: ${e.message}>`);
    console.error(`[${label}] body preview: ${body.slice(0, 500)}`);
    await shot(page, outDir, `FAILURE-${label}`).catch(() => {});
  } finally {
    await Promise.race([(async () => { await browser.close(); })(), new Promise((r) => setTimeout(r, 8000))]);
  }
}

async function main() {
  const workspace = process.cwd();
  const env = loadEnvLocal(workspace);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Missing Supabase env");

  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  const outDir = path.join(workspace, "playwright-artifacts", "design-evolution", "9B", "9B.4");
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`=== Phase 9B.4 screenshot capture: ${MODE.toUpperCase()} ===`);

  const runs = [
    { width: 390, height: 844, label: "mobile", reducedMotion: false },
    { width: 390, height: 844, label: "mobile-reduced-motion", reducedMotion: true },
    { width: 1440, height: 900, label: "desktop", reducedMotion: false },
  ].filter((r) => !ONLY || r.label === ONLY);

  for (const run of runs) {
    await runViewport(run, baseUrl, outDir);
  }
  console.log(`=== DONE: ${MODE.toUpperCase()} ===`);
}

main().catch((error) => {
  console.error("❌ PHASE 9B.4 QA FAILED");
  console.error(error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
  process.exit(1);
});
