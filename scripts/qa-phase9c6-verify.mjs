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

// Schema-valid mock report (matches types/protocolReport.ts exactly) used
// only to exercise ResultPage's own existing localStorage-cache fallback
// path for QA screenshots — a fresh test account has no real scan data to
// generate an actual report. Never sent anywhere; purely a client-side seed.
const MOCK_REPORT = {
  schemaVersion: "protocol_report.v2.1.0",
  issueSummary: {
    whatWasDetected: ["Mild inflammatory acne on the jawline", "Uneven oil distribution across the T-zone"],
    whyItHappens: ["Hormonal fluctuations increase sebum production", "Inconsistent cleansing lets buildup accumulate"],
    whyConsistencyMatters: ["Skin cell turnover takes roughly 28 days to show visible change"],
  },
  mainResolvingIngredients: [
    {
      ingredient: "Niacinamide 10%",
      purpose: "Regulates oil production and reduces inflammation",
      targets: ["oil_control", "inflammation"],
      whyItWorks: "Niacinamide strengthens the skin barrier and reduces sebum output over time.",
      expectedTimeline: "Visible oil-control improvement within 2-3 weeks",
      safetyNotes: ["Patch test before first full application"],
    },
  ],
  monthlyRecoveryPlan: {
    morning: [
      {
        title: "Gentle Cleanse & Niacinamide Serum",
        purpose: "Remove overnight buildup and apply oil-regulating serum",
        why: "Clean skin absorbs active ingredients more effectively",
        steps: ["Splash with lukewarm water", "Apply cleanser and massage 30s", "Pat dry", "Apply 2-3 drops of serum"],
        timing: "Within 30 minutes of waking",
        frequency: "Daily",
        expectedImprovement: "Reduced midday shine within 1 week",
        mistakesToAvoid: ["Using hot water, which strips the barrier"],
        escalationCues: ["Redness or stinging lasting over 5 minutes"],
      },
    ],
    afternoon: [
      {
        title: "Midday Blot & Hydration Check",
        purpose: "Manage shine without over-stripping",
        why: "Prevents compensatory oil overproduction",
        steps: ["Blot with oil paper if shiny", "Sip water if hydration is low"],
        timing: "Around 1-2 PM",
        frequency: "Daily",
        expectedImprovement: "More stable midday appearance",
        mistakesToAvoid: ["Re-washing face midday"],
        escalationCues: ["Excessive dryness or tightness"],
      },
    ],
    night: [
      {
        title: "Evening Double Cleanse & Treatment",
        purpose: "Remove the day's buildup and apply treatment actives",
        why: "Skin repairs overnight, so this is when actives work hardest",
        steps: ["Oil cleanse first", "Follow with gentle foaming cleanser", "Apply treatment"],
        timing: "30-60 minutes before bed",
        frequency: "Daily",
        expectedImprovement: "Reduced breakout frequency within 2-3 weeks",
        mistakesToAvoid: ["Skipping cleanse after makeup or sunscreen"],
        escalationCues: ["New cystic breakouts"],
      },
    ],
    weekly: [
      {
        title: "Gentle Exfoliation",
        purpose: "Support cell turnover without irritation",
        why: "Removes dead skin cells that can clog pores",
        steps: ["Apply chemical exfoliant", "Leave for recommended time", "Rinse thoroughly"],
        timing: "Once, any evening",
        frequency: "Weekly",
        expectedImprovement: "Smoother texture within 3-4 weeks",
        mistakesToAvoid: ["Combining with other actives same night"],
        escalationCues: ["Peeling or burning sensation"],
      },
    ],
  },
  thingsToAvoid: {
    food: [{ item: "Excess dairy", whyAvoid: "May influence hormonal breakouts in sensitive individuals", effectOnRecovery: "Can slow visible progress", betterAlternative: "Oat or almond milk alternatives" }],
    habits: [],
    environment: [],
    productMistakes: [{ item: "Layering multiple exfoliants", whyAvoid: "Over-exfoliation damages the skin barrier", effectOnRecovery: "Increases inflammation and setbacks", betterAlternative: "One exfoliation method at a time" }],
  },
  recommendedProducts: [
    {
      productId: "niacinamide-serum-10",
      name: "Niacinamide 10% Serum",
      ingredientMatch: "Niacinamide 10%",
      whyRecommended: "Directly targets the oil-regulation need identified in your scan",
      howToUse: "Apply 2-3 drops after cleansing, morning and night",
      applicationArea: "Full face, avoiding eye area",
      amount: "2-3 drops",
      timing: "AM and PM",
      expectedImprovement: "Reduced shine and fewer breakouts within 2-3 weeks",
      compatibilityWithCurrentRoutine: "Safe to layer under moisturizer and SPF",
    },
  ],
  dietPlan: {
    breakfast: ["Oats with berries"],
    lunch: ["Grilled protein with leafy greens"],
    dinner: ["Light, low-dairy meal"],
    snacks: ["Nuts or fruit"],
    hydration: "Aim for 2.5-3L of water daily",
    wellnessGuidance: ["Prioritize 7-8 hours of sleep for skin repair"],
  },
  motivation: "You're already taking the right first step — consistency over the next 30 days is what turns this plan into real, visible change.",
  expectedTimeline: [
    { week: 1, expectedImprovements: ["Reduced midday shine"], possibleSetbacks: ["Mild purging possible"], continueDoing: ["Consistent AM/PM routine"] },
    { week: 2, expectedImprovements: ["Fewer new breakouts"], possibleSetbacks: ["Occasional dryness"], continueDoing: ["Hydration tracking"] },
    { week: 3, expectedImprovements: ["Smoother texture"], possibleSetbacks: [], continueDoing: ["Weekly exfoliation"] },
    { week: 4, expectedImprovements: ["Visibly more even tone"], possibleSetbacks: [], continueDoing: ["Full routine adherence"] },
  ],
  weeklyMilestones: [
    { week: 1, milestone: "Establish the routine habit", adherenceTarget: "80%+" },
    { week: 2, milestone: "Notice reduced oiliness", adherenceTarget: "85%+" },
    { week: 3, milestone: "Fewer active breakouts", adherenceTarget: "85%+" },
    { week: 4, milestone: "Stable, predictable skin", adherenceTarget: "90%+" },
  ],
  confidenceNotes: ["Based on a single scan — a follow-up scan will improve trend accuracy."],
};

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
    await page.goto(`${baseUrl}/result`, { waitUntil: "domcontentloaded" });
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
    const email = `qa.9c6.${label}.${Date.now()}@example.com`;
    console.log(`[${label}] auth`);
    await authenticate(page, baseUrl, email, "AlphaFlow#2026!");

    // Seed the real localStorage cache key ResultPage already falls back to
    // when no report is found for this fresh account. The real polling
    // loop only reaches that fallback after 48 retries at 2.5s each (~2min)
    // on a real "not_found" response — too slow for a test, and the polling
    // logic itself is explicitly not to be touched this phase. Instead,
    // intercept the network call (test-side only, app code untouched) to
    // return a *different* error string than "not_found" on the first
    // attempt, which the app's own existing catch-block already handles by
    // immediately falling back to the seeded cache — no polling behavior
    // changed, just a faster path through logic that already exists.
    await page.route("**/api/protocol/report*", (route) => {
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: false, error: "qa_short_circuit" }) });
    });
    await page.evaluate((report) => {
      localStorage.setItem("protocol_report_v2", JSON.stringify(report));
      sessionStorage.removeItem("protocolReportId");
    }, MOCK_REPORT);
    await page.goto(`${baseUrl}/result`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 25000 });
    await page.waitForTimeout(1000);

    console.log(`[${label}] hero`);
    await page.screenshot({ path: path.join(outDir, `01-hero-${label}.png`) });

    const primaryCta = page.getByRole("button", { name: /View Today's Routine/i });
    const secondaryCta = page.getByRole("button", { name: /Shop Recommended Products/i });
    console.log(`[${label}] hero primary CTA visible: ${await primaryCta.isVisible().catch(() => false)}, secondary CTA visible: ${await secondaryCta.isVisible().catch(() => false)}`);

    console.log(`[${label}] full page`);
    await page.screenshot({ path: path.join(outDir, `02-full-${label}.png`), fullPage: true });

    const roadmapHeading = page.getByText("Recovery Roadmap", { exact: false });
    if (await roadmapHeading.isVisible().catch(() => false)) {
      await roadmapHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, `03-roadmap-${label}.png`) });
    }

    const followUpHeading = page.locator("#follow-up");
    if (await followUpHeading.isVisible().catch(() => false)) {
      await followUpHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(outDir, `04-followup-${label}.png`) });
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
  const outDir = path.join(workspace, "playwright-artifacts", "design-evolution", "9C", "9C.6");
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
