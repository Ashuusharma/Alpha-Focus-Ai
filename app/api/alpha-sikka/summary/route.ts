import { NextRequest, NextResponse } from "next/server";
import { alphaSikkaSummarySchema } from "@/lib/server/validators";
import { getTierForLifetime } from "@/lib/rewardTierService";
import { getSupabaseRequestUser } from "@/lib/server/supabaseRequestAuth";
import { getOrSetRequestCache } from "@/lib/server/requestCache";

export const runtime = "nodejs";

type SummaryRow = {
  current_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
};

type StreakRow = {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
};

function getSupabaseConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
    console.warn("[alpha-sikka.summary] unauthorized", {
      hasAuthorizationHeader: Boolean(request.headers.get("authorization")?.trim()),
      path: request.nextUrl.pathname,
    });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const config = getSupabaseConfig();
  if (!config) {
    console.error("[alpha-sikka.summary] supabase_not_configured", {
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
  }

  const rawQuery = {
    supabaseUserId: request.nextUrl.searchParams.get("supabaseUserId") || undefined,
  };
  const parsed = alphaSikkaSummarySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_query" }, { status: 400 });
  }

  if (parsed.data.supabaseUserId && parsed.data.supabaseUserId !== authUser.id) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const supabaseUserId = authUser.id;

  console.info("[alpha-sikka.summary] request_start", {
    authenticatedUserId: supabaseUserId,
    hasAuthorizationHeader: Boolean(request.headers.get("authorization")?.trim()),
  });

  try {
    const payload = await getOrSetRequestCache(`alpha-summary:${supabaseUserId}`, 15_000, async () => {
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
        const detail = await summaryResponse.text();
        console.error("[alpha-sikka.summary] summary_query_failed", {
          failingCall: "GET /rest/v1/alpha_sikka_summary",
          status: summaryResponse.status,
          userId: supabaseUserId,
          detail: detail.slice(0, 500),
        });
        throw new Error("summary_fetch_failed");
      }

      console.info("[alpha-sikka.summary] summary_query_ok", {
        userId: supabaseUserId,
      });

      const rows = (await summaryResponse.json()) as SummaryRow[];
      const row = rows[0] || { current_balance: 0, lifetime_earned: 0, lifetime_spent: 0 };

      const transactionsUrl = new URL(`${config.baseUrl}/rest/v1/alpha_sikka_transactions`);
      transactionsUrl.searchParams.set("select", "id,amount,category,description,created_at,action_code,activity_date,metadata");
      transactionsUrl.searchParams.set("user_id", `eq.${supabaseUserId}`);
      transactionsUrl.searchParams.set("order", "created_at.desc");
      transactionsUrl.searchParams.set("limit", "40");

      const txResponse = await fetch(transactionsUrl.toString(), {
        method: "GET",
        headers: buildAuthHeaders(config.serviceKey),
        cache: "no-store",
      });

      if (!txResponse.ok) {
        const txDetail = await txResponse.text();
        console.error("[alpha-sikka.summary] transactions_query_failed", {
          failingCall: "GET /rest/v1/alpha_sikka_transactions",
          status: txResponse.status,
          userId: supabaseUserId,
          detail: txDetail.slice(0, 500),
        });
      }

      const transactions = txResponse.ok ? await txResponse.json() : [];

      const streakUrl = new URL(`${config.baseUrl}/rest/v1/user_streaks`);
      streakUrl.searchParams.set("select", "current_streak,longest_streak,last_activity_date");
      streakUrl.searchParams.set("user_id", `eq.${supabaseUserId}`);
      streakUrl.searchParams.set("limit", "1");

      const streakResponse = await fetch(streakUrl.toString(), {
        method: "GET",
        headers: buildAuthHeaders(config.serviceKey),
        cache: "no-store",
      });

      if (!streakResponse.ok) {
        const streakDetail = await streakResponse.text();
        console.error("[alpha-sikka.summary] streak_query_failed", {
          failingCall: "GET /rest/v1/user_streaks",
          status: streakResponse.status,
          userId: supabaseUserId,
          detail: streakDetail.slice(0, 500),
        });
      }

      const streakRows = streakResponse.ok ? ((await streakResponse.json()) as StreakRow[]) : [];
      const streak = streakRows[0] || { current_streak: 0, longest_streak: 0, last_activity_date: null };
      const tierLevel = getTierForLifetime(Number(row.lifetime_earned || 0)).label;

      return {
        ok: true,
        summary: {
          current_balance: Number(row.current_balance || 0),
          lifetime_earned: Number(row.lifetime_earned || 0),
          lifetime_spent: Number(row.lifetime_spent || 0),
          tier_level: tierLevel,
          currentBalance: Number(row.current_balance || 0),
          lifetimeEarned: Number(row.lifetime_earned || 0),
          lifetimeSpent: Number(row.lifetime_spent || 0),
          tierLevel,
        },
        transactions,
        streak,
      };
    });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=15, stale-while-revalidate=45",
      },
    });
  } catch (error) {
    console.error("[alpha-sikka.summary] request_failed", {
      failingCall: "getOrSetRequestCache(alpha-summary)",
      error: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "summary_fetch_failed" }, { status: 500 });
  }
}
