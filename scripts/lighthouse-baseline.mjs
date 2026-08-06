import { chromium } from "playwright";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execFileAsync = promisify(execFile);

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

const DEBUG_PORT = 9222;
const PAGES = [
  "/assessment", "/image-analyzer", "/dashboard", "/result",
  "/", "/login", "/saved-scans", "/profile", "/settings", "/upgrade", "/shop", "/checkout", "/alpha-credits",
];

// /result needs a real report to render its actual content — a fresh QA
// account has none. This seeds the same localStorage cache key ResultPage
// already falls back to (a real, existing code path, not a test-only
// hack); --disable-storage-reset below stops Lighthouse's default
// clean-profile behavior from wiping it before the audit runs.
const MOCK_PROTOCOL_REPORT = {
  schemaVersion: "protocol_report.v2.1.0",
  issueSummary: {
    whatWasDetected: ["Mild inflammatory acne on the jawline"],
    whyItHappens: ["Hormonal fluctuations increase sebum production"],
    whyConsistencyMatters: ["Skin cell turnover takes roughly 28 days to show visible change"],
  },
  mainResolvingIngredients: [
    {
      ingredient: "Niacinamide 10%",
      purpose: "Regulates oil production and reduces inflammation",
      targets: ["oil_control"],
      whyItWorks: "Niacinamide strengthens the skin barrier and reduces sebum output over time.",
      expectedTimeline: "Visible improvement within 2-3 weeks",
      safetyNotes: ["Patch test before first full application"],
    },
  ],
  monthlyRecoveryPlan: {
    morning: [{ title: "Gentle Cleanse & Niacinamide Serum", purpose: "Remove overnight buildup", why: "Clean skin absorbs actives better", steps: ["Cleanse", "Apply serum"], timing: "AM", frequency: "Daily", expectedImprovement: "Reduced shine within 1 week", mistakesToAvoid: ["Hot water"], escalationCues: ["Prolonged stinging"] }],
    afternoon: [{ title: "Midday Blot", purpose: "Manage shine", why: "Prevents overproduction", steps: ["Blot with oil paper"], timing: "1-2 PM", frequency: "Daily", expectedImprovement: "Stable midday look", mistakesToAvoid: ["Re-washing"], escalationCues: ["Excess dryness"] }],
    night: [{ title: "Evening Double Cleanse", purpose: "Remove day buildup", why: "Skin repairs overnight", steps: ["Oil cleanse", "Foam cleanse"], timing: "PM", frequency: "Daily", expectedImprovement: "Fewer breakouts", mistakesToAvoid: ["Skipping cleanse"], escalationCues: ["New cystic breakouts"] }],
    weekly: [{ title: "Gentle Exfoliation", purpose: "Support cell turnover", why: "Removes dead skin cells", steps: ["Apply exfoliant", "Rinse"], timing: "1x/week", frequency: "Weekly", expectedImprovement: "Smoother texture", mistakesToAvoid: ["Combining actives"], escalationCues: ["Burning"] }],
  },
  thingsToAvoid: { food: [], habits: [], environment: [], productMistakes: [] },
  recommendedProducts: [{ productId: "niacinamide-serum-10", name: "Niacinamide 10% Serum", whyRecommended: "Targets the oil-regulation need identified in your scan", howToUse: "Apply 2-3 drops AM/PM", applicationArea: "Full face", amount: "2-3 drops", timing: "AM and PM", expectedImprovement: "Reduced shine within 2-3 weeks", compatibilityWithCurrentRoutine: "Safe under moisturizer and SPF" }],
  dietPlan: { breakfast: ["Oats with berries"], lunch: ["Grilled protein with greens"], dinner: ["Light meal"], snacks: ["Nuts"], hydration: "2.5-3L daily", wellnessGuidance: ["7-8 hours of sleep"] },
  motivation: "You're already taking the right first step — consistency over the next 30 days is what turns this plan into real, visible change.",
  expectedTimeline: [1, 2, 3, 4].map((week) => ({ week, expectedImprovements: ["Steady visible progress"], possibleSetbacks: [], continueDoing: ["Routine adherence"] })),
  weeklyMilestones: [1, 2, 3, 4].map((week) => ({ week, milestone: "Milestone reached", adherenceTarget: "80%+" })),
  confidenceNotes: ["Based on a single scan — a follow-up scan will improve trend accuracy."],
};

