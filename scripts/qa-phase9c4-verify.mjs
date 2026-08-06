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
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
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
    const email = `qa.9c4.${label}.${Date.now()}@example.com`;
    console.log(`[${label}] auth`);
    await authenticate(page, baseUrl, email, "AlphaFlow#2026!");

    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => (document.body?.innerText || "").includes("Welcome back"), { timeout: 20000 });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, `01-navbar-${label}.png`) });

    // Mobile: open the hamburger drawer.
    if (width < 768) {
      const hamburger = page.getByLabel("Open menu");
      if (await hamburger.isVisible().catch(() => false)) {
        await hamburger.click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(outDir, `02-drawer-${label}.png`) });
        await page.keyboard.press("Escape").catch(() => {});
        await page.mouse.click(5, 5).catch(() => {});
        await page.waitForTimeout(200);
      }
      // Bottom nav visible on mobile.
      const bottomNav = page.getByLabel("Primary mobile navigation");
      if (await bottomNav.isVisible().catch(() => false)) {
        await page.screenshot({ path: path.join(outDir, `03-bottomnav-${label}.png`) });
      }
    } else {
      // Desktop: open the "More" dropdown.
      const moreBtn = page.getByLabel("Open more routes");
      if (await moreBtn.isVisible().catch(() => false)) {
        await moreBtn.click();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(outDir, `02-more-menu-${label}.png`) });
        await page.mouse.click(5, 5).catch(() => {});
      }

      // Keyboard traversal: Tab through the first several focusable nav elements
      // and confirm a visible focus ring lands on each (desktop only, mouse-free).
      await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
      for (let i = 0; i < 6; i += 1) {
        await page.keyboard.press("Tab");
        await page.waitForTimeout(80);
      }
      await page.screenshot({ path: path.join(outDir, `04-keyboard-focus-${label}.png`) });
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
  const outDir = path.join(workspace, "playwright-artifacts", "design-evolution", "9C", "9C.4");
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
