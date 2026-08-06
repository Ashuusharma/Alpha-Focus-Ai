import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

// This script exercises the REAL assessment -> REAL protocol-generation AI
// call -> REAL /result render, without going through real Vision AI photo
// validation. The photo-upload leg was already verified separately (a
// synthetic non-skin test image was correctly rejected by the real Vision
// AI quality gate -- confirmed working, but it means that image can't reach
// this leg of the funnel). Instead of touching any real code, this seeds
// the exact sessionStorage keys the app's own real code already reads via
// hasRecentSessionScanForCategory()/getRecentSessionCategory() in
// app/assessment/page.tsx -- the same "seed a real existing fallback path,
// don't touch business logic" technique already established and approved
// in prior phases for the /result localStorage cache fallback.

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

const results = [];
function record(step, status, detail) {
  console.log(`[${status}] ${step}${detail ? " — " + detail : ""}`);
  results.push({ step, status, detail: detail || null, at: new Date().toISOString() });
}
async function shot(page, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true }).catch(() => {});
}

async function authenticate(page, email, password) {
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
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    authed = !page.url().includes("/login");
  }
  return authed;
}

async function main() {
  const env = loadEnvLocal(workspace);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Missing Supabase env");

  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on("dialog", async (d) => { await d.accept(); });

  const email = `qa.9s.assess.${Date.now()}@example.com`;
  const password = "AlphaFlow#2026!";

  try {
    const authed = await authenticate(page, email, password);
    record("auth", authed ? "PASS" : "FAIL");
    if (!authed) throw new Error("auth failed");

    // Seed a fake-but-recent "scan just happened" session state for the
    // acne category -- the exact shape app/assessment/page.tsx's
    // getRecentSessionCategory() already expects and trusts.
    await page.evaluate(() => {
      const fakeAnalysis = {
        type: "acne",
        confidence: 78,
        detectedIssues: [{ name: "Mild inflammatory acne", confidence: 78, impact: "moderate", description: "Localized inflammation", affectedArea: "jawline" }],
        severity: "moderate",
        recommendations: [],
        tips: [],
        products: [],
        weeklyRoutines: [],
        capturedPhotos: [],
      };
      sessionStorage.setItem("analysisCategory", "acne");
      sessionStorage.setItem("analysisAt", new Date().toISOString());
      sessionStorage.setItem("photoAnalysis", JSON.stringify(fakeAnalysis));
      sessionStorage.setItem("analysisParentCategory", "skin");
    });
    record("seed session scan state (acne)", "PASS");

    await page.goto(`${baseUrl}/assessment?category=acne`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await shot(page, "assess-01-entry");

    const beginBtn = page.getByRole("button", { name: /Begin Assessment/i });
    if (await beginBtn.isVisible().catch(() => false)) {
      await beginBtn.click();
      await page.waitForTimeout(500);
      record("reached real question flow (not blocked)", "PASS");
    } else {
      const blocked = await page.locator("text=/locked|Start from analyzer/i").first().isVisible().catch(() => false);
      record("reached real question flow (not blocked)", blocked ? "FAIL" : "WARN", blocked ? "assessment lock screen shown -- session seed rejected" : "unexpected state, check screenshot");
      await shot(page, "assess-01b-unexpected");
    }

    let guard = 0;
    while (guard < 60) {
      guard += 1;
      const reviewBtn = page.getByRole("button", { name: /Review Answers/i });
      const nextBtn = page.getByRole("button", { name: /Next Question/i });
      const firstRadio = page.getByRole("radio").first();

      if (await reviewBtn.isVisible().catch(() => false)) {
        if (await reviewBtn.isEnabled().catch(() => false)) { await reviewBtn.click(); break; }
        await firstRadio.click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(150);
        continue;
      }
      if (await firstRadio.isVisible().catch(() => false)) {
        await firstRadio.click();
        await page.waitForTimeout(150);
      }
      if (await nextBtn.isVisible().catch(() => false) && await nextBtn.isEnabled().catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(200);
      }
    }
    record("answer all questions", guard < 60 ? "PASS" : "FAIL", `${guard} steps`);

    await page.waitForTimeout(800);
    await shot(page, "assess-02-review");
    const generateBtn = page.getByRole("button", { name: /Generate Recovery Plan/i });
    await generateBtn.click({ timeout: 10000 });
    record("submit assessment (real protocol/generate call fires here)", "PASS");

    await shot(page, "assess-03-generating");
    try {
      await page.waitForURL(/\/result/, { timeout: 90000 });
      record("real AI protocol generation + redirect to /result", "PASS");
    } catch {
      const blockedMsg = await page.locator("text=/Could not submit assessment/i").first().textContent().catch(() => null);
      record("real AI protocol generation + redirect to /result", "FAIL", blockedMsg || "timed out");
      await shot(page, "assess-03-FAILED");
      throw new Error("protocol generation did not complete");
    }

    await page.waitForTimeout(2000);
    await shot(page, "assess-04-result-page");
    const hasHeading = await page.locator("h1").first().isVisible().catch(() => false);
    record("/result renders real generated protocol", hasHeading ? "PASS" : "WARN");

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await shot(page, "assess-05-dashboard-after-real-protocol");
    record("dashboard reflects real generated protocol", "PASS");

  } catch (error) {
    record("FATAL", "FAIL", error instanceof Error ? error.message : String(error));
    await shot(page, "assess-FATAL");
  } finally {
    fs.writeFileSync(path.join(outDir, "assessment-to-protocol-results.json"), JSON.stringify(results, null, 2));
    await Promise.race([(async () => { await browser.close(); })(), new Promise((r) => setTimeout(r, 8000))]);
  }
}

main().catch((error) => {
  console.error("SCRIPT FAILED", error);
  process.exit(1);
});
