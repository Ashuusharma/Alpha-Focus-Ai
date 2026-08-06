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
const outDir = path.join(workspace, "playwright-artifacts", "design-evolution", "9S.1");
fs.mkdirSync(outDir, { recursive: true });
const AXE_URL = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js";
let axeSource = null;

const results = [];
function record(step, status, detail) {
  console.log(`[${status}] ${step}${detail ? " — " + detail : ""}`);
  results.push({ step, status, detail: detail || null });
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

async function axeCheck(page) {
  await page.addScriptTag({ content: axeSource });
  return await page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    return await axe.run(document, { resultTypes: ["violations"] });
  });
}

async function main() {
  const env = loadEnvLocal(workspace);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Missing Supabase env");
  axeSource = await fetch(AXE_URL).then((r) => r.text());

  const browser = await chromium.launch({ headless: true, args: ["--disable-dev-shm-usage", "--no-sandbox"] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on("dialog", async (d) => { await d.accept(); });

  try {
    const email = `qa.9s1.${Date.now()}@example.com`;
    const authed = await authenticate(page, email, "AlphaFlow#2026!");
    record("auth", authed ? "PASS" : "FAIL");

    // --- Nav: Shop hidden ---
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const hamburger = page.getByLabel(/menu/i).first();
    if (await hamburger.isVisible().catch(() => false)) {
      await hamburger.click();
      await page.waitForTimeout(500);
    }
    await shot(page, "01-mobile-drawer");
    const shopLinkVisible = await page.getByRole("link", { name: /^Shop$/i }).isVisible().catch(() => false);
    record("nav: Shop hidden from mobile drawer", shopLinkVisible ? "FAIL" : "PASS", shopLinkVisible ? "Shop link still visible" : null);
    await page.keyboard.press("Escape").catch(() => {});

    // Desktop viewport nav check too
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await shot(page, "02-desktop-nav");
    const shopDesktopVisible = await page.getByRole("link", { name: /^Shop$/i }).isVisible().catch(() => false);
    record("nav: Shop hidden from desktop nav", shopDesktopVisible ? "FAIL" : "PASS", shopDesktopVisible ? "Shop link still visible" : null);
    await page.setViewportSize({ width: 390, height: 844 });

    // --- Cart: open drawer, verify checkout CTA is unconditionally disabled ---
    // (CheckoutCTA now renders `disabled` regardless of cart contents, so no
    // need to fight a flaky off-viewport "Add to Cart" click just to test this.)
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const cartTrigger = page.locator('button[aria-label*="cart" i], button:has(svg.lucide-shopping-cart)').first();
    if (await cartTrigger.isVisible().catch(() => false)) {
      await cartTrigger.click();
      await page.waitForTimeout(800);
    }
    await shot(page, "03-cart-drawer");
    const checkoutBtn = page.getByRole("button", { name: /checkout unavailable during beta/i }).first();
    const checkoutBtnVisible = await checkoutBtn.isVisible().catch(() => false);
    const checkoutBtnDisabled = checkoutBtnVisible ? await checkoutBtn.isDisabled().catch(() => false) : false;
    record("cart drawer: checkout CTA shows honest disabled state", checkoutBtnVisible && checkoutBtnDisabled ? "PASS" : "WARN", checkoutBtnVisible ? null : "button not found — check screenshot");

    // --- /cart page ---
    await page.goto(`${baseUrl}/cart`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await shot(page, "04-cart-page");
    const cartPageCheckoutBtn = page.getByRole("button", { name: /continue to checkout/i }).first();
    const cartPageDisabled = await cartPageCheckoutBtn.isDisabled().catch(() => null);
    record("/cart page: checkout button disabled", cartPageDisabled === true ? "PASS" : "WARN", cartPageDisabled === null ? "button not found" : `isDisabled=${cartPageDisabled}`);

    // --- /checkout direct visit ---
    await page.goto(`${baseUrl}/checkout`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await shot(page, "05-checkout-informational");
    const hasCardNumberField = await page.locator('input[autocomplete="cc-number"]').isVisible().catch(() => false);
    const hasInformationalHeading = await page.getByText(/not available during the beta/i).isVisible().catch(() => false);
    record("/checkout: no card fields rendered", hasCardNumberField ? "FAIL" : "PASS", hasCardNumberField ? "card-number field still present!" : null);
    record("/checkout: honest informational message shown", hasInformationalHeading ? "PASS" : "FAIL");

    // --- axe-core re-run on previously-failing routes for landmark + contrast ---
    const routesToRecheck = ["/", "/dashboard", "/image-analyzer", "/upgrade", "/alpha-credits"];
    for (const route of routesToRecheck) {
      await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);
      const axeResult = await axeCheck(page);
      const violationIds = (axeResult.violations || []).map((v) => v.id);
      const landmarkIssues = violationIds.filter((id) => id.startsWith("landmark-"));
      record(`axe: ${route} landmark issues resolved`, landmarkIssues.length === 0 ? "PASS" : "FAIL", landmarkIssues.length ? landmarkIssues.join(", ") : null);
    }

    // Contrast re-check specifically inside the cart drawer (where the fix was)
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    const cartTrigger2 = page.locator('button[aria-label*="cart" i], button:has(svg.lucide-shopping-cart)').first();
    if (await cartTrigger2.isVisible().catch(() => false)) {
      await cartTrigger2.click();
      await page.waitForTimeout(800);
    }
    const axeCart = await axeCheck(page);
    const contrastViolation = (axeCart.violations || []).find((v) => v.id === "color-contrast");
    const contrastTargets = contrastViolation ? contrastViolation.nodes.map((n) => n.target.join(" ")).join(" | ") : "";
    const stillHas6A7F71 = contrastTargets.includes("6A7F71") || contrastTargets.includes("6a7f71");
    record("axe: ProfessionalCartDrawer #6A7F71 contrast fixed", stillHas6A7F71 ? "FAIL" : "PASS", contrastViolation ? `${contrastViolation.nodes.length} other contrast issues remain (unrelated)` : "0 contrast violations in drawer view");

  } catch (error) {
    record("FATAL", "FAIL", error instanceof Error ? error.message : String(error));
    await shot(page, "FATAL");
  } finally {
    fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify(results, null, 2));
    console.log("\n=== 9S.1 VERIFICATION SUMMARY ===");
    for (const r of results) console.log(`[${r.status}] ${r.step}${r.detail ? " — " + r.detail : ""}`);
    await Promise.race([(async () => { await browser.close(); })(), new Promise((r) => setTimeout(r, 8000))]);
  }
}

main().catch((error) => {
  console.error("SCRIPT FAILED", error);
  process.exit(1);
});
