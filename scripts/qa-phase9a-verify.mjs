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
    // Report every image as already server-uploaded so the client skips
    // its own dataUrlToBlob(fetch) fallback - fetching a data: URL trips
    // this app's connect-src CSP and can destabilize headless Chromium.
    // The real /api/galaxy/analyze route always returns uploadedImageUrls
    // covering every image; only the QA mock was missing this field.
    const uploadedImageUrls = images.map((_, i) => `https://example.invalid/mock-upload-${i}.jpg`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        provider: "e2e-mock",
        confidence: 91,
        annotatedImageUrl: firstImage,
        uploadedImageUrls,
        hotspots: [{ x: 40, y: 40, label: "Cheek", severity: "medium" }],
        issues: [
          { name: "Baseline Marker", confidence: 91, impact: "moderate", description: "Mocked issue for Phase 9A QA.", affectedArea: "Target region" },
        ],
      }),
    });
  });
}

async function shot(page, dir, name) {
  const p = path.join(dir, `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`  saved ${p}`);
}

async function main() {
  const workspace = process.cwd();
  const env = loadEnvLocal(workspace);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) throw new Error("Missing Supabase env in .env.local");

  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  const outDir = path.join(workspace, "artifacts", "phase9a-qa");
  fs.mkdirSync(outDir, { recursive: true });

  const email = `qa.phase9a.${Date.now()}@example.com`;
  const password = "AlphaFlow#2026!";
  const sampleImage = path.join(workspace, "public", "icons", "icon-512.png");

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await desktop.newPage();
  dp.setDefaultTimeout(8000);
  dp.on("console", (m) => { if (m.type() === "error") console.log(`[browser:error] ${m.text()}`); });
  dp.on("pageerror", (err) => console.log(`[pageerror] ${err.message}`));
  dp.on("crash", () => console.log("[PAGE CRASH EVENT]"));
  dp.on("dialog", async (dialog) => {
    console.log(`[dialog] ${dialog.message()}`);
    await dialog.accept();
  });
  await mockGalaxy(dp);

  try {
    console.log("Step 1: sign up + sign in via /test-auth");
    // Warm up the dev-server route compile before the real attempt so the
    // first real fetch isn't racing Next.js's on-demand compilation.
    await dp.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });
    await dp.waitForTimeout(1000);

    let authed = false;
    for (let attempt = 1; attempt <= 3 && !authed; attempt += 1) {
      if (attempt > 1) {
        console.log(`  retrying sign up/in (attempt ${attempt})`);
        await dp.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });
        await dp.waitForTimeout(1000);
      }
      const authPanel = dp.locator("div", { hasText: "Supabase Auth Test" }).first();
      await dp.getByPlaceholder("email").fill(email);
      await dp.getByPlaceholder("password").fill(password);
      await authPanel.locator("button", { hasText: /^Sign Up$/ }).first().click();
      await dp.waitForTimeout(2500);
      await authPanel.locator("button", { hasText: /^Sign In$/ }).first().click();
      await dp.waitForTimeout(2500);

      authed = await dp.getByText("Logout", { exact: false }).isVisible().catch(() => false);
    }
    if (!authed) throw new Error("Could not establish an authenticated session after 3 attempts.");
    console.log("  authenticated (Logout control visible)");

    console.log("Step 2: AI Laboratory (no scan yet) - desktop, English");
    await dp.goto(`${baseUrl}/assessment`, { waitUntil: "domcontentloaded" });
    await dp.waitForTimeout(1500);
    await shot(dp, outDir, "01-ai-lab-desktop-en");

    console.log("Step 3: AI Laboratory - mobile viewport, English");
    await dp.setViewportSize({ width: 390, height: 844 });
    await dp.waitForTimeout(400);
    await shot(dp, outDir, "02-ai-lab-mobile-en");
    await dp.setViewportSize({ width: 1440, height: 900 });

    console.log("Step 4: run analyzer -> assessment flow (lip_care, mocked vision)");
    await dp.goto(`${baseUrl}/image-analyzer`, { waitUntil: "domcontentloaded" });
    await dp.getByRole("button", { name: /^Lip Care\b/i }).first().click({ timeout: 15000 });
    await dp.waitForTimeout(700);
    const fileInput = dp.locator('input[type="file"]');
    await fileInput.first().setInputFiles(sampleImage);
    await dp.waitForTimeout(1200);
    // Multi-angle upload: one photo is enough to unlock the partial-set
    // "Analyze N Photo(s)" shortcut, which moves to the Review step; from
    // there "Start AI Analysis" actually kicks off the vision call.
    const partialBtn = dp.getByRole("button", { name: /Analyze \d+ Photos?/i });
    await partialBtn.first().waitFor({ state: "visible", timeout: 15000 });
    await partialBtn.first().click({ timeout: 15000 });
    await dp.waitForTimeout(500);
    const startBtn = dp.getByRole("button", { name: /Start AI Analysis/i });
    await startBtn.first().waitFor({ state: "visible", timeout: 15000 });
    await startBtn.first().click({ timeout: 15000 });

    console.log("Step 5: image-analyzer done step - AI confidence stars");
    await dp.waitForFunction(() => (document.body?.innerText || "").includes("Analysis Complete"), { timeout: 60000 });
    await dp.waitForTimeout(500);
    await shot(dp, outDir, "03-image-analyzer-done-confidence");

    await dp.getByRole("button", { name: /Continue to Assessment/i }).click({ timeout: 15000 });
    await dp.waitForURL(/\/assessment/, { timeout: 30000 });
    // validateFlow() runs a few sequential Supabase queries before the
    // "Preparing your AI Laboratory" skeleton resolves - wait for one of
    // the real terminal states instead of a guessed fixed delay (a plain
    // absence-of-loading-text check can false-positive on a blank frame
    // mid-render).
    await dp.waitForFunction(() => {
      const text = document.body?.innerText || "";
      return text.includes("Begin Assessment") || text.includes("Choose an Analyzer") || text.includes("Answer based on recent");
    }, { timeout: 30000 });
    await dp.waitForTimeout(300);

    const stillLab = await dp.getByText("Choose an Analyzer", { exact: false }).isVisible().catch(() => false);
    if (stillLab) throw new Error("Expected the guided question flow, but AI Laboratory rendered instead (no fresh scan detected).");

    console.log("Step 6: welcome gate screen");
    await shot(dp, outDir, "04-assessment-welcome-en");
    const begin = dp.getByRole("button", { name: /Begin Assessment/i });
    if (await begin.isVisible().catch(() => false)) {
      await begin.click({ timeout: 10000 });
      await dp.waitForFunction(() => (document.body?.innerText || "").includes("Answer based on recent"), { timeout: 15000 });
    }

    console.log("Step 7: first question card - plain language + emoji");
    await shot(dp, outDir, "05-assessment-question-en");

    console.log("Step 8: toggle to Hindi, verify translated question renders");
    await dp.getByRole("button", { name: /हिन्दी/ }).first().click({ timeout: 10000 });
    await dp.waitForTimeout(500);
    await shot(dp, outDir, "06-assessment-question-hi");
    await dp.getByRole("button", { name: /English/ }).first().click({ timeout: 10000 });
    await dp.waitForTimeout(500);

    console.log("Step 9: answer all questions, reach review screen");
    // Real Playwright locators with awaited clicks (not raw DOM .click()
    // via page.evaluate) so each step waits for React to actually commit
    // the re-render before the next decision is made.
    const reviewBtn = dp.getByRole("button", { name: /Review Answers/i });
    const nextBtn = dp.getByRole("button", { name: /Next Question/i });
    // Question options only - excludes the header's unrelated "Recovery
    // Track" radiogroup (beginner / intermediate / advanced).
    const optionRadio = dp.locator('[role="radiogroup"]:not([aria-label="Recovery track"]) [role="radio"]');

    for (let i = 0; i < 20; i += 1) {
      if (await reviewBtn.isEnabled().catch(() => false)) {
        await reviewBtn.click({ timeout: 5000 });
        console.log(`  [${i}] clicked Review Answers`);
        break;
      }
      if (await nextBtn.isEnabled().catch(() => false)) {
        await nextBtn.click({ timeout: 5000 });
        console.log(`  [${i}] clicked Next Question`);
        await dp.waitForTimeout(1200);
        continue;
      }
      await optionRadio.first().click({ timeout: 5000 });
      console.log(`  [${i}] answered current question`);
      await dp.waitForTimeout(1200);
    }

    await dp.waitForFunction(() => (document.body?.innerText || "").includes("Assessment Complete"), { timeout: 15000 });
    console.log("Step 10: review-answers / completion celebration screen");
    await shot(dp, outDir, "07-assessment-review-complete-en");

    console.log("Step 11: generate recovery plan, reach staged loading + /result");
    await dp.getByRole("button", { name: /Generate Recovery Plan/i }).click({ timeout: 10000 });
    await dp.waitForTimeout(1200);
    await shot(dp, outDir, "08-assessment-staged-loading");

    await dp.waitForURL(/\/result/, { timeout: 60000 });
    console.log(`Final URL: ${dp.url()}`);
    console.log("PHASE 9A QA FLOW: PASSED");
  } catch (error) {
    console.error(`Failure error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`Failure URL: ${dp.url()}`);
    const bodyText = await dp.locator("body").innerText({ timeout: 4000 }).catch((e) => `<innerText failed: ${e.message}>`);
    if (bodyText) console.error(`Failure body preview: ${bodyText.slice(0, 800)}`);
    await shot(dp, outDir, "FAILURE").catch((e) => console.error(`screenshot failed: ${e.message}`));
    throw error;
  } finally {
    await Promise.race([
      (async () => { await desktop.close(); await browser.close(); })(),
      new Promise((resolve) => setTimeout(resolve, 10000)),
    ]);
  }
}

main().catch((error) => {
  console.error("❌ PHASE 9A QA FAILED");
  console.error(error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
  process.exit(1);
});
