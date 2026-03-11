import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const ANALYZER_LABEL_BY_CATEGORY = {
  acne: "Acne Analysis",
  dark_circles: "Dark Circles",
  anti_aging: "Anti-Aging",
  hair_loss: "Hair Loss",
  scalp_health: "Scalp Health",
  beard_growth: "Beard Growth",
  body_acne: "Body Acne",
  lip_care: "Lip Care",
};

function loadEnvLocal(workspace) {
  const envPath = path.join(workspace, ".env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    env[key] = value;
  }
  return env;
}

function timestampEmail() {
  const t = Date.now();
  return `qa.flow.${t}@example.com`;
}

function readConfig(workspace) {
  const category = process.env.E2E_CATEGORY || "acne";
  const scenario = process.env.E2E_SCENARIO || "standard";
  const resumeDelayMs = Number(process.env.E2E_RESUME_DELAY_MS || 2500);
  const skipDbVerify = (process.env.E2E_SKIP_DB_VERIFY || "0") === "1";
  const mockGalaxy = (process.env.E2E_MOCK_GALAXY || "0") === "1";
  const providedEmail = process.env.E2E_EMAIL;
  const providedPassword = process.env.E2E_PASSWORD;
  const captureFailureScreenshot = (process.env.E2E_CAPTURE_FAILURE_SCREENSHOT || "0") === "1";

  if ((providedEmail && !providedPassword) || (!providedEmail && providedPassword)) {
    throw new Error("Set both E2E_EMAIL and E2E_PASSWORD together, or neither.");
  }

  const imagePath = process.env.E2E_SAMPLE_IMAGE
    ? path.resolve(workspace, process.env.E2E_SAMPLE_IMAGE)
    : path.join(workspace, "public", "icons", "icon-512.png");

  if (!ANALYZER_LABEL_BY_CATEGORY[category]) {
    throw new Error(`Unsupported E2E category: ${category}`);
  }

  if (!["standard", "leave_resume", "repeat_scan"].includes(scenario)) {
    throw new Error(`Unsupported E2E scenario: ${scenario}`);
  }

  return {
    category,
    scenario,
    resumeDelayMs,
    imagePath,
    skipDbVerify,
    mockGalaxy,
    providedEmail,
    providedPassword,
    captureFailureScreenshot,
  };
}

async function preflight(baseUrl, supabaseUrl, supabaseAnon) {
  const timeoutMs = Number(process.env.E2E_PREFLIGHT_TIMEOUT_MS || 8000);
  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  const appHealth = await fetch(`${baseUrl}/test-auth`, {
    method: "GET",
    signal: timeoutSignal,
    cache: "no-store",
  }).catch((error) => {
    throw new Error(`App preflight failed for ${baseUrl}/test-auth: ${error instanceof Error ? error.message : String(error)}`);
  });

  if (!appHealth.ok) {
    throw new Error(`App preflight failed for ${baseUrl}/test-auth with status ${appHealth.status}.`);
  }

  const authHealth = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    method: "GET",
    headers: {
      apikey: supabaseAnon,
      Authorization: `Bearer ${supabaseAnon}`,
    },
    signal: timeoutSignal,
    cache: "no-store",
  }).catch((error) => {
    throw new Error(`Supabase preflight failed for auth settings endpoint: ${error instanceof Error ? error.message : String(error)}`);
  });

  if (!authHealth.ok) {
    throw new Error(`Supabase preflight failed with status ${authHealth.status}. Check NEXT_PUBLIC_SUPABASE_URL / key / network.`);
  }
}

async function waitForAssessmentAndComplete(page) {
  await page.waitForURL(/\/assessment/, { timeout: 90000 });

  await page.waitForFunction(() => {
    const text = document.body?.innerText || "";
    return text.includes("Clinical Assessment -") || text.includes("Assessment Locked") || text.includes("Domain:");
  }, { timeout: 90000 });

  const locked = await page.getByText("Assessment Locked", { exact: false }).isVisible().catch(() => false);
  if (locked) {
    const body = await page.locator("body").innerText().catch(() => "");
    throw new Error(`Assessment stayed locked. Body preview: ${body.slice(0, 500)}`);
  }

  for (let i = 0; i < 60; i += 1) {
    const action = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));

      const submit = buttons.find((b) => /Submit .* Clinical Report/i.test((b.textContent || "").trim()));
      if (submit && !submit.disabled) {
        submit.click();
        return "submit";
      }

      const option = buttons.find((b) => {
        const text = (b.textContent || "").trim();
        return /Score\s+\d/i.test(text)
          && !/Next Question|Submit/i.test(text)
          && !b.disabled;
      });
      if (option) {
        option.click();
      }

      const next = buttons.find((b) => /Next Question/i.test((b.textContent || "").trim()));
      if (next && !next.disabled) {
        next.click();
        return "next";
      }

      return option ? "option_only" : "idle";
    });

    if (action === "submit") {
      await page.waitForURL(/\/result/, { timeout: 90000 });
      return;
    }

    await page.waitForTimeout(400);
  }

  throw new Error("Assessment completion loop exhausted before reaching result page.");
}

