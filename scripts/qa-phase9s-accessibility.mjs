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
const AXE_URL = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js";
let axeSource = null;

// Schema-valid mock report (same shape used by scripts/lighthouse-baseline.mjs
// and scripts/qa-phase9c6-verify.mjs) -- seeds /result's own real
// localStorage cache fallback so the page renders real content for audit.
const MOCK_REPORT = {
  schemaVersion: "protocol_report.v2.1.0",
  issueSummary: { whatWasDetected: ["Mild inflammatory acne on the jawline"], whyItHappens: ["Hormonal fluctuations increase sebum production"], whyConsistencyMatters: ["Skin cell turnover takes roughly 28 days to show visible change"] },
  mainResolvingIngredients: [{ ingredient: "Niacinamide 10%", purpose: "Regulates oil production and reduces inflammation", targets: ["oil_control"], whyItWorks: "Niacinamide strengthens the skin barrier and reduces sebum output over time.", expectedTimeline: "Visible improvement within 2-3 weeks", safetyNotes: ["Patch test before first full application"] }],
  monthlyRecoveryPlan: {
    morning: [{ title: "Gentle Cleanse & Niacinamide Serum", purpose: "Remove overnight buildup", why: "Clean skin absorbs actives better", steps: ["Cleanse", "Apply serum"], timing: "AM", frequency: "Daily", expectedImprovement: "Reduced shine within 1 week", mistakesToAvoid: ["Hot water"], escalationCues: ["Prolonged stinging"] }],
    afternoon: [{ title: "Midday Blot", purpose: "Manage shine", why: "Prevents overproduction", steps: ["Blot with oil paper"], timing: "1-2 PM", frequency: "Daily", expectedImprovement: "Stable midday look", mistakesToAvoid: ["Re-washing"], escalationCues: ["Excess dryness"] }],
    night: [{ title: "Evening Double Cleanse", purpose: "Remove day buildup", why: "Skin repairs overnight", steps: ["Oil cleanse", "Foam cleanse"], timing: "PM", frequency: "Daily", expectedImprovement: "Fewer breakouts", mistakesToAvoid: ["Skipping cleanse"], escalationCues: ["New cystic breakouts"] }],
    weekly: [{ title: "Gentle Exfoliation", purpose: "Support cell turnover", why: "Removes dead skin cells", steps: ["Apply exfoliant", "Rinse"], timing: "1x/week", frequency: "Weekly", expectedImprovement: "Smoother texture", mistakesToAvoid: ["Combining actives"], escalationCues: ["Burning"] }],
  },
  thingsToAvoid: { food: [], habits: [], environment: [], productMistakes: [] },
  recommendedProducts: [{ productId: "niacinamide-serum-10", name: "Niacinamide 10% Serum", whyRecommended: "Targets the oil-regulation need identified in your scan", howToUse: "Apply 2-3 drops AM/PM", applicationArea: "Full face", amount: "2-3 drops", timing: "AM and PM", expectedImprovement: "Reduced shine within 2-3 weeks", compatibilityWithCurrentRoutine: "Safe under moisturizer and SPF" }],
  dietPlan: { breakfast: ["Oats with berries"], lunch: ["Grilled protein with greens"], dinner: ["Light meal"], snacks: ["Nuts"], hydration: "2.5-3L daily", wellnessGuidance: ["7-8 hours of sleep"] },
  motivation: "You're already taking the right first step.",
  expectedTimeline: [1, 2, 3, 4].map((week) => ({ week, expectedImprovements: ["Steady visible progress"], possibleSetbacks: [], continueDoing: ["Routine adherence"] })),
  weeklyMilestones: [1, 2, 3, 4].map((week) => ({ week, milestone: "Milestone reached", adherenceTarget: "80%+" })),
  confidenceNotes: ["Based on a single scan."],
};

const PAGES = [
  { path: "/", auth: false },
  { path: "/login", auth: false },
  { path: "/dashboard", auth: true },
  { path: "/image-analyzer", auth: true },
  { path: "/result", auth: true, seedReport: true },
  { path: "/saved-scans", auth: true },
  { path: "/profile", auth: true },
  { path: "/settings", auth: true },
  { path: "/upgrade", auth: true },
  { path: "/shop", auth: true },
  { path: "/cart", auth: true },
  { path: "/checkout", auth: true },
  { path: "/alpha-credits", auth: true },
];

const results = [];

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

async function auditPage(page, entry, viewportLabel) {
  if (entry.seedReport) {
    await page.route("**/api/protocol/report*", (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: false, error: "qa_short_circuit" }) });
    });
  }
  await page.goto(`${baseUrl}${entry.path}`, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  if (entry.seedReport) {
    await page.evaluate((report) => {
      localStorage.setItem("protocol_report_v2", JSON.stringify(report));
      sessionStorage.removeItem("protocolReportId");
    }, MOCK_REPORT);
    await page.goto(`${baseUrl}${entry.path}`, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  }
  await page.waitForTimeout(1500);
  if (entry.seedReport) await page.unroute("**/api/protocol/report*").catch(() => {});

  const landedUrl = page.url();
  try {
    // The app's own CSP (script-src 'self' 'unsafe-inline' ...) blocks
    // loading a <script src="https://cdn..."> tag, so axe-core is fetched
    // once up front (outside the page/CSP context) and injected as inline
    // content instead, which the CSP's 'unsafe-inline' already permits.
    await page.addScriptTag({ content: axeSource });
  } catch (error) {
    results.push({ path: entry.path, viewport: viewportLabel, error: `axe-core failed to load: ${error.message}` });
    return;
  }

  const axeResult = await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    return await axe.run(document, { resultTypes: ["violations"] });
  });

  const violations = (axeResult.violations || []).map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodeCount: v.nodes.length,
    sampleTargets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
  }));

  results.push({ path: entry.path, viewport: viewportLabel, landedUrl, violationCount: violations.length, violations });
  const summary = violations.length === 0 ? "0 violations" : violations.map((v) => `${v.id}(${v.impact},${v.nodeCount})`).join(", ");
  console.log(`[${viewportLabel}] ${entry.path} -> ${summary}`);
}

async function main() {
  const env = loadEnvLocal(workspace);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Missing Supabase env");

  console.log("Fetching axe-core source...");
  axeSource = await fetch(AXE_URL).then((r) => r.text());

  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
  const email = `qa.9s.axe.${Date.now()}@example.com`;
  const password = "AlphaFlow#2026!";

  for (const viewport of [{ width: 390, height: 844, label: "mobile" }, { width: 1440, height: 900, label: "desktop" }]) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on("dialog", async (d) => { await d.accept(); });

    const authed = await authenticate(page, email, password);
    console.log(`[${viewport.label}] auth: ${authed ? "OK" : "FAILED"}`);

    for (const entry of PAGES) {
      if (entry.auth && !authed) {
        results.push({ path: entry.path, viewport: viewport.label, error: "skipped -- auth failed" });
        continue;
      }
      try {
        await auditPage(page, entry, viewport.label);
      } catch (error) {
        results.push({ path: entry.path, viewport: viewport.label, error: error instanceof Error ? error.message : String(error) });
        console.log(`[${viewport.label}] ${entry.path} -> ERROR: ${error.message}`);
      }
    }
    await context.close();
  }

  fs.writeFileSync(path.join(outDir, "accessibility-results.json"), JSON.stringify(results, null, 2));
  await browser.close();
  console.log("DONE");
}

main().catch((error) => {
  console.error("ACCESSIBILITY SCRIPT FAILED", error);
  process.exit(1);
});
