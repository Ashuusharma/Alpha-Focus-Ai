import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "playwright-artifacts", "7zc-final");

const PAGES = [
  { slug: "dashboard", route: "/dashboard" },
  { slug: "tracking", route: "/tracking" },
  { slug: "reports-weekly", route: "/reports/weekly" },
  { slug: "recovery-program", route: "/recovery-program" },
  { slug: "alpha-credits", route: "/alpha-credits" },
  { slug: "assessment", route: "/assessment" },
  { slug: "assistant", route: "/assistant" },
  { slug: "settings", route: "/settings" },
  { slug: "profile", route: "/profile" },
];

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
];

function timestampEmail() {
  return `qa.7zc.${Date.now()}@example.com`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  const email = timestampEmail();
  const password = "AlphaFlow#2026!";

  console.log("Step 1: Authenticate via test-auth page");
  await page.goto(`${BASE_URL}/test-auth`, { waitUntil: "domcontentloaded" });
  const authPanel = page.locator("div", { hasText: "Supabase Auth Test" }).first();
  await page.getByPlaceholder("email").fill(email);
  await page.getByPlaceholder("password").fill(password);
  await authPanel.locator("button", { hasText: /^Sign Up$/ }).first().click();
  await page.waitForTimeout(1500);
  await authPanel.locator("button", { hasText: /^Sign In$/ }).first().click();
  await page.waitForTimeout(2000);

  // Session lives in cookies (createBrowserClient / @supabase/ssr), not localStorage —
  // verify by confirming a protected route doesn't bounce back to /login.
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);
  if (/\/login/.test(page.url())) {
    throw new Error("Auth session not established (redirected to /login).");
  }
  console.log("Authenticated as", email);

  const captured = [];
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const target of PAGES) {
      try {
        await page.goto(`${BASE_URL}${target.route}`, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(900);
        const fileName = `${target.slug}-${viewport.name}.png`;
        const outPath = path.join(OUT_DIR, fileName);
        await page.screenshot({ path: outPath, fullPage: true });
        captured.push(fileName);
        console.log(`Captured ${fileName}`);
      } catch (error) {
        console.error(`FAILED ${target.slug} (${viewport.name}): ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  await browser.close();

  console.log("\nDone. Captured:", captured.length);
  if (consoleErrors.length > 0) {
    console.log("\nBrowser console errors seen during run:");
    for (const e of consoleErrors.slice(0, 40)) console.log(" -", e);
  } else {
    console.log("No browser console errors observed.");
  }
}

main().catch((error) => {
  console.error("QA screenshot run failed");
  console.error(error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
  process.exit(1);
});
