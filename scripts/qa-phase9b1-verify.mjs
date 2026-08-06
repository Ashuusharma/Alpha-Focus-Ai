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

async function shot(page, dir, name) {
  const p = path.join(dir, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`  saved ${p}`);
}

async function main() {
  const workspace = process.cwd();
  const env = loadEnvLocal(workspace);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase env in .env.local");
  }

  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  const outDir = path.join(workspace, "artifacts", "phase9b1-qa");
  fs.mkdirSync(outDir, { recursive: true });

  const email = `qa.phase9b1.${Date.now()}@example.com`;
  const password = "AlphaFlow#2026!";

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });

  // Mobile-first: the 390px context is created and used FIRST, per ground
  // rule 1 (mobile is the reference, not an afterthought screenshotted last).
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mobile.newPage();
  mp.setDefaultTimeout(8000);
  mp.on("dialog", async (dialog) => {
    console.log(`[dialog] ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    console.log("Step 1: sign up + sign in via /test-auth (mobile viewport)");
    await mp.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });
    await mp.waitForTimeout(1000);

    let authed = false;
    for (let attempt = 1; attempt <= 3 && !authed; attempt += 1) {
      if (attempt > 1) {
        await mp.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });
        await mp.waitForTimeout(1000);
      }
      const authPanel = mp.locator("div", { hasText: "Supabase Auth Test" }).first();
      await mp.getByPlaceholder("email").fill(email);
      await mp.getByPlaceholder("password").fill(password);
      await authPanel.locator("button", { hasText: /^Sign Up$/ }).first().click();
      await mp.waitForTimeout(2500);
      await authPanel.locator("button", { hasText: /^Sign In$/ }).first().click();
      await mp.waitForTimeout(2500);
      // The mobile nav hides "Logout" behind a hamburger drawer, so check
      // auth by visiting a protected route instead of hunting nav DOM.
      await mp.goto(`${baseUrl}/saved-scans`, { waitUntil: "domcontentloaded" });
      await mp.waitForTimeout(600);
      authed = !mp.url().includes("/login");
    }
    if (!authed) throw new Error("Could not establish an authenticated session after 3 attempts.");
    console.log("  authenticated");

    console.log("Step 2: AI Laboratory - mobile 390px, English");
    await mp.goto(`${baseUrl}/assessment`, { waitUntil: "domcontentloaded" });
    await mp.waitForFunction(() => {
      const text = document.body?.innerText || "";
      return text.includes("Begin Assessment") || text.includes("Choose an Analyzer") || text.includes("Answer based on recent");
    }, { timeout: 30000 });
    await mp.waitForTimeout(400);
    await shot(mp, outDir, "01-ai-lab-mobile-en-full");

    // Focused crops of the key new pieces, still at mobile width.
    console.log("Step 3: hero + glass-stats crop (mobile)");
    await mp.evaluate(() => window.scrollTo(0, 0));
    await mp.waitForTimeout(200);
    await mp.screenshot({ path: path.join(outDir, "02-hero-glass-stats-mobile.png") });
    console.log(`  saved ${path.join(outDir, "02-hero-glass-stats-mobile.png")}`);

    console.log("Step 4: analyzer grid crop (mobile)");
    const analyzerHeading = mp.getByText("Choose an Analyzer", { exact: false });
    await analyzerHeading.scrollIntoViewIfNeeded();
    await mp.waitForTimeout(300);
    await mp.screenshot({ path: path.join(outDir, "03-analyzer-grid-mobile.png") });
    console.log(`  saved ${path.join(outDir, "03-analyzer-grid-mobile.png")}`);

    console.log("Step 5: subscription dark-CTA crop (mobile)");
    const subHeading = mp.getByText("Unlock the capabilities", { exact: false });
    if (await subHeading.isVisible().catch(() => false)) {
      await subHeading.scrollIntoViewIfNeeded();
      await mp.waitForTimeout(300);
      await mp.screenshot({ path: path.join(outDir, "04-subscription-mobile.png") });
      console.log(`  saved ${path.join(outDir, "04-subscription-mobile.png")}`);
    } else {
      console.log("  skipped (user already premium or section not present)");
    }

    console.log("Step 6: toggle Hindi, full page (mobile)");
    await mp.evaluate(() => window.scrollTo(0, 0));
    const hiToggle = mp.getByRole("button", { name: /हिन्दी/ }).first();
    if (await hiToggle.isVisible().catch(() => false)) {
      await hiToggle.click({ timeout: 5000 });
      await mp.waitForTimeout(500);
      await shot(mp, outDir, "05-ai-lab-mobile-hi-full");
    } else {
      console.log("  no Hindi toggle found on this page (unexpected) - skipping");
    }

    console.log("Step 7: image-analyzer picker (AnalyzerCard select-mode) - mobile");
    await mp.goto(`${baseUrl}/image-analyzer`, { waitUntil: "domcontentloaded" });
    await mp.waitForTimeout(1000);
    await shot(mp, outDir, "06-analyzer-picker-mobile");

    console.log("Step 8: select one analyzer, confirm selected-state renders");
    await mp.getByRole("button", { name: /^Acne\b/i }).first().click({ timeout: 8000 });
    await mp.waitForTimeout(500);
    await shot(mp, outDir, "07-analyzer-picker-selected-mobile");

    console.log("PHASE 9B.1 MOBILE QA: PASSED");
  } catch (error) {
    console.error(`Failure URL: ${mp.url()}`);
    const bodyText = await mp.locator("body").innerText({ timeout: 4000 }).catch((e) => `<failed: ${e.message}>`);
    console.error(`Failure body preview: ${bodyText.slice(0, 600)}`);
    await shot(mp, outDir, "FAILURE-mobile").catch(() => {});
    throw error;
  } finally {
    await Promise.race([
      (async () => { await mobile.close(); })(),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);
  }

  // Desktop pass, AFTER mobile — mobile is the reference, desktop confirms
  // the split-hero/grid layout adapts up cleanly, not the other way round.
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await desktop.newPage();
  dp.setDefaultTimeout(8000);

  try {
    console.log("Step 9: sign in again (desktop context) via storage-state-free re-auth");
    await dp.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });
    await dp.waitForTimeout(800);
    const authPanel = dp.locator("div", { hasText: "Supabase Auth Test" }).first();
    await dp.getByPlaceholder("email").fill(email);
    await dp.getByPlaceholder("password").fill(password);
    dp.on("dialog", async (dialog) => { await dialog.accept(); });
    await authPanel.locator("button", { hasText: /^Sign In$/ }).first().click();
    await dp.waitForTimeout(2000);

    console.log("Step 10: AI Laboratory - desktop 1440px, English");
    await dp.goto(`${baseUrl}/assessment`, { waitUntil: "domcontentloaded" });
    await dp.waitForFunction(() => {
      const text = document.body?.innerText || "";
      return text.includes("Begin Assessment") || text.includes("Choose an Analyzer") || text.includes("Answer based on recent");
    }, { timeout: 30000 });
    await dp.waitForTimeout(400);
    await shot(dp, outDir, "08-ai-lab-desktop-en-full");

    console.log("Step 11: image-analyzer picker - desktop");
    await dp.goto(`${baseUrl}/image-analyzer`, { waitUntil: "domcontentloaded" });
    await dp.waitForTimeout(1000);
    await shot(dp, outDir, "09-analyzer-picker-desktop");

    console.log("PHASE 9B.1 DESKTOP QA: PASSED");
  } catch (error) {
    console.error(`Failure URL: ${dp.url()}`);
    await shot(dp, outDir, "FAILURE-desktop").catch(() => {});
    throw error;
  } finally {
    await Promise.race([
      (async () => { await desktop.close(); await browser.close(); })(),
      new Promise((resolve) => setTimeout(resolve, 8000)),
    ]);
  }
}

main().catch((error) => {
  console.error("❌ PHASE 9B.1 QA FAILED");
  console.error(error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
  process.exit(1);
});