async function runLighthouse(url, outPath, formFactor, { preserveStorage = false } = {}) {
  const args = [
    "--yes",
    "lighthouse",
    url,
    `--port=${DEBUG_PORT}`,
    "--output=json",
    `--output-path=${outPath}`,
    "--only-categories=performance,accessibility,best-practices,seo",
    "--chrome-flags=--headless",
    "--quiet",
  ];
  if (preserveStorage) args.push("--disable-storage-reset");
  if (formFactor === "mobile") {
    args.push("--preset=perf", "--form-factor=mobile", "--screenEmulation.mobile", "--screenEmulation.width=390", "--screenEmulation.height=844", "--screenEmulation.deviceScaleFactor=2");
  } else {
    args.push("--preset=desktop");
  }
  await execFileAsync("npx", args, { cwd: process.cwd(), shell: true, maxBuffer: 1024 * 1024 * 20 });
}

async function main() {
  const workspace = process.cwd();
  const env = loadEnvLocal(workspace);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase env in .env.local");
  }
  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
  const outDir = path.join(workspace, "artifacts", "lighthouse-baseline");
  fs.mkdirSync(outDir, { recursive: true });

  const email = `qa.lighthouse.${Date.now()}@example.com`;
  const password = "AlphaFlow#2026!";

  console.log("Launching Chrome with a remote-debugging port so Lighthouse reuses the authenticated session...");
  const browser = await chromium.launch({
    headless: true,
    args: [`--remote-debugging-port=${DEBUG_PORT}`, "--disable-dev-shm-usage", "--no-sandbox"],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on("dialog", async (dialog) => {
    console.log(`  [dialog] ${dialog.message()}`);
    await dialog.accept();
  });

  console.log("Authenticating via /test-auth...");
  let authed = false;
  for (let attempt = 1; attempt <= 3 && !authed; attempt += 1) {
    if (attempt > 1) console.log(`  retrying sign up/in (attempt ${attempt})`);
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
    await page.waitForTimeout(600);
    authed = !page.url().includes("/login");
  }
  if (!authed) throw new Error("Authentication failed before Lighthouse run.");
  console.log("  authenticated");

  if (PAGES.includes("/result")) {
    console.log("Seeding a schema-valid mock protocol report for /result (real fallback path, not a hack)...");
    await page.route("**/api/protocol/report*", (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: false, error: "qa_short_circuit" }) });
    });
    await page.goto(`${baseUrl}/result`, { waitUntil: "domcontentloaded" });
    await page.evaluate((report) => {
      localStorage.setItem("protocol_report_v2", JSON.stringify(report));
      sessionStorage.removeItem("protocolReportId");
    }, MOCK_PROTOCOL_REPORT);
  }

  const results = [];
  for (const route of PAGES) {
    for (const formFactor of ["mobile", "desktop"]) {
      const url = `${baseUrl}${route}`;
      const safeName = route.replace(/\//g, "_");
      const outPath = path.join(outDir, `${safeName}-${formFactor}.json`);
      console.log(`Running Lighthouse: ${url} [${formFactor}]`);
      try {
        await runLighthouse(url, outPath, formFactor, { preserveStorage: route === "/result" });
        const report = JSON.parse(fs.readFileSync(outPath, "utf8"));
        const scores = {};
        for (const [key, cat] of Object.entries(report.categories || {})) {
          scores[key] = Math.round((cat.score || 0) * 100);
        }
        results.push({ route, formFactor, scores });
        console.log(`  ${JSON.stringify(scores)}`);
      } catch (error) {
        console.error(`  FAILED: ${error.message}`);
        results.push({ route, formFactor, error: error.message });
      }
    }
  }

  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(results, null, 2));
  console.log("\n=== LIGHTHOUSE BASELINE SUMMARY ===");
  console.table(
    results.map((r) => ({
      route: r.route,
      form: r.formFactor,
      Performance: r.scores?.performance ?? "ERR",
      Accessibility: r.scores?.accessibility ?? "ERR",
      "Best Practices": r.scores?.["best-practices"] ?? "ERR",
      SEO: r.scores?.seo ?? "ERR",
    }))
  );

  await browser.close();
}

main().catch((error) => {
  console.error("❌ LIGHTHOUSE BASELINE FAILED");
  console.error(error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
  process.exit(1);
});
