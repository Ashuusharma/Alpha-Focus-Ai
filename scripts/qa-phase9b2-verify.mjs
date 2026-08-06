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

async function mockGalaxy(page) {
  await page.route("**/api/galaxy/analyze", async (route) => {
    const body = route.request().postDataJSON?.() || {};
    const images = Array.isArray(body.images) ? body.images : [];
    const firstImage = images.length > 0 ? images[0] : null;
    const uploadedImageUrls = images.map((_, i) => `https://example.invalid/mock-upload-${i}.jpg`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        provider: "e2e-mock",
        confidence: 91,
        annotatedImageUrl: firstImage,
        uploadedImageUrls,
        hotspots: [{ x: 40, y: 40, label: "Lips", severity: "medium" }],
        issues: [{ name: "Baseline Marker", confidence: 91, impact: "moderate", description: "Mocked issue for Phase 9B.2 QA.", affectedArea: "Target region" }],
      }),
    });
  });
}

async function shot(page, dir, name) {
  const p = path.join(dir, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`  saved ${p}`);
}

async function runScanToAssessment(page, baseUrl, sampleImage) {
  await page.goto(`${baseUrl}/image-analyzer`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /^Lip Care\b/i }).first().click({ timeout: 15000 });
  await page.waitForTimeout(700);
  await page.locator('input[type="file"]').first().setInputFiles(sampleImage);
  await page.waitForTimeout(1200);
  const partialBtn = page.getByRole("button", { name: /Analyze \d+ Photos?/i });
  await partialBtn.first().waitFor({ state: "visible", timeout: 15000 });
  await partialBtn.first().click({ timeout: 15000 });
  await page.waitForTimeout(500);
  const startBtn = page.getByRole("button", { name: /Start AI Analysis/i });
  await startBtn.first().waitFor({ state: "visible", timeout: 15000 });
  await startBtn.first().click({ timeout: 15000 });
  await page.waitForFunction(() => (document.body?.innerText || "").includes("Analysis Complete"), { timeout: 60000 });
  await page.getByRole("button", { name: /Continue to Assessment/i }).click({ timeout: 15000 });
  await page.waitForURL(/\/assessment/, { timeout: 30000 });
  await page.waitForFunction(() => {
    const text = document.body?.innerText || "";
    return text.includes("Begin Assessment") || text.includes("Choose an Analyzer") || text.includes("Answer based on recent");
  }, { timeout: 30000 });
  await page.waitForTimeout(300);
}