async function runAnalyzerToAssessment(page, baseUrl, category, sampleImage) {
  const analyzerLabel = ANALYZER_LABEL_BY_CATEGORY[category];
  await page.goto(`${baseUrl}/image-analyzer`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: new RegExp(analyzerLabel, "i") }).first().click({ timeout: 15000 });
  await page.waitForTimeout(700);

  const fileInput = page.locator('input[type="file"]');
  const inputCount = await fileInput.count();
  if (inputCount === 0) {
    throw new Error("No file input found in analyzer upload step.");
  }

  await fileInput.first().setInputFiles(sampleImage);
  await page.waitForTimeout(1200);

  const analyzeBtn = page.getByRole("button", { name: /Analyze 1 Photo|Analyze All Photos/i });
  await analyzeBtn.waitFor({ state: "visible", timeout: 15000 });
  await analyzeBtn.click({ timeout: 15000 });
}

async function completeOneFlow(page, baseUrl, category, sampleImage, scenario, resumeDelayMs) {
  await runAnalyzerToAssessment(page, baseUrl, category, sampleImage);

  if (scenario === "leave_resume") {
    await page.waitForURL(/\/assessment/, { timeout: 90000 });
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(Math.max(0, resumeDelayMs));
    await page.goto(`${baseUrl}/assessment?category=${encodeURIComponent(category)}`, { waitUntil: "domcontentloaded" });
  }

  await waitForAssessmentAndComplete(page);
}

async function assertBrowserAuthSession(page) {
  const hasSession = await page.evaluate(() => {
    const keys = Object.keys(window.localStorage || {});
    return keys.some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
  }).catch(() => false);

  if (!hasSession) {
    throw new Error("Auth session was not established in browser (missing Supabase auth token in localStorage).");
  }
}

