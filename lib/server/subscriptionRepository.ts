import "server-only";

type SupabaseConfig = {
  baseUrl: string;
  serviceKey: string;
};

export type UserSubscriptionRow = {
  user_id: string;
  plan: "free" | "premium_monthly" | "premium_yearly";
  active: boolean;
  started_at: string | null;
  expires_at: string | null;
  provider: string | null;
};

export type SubscriptionOrderRow = {
  id: string;
  user_id: string;
  plan: "premium_monthly" | "premium_yearly";
  provider: string;
  provider_order_id: string;
  amount_inr: number;
  currency: string;
  status: "created" | "paid" | "failed" | "expired" | "cancelled";
  created_at: string;
};

function getConfig(): SupabaseConfig | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), serviceKey };
}

function headers(serviceKey: string, extra: Record<string, string> = {}) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** Safe default: unknown/unreachable DB means "free", never silently "premium". */
export async function getUserSubscription(userId: string): Promise<UserSubscriptionRow | null> {
  const config = getConfig();
  if (!config) return null;

  try {
    const url = new URL(`${config.baseUrl}/rest/v1/user_subscriptions`);
    url.searchParams.set("select", "user_id,plan,active,started_at,expires_at,provider");
    url.searchParams.set("user_id", `eq.${userId}`);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), { headers: headers(config.serviceKey), cache: "no-store" });
    if (!response.ok) return null;

    const rows = (await response.json()) as UserSubscriptionRow[];
    return rows[0] ?? null;
  } catch (error) {
    console.error("[billing.subscriptionRepository] get_subscription_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return null;
  }
}

export async function findRecentPendingOrder(
  userId: string,
  plan: "premium_monthly" | "premium_yearly",
  withinMs: number
): Promise<SubscriptionOrderRow | null> {
  const config = getConfig();
  if (!config) return null;

  try {
    const sinceIso = new Date(Date.now() - withinMs).toISOString();
    const url = new URL(`${config.baseUrl}/rest/v1/subscription_orders`);
    url.searchParams.set("select", "id,user_id,plan,provider,provider_order_id,amount_inr,currency,status,created_at");
    url.searchParams.set("user_id", `eq.${userId}`);
    url.searchParams.set("plan", `eq.${plan}`);
    url.searchParams.set("status", "eq.created");
    url.searchParams.set("created_at", `gte.${sinceIso}`);
    url.searchParams.set("order", "created_at.desc");
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), { headers: headers(config.serviceKey), cache: "no-store" });
    if (!response.ok) return null;

    const rows = (await response.json()) as SubscriptionOrderRow[];
    return rows[0] ?? null;
  } catch (error) {
    console.error("[billing.subscriptionRepository] find_recent_order_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return null;
  }
}

export async function insertSubscriptionOrder(entry: {
  userId: string;
  plan: "premium_monthly" | "premium_yearly";
  providerOrderId: string;
  amountInr: number;
}): Promise<void> {
  const config = getConfig();
  if (!config) throw new Error("subscription_repository_not_configured");

  const response = await fetch(`${config.baseUrl}/rest/v1/subscription_orders`, {
    method: "POST",
    headers: headers(config.serviceKey, { Prefer: "return=minimal" }),
    body: JSON.stringify({
      user_id: entry.userId,
      plan: entry.plan,
      provider: "cashfree",
      provider_order_id: entry.providerOrderId,
      amount_inr: entry.amountInr,
      currency: "INR",
      status: "created",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`insert_subscription_order_failed: ${response.status} ${body.slice(0, 300)}`);
  }
}

async function getOrderByProviderOrderId(config: SupabaseConfig, providerOrderId: string): Promise<SubscriptionOrderRow | null> {
  const url = new URL(`${config.baseUrl}/rest/v1/subscription_orders`);
  url.searchParams.set("select", "id,user_id,plan,provider,provider_order_id,amount_inr,currency,status,created_at");
  url.searchParams.set("provider_order_id", `eq.${providerOrderId}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), { headers: headers(config.serviceKey), cache: "no-store" });
  if (!response.ok) return null;
  const rows = (await response.json()) as SubscriptionOrderRow[];
  return rows[0] ?? null;
}

const PLAN_DURATION_MS: Record<"premium_monthly" | "premium_yearly", number> = {
  premium_monthly: 30 * 24 * 60 * 60 * 1000,
  premium_yearly: 365 * 24 * 60 * 60 * 1000,
};

/**
 * Idempotent activation: only proceeds past the conditional status flip if
 * this call is the one that actually transitioned created -> paid, so a
 * webhook and a client-triggered verify-payment racing each other can't
 * double-activate (or double-extend expires_at) the same order.
 */
export async function activateSubscriptionForOrder(providerOrderId: string): Promise<{ activated: boolean }> {
  const config = getConfig();
  if (!config) throw new Error("subscription_repository_not_configured");

  const order = await getOrderByProviderOrderId(config, providerOrderId);
  if (!order) {
    console.error("[billing.subscriptionRepository] activate_order_not_found", { providerOrderId });
    return { activated: false };
  }

  const flipUrl = new URL(`${config.baseUrl}/rest/v1/subscription_orders`);
  flipUrl.searchParams.set("provider_order_id", `eq.${providerOrderId}`);
  flipUrl.searchParams.set("status", "eq.created");

  const flipResponse = await fetch(flipUrl.toString(), {
    method: "PATCH",
    headers: headers(config.serviceKey, { Prefer: "return=representation" }),
    body: JSON.stringify({ status: "paid", updated_at: new Date().toISOString() }),
    cache: "no-store",
  });

  if (!flipResponse.ok) {
    console.error("[billing.subscriptionRepository] activate_status_flip_failed", { status: flipResponse.status });
    return { activated: false };
  }

  const flipped = (await flipResponse.json()) as SubscriptionOrderRow[];
  if (!flipped.length) {
    // Already flipped by a concurrent call (webhook + verify-payment race) — not an error.
    return { activated: false };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + PLAN_DURATION_MS[order.plan]);

  const upsertResponse = await fetch(`${config.baseUrl}/rest/v1/user_subscriptions`, {
    method: "POST",
    headers: headers(config.serviceKey, { Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({
      user_id: order.user_id,
      plan: order.plan,
      active: true,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      provider: "cashfree",
    }),
    cache: "no-store",
  });

  if (!upsertResponse.ok) {
    const body = await upsertResponse.text().catch(() => "");
    console.error("[billing.subscriptionRepository] activate_upsert_failed", { status: upsertResponse.status, bodyPreview: body.slice(0, 300) });
    return { activated: false };
  }

  console.info("[billing.subscriptionRepository] activated", { userId: order.user_id, plan: order.plan, providerOrderId });
  return { activated: true };
}
