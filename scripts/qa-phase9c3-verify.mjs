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
    const email = `qa.9c3.${label}.${Date.now()}@example.com`;
    console.log(`[${label}] auth`);
    await authenticate(page, baseUrl, email, "AlphaFlow#2026!");

    // AnalyzerCard (browse variant) — AI Laboratory grid
    console.log(`[${label}] AI Laboratory (AnalyzerCard/browse)`);
    await page.goto(`${baseUrl}/assessment`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 20000 });
    await page.waitForTimeout(900);
    const analyzerGrid = page.getByText("Choose an Analyzer", { exact: false });
    if (await analyzerGrid.isVisible().catch(() => false)) {
      await analyzerGrid.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: path.join(outDir, `01-analyzer-browse-${label}.png`) });

    // AnalyzerCard (select variant) — image-analyzer picker, unselected + selected
    console.log(`[${label}] Image Analyzer picker (AnalyzerCard/select)`);
    await page.goto(`${baseUrl}/image-analyzer`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, `02-analyzer-select-unselected-${label}.png`) });
    // Target a real analyzer option card specifically (by its visible label), not nav chrome.
    const acneCard = page.getByRole("button", { name: /^Acne/ }).first();
    if (await acneCard.isVisible().catch(() => false)) {
      await acneCard.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(outDir, `03-analyzer-select-selected-${label}.png`) });
    } else {
      console.log(`[${label}] Acne analyzer card not found for selected-state screenshot`);
    }

    // StatCard + AICard — Dashboard
    console.log(`[${label}] Dashboard (StatCard + AICard)`);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => (document.body?.innerText || "").includes("Welcome back"), { timeout: 20000 });
    await page.waitForTimeout(800);
    const kpiHeading = page.getByText("Clinical Signal Summary", { exact: false });
    if (await kpiHeading.isVisible().catch(() => false)) {
      await kpiHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: path.join(outDir, `04-dashboard-statcard-${label}.png`) });

    const aiHeading = page.getByText("What we're noticing", { exact: false });
    if (await aiHeading.isVisible().catch(() => false)) {
      await aiHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, `05-dashboard-aicard-${label}.png`) });
    } else {
      console.log(`[${label}] "What we're noticing" (AICard) not visible — likely no insights for this fresh account`);
    }

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
  const outDir = path.join(workspace, "playwright-artifacts", "design-evolution", "9C", "9C.3");
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
