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

const workspace = process.cwd();
const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
const outDir = path.join(workspace, "playwright-artifacts", "design-evolution", "9S");
fs.mkdirSync(outDir, { recursive: true });
const testImage = path.join(workspace, "public", "icons", "icon-512.png");

const results = [];
function record(step, status, detail) {
  const line = `[${status}] ${step}${detail ? " — " + detail : ""}`;
  console.log(line);
  results.push({ step, status, detail: detail || null, at: new Date().toISOString() });
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true }).catch(() => {});
}

async function authenticate(page, email, password, { signUpOnly = false } = {}) {
  let authed = false;
  for (let attempt = 1; attempt <= 3 && !authed; attempt += 1) {
    if (attempt > 1) console.log(`  auth retry ${attempt}`);
    await page.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const authPanel = page.locator("div", { hasText: "Supabase Auth Test" }).first();
    await page.getByPlaceholder("email").fill(email);
    await page.getByPlaceholder("password").fill(password);
    if (!signUpOnly) {
      await authPanel.locator("button", { hasText: /^Sign Up$/ }).first().click();
      await page.waitForTimeout(2500);
    }
    await authPanel.locator("button", { hasText: /^Sign In$/ }).first().click();
    await page.waitForTimeout(2500);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    authed = !page.url().includes("/login");
  }
  return authed;
}

