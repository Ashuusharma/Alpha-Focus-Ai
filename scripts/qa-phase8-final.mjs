import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "playwright-artifacts", "phase8-final");

const ROUTES = [
  "/dashboard",
  "/tracking",
  "/alpha-credits",
  "/reports/weekly",
  "/profile",
  "/settings",
  "/recovery-program",
  "/assistant",
  "/shop",
  "/checkout",
];

function timestampEmail() {
  return `qa.phase8.${Date.now()}@example.com`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrorsByRoute = {};
  const networkErrorsByRoute = {};
  let currentRoute = "auth";

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      (consoleErrorsByRoute[currentRoute] ||= []).push(msg.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().includes("/rest/v1/")) {
      (networkErrorsByRoute[currentRoute] ||= []).push(`${response.status()} ${response.url()}`);
    }
  });

  const email = timestampEmail();
  const password = "AlphaFlow#2026!";

  console.log("Step 1: Authenticate via test-auth page");
  await page.goto(`${BASE_URL}/test-auth`, { waitUntil: "domcontentloaded" });
  const authPanel = page.locator("div", { hasText: "Supabase Auth Test" }).first();
  await page.getByPlaceholder("email").fill(email);
  await page.getByPlaceholder("password").fill(password);
  await authPanel.locator("button", { hasText: /^Sign Up$/ }).first().click();
  await page.waitForTimeout(2000);
  await authPanel.locator("button", { hasText: /^Sign In$/ }).first().click();
  await page.waitForTimeout(2000);

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1000);
  if (/\/login/.test(page.url())) {
    throw new Error("Auth session not established (redirected to /login).");
  }
  console.log("Authenticated as", email);

  for (const route of ROUTES) {
    currentRoute = route;
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1200);
      const fileName = `${route.replace(/\//g, "_") || "root"}.png`;
      await page.screenshot({ path: path.join(OUT_DIR, fileName), fullPage: false });
      console.log(`Captured ${route}`);
    } catch (error) {
      console.error(`FAILED ${route}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await browser.close();

  console.log("\n=== Console errors by route ===");
  let anyIssues = false;
  for (const [route, errors] of Object.entries(consoleErrorsByRoute)) {
    if (errors.length) {
      anyIssues = true;
      console.log(`${route}:`);
      errors.forEach((e) => console.log("  -", e));
    }
  }
  console.log("\n=== Supabase REST 400+ responses by route ===");
  for (const [route, errors] of Object.entries(networkErrorsByRoute)) {
    if (errors.length) {
      anyIssues = true;
      console.log(`${route}:`);
      errors.forEach((e) => console.log("  -", e));
    }
  }
  if (!anyIssues) console.log("None found across all routes.");
}

main().catch((error) => {
  console.error("QA run failed");
  console.error(error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error));
  process.exit(1);
});
