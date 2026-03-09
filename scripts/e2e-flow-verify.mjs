import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
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

  for (let i = 0; i < 20; i += 1) {
    const optionButtons = page
      .locator("main button")
      .filter({ hasText: /Score\s+\d/i })
      .filter({ hasNotText: /Next Question|Submit/i });
    const optionCount = await optionButtons.count();
    if (optionCount > 0) {
      let selected = false;
      for (let idx = 0; idx < optionCount; idx += 1) {
        const candidate = optionButtons.nth(idx);
        const disabled = await candidate.isDisabled().catch(() => true);
        if (disabled) continue;
        await candidate.click({ timeout: 10000 });
        selected = true;
        break;
      }
      if (selected) {
        await page.waitForTimeout(150);
      }
    }

    const submitBtn = page.getByRole("button", { name: /Submit .* Clinical Report/i });
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForURL(/\/result/, { timeout: 90000 });
      return;
    }

    const nextBtn = page.getByRole("button", { name: /Next Question/i });
    if (await nextBtn.isVisible().catch(() => false)) {
      await page.waitForFunction(() => {
        const next = Array.from(document.querySelectorAll("button")).find((b) =>
          (b.textContent || "").includes("Next Question")
        );
        return Boolean(next && !next.hasAttribute("disabled"));
      }, { timeout: 15000 });
      await nextBtn.click();
      await page.waitForTimeout(200);
      continue;
    }
  }

  throw new Error("Assessment completion loop exhausted before reaching result page.");
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
  const sampleImage = path.join(workspace, "public", "icons", "icon-512.png");
  if (!fs.existsSync(sampleImage)) {
    throw new Error(`Sample image not found at ${sampleImage}`);
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

  const email = timestampEmail();
  const password = "AlphaFlow#2026!";

  try {
    console.log("Step 1: Sign up / sign in via test-auth page");
    await page.goto(`${baseUrl}/test-auth`, { waitUntil: "domcontentloaded" });

    const authPanel = page.locator("div", { hasText: "Supabase Auth Test" }).first();

    await page.getByPlaceholder("email").fill(email);
    await page.getByPlaceholder("password").fill(password);

    await authPanel.getByRole("button", { name: "Sign Up" }).click();
    await page.waitForTimeout(1500);
    await authPanel.getByRole("button", { name: "Sign In" }).click();
    await page.waitForTimeout(2000);

    console.log("Step 2: Navigate to analyzer and upload sample photo");
    await page.goto(`${baseUrl}/image-analyzer`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Acne Analysis/i }).first().click({ timeout: 10000 });
    await page.waitForTimeout(600);

    const fileInput = page.locator('input[type="file"]');
    const inputCount = await fileInput.count();
    if (inputCount === 0) {
      throw new Error("No file input found in analyzer upload step.");
    }

    await fileInput.first().setInputFiles(sampleImage);

    await page.waitForTimeout(1400);
    const analyzeReady = page.getByRole("button", { name: /Analyze 1 Photo|Analyze All Photos/i });
    await analyzeReady.waitFor({ state: "visible", timeout: 15000 });

    const analyzeBtn = page.getByRole("button", { name: /Analyze 1 Photo|Analyze All Photos/i });
    await analyzeBtn.click({ timeout: 15000 });

    console.log("Step 3: Complete assessment and reach result page");
    await waitForAssessmentAndComplete(page);

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
        .eq("analyzer_category", "acne")
        .order("scan_date", { ascending: false })
        .limit(3),
      supabase
        .from("assessment_answers")
        .select("id,user_id,category,parent_category,completed_at")
        .eq("user_id", userId)
        .eq("category", "acne")
        .order("completed_at", { ascending: false })
        .limit(3),
        supabase
        .from("user_category_clinical_scores")
        .select("user_id,category,severity_score,confidence_score,risk_level,assessment_completeness,updated_at")
        .eq("user_id", userId)
        .eq("category", "acne")
        .order("updated_at", { ascending: false })
        .limit(1),
    ]);

    if (scansError) throw new Error(`photo_scans query failed: ${scansError.message}`);
    if (assessmentError) throw new Error(`assessment_answers query failed: ${assessmentError.message}`);
      if (clinicalError) throw new Error(`user_category_clinical_scores query failed: ${clinicalError.message}`);

    const latestScan = scans?.[0];
    const latestAssessment = assessments?.[0];
    const latestClinical = clinicalRows?.[0];

    if (!latestScan) throw new Error("No acne scan row found after analyzer flow.");
    if (!latestAssessment) throw new Error("No acne assessment row found after assessment flow.");
    if (!latestClinical) throw new Error("No acne clinical score row found after result generation.");

    const uploadedUrls = Array.isArray(latestScan.captured_image_urls) ? latestScan.captured_image_urls : [];

    console.log("✅ FLOW VERIFIED");
    console.log(JSON.stringify({
      email,
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
      const screenshotPath = path.join(workspace, "artifacts", `e2e-failure-${Date.now()}.png`);
      fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.error(`Failure URL: ${page.url()}`);
      console.error(`Failure screenshot: ${screenshotPath}`);
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