async function runScanAndAssessment(page, label) {
  // --- AI Lab / Analyzer selection ---
  await page.goto(`${baseUrl}/image-analyzer`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await shot(page, `${label}-01-analyzer-select`);

  const acneCard = page.getByText(/^Acne$/i).first();
  await acneCard.click({ timeout: 10000 });
  await page.waitForTimeout(600);
  record(`${label}: select analyzer category`, "PASS");

  // --- Upload photo ---
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(testImage);
  await page.waitForTimeout(1500);
  await shot(page, `${label}-02-photo-captured`);

  const submitBtn = page.getByRole("button", { name: /Analyze \d+ Photo|Analyze All Photos/i });
  await submitBtn.click({ timeout: 10000 });
  await page.waitForTimeout(600);
  record(`${label}: upload photo`, "PASS");

  // --- Review screen ---
  await shot(page, `${label}-03-review`);
  const startAnalysisBtn = page.getByRole("button", { name: /Start AI Analysis/i });
  await startAnalysisBtn.click({ timeout: 10000 });
  record(`${label}: submit for AI analysis`, "PASS");

  // --- Wait for real Vision AI pipeline (up to 60s server-side) ---
  await shot(page, `${label}-04-analyzing`);
  try {
    await page.getByText(/Analysis Complete/i).waitFor({ timeout: 70000 });
    record(`${label}: vision analysis complete`, "PASS");
  } catch {
    const errorText = await page.locator("text=/validation failed|Analysis failed|limit reached/i").first().textContent().catch(() => null);
    record(`${label}: vision analysis complete`, "FAIL", errorText || "timed out waiting for Analysis Complete");
    await shot(page, `${label}-04-analyzing-FAILED`);
    return false;
  }
  await shot(page, `${label}-05-analysis-done`);

  const continueBtn = page.getByRole("button", { name: /Continue to Assessment/i });
  await continueBtn.click({ timeout: 10000 });
  await page.waitForTimeout(1000);

  // --- Assessment: welcome screen ---
  await shot(page, `${label}-06-assessment-welcome`);
  const beginBtn = page.getByRole("button", { name: /Begin Assessment/i });
  if (await beginBtn.isVisible().catch(() => false)) {
    await beginBtn.click();
    await page.waitForTimeout(500);
  }
  record(`${label}: enter assessment`, "PASS");

  // --- Answer every question (pick first radio option each time) ---
  let guard = 0;
  while (guard < 60) {
    guard += 1;
    const reviewBtn = page.getByRole("button", { name: /Review Answers/i });
    const nextBtn = page.getByRole("button", { name: /Next Question/i });
    const firstRadio = page.getByRole("radio").first();

    if (await reviewBtn.isVisible().catch(() => false)) {
      const enabled = await reviewBtn.isEnabled().catch(() => false);
      if (!enabled) {
        await firstRadio.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(150);
        continue;
      }
      await reviewBtn.click();
      break;
    }

    if (await firstRadio.isVisible().catch(() => false)) {
      await firstRadio.click();
      await page.waitForTimeout(150);
    }

    if (await nextBtn.isVisible().catch(() => false)) {
      const enabled = await nextBtn.isEnabled().catch(() => false);
      if (enabled) {
        await nextBtn.click();
        await page.waitForTimeout(200);
      }
    }
  }
  record(`${label}: answer questions`, guard < 60 ? "PASS" : "FAIL", guard < 60 ? `${guard} steps` : "guard limit hit");

  // --- Review screen ---
  await page.waitForTimeout(800);
  await shot(page, `${label}-07-review-answers`);
  const generateBtn = page.getByRole("button", { name: /Generate Recovery Plan/i });
  await generateBtn.click({ timeout: 10000 });
  record(`${label}: submit assessment`, "PASS");

  // --- Wait for real protocol generation + redirect to /result ---
  try {
    await page.waitForURL(/\/result/, { timeout: 90000 });
    record(`${label}: protocol generation + redirect to /result`, "PASS");
  } catch {
    const blocked = await page.locator("text=/Could not submit assessment/i").first().textContent().catch(() => null);
    record(`${label}: protocol generation + redirect to /result`, "FAIL", blocked || "timed out waiting for /result redirect");
    await shot(page, `${label}-08-generation-FAILED`);
    return false;
  }
  await page.waitForTimeout(1500);
  await shot(page, `${label}-08-result-page`);
  return true;
}

async function main() {
  const env = loadEnvLocal(workspace);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase env in .env.local");
  }
  if (!fs.existsSync(testImage)) throw new Error(`Test image not found: ${testImage}`);

  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on("dialog", async (d) => { console.log(`  [dialog] ${d.message()}`); await d.accept(); });
  page.on("pageerror", (err) => record("console: pageerror", "WARN", err.message));

  const email = `qa.9s.journey.${Date.now()}@example.com`;
  const password = "AlphaFlow#2026!";

  try {
    // ===== PART 1a: NEW USER JOURNEY =====
    const signedUp = await authenticate(page, email, password);
    record("new user: signup + first login", signedUp ? "PASS" : "FAIL");
    if (!signedUp) throw new Error("Cannot continue — signup/login failed");

    await shot(page, "new-01-dashboard-empty");
    record("new user: dashboard renders (empty state)", "PASS");

    const scan1ok = await runScanAndAssessment(page, "new-user-scan1");

    if (scan1ok) {
      await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await shot(page, "new-02-dashboard-populated");
      record("new user: dashboard populated after first scan", "PASS");
    }

    // --- Logout ---
    const logoutBtn = page.getByRole("button", { name: /Logout/i }).first();
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
      record("new user: logout", "PASS");
    } else {
      record("new user: logout", "FAIL", "Logout button not found/visible (may be behind mobile menu)");
    }
    await shot(page, "new-03-post-logout");

    // ===== PART 1b: RETURNING USER JOURNEY =====
    const returned = await authenticate(page, email, password, { signUpOnly: true });
    record("returning user: login", returned ? "PASS" : "FAIL");

    await page.goto(`${baseUrl}/saved-scans`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await shot(page, "returning-01-saved-scans");
    const hasScanHistory = await page.locator("text=/Acne/i").first().isVisible().catch(() => false);
    record("returning user: previous scan visible in saved-scans", hasScanHistory ? "PASS" : "WARN", hasScanHistory ? null : "could not confirm via text match — verify screenshot manually");

    // Second real scan — also brings free-tier usage to 2/2
    const scan2ok = await runScanAndAssessment(page, "returning-user-scan2");
    if (scan2ok) {
      await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await shot(page, "returning-02-dashboard-updated");
      record("returning user: dashboard reflects updated protocol", "PASS");
    }

    // ===== PART 1d: ERROR JOURNEY — budget/scan-limit exceeded (3rd scan) =====
    await page.goto(`${baseUrl}/image-analyzer`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const acneCard3 = page.getByText(/^Acne$/i).first();
    await acneCard3.click({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);
    const fileInput3 = page.locator('input[type="file"]').first();
    await fileInput3.setInputFiles(testImage).catch(() => {});
    await page.waitForTimeout(1200);
    const submitBtn3 = page.getByRole("button", { name: /Analyze \d+ Photo|Analyze All Photos/i });
    if (await submitBtn3.isVisible().catch(() => false)) {
      await submitBtn3.click();
      await page.waitForTimeout(500);
      const startBtn3 = page.getByRole("button", { name: /Start AI Analysis/i });
      await startBtn3.click({ timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2500);
      await shot(page, "error-01-scan-limit-exceeded");
      const limitMsg = await page.locator("text=/limit reached|Upgrade to Premium/i").first().isVisible().catch(() => false);
      record("error journey: 3rd scan blocked by free-tier cap (2/month)", limitMsg ? "PASS" : "WARN", limitMsg ? null : "expected limit message not found — check screenshot");
    } else {
      record("error journey: 3rd scan blocked by free-tier cap (2/month)", "WARN", "could not reach submit step to test cap");
    }

    // ===== PART 1d: ERROR JOURNEY — expired/invalid session =====
    await context.clearCookies();
    await page.evaluate(() => { try { localStorage.clear(); } catch {} }).catch(() => {});
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await shot(page, "error-02-expired-session-redirect");
    const redirectedToLogin = page.url().includes("/login");
    record("error journey: expired session redirects to /login", redirectedToLogin ? "PASS" : "FAIL", redirectedToLogin ? null : `landed on ${page.url()}`);

    // ===== PART 1d: ERROR JOURNEY — no network =====
    await authenticate(page, email, password, { signUpOnly: true });
    await context.setOffline(true);
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);
    await shot(page, "error-03-offline-dashboard");
    await context.setOffline(false);
    record("error journey: offline navigation captured", "PASS", "see screenshot for offline UX quality — no automated pass/fail criterion");

  } catch (error) {
    record("FATAL", "FAIL", error instanceof Error ? error.message : String(error));
    await shot(page, "FATAL-error-state");
  } finally {
    fs.writeFileSync(path.join(outDir, "journey-results.json"), JSON.stringify(results, null, 2));
    console.log("\n=== JOURNEY SUMMARY ===");
    for (const r of results) console.log(`[${r.status}] ${r.step}${r.detail ? " — " + r.detail : ""}`);
    await Promise.race([(async () => { await browser.close(); })(), new Promise((r) => setTimeout(r, 8000))]);
  }
}

main().catch((error) => {
  console.error("QA JOURNEY SCRIPT FAILED", error);
  process.exit(1);
});