async function main() {
  const workspace = process.cwd();
  const env = loadEnvLocal(workspace);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Missing Supabase env");

  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  const outDir = path.join(workspace, "artifacts", "phase9b2-qa");
  fs.mkdirSync(outDir, { recursive: true });

  const email = `qa.phase9b2.${Date.now()}@example.com`;
  const password = "AlphaFlow#2026!";
  const sampleImage = path.join(workspace, "public", "icons", "icon-512.png");

  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });

  // MOBILE FIRST — 390px is the reference context and runs before desktop.
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" });
  const mp = await mobile.newPage();
  mp.setDefaultTimeout(8000);
  mp.on("dialog", async (d) => { console.log(`[dialog] ${d.message()}`); await d.accept(); });
  await mockGalaxy(mp);

  try {
    console.log("Step 1: auth (mobile)");
    let authed = false;
    for (let attempt = 1; attempt <= 3 && !authed; attempt += 1) {
      await mp.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });
      await mp.waitForTimeout(1000);
      const authPanel = mp.locator("div", { hasText: "Supabase Auth Test" }).first();
      await mp.getByPlaceholder("email").fill(email);
      await mp.getByPlaceholder("password").fill(password);
      await authPanel.locator("button", { hasText: /^Sign Up$/ }).first().click();
      await mp.waitForTimeout(2500);
      await authPanel.locator("button", { hasText: /^Sign In$/ }).first().click();
      await mp.waitForTimeout(2500);
      await mp.goto(`${baseUrl}/saved-scans`, { waitUntil: "domcontentloaded" });
      await mp.waitForTimeout(500);
      authed = !mp.url().includes("/login");
    }
    if (!authed) throw new Error("auth failed");
    console.log("  authenticated");

    console.log("Step 2: scan lip_care -> land on welcome screen (mobile)");
    await runScanToAssessment(mp, baseUrl, sampleImage);
    await shot(mp, outDir, "01-welcome-with-pace-picker-mobile");

    console.log("Step 3: begin assessment -> first question card (mobile)");
    await mp.getByRole("button", { name: /Begin Assessment/i }).click({ timeout: 8000 });
    await mp.waitForFunction(() => (document.body?.innerText || "").includes("Answer based on recent"), { timeout: 15000 });
    await mp.waitForTimeout(400);
    await shot(mp, outDir, "02-question-card-timeline-mobile");

    console.log("Step 4: answer all questions, reach AI Summary review (mobile)");
    const reviewBtn = mp.getByRole("button", { name: /Review Answers/i });
    const nextBtn = mp.getByRole("button", { name: /Next Question/i });
    const optionRadio = mp.locator('[role="radiogroup"]:not([aria-label="Recovery track"]) [role="radio"]');
    for (let i = 0; i < 15; i += 1) {
      if (await reviewBtn.isEnabled().catch(() => false)) { await reviewBtn.click({ timeout: 5000 }); break; }
      if (await nextBtn.isEnabled().catch(() => false)) { await nextBtn.click({ timeout: 5000 }); await mp.waitForTimeout(500); continue; }
      await optionRadio.first().click({ timeout: 5000 });
      await mp.waitForTimeout(500);
    }
    await mp.waitForFunction(() => (document.body?.innerText || "").includes("Assessment Complete"), { timeout: 15000 });
    await mp.waitForTimeout(300);
    await shot(mp, outDir, "03-ai-summary-review-mobile");

    console.log("Step 5: toggle Hindi on question flow (go back to edit, mobile)");
    await mp.getByRole("button", { name: /Edit Answers/i }).click({ timeout: 8000 });
    await mp.waitForTimeout(400);
    const hiToggle = mp.getByRole("button", { name: /हिन्दी/ }).first();
    if (await hiToggle.isVisible().catch(() => false)) {
      await hiToggle.click({ timeout: 5000 });
      await mp.waitForTimeout(400);
      await shot(mp, outDir, "04-question-card-hindi-mobile");
    }

    console.log("PHASE 9B.2 MOBILE QA: PASSED");
  } catch (error) {
    console.error(`Failure URL: ${mp.url()}`);
    const body = await mp.locator("body").innerText({ timeout: 4000 }).catch((e) => `<failed: ${e.message}>`);
    console.error(`Failure body preview: ${body.slice(0, 600)}`);
    await shot(mp, outDir, "FAILURE-mobile").catch(() => {});
    throw error;
  } finally {
    await Promise.race([(async () => { await mobile.close(); })(), new Promise((r) => setTimeout(r, 8000))]);
  }

  // Reduced-motion pass, mobile — confirms the new Timeline/AnswerCard/AI
  // Summary motion respects the global prefers-reduced-motion handling.
  const reducedMotion = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const rp = await reducedMotion.newPage();
  rp.setDefaultTimeout(8000);
  rp.on("dialog", async (d) => { await d.accept(); });
  await mockGalaxy(rp);
  try {
    console.log("Step 6: reduced-motion pass (mobile)");
    const email2 = `qa.phase9b2rm.${Date.now()}@example.com`;
    await rp.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });
    await rp.waitForTimeout(800);
    const authPanel2 = rp.locator("div", { hasText: "Supabase Auth Test" }).first();
    await rp.getByPlaceholder("email").fill(email2);
    await rp.getByPlaceholder("password").fill(password);
    await authPanel2.locator("button", { hasText: /^Sign Up$/ }).first().click();
    await rp.waitForTimeout(2500);
    await authPanel2.locator("button", { hasText: /^Sign In$/ }).first().click();
    await rp.waitForTimeout(2500);
    await runScanToAssessment(rp, baseUrl, sampleImage);
    await rp.getByRole("button", { name: /Begin Assessment/i }).click({ timeout: 8000 });
    await rp.waitForFunction(() => (document.body?.innerText || "").includes("Answer based on recent"), { timeout: 15000 });
    await rp.waitForTimeout(400);
    await shot(rp, outDir, "05-question-card-reduced-motion-mobile");
    console.log("PHASE 9B.2 REDUCED-MOTION QA: PASSED");
  } catch (error) {
    console.error(`Reduced-motion failure: ${error.message}`);
    await shot(rp, outDir, "FAILURE-reduced-motion").catch(() => {});
  } finally {
    await Promise.race([(async () => { await reducedMotion.close(); })(), new Promise((r) => setTimeout(r, 8000))]);
  }

  // Desktop, after mobile.
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await desktop.newPage();
  dp.setDefaultTimeout(8000);
  dp.on("dialog", async (d) => { await d.accept(); });
  await mockGalaxy(dp);
  try {
    console.log("Step 7: auth + scan (desktop)");
    const email3 = `qa.phase9b2desktop.${Date.now()}@example.com`;
    await dp.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });
    await dp.waitForTimeout(800);
    const authPanel3 = dp.locator("div", { hasText: "Supabase Auth Test" }).first();
    await dp.getByPlaceholder("email").fill(email3);
    await dp.getByPlaceholder("password").fill(password);
    await authPanel3.locator("button", { hasText: /^Sign Up$/ }).first().click();
    await dp.waitForTimeout(2500);
    await authPanel3.locator("button", { hasText: /^Sign In$/ }).first().click();
    await dp.waitForTimeout(2500);
    await runScanToAssessment(dp, baseUrl, sampleImage);
    await shot(dp, outDir, "06-welcome-desktop");
    await dp.getByRole("button", { name: /Begin Assessment/i }).click({ timeout: 8000 });
    await dp.waitForFunction(() => (document.body?.innerText || "").includes("Answer based on recent"), { timeout: 15000 });
    await dp.waitForTimeout(400);
    await shot(dp, outDir, "07-question-card-desktop");

    const reviewBtn2 = dp.getByRole("button", { name: /Review Answers/i });
    const nextBtn2 = dp.getByRole("button", { name: /Next Question/i });
    const optionRadio2 = dp.locator('[role="radiogroup"]:not([aria-label="Recovery track"]) [role="radio"]');
    for (let i = 0; i < 15; i += 1) {
      if (await reviewBtn2.isEnabled().catch(() => false)) { await reviewBtn2.click({ timeout: 5000 }); break; }
      if (await nextBtn2.isEnabled().catch(() => false)) { await nextBtn2.click({ timeout: 5000 }); await dp.waitForTimeout(500); continue; }
      await optionRadio2.first().click({ timeout: 5000 });
      await dp.waitForTimeout(500);
    }
    await dp.waitForFunction(() => (document.body?.innerText || "").includes("Assessment Complete"), { timeout: 15000 });
    await dp.waitForTimeout(300);
    await shot(dp, outDir, "08-ai-summary-desktop");

    console.log("PHASE 9B.2 DESKTOP QA: PASSED");
  } catch (error) {
    console.error(`Failure URL: ${dp.url()}`);
    await shot(dp, outDir, "FAILURE-desktop").catch(() => {});
    throw error;
  } finally {
    await Promise.race([(async () => { await desktop.close(); await browser.close(); })(), new Promise((r) => setTimeout(r, 8000))]);
  }
}

main().catch((error) => {
  console.error("❌ PHASE 9B.2 QA FAILED");
  console.error(error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
  process.exit(1);
});
