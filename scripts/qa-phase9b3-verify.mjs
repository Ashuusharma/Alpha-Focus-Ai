import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const MODE = process.argv[2] === "after" ? "after" : "before";

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

const MOCK_REPORT = {
  schemaVersion: "protocol_report.v2.1.0",
  issueSummary: {
    whatWasDetected: ["Frequent breakouts along the jawline", "Mild redness after cleansing"],
    whyItHappens: ["Your uploaded photos and answers suggest hormonal-pattern breakouts, common with stress and diet triggers."],
    whyConsistencyMatters: ["Skin barrier repair takes 3-4 weeks of consistent care to show visible change."],
  },
  mainResolvingIngredients: [
    { ingredient: "Niacinamide 5%", purpose: "Calms inflammation and regulates oil", targets: ["Redness", "Oil balance"], whyItWorks: "Reduces inflammatory signaling in the skin barrier.", expectedTimeline: "2-4 weeks", safetyNotes: ["Patch test first"] },
  ],
  monthlyRecoveryPlan: {
    morning: [{ title: "Gentle Cleanse", purpose: "Remove overnight oil", why: "Prevents pore congestion", steps: ["Rinse with lukewarm water", "Apply cleanser"], timing: "Morning", frequency: "Daily", expectedImprovement: "Less midday shine", mistakesToAvoid: ["Hot water"], escalationCues: ["Increased redness"] }],
    afternoon: [{ title: "SPF Reapply", purpose: "Sun protection", why: "Prevents pigmentation", steps: ["Reapply SPF 30+"], timing: "Midday", frequency: "Daily", expectedImprovement: "Even tone", mistakesToAvoid: ["Skipping"], escalationCues: ["Sunburn"] }],
    night: [{ title: "Treatment Serum", purpose: "Active repair", why: "Skin repairs overnight", steps: ["Apply niacinamide serum"], timing: "Night", frequency: "Daily", expectedImprovement: "Reduced breakouts", mistakesToAvoid: ["Overuse"], escalationCues: ["Irritation"] }],
    weekly: [{ title: "Gentle Exfoliation", purpose: "Remove buildup", why: "Prevents clogged pores", steps: ["Use exfoliant 1x/week"], timing: "Weekly", frequency: "1x/week", expectedImprovement: "Smoother texture", mistakesToAvoid: ["Over-exfoliating"], escalationCues: ["Sensitivity"] }],
  },
  thingsToAvoid: { food: [], habits: [], environment: [], productMistakes: [] },
  recommendedProducts: [
    { productId: "barrier-calm-cleanser", name: "Barrier Calm Cleanser", whyRecommended: "Gentle, non-stripping formula", howToUse: "Massage onto damp skin", applicationArea: "Face", amount: "Coin-sized", timing: "AM/PM", expectedImprovement: "Reduced irritation", compatibilityWithCurrentRoutine: "Fits any routine" },
  ],
  dietPlan: { breakfast: ["Oats with berries"], lunch: ["Grilled protein with greens"], dinner: ["Light soup"], snacks: ["Nuts"], hydration: "8-10 glasses of water daily", wellnessGuidance: ["Prioritize consistent sleep"] },
  motivation: "You're already taking the right first step — consistency over the next 30 days is what turns this plan into real results.",
  expectedTimeline: [1, 2, 3, 4].map((week) => ({ week, expectedImprovements: ["Reduced redness"], possibleSetbacks: ["Mild purging"], continueDoing: ["Daily routine"] })),
  weeklyMilestones: [1, 2, 3, 4].map((week) => ({ week, milestone: `Week ${week} check-in`, adherenceTarget: "80%+" })),
  confidenceNotes: ["High confidence — clear photos and complete answers."],
};

async function mockProtocolFlow(page, { holdQueuedMs = 1400, holdProcessingMs = 1800 } = {}) {
  // Lazily set on the *first* /api/protocol/report poll, not at route
  // registration time — registration happens before the whole scan +
  // assessment UI flow, which alone takes 60-100s of real wall-clock time,
  // so a fixed-at-registration timestamp would blow past the hold windows
  // before polling even starts.
  let jobStart = null;
  await page.route("**/api/galaxy/analyze", async (route) => {
    const body = route.request().postDataJSON?.() || {};
    const images = Array.isArray(body.images) ? body.images : [];
    const uploadedImageUrls = images.map((_, i) => `https://example.invalid/mock-upload-${i}.jpg`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        provider: "e2e-mock",
        confidence: 91,
        annotatedImageUrl: images[0] || null,
        uploadedImageUrls,
        hotspots: [{ x: 40, y: 40, label: "Jawline", severity: "medium" }],
        issues: [{ name: "Baseline Marker", confidence: 91, impact: "moderate", description: "Mocked issue for Phase 9B.3 QA.", affectedArea: "Target region" }],
      }),
    });
  });

  await page.route("**/api/protocol/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, status: "queued", reportId: "mock-report-id", jobId: "mock-job-id" }),
    });
  });

  await page.route(/\/api\/protocol\/report/, async (route) => {
    if (jobStart === null) jobStart = Date.now();
    const elapsed = Date.now() - jobStart;
    console.log(`  [mock] /api/protocol/report intercepted, elapsed=${elapsed}ms`);
    let status = "queued";
    if (elapsed > holdQueuedMs + holdProcessingMs) status = "ready";
    else if (elapsed > holdQueuedMs) status = "processing";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        report: {
          id: "mock-report-id",
          status,
          generatedAt: status === "ready" ? new Date().toISOString() : null,
          payload: status === "ready" ? MOCK_REPORT : null,
        },
      }),
    });
  });
}

