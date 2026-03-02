import { NextRequest, NextResponse } from "next/server";
import { alphaSikkaSummarySchema } from "@/lib/server/validators";
import { deriveTier } from "@/lib/server/alphaSikkaServer";
import { getSupabaseRequestUser } from "@/lib/server/supabaseRequestAuth";

export const runtime = "nodejs";

type SummaryRow = {
  current_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
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
  };
}

export async function GET(request: NextRequest) {
  const authUser = await getSupabaseRequestUser(request);
  if (!authUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const config = getSupabaseConfig();
  if (!config) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  const rawQuery = {
    supabaseUserId: request.nextUrl.searchParams.get("supabaseUserId") || undefined,
  };
  const parsed = alphaSikkaSummarySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_query" }, { status: 400 });
  }

  const supabaseUserId = parsed.data.supabaseUserId || authUser.id;

  const summaryUrl = new URL(`${config.baseUrl}/rest/v1/alpha_sikka_summary`);
  summaryUrl.searchParams.set("select", "current_balance,lifetime_earned,lifetime_spent");
  summaryUrl.searchParams.set("user_id", `eq.${supabaseUserId}`);
  summaryUrl.searchParams.set("limit", "1");

  const summaryResponse = await fetch(summaryUrl.toString(), {
    method: "GET",
    headers: buildAuthHeaders(config.serviceKey),
    cache: "no-store",
  });

  if (!summaryResponse.ok) {
    return NextResponse.json({ ok: false, error: "summary_fetch_failed" }, { status: 500 });
  }

  const rows = (await summaryResponse.json()) as SummaryRow[];
  const row = rows[0] || { current_balance: 0, lifetime_earned: 0, lifetime_spent: 0 };

  const transactionsUrl = new URL(`${config.baseUrl}/rest/v1/alpha_sikka_transactions`);
  transactionsUrl.searchParams.set("select", "id,amount,category,description,created_at");
  transactionsUrl.searchParams.set("user_id", `eq.${supabaseUserId}`);
  transactionsUrl.searchParams.set("order", "created_at.desc");
  transactionsUrl.searchParams.set("limit", "25");

  const txResponse = await fetch(transactionsUrl.toString(), {
    method: "GET",
    headers: buildAuthHeaders(config.serviceKey),
    cache: "no-store",
  });

  const transactions = txResponse.ok ? await txResponse.json() : [];

  return NextResponse.json({
    ok: true,
    summary: {
      currentBalance: Number(row.current_balance || 0),
      lifetimeEarned: Number(row.lifetime_earned || 0),
      lifetimeSpent: Number(row.lifetime_spent || 0),
      tierLevel: deriveTier(Number(row.lifetime_earned || 0)),
    },
    transactions,
  });
}
