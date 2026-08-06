import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

async function run() {
  const outDir = "C:\\Users\\Badmash\\oneman-ai\\playwright-artifacts\\design-evolution\\9C\\9C.1";
  fs.mkdirSync(outDir, { recursive: true });
  const baseUrl = "http://localhost:3000";

  const viewports = [
    { width: 390, height: 844, label: "mobile" },
    { width: 1440, height: 900, label: "desktop" },
  ];

  for (const vp of viewports) {
    const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);

    console.log(`[${vp.label}] /`);
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(outDir, `landing-${vp.label}.png`), fullPage: true });

    console.log(`[${vp.label}] /login`);
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(outDir, `login-${vp.label}.png`), fullPage: true });

    // Focus-ring check: tab to the first focusable element on /login and screenshot just that state.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(outDir, `login-focus-${vp.label}.png`) });

    console.log(`[${vp.label}] /upgrade/success`);
    await page.goto(`${baseUrl}/upgrade/success?order_id=qa-9c1`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(outDir, `upgrade-success-${vp.label}.png`), fullPage: true });

    await browser.close();
  }
  console.log("DONE");
}

run().catch((e) => { console.error(e); process.exit(1); });