async function shot(page, dir, name) {
  const p = path.join(dir, `${name}-${MODE}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`  saved ${p}`);
}

async function runScanToWelcome(page, baseUrl, sampleImage) {
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

async function answerAllAndSubmit(page) {
  await page.getByRole("button", { name: /Begin Assessment/i }).click({ timeout: 8000 });
  await page.waitForFunction(() => (document.body?.innerText || "").includes("Answer based on recent"), { timeout: 15000 });
  const reviewBtn = page.getByRole("button", { name: /Review Answers/i });
  const nextBtn = page.getByRole("button", { name: /Next Question/i });
  const optionRadio = page.locator('[role="radiogroup"]:not([aria-label="Recovery track"]) [role="radio"]');
  for (let i = 0; i < 15; i += 1) {
    if (await reviewBtn.isEnabled().catch(() => false)) { await reviewBtn.click({ timeout: 5000 }); break; }
    if (await nextBtn.isEnabled().catch(() => false)) { await nextBtn.click({ timeout: 5000 }); await page.waitForTimeout(500); continue; }
    await optionRadio.first().click({ timeout: 5000 });
    await page.waitForTimeout(500);
  }
  await page.waitForFunction(() => (document.body?.innerText || "").includes("Assessment Complete"), { timeout: 15000 });
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /Generate Recovery Plan/i }).click({ timeout: 10000 });
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

async function runViewport({ width, height, label, reducedMotion }, baseUrl, outDir, sampleImage) {
  // A fresh browser PROCESS per viewport (not just a fresh context) —
  // headless Chromium in this sandboxed environment can hard-crash after
  // enough cumulative page activity (a known, environment-specific
  // rendering-stability limit hit repeatedly in earlier phases' QA, not an
  // app defect); isolating each run keeps one crash from taking the rest
  // of the suite down with it.
  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
  // serviceWorkers: "block" — this app registers a PWA service worker that
  // can intercept fetches below Playwright's page.route() hook, which was
  // silently letting /api/protocol/report through to the real server
  // instead of the mock (confirmed via a debug log that never fired).
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("dialog", async (d) => { console.log(`[dialog] ${d.message()}`); await d.accept(); });
  await mockProtocolFlow(page, { holdQueuedMs: 1600, holdProcessingMs: 2200 });

  try {
    const email = `qa.9b3.${label}.${Date.now()}@example.com`;
    console.log(`[${label}] auth`);
    await authenticate(page, baseUrl, email, "AlphaFlow#2026!");

    console.log(`[${label}] scan -> assessment -> answer all`);
    await runScanToWelcome(page, baseUrl, sampleImage);
    await answerAllAndSubmit(page);

    console.log(`[${label}] capturing assessment submitting stages`);
    await page.waitForTimeout(200);
    await shot(page, outDir, `01-assessment-submitting-early-${label}`);
    await page.waitForTimeout(900);
    await shot(page, outDir, `02-assessment-submitting-mid-${label}`);

    console.log(`[${label}] waiting for redirect to /result`);
    await page.waitForURL(/\/result/, { timeout: 30000 });

    console.log(`[${label}] capturing result loading stages`);
    await page.waitForTimeout(300);
    await shot(page, outDir, `03-result-loading-queued-${label}`);
    await page.waitForTimeout(1600);
    await shot(page, outDir, `04-result-loading-processing-${label}`);

    console.log(`[${label}] waiting for report ready + capturing reveal`);
    // Wait for the actual report content (Recovery Roadmap section), not a
    // fixed delay — the mock's hold windows + the real 900ms celebration
    // beat add up to more than a guessed timeout would reliably cover.
    await page.waitForFunction(() => (document.body?.innerText || "").includes("Recovery Roadmap"), { timeout: 20000 });
    await page.waitForTimeout(400);
    await shot(page, outDir, `05-result-ready-reveal-${label}`);

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
  const outDir = path.join(workspace, "playwright-artifacts", "design-evolution", "9B", "9B.3");
  fs.mkdirSync(outDir, { recursive: true });
  const sampleImage = path.join(workspace, "public", "icons", "icon-512.png");

  console.log(`=== Phase 9B.3 screenshot capture: ${MODE.toUpperCase()} ===`);

  const only = process.argv[3];
  const runs = [
    { width: 390, height: 844, label: "mobile", reducedMotion: false },
    { width: 390, height: 844, label: "mobile-reduced-motion", reducedMotion: true },
    { width: 1440, height: 900, label: "desktop", reducedMotion: false },
  ].filter((r) => !only || r.label === only);

  for (const run of runs) {
    await runViewport(run, baseUrl, outDir, sampleImage);
  }
  console.log(`=== DONE: ${MODE.toUpperCase()} ===`);
}

main().catch((error) => {
  console.error("❌ PHASE 9B.3 SCREENSHOT CAPTURE FAILED");
  console.error(error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
  process.exit(1);
});
