import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/server/rateLimit";
import { writeAuditLog } from "@/lib/server/auditLog";
import { alphaSikkaSpendSchema } from "@/lib/server/validators";
import { deriveTier } from "@/lib/server/alphaSikkaServer";
import { getSupabaseRequestUser } from "@/lib/server/supabaseRequestAuth";
import { invalidateRequestCache, invalidateRequestCachePrefix } from "@/lib/server/requestCache";

export const runtime = "nodejs";

type SummaryRow = {
  current_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
};

type TxRow = {
  id: string;
  amount: number;
  created_at: string;
  category: string;
};

function getSupabaseConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !serviceKey) return null;
  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    serviceKey,
  };
}

function buildAuthHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function fetchSummary(baseUrl: string, serviceKey: string, userId: string) {
  const url = new URL(`${baseUrl}/rest/v1/alpha_sikka_summary`);
  url.searchParams.set("select", "current_balance,lifetime_earned,lifetime_spent");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as SummaryRow[];
  return rows[0] || { current_balance: 0, lifetime_earned: 0, lifetime_spent: 0 };
}

async function fetchRecent(baseUrl: string, serviceKey: string, userId: string) {
  const url = new URL(`${baseUrl}/rest/v1/alpha_sikka_transactions`);
  url.searchParams.set("select", "id,amount,created_at,category");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "10");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) return [] as TxRow[];
  return (await response.json()) as TxRow[];
}

async function callProcessTransactionRpc(input: {
  baseUrl: string;
  serviceKey: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  actionCode?: string;
  activityDate?: string;
}) {
  const response = await fetch(`${input.baseUrl}/rest/v1/rpc/process_alpha_sikka_transaction`, {
    method: "POST",
    headers: buildAuthHeaders(input.serviceKey),
    body: JSON.stringify({
      p_user_id: input.userId,
      p_amount: input.amount,
      p_type: "spend",
      p_category: input.category,
      p_description: input.description,
      p_reference_id: input.referenceId || null,
      p_metadata: input.metadata || {},
      p_action_code: input.actionCode || null,
      p_activity_date: input.activityDate || null,
    }),
    cache: "no-store",
  });

  return response;
}

async function validateRedemption(input: {
  baseUrl: string;
  serviceKey: string;
  userId: string;
  cartTotal: number;
  requestedDiscount: number;
}) {
  const response = await fetch(`${input.baseUrl}/rest/v1/rpc/validate_alpha_redemption`, {
    method: "POST",
    headers: buildAuthHeaders(input.serviceKey),
    body: JSON.stringify({
      p_user: input.userId,
      p_cart_total: input.cartTotal,
      p_requested_discount: input.requestedDiscount,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return false;
  }

  const payload = await response.json();
  return Boolean(payload);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getSupabaseRequestUser(request);
    if (!authUser) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`alpha-sikka:spend:${authUser.id}`, 40, 60_000)) {
      await writeAuditLog({ action: "alpha_sikka.spend", userId: authUser.id, ok: false, route: "/api/alpha-sikka/spend", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const config = getSupabaseConfig();
    if (!config) {
      return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
    }

    const raw = await request.json();
    const parsed = alphaSikkaSpendSchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "alpha_sikka.spend", userId: authUser.id, ok: false, route: "/api/alpha-sikka/spend", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;

    if (body.category === "redemption" && Number.isFinite(body.cartTotal)) {
      const isValid = await validateRedemption({
        baseUrl: config.baseUrl,
        serviceKey: config.serviceKey,
        userId: authUser.id,
        cartTotal: Number(body.cartTotal),
        requestedDiscount: Math.abs(body.amount),
      });

      if (!isValid) {
        return NextResponse.json(
          {
            ok: false,
            error: "redemption_validation_failed",
            message: "Redemption exceeds allowed rules (balance, max 20%, or min cart ₹1000).",
          },
          { status: 400 }
        );
      }
    }

    const insertResponse = await callProcessTransactionRpc({
      baseUrl: config.baseUrl,
      serviceKey: config.serviceKey,
      userId: authUser.id,
      amount: Math.abs(body.amount),
      category: body.category || "redemption",
      description: body.description,
      referenceId: body.referenceId,
      metadata: body.metadata,
    });

    if (!insertResponse.ok) {
      const detail = await insertResponse.text();
      if (detail.toLowerCase().includes("insufficient balance")) {
        const latestSummary = await fetchSummary(config.baseUrl, config.serviceKey, authUser.id);
        return NextResponse.json(
          {
            ok: false,
            error: "insufficient_balance",
            currentBalance: Number(latestSummary?.current_balance || 0),
          },
          { status: 400 }
        );
      }
      await writeAuditLog({ action: "alpha_sikka.spend", userId: authUser.id, ok: false, route: "/api/alpha-sikka/spend", detail: "insert_failed" });
      return NextResponse.json({ ok: false, error: "insert_failed", detail }, { status: 500 });
    }

    const summary = await fetchSummary(config.baseUrl, config.serviceKey, authUser.id);
    const recent = await fetchRecent(config.baseUrl, config.serviceKey, authUser.id);
    const lifetimeEarned = Number(summary?.lifetime_earned || 0);

    await writeAuditLog({ action: "alpha_sikka.spend", userId: authUser.id, ok: true, route: "/api/alpha-sikka/spend" });
    invalidateRequestCache(`alpha-summary:${authUser.id}`);
    invalidateRequestCachePrefix(`dashboard:${authUser.id}`);

    return NextResponse.json({
      ok: true,
      spent: body.amount,
      summary: {
        currentBalance: Number(summary?.current_balance || 0),
        lifetimeEarned,
        lifetimeSpent: Number(summary?.lifetime_spent || 0),
        tier: deriveTier(lifetimeEarned),
      },
      recent,
      toast: `-${body.amount} A$ spent`,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "alpha_sikka_spend_failed" }, { status: 500 });
  }
}