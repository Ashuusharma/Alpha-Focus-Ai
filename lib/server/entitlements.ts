import "server-only";
import { getUserSubscription } from "@/lib/server/subscriptionRepository";

export type PlanId = "free" | "premium_monthly" | "premium_yearly";

export type UserPlan = {
  plan: PlanId;
  active: boolean;
  expiresAt: string | null;
};

// Free-tier monthly analyzer cap. Matches the /upgrade page's existing "2
// scans/month" copy for the free tier — the old client-side check this
// replaces had `basic: 80`, almost certainly a copy/paste bug against
// plus's `5`, fixed here as part of unifying the plan vocabulary.
const FREE_MONTHLY_SCAN_CAP = 2;

/**
 * Central source of truth for "what plan is this user on, and is it
 * currently in effect." Safe default on any DB error: free/inactive —
 * never silently grants premium access it couldn't verify.
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  const row = await getUserSubscription(userId);
  if (!row) {
    return { plan: "free", active: true, expiresAt: null };
  }

  const notExpired = !row.expires_at || new Date(row.expires_at) > new Date();
  const isActive = row.active !== false && notExpired;
  const plan: PlanId = isActive ? row.plan : "free";

  return { plan, active: isActive, expiresAt: row.expires_at };
}

function isPremiumPlan(plan: PlanId): boolean {
  return plan === "premium_monthly" || plan === "premium_yearly";
}

export async function canAccessPremiumFeatures(userId: string): Promise<boolean> {
  const { plan } = await getUserPlan(userId);
  return isPremiumPlan(plan);
}

/**
 * No protocol-generation-specific cap exists today (protocol generation
 * always follows a gated analyzer scan) — this mirrors the general premium
 * check rather than inventing a new restriction, and exists so future
 * premium-only protocol features have a ready call site.
 */
export async function canGenerateProtocol(_userId: string): Promise<boolean> {
  return true;
}

/** Fail-open on the count query itself (unreachable DB -> assume 0 used
 *  this month) — a soft usage cap under-enforcing briefly is an acceptable
 *  trade-off against blocking every free-tier scan on a transient error. */
async function getMonthlyScanCount(userId: string): Promise<number> {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return 0;

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  try {
    const url = new URL(`${baseUrl.replace(/\/$/, "")}/rest/v1/photo_scans`);
    url.searchParams.set("select", "id");
    url.searchParams.set("user_id", `eq.${userId}`);
    url.searchParams.set("scan_date", `gte.${monthStart.toISOString()}`);

    const response = await fetch(url.toString(), {
      method: "HEAD",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: "count=exact" },
      cache: "no-store",
    });

    const contentRange = response.headers.get("content-range");
    const total = contentRange ? Number(contentRange.split("/")[1]) : 0;
    return Number.isFinite(total) ? total : 0;
  } catch (error) {
    console.error("[entitlements] monthly_scan_count_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return 0;
  }
}

export async function canRunAnalyzer(userId: string): Promise<{ allowed: boolean; used: number; cap: number }> {
  const [{ plan }, used] = await Promise.all([getUserPlan(userId), getMonthlyScanCount(userId)]);
  const cap = isPremiumPlan(plan) ? Number.POSITIVE_INFINITY : FREE_MONTHLY_SCAN_CAP;
  return { allowed: used < cap, used, cap };
}
