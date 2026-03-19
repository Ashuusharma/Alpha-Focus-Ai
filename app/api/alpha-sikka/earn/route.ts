import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/server/rateLimit";
import { writeAuditLog } from "@/lib/server/auditLog";
import { alphaSikkaEarnSchema } from "@/lib/server/validators";
import { getSupabaseRequestUser } from "@/lib/server/supabaseRequestAuth";
import {
  ALPHA_SIKKA_RULES,
  buildReferenceKey,
  computeAwardAmount,
  deriveTier,
  getAlphaSikkaActivityDate,
  type AlphaSikkaAction,
} from "@/lib/server/alphaSikkaServer";
import { ALPHA_CORE_DAILY_ACTIONS, ALPHA_REWARD_SYSTEM } from "@/lib/alphaRewardSystem";
import { invalidateRequestCache, invalidateRequestCachePrefix } from "@/lib/server/requestCache";

export const runtime = "nodejs";

type TxRow = {
  id: string;
  amount: number;
  created_at: string;
  category: string;
};

type SummaryRow = {
  current_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
};

type TierRpcRow = {
  tier_name: string;
};

type StreakRpcRow = {
  current_streak: number;
  longest_streak: number;
  bonus_awarded: number;
};

type StreakStateRow = {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
};

type ActionRow = {
  action_code: string | null;
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

async function fetchDisciplineTodayTotal(baseUrl: string, serviceKey: string, userId: string) {
  const dayKey = getAlphaSikkaActivityDate(new Date());
  const url = new URL(`${baseUrl}/rest/v1/alpha_sikka_transactions`);
  url.searchParams.set("select", "amount");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("category", "eq.discipline");
  url.searchParams.set("activity_date", `eq.${dayKey}`);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) return 0;
  const rows = (await response.json()) as Array<{ amount: number }>;
  return rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
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
  return rows[0] || null;
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
  type?: "earn" | "spend";
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
      p_type: input.type || "earn",
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

async function fetchTierFromRpc(baseUrl: string, serviceKey: string, userId: string) {
  const response = await fetch(`${baseUrl}/rest/v1/rpc/get_user_tier`, {
    method: "POST",
    headers: buildAuthHeaders(serviceKey),
    body: JSON.stringify({ p_user: userId }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as TierRpcRow[] | TierRpcRow | null;
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0]?.tier_name || null;
  return payload.tier_name || null;
}

async function updateStreakRpc(baseUrl: string, serviceKey: string, userId: string) {
  const response = await fetch(`${baseUrl}/rest/v1/rpc/update_user_streak`, {
    method: "POST",
    headers: buildAuthHeaders(serviceKey),
    body: JSON.stringify({ p_user: userId }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as StreakRpcRow[] | StreakRpcRow | null;
  if (!payload) return null;
  if (Array.isArray(payload)) return payload[0] || null;
  return payload;
}

async function fetchStreakState(baseUrl: string, serviceKey: string, userId: string) {
  const url = new URL(`${baseUrl}/rest/v1/user_streaks`);
  url.searchParams.set("select", "current_streak,longest_streak,last_activity_date");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as StreakStateRow[];
  return rows[0] || null;
}

async function fetchCompletedDailyActions(baseUrl: string, serviceKey: string, userId: string, activityDate: string) {
  const url = new URL(`${baseUrl}/rest/v1/alpha_sikka_transactions`);
  url.searchParams.set("select", "action_code");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("activity_date", `eq.${activityDate}`);
  url.searchParams.set("amount", "gt.0");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) return new Set<string>();
  const rows = (await response.json()) as ActionRow[];
  return new Set(rows.map((row) => row.action_code).filter((value): value is string => Boolean(value)));
}

function getDateDiffDays(previousDate: string, nextDate: string) {
  const previous = new Date(`${previousDate}T00:00:00Z`).getTime();
  const next = new Date(`${nextDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(previous) || !Number.isFinite(next)) return 0;
  return Math.floor((next - previous) / 86_400_000);
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getSupabaseRequestUser(request);
    if (!authUser) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`alpha-sikka:earn:${authUser.id}`, 40, 60_000)) {
      await writeAuditLog({ action: "alpha_sikka.earn", userId: authUser.id, ok: false, route: "/api/alpha-sikka/earn", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const config = getSupabaseConfig();
    if (!config) {
      return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });
    }

    const raw = await request.json();
    const parsed = alphaSikkaEarnSchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "alpha_sikka.earn", userId: authUser.id, ok: false, route: "/api/alpha-sikka/earn", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;
    const action = body.action as AlphaSikkaAction;
    const rule = ALPHA_SIKKA_RULES[action];

    const supabaseUserId = authUser.id;
    const activityDate = getAlphaSikkaActivityDate(new Date());

    const referenceId = buildReferenceKey(action, rule.frequency, body.referenceId);
    if (rule.frequency === "event" && !referenceId) {
      return NextResponse.json({ ok: false, error: "reference_required" }, { status: 400 });
    }

    let amount = computeAwardAmount(action, body.metadata);

    let penaltyApplied = 0;

    if (action === "daily_login") {
      const streakState = await fetchStreakState(config.baseUrl, config.serviceKey, supabaseUserId);
      const lastActivityDate = streakState?.last_activity_date;
      if (lastActivityDate) {
        const skippedDays = Math.max(0, getDateDiffDays(lastActivityDate, activityDate) - 1 - ALPHA_REWARD_SYSTEM.penalties.graceDays);
        if (skippedDays > 0) {
          const penalizedDays = Math.min(skippedDays, ALPHA_REWARD_SYSTEM.penalties.maxPenaltyDaysPerClaim);
          const currentSummary = await fetchSummary(config.baseUrl, config.serviceKey, supabaseUserId);
          const rawPenaltyAmount = penalizedDays * ALPHA_REWARD_SYSTEM.penalties.missed_day;
          const penaltyAmount = Math.min(Number(currentSummary?.current_balance || 0), rawPenaltyAmount);
          const penaltyReferenceId = `missed_day_penalty:${activityDate}`;
          if (penaltyAmount > 0) {
            const penaltyResponse = await callProcessTransactionRpc({
              baseUrl: config.baseUrl,
              serviceKey: config.serviceKey,
              userId: supabaseUserId,
              amount: penaltyAmount,
              type: "spend",
              category: "penalty",
              description: penalizedDays === 1 ? "Missed day penalty" : `${penalizedDays} missed days penalty`,
              referenceId: penaltyReferenceId,
              metadata: {
                skippedDays,
                penalizedDays,
                previousActivityDate: lastActivityDate,
                graceDays: ALPHA_REWARD_SYSTEM.penalties.graceDays,
                maxPenaltyDaysPerClaim: ALPHA_REWARD_SYSTEM.penalties.maxPenaltyDaysPerClaim,
              },
              actionCode: "missed_day_penalty",
              activityDate,
            });

            if (penaltyResponse.ok) {
              penaltyApplied = penaltyAmount;
            }
          }
        }
      }
    }

    if (action === "treatment_task_completed") {
      const timerCompleted = body.metadata?.timerCompleted === true;
      const withinWindow = body.metadata?.withinWindow === true;
      const completedOnce = body.metadata?.completedOnce === true;
      const cooldownLock = body.metadata?.cooldownLock === true;
      const isRecovery = body.metadata?.isRecovery === true;

      if (!isRecovery && (!timerCompleted || !withinWindow || !completedOnce || !cooldownLock)) {
        return NextResponse.json({ ok: false, error: "reward_policy_violation" }, { status: 400 });
      }
    }

    if (action === "treatment_day_completed") {
      const allTasksVerified = body.metadata?.allTasksVerified === true;
      const completedOnce = body.metadata?.completedOnce === true;
      const cooldownLock = body.metadata?.cooldownLock === true;
      if (!allTasksVerified || !completedOnce || !cooldownLock) {
        return NextResponse.json({ ok: false, error: "reward_policy_violation" }, { status: 400 });
      }
    }

    if (rule.category === "discipline") {
      const earnedToday = await fetchDisciplineTodayTotal(config.baseUrl, config.serviceKey, supabaseUserId);
      amount = Math.max(0, Math.min(amount, 20 - earnedToday));
      if (amount <= 0) {
        return NextResponse.json({ ok: false, error: "daily_discipline_cap_reached", dailyCap: 20 }, { status: 200 });
      }
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "invalid_award_amount" }, { status: 400 });
    }

    const insertResponse = await callProcessTransactionRpc({
      baseUrl: config.baseUrl,
      serviceKey: config.serviceKey,
      userId: supabaseUserId,
      amount,
      category: rule.category,
      description: rule.description,
      referenceId: referenceId || undefined,
      metadata: body.metadata,
      actionCode: action,
      activityDate,
    });

    if (!insertResponse.ok) {
      const message = await insertResponse.text();
      const isDuplicate = message.includes("duplicate") || message.includes("unique");
      if (isDuplicate) {
        return NextResponse.json({ ok: false, error: "already_awarded" }, { status: 200 });
      }

      await writeAuditLog({ action: "alpha_sikka.earn", userId: authUser.id, ok: false, route: "/api/alpha-sikka/earn", detail: "insert_failed" });
      return NextResponse.json({ ok: false, error: "insert_failed", detail: message }, { status: 500 });
    }

    let streakBonus = 0;
    let taskBonus = 0;
    if (rule.category === "discipline") {
      const completedDailyActions = await fetchCompletedDailyActions(config.baseUrl, config.serviceKey, supabaseUserId, activityDate);
      const completedCoreDailyCount = ALPHA_CORE_DAILY_ACTIONS.filter((item) => completedDailyActions.has(item)).length;

      if (completedCoreDailyCount >= ALPHA_REWARD_SYSTEM.taskBonus.threshold) {
        const bonusResponse = await callProcessTransactionRpc({
          baseUrl: config.baseUrl,
          serviceKey: config.serviceKey,
          userId: supabaseUserId,
          amount: ALPHA_REWARD_SYSTEM.taskBonus.amount,
          category: "discipline",
          description: "3-task daily bonus",
          referenceId: `${ALPHA_REWARD_SYSTEM.taskBonus.actionCode}:${activityDate}`,
          metadata: {
            completedTasksToday: completedCoreDailyCount,
            trigger: action,
          },
          actionCode: ALPHA_REWARD_SYSTEM.taskBonus.actionCode,
          activityDate,
        });

        if (bonusResponse.ok) {
          taskBonus = ALPHA_REWARD_SYSTEM.taskBonus.amount;
        }
      }

      const streak = await updateStreakRpc(config.baseUrl, config.serviceKey, supabaseUserId);
      const currentStreak = Number(streak?.current_streak || 0);
      const computedBonus = currentStreak === 30
        ? ALPHA_REWARD_SYSTEM.streakBonus[30]
        : currentStreak === 7
          ? ALPHA_REWARD_SYSTEM.streakBonus[7]
          : 0;
      if (computedBonus > 0) {
        streakBonus = computedBonus;
        const streakReferenceId = `streak_bonus:${supabaseUserId}:${activityDate}:${computedBonus}`;
        const bonusResponse = await callProcessTransactionRpc({
          baseUrl: config.baseUrl,
          serviceKey: config.serviceKey,
          userId: supabaseUserId,
          amount: computedBonus,
          category: "milestone",
          description: computedBonus === ALPHA_REWARD_SYSTEM.streakBonus[30] ? "30-day streak milestone" : "7-day streak milestone",
          referenceId: streakReferenceId,
          metadata: {
            milestone: computedBonus === ALPHA_REWARD_SYSTEM.streakBonus[30] ? 30 : 7,
            trigger: action,
          },
          actionCode: computedBonus === ALPHA_REWARD_SYSTEM.streakBonus[30] ? "streak_30" : "streak_7",
          activityDate,
        });

        if (!bonusResponse.ok) {
          streakBonus = 0;
        }
      }
    }

    const summary = await fetchSummary(config.baseUrl, config.serviceKey, supabaseUserId);
    const recent = await fetchRecent(config.baseUrl, config.serviceKey, supabaseUserId);

    const lifetimeEarned = Number(summary?.lifetime_earned || 0);
    const tier = (await fetchTierFromRpc(config.baseUrl, config.serviceKey, supabaseUserId)) || deriveTier(lifetimeEarned);

    await writeAuditLog({ action: "alpha_sikka.earn", userId: authUser.id, ok: true, route: "/api/alpha-sikka/earn" });
    invalidateRequestCache(`alpha-summary:${supabaseUserId}`);
    invalidateRequestCachePrefix(`dashboard:${supabaseUserId}`);
    return NextResponse.json({
      ok: true,
      awarded: amount,
      category: rule.category,
      penaltyApplied,
      taskBonus,
      summary: {
        currentBalance: Number(summary?.current_balance || 0),
        lifetimeEarned,
        lifetimeSpent: Number(summary?.lifetime_spent || 0),
        tier,
      },
      recent,
      streakBonus,
      toast: `${amount + taskBonus + streakBonus - penaltyApplied >= 0 ? "+" : "-"}${Math.abs(amount + taskBonus + streakBonus - penaltyApplied)} A$ ${penaltyApplied > 0 ? "net" : "earned"}`,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "alpha_sikka_earn_failed" }, { status: 500 });
  }
}
