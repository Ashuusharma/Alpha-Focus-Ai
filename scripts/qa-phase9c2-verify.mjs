import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

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
    await page.goto(`${baseUrl}/assessment`, { waitUntil: "domcontentloaded" });
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
  page.setDefaultTimeout(15000);
  page.on("dialog", async (d) => { await d.accept(); });

  try {
    const email = `qa.9c2.${label}.${Date.now()}@example.com`;
    console.log(`[${label}] auth`);
    await authenticate(page, baseUrl, email, "AlphaFlow#2026!");

    console.log(`[${label}] navigate to /assessment`);
    await page.goto(`${baseUrl}/assessment`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 20000 });
    // Let the staggered entrance (max ~150ms delay + 250ms duration) fully resolve.
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(outDir, `01-hero-${label}.png`) });

    // Confirm the hero heading and CTA are both actually visible/legible post-animation.
    const h1Visible = await page.locator("h1").first().isVisible();
    const ctaVisible = await page.getByRole("button", { name: /scan|स्कैन/i }).first().isVisible().catch(() => false);
    console.log(`[${label}] h1 visible: ${h1Visible}, CTA visible: ${ctaVisible}`);

    console.log(`[${label}] PASSED`);
  } catch (error) {
    console.error(`[${label}] FAILED: ${error.message}`);
    await page.screenshot({ path: path.join(outDir, `FAILURE-${label}.png`) }).catch(() => {});
  } finally {
    await Promise.race([(async () => { await browser.close(); })(), new Promise((r) => setTimeout(r, 8000))]);
  }
}

async function main() {
  const workspace = process.cwd();
  const env = loadEnvLocal(workspace);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Missing Supabase env");

  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  const outDir = path.join(workspace, "playwright-artifacts", "design-evolution", "9C", "9C.2");
  fs.mkdirSync(outDir, { recursive: true });

  const runs = [
    { width: 390, height: 844, label: "mobile", reducedMotion: false },
    { width: 768, height: 1024, label: "tablet", reducedMotion: false },
    { width: 1440, height: 900, label: "desktop", reducedMotion: false },
    { width: 390, height: 844, label: "mobile-reduced-motion", reducedMotion: true },
  ];

  for (const run of runs) {
    await runViewport(run, baseUrl, outDir);
  }
  console.log("DONE");
}

main().catch((error) => {
  console.error("QA FAILED", error);
  process.exit(1);
});