async function main() {
  const workspace = process.cwd();
  const env = loadEnvLocal(workspace);
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  }

  const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3010";
  const config = readConfig(workspace);

  console.log("Preflight: checking app + Supabase reachability");
  await preflight(baseUrl, supabaseUrl, supabaseAnon);

  if (!fs.existsSync(config.imagePath)) {
    throw new Error(`Sample image not found at ${config.imagePath}`);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      console.log(`[browser:${type}] ${msg.text()}`);
    }
  });

  page.on("response", async (response) => {
    if (response.url().includes("/api/galaxy/analyze")) {
      const status = response.status();
      let body = "";
      try {
        body = await response.text();
      } catch {
        body = "<unreadable>";
      }
      console.log(`[galaxy] ${status} ${body.slice(0, 280)}`);
    }
  });

  page.on("dialog", async (dialog) => {
    console.log(`[dialog] ${dialog.message()}`);
    await dialog.accept();
  });

  if (config.mockGalaxy) {
    await page.route("**/api/galaxy/analyze", async (route) => {
      const body = route.request().postDataJSON?.() || {};
      const firstImage = Array.isArray(body.images) && body.images.length > 0
        ? body.images[0]
        : null;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          provider: "e2e-mock",
          confidence: 78,
          annotatedImageUrl: firstImage,
          hotspots: [
            { x: 35, y: 40, label: "Left Cheek", severity: "medium" },
            { x: 65, y: 40, label: "Right Cheek", severity: "medium" },
          ],
          issues: [
            {
              name: "Baseline Marker",
              confidence: 78,
              impact: "moderate",
              description: "Mocked issue for low-cost E2E verification.",
              affectedArea: "Target region",
            },
          ],
        }),
      });
    });
  }

  const email = config.providedEmail || timestampEmail();
  const password = config.providedPassword || "AlphaFlow#2026!";

  try {
    console.log("Step 1: Authenticate via test-auth page");
    await page.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });

    const authPanel = page.locator("div", { hasText: "Supabase Auth Test" }).first();

    await page.getByPlaceholder("email").fill(email);
    await page.getByPlaceholder("password").fill(password);

    if (config.providedEmail) {
      await authPanel.locator("button", { hasText: /^Sign In$/ }).first().click();
    } else {
      // Create + sign in a fresh user only when no reusable credential is provided.
      await authPanel.locator("button", { hasText: /^Sign Up$/ }).first().click();
      await page.waitForTimeout(1500);
      await authPanel.locator("button", { hasText: /^Sign In$/ }).first().click();
    }

    await page.waitForTimeout(2000);
    await assertBrowserAuthSession(page);

    console.log(`Step 2: Execute clinical flow (${config.category}, ${config.scenario})`);
    await completeOneFlow(page, baseUrl, config.category, config.imagePath, config.scenario, config.resumeDelayMs);

    if (config.scenario === "repeat_scan") {
      console.log("Step 3: Repeat scan scenario - running second pass for same user");
      await completeOneFlow(page, baseUrl, config.category, config.imagePath, "standard", config.resumeDelayMs);
    }

    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    if (!/\/result/.test(finalUrl)) {
      throw new Error(`Expected result page, got ${finalUrl}`);
    }

    await page.waitForTimeout(2500);
    const stableUrl = page.url();
    if (/\/image-analyzer/.test(stableUrl)) {
      throw new Error(`Redirected back to analyzer unexpectedly: ${stableUrl}`);
    }

    const reportUnavailable = await page.getByText("Clinical Report Unavailable", { exact: false }).isVisible().catch(() => false);
    if (reportUnavailable) {
      throw new Error("Result page reached but clinical report payload was unavailable.");
    }

    if (config.skipDbVerify) {
      console.log("Step 4: DB verification skipped (E2E_SKIP_DB_VERIFY=1)");
      console.log(JSON.stringify({
        email,
        category: config.category,
        scenario: config.scenario,
        finalUrl: stableUrl,
        mockGalaxy: config.mockGalaxy,
        dbVerified: false,
      }, null, 2));
      return;
    }

    console.log("Step 4: Verify Supabase persisted rows");
    const supabase = createClient(supabaseUrl, supabaseAnon);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData.session?.user) {
      throw new Error(`Supabase sign-in failed for verification user: ${signInError?.message || "No session"}`);
    }

    const userId = signInData.session.user.id;

    const [{ data: scans, error: scansError }, { data: assessments, error: assessmentError }, { data: clinicalRows, error: clinicalError }] = await Promise.all([
      supabase
        .from("photo_scans")
        .select("id,user_id,analyzer_category,parent_category,image_url,captured_image_urls,scan_date")
        .eq("user_id", userId)
        .eq("analyzer_category", config.category)
        .order("scan_date", { ascending: false })
        .limit(6),
      supabase
        .from("assessment_answers")
        .select("id,user_id,category,parent_category,completed_at")
        .eq("user_id", userId)
        .eq("category", config.category)
        .order("completed_at", { ascending: false })
        .limit(6),
        supabase
        .from("user_category_clinical_scores")
        .select("user_id,category,severity_score,confidence_score,risk_level,assessment_completeness,updated_at")
        .eq("user_id", userId)
        .eq("category", config.category)
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

    if (scansError) throw new Error(`photo_scans query failed: ${scansError.message}`);
    if (assessmentError) throw new Error(`assessment_answers query failed: ${assessmentError.message}`);
      if (clinicalError) throw new Error(`user_category_clinical_scores query failed: ${clinicalError.message}`);

    const latestScan = scans?.[0];
    const latestAssessment = assessments?.[0];
    const latestClinical = clinicalRows?.[0];

    if (!latestScan) throw new Error(`No ${config.category} scan row found after analyzer flow.`);
    if (!latestAssessment) throw new Error(`No ${config.category} assessment row found after assessment flow.`);
    if (!latestClinical) throw new Error(`No ${config.category} clinical score row found after result generation.`);

    if (config.scenario === "repeat_scan" && (scans?.length || 0) < 2) {
      throw new Error(`Repeat scan scenario expected at least 2 ${config.category} scans, found ${(scans?.length || 0)}.`);
    }

    const uploadedUrls = Array.isArray(latestScan.captured_image_urls) ? latestScan.captured_image_urls : [];

    console.log("✅ FLOW VERIFIED");
    console.log(JSON.stringify({
      email,
      category: config.category,
      scenario: config.scenario,
      userId,
      finalUrl: stableUrl,
      latestScan: {
        id: latestScan.id,
        analyzer_category: latestScan.analyzer_category,
        parent_category: latestScan.parent_category,
        image_url_present: Boolean(latestScan.image_url),
        captured_image_urls_count: uploadedUrls.length,
      },
      latestAssessment: {
        id: latestAssessment.id,
        category: latestAssessment.category,
        parent_category: latestAssessment.parent_category,
      },
      latestClinical: {
        category: latestClinical.category,
        severity_score: latestClinical.severity_score,
        confidence_score: latestClinical.confidence_score,
        risk_level: latestClinical.risk_level,
        assessment_completeness: latestClinical.assessment_completeness,
      },
    }, null, 2));
  } catch (error) {
    try {
      console.error(`Failure URL: ${page.url()}`);
      if (config.captureFailureScreenshot) {
        const screenshotPath = path.join(workspace, "artifacts", `e2e-failure-${Date.now()}.png`);
        fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.error(`Failure screenshot: ${screenshotPath}`);
      }
      const bodyText = await page.locator("body").innerText().catch(() => "");
      if (bodyText) console.error(`Failure body preview: ${bodyText.slice(0, 600)}`);
    } catch {
      // ignore secondary diagnostic errors
    }
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error("❌ FLOW VERIFY FAILED");
  const message = error instanceof Error ? `${error.message}\n${error.stack || ""}` : JSON.stringify(error);
  console.error(message);
  process.exit(1);
});
