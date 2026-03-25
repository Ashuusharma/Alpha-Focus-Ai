import { createNotification } from "@/lib/notifications/notificationEngine";
import { getRewardCatalog } from "@/lib/couponService";

type RoutineLogRow = {
  user_id: string;
  log_date: string;
  am_done: boolean | null;
  pm_done: boolean | null;
};

type ProgressRow = {
  user_id: string;
  improvement_pct: number | null;
  updated_at: string;
};

type ChallengeRow = {
  user_id: string;
  completed_days?: number[];
  progress_payload?: { completedDays?: number[] };
  updated_at?: string;
};

type RewardSummaryRow = {
  user_id: string;
  balance: number | null;
  updated_at?: string;
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

async function listTargetUsers(baseUrl: string, serviceKey: string, requestedUserId?: string) {
  if (requestedUserId) return [requestedUserId];

  const url = new URL(`${baseUrl}/rest/v1/profiles`);
  url.searchParams.set("select", "id");
  url.searchParams.set("limit", "50");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) return [];
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows.map((row) => row.id).filter(Boolean);
}

async function fetchTodayRoutine(baseUrl: string, serviceKey: string, userId: string, dayKey: string) {
  const url = new URL(`${baseUrl}/rest/v1/routine_logs`);
  url.searchParams.set("select", "user_id,log_date,am_done,pm_done");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("log_date", `eq.${dayKey}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as RoutineLogRow[];
  return rows[0] || null;
}

async function fetchLatestProgress(baseUrl: string, serviceKey: string, userId: string) {
  const url = new URL(`${baseUrl}/rest/v1/user_progress_metrics`);
  url.searchParams.set("select", "user_id,improvement_pct,updated_at");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("order", "updated_at.desc");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as ProgressRow[];
  return rows[0] || null;
}

async function fetchChallengeProgress(baseUrl: string, serviceKey: string, userId: string) {
  const url = new URL(`${baseUrl}/rest/v1/challenge_progress`);
  url.searchParams.set("select", "user_id,completed_days,progress_payload,updated_at");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("order", "updated_at.desc");
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as ChallengeRow[];
  return rows[0] || null;
}

async function fetchRewardSummary(baseUrl: string, serviceKey: string, userId: string) {
  const url = new URL(`${baseUrl}/rest/v1/alpha_sikka_summary`);
  url.searchParams.set("select", "user_id,balance,updated_at");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as RewardSummaryRow[];
  return rows[0] || null;
}

function extractCompletedDays(row: ChallengeRow | null) {
  if (!row) return [] as number[];
  if (Array.isArray(row.completed_days)) return row.completed_days.filter((x) => Number.isFinite(x));
  if (row.progress_payload && Array.isArray(row.progress_payload.completedDays)) {
    return row.progress_payload.completedDays.filter((x) => Number.isFinite(x));
  }
  return [] as number[];
}

export async function runNotificationScheduler(input?: { userId?: string; now?: Date }) {
  const config = getSupabaseConfig();
  if (!config) return { ok: false as const, error: "supabase_not_configured" };

  const now = input?.now || new Date();
  const dayKey = now.toISOString().slice(0, 10);
  const hour = now.getHours();

  const users = await listTargetUsers(config.baseUrl, config.serviceKey, input?.userId);
  const rewardCatalog = getRewardCatalog();
  const results: Array<{ userId: string; created: number; skipped: number }> = [];

  for (const userId of users) {
    let created = 0;
    let skipped = 0;

    const todayRoutine = await fetchTodayRoutine(config.baseUrl, config.serviceKey, userId, dayKey);
    const completedToday = Boolean(todayRoutine?.am_done) && Boolean(todayRoutine?.pm_done);

    if (hour >= 7 && !completedToday) {
      const reminderResult = await createNotification({
        userId,
        eventType: "routine_reminder",
        metadata: { slot: todayRoutine?.am_done ? "pm" : "am", logDate: dayKey },
        dedupeKey: `routine_reminder:${dayKey}`,
      });
      if (reminderResult.ok && !("skipped" in reminderResult)) created += 1;
      else skipped += 1;
    }

    if (hour >= 10) {
      const tipResult = await createNotification({
        userId,
        eventType: "daily_tip",
        metadata: { reference: dayKey },
        dedupeKey: `daily_tip:${dayKey}`,
      });
      if (tipResult.ok && !("skipped" in tipResult)) created += 1;
      else skipped += 1;
    }

    if (hour >= 21) {
      if (!completedToday) {
        const result = await createNotification({
          userId,
          eventType: "routine_missed",
          metadata: { logDate: dayKey },
          dedupeKey: `routine_missed:${dayKey}`,
        });
        if (result.ok && !("skipped" in result)) created += 1;
        else skipped += 1;
      }
    }

    const progress = await fetchLatestProgress(config.baseUrl, config.serviceKey, userId);
    const improvementPct = Number(progress?.improvement_pct || 0);
    if (improvementPct >= 10) {
      const result = await createNotification({
        userId,
        eventType: "progress_improved",
        metadata: { improvementPct },
        dedupeKey: `progress_improved:${dayKey}`,
      });
      if (result.ok && !("skipped" in result)) created += 1;
      else skipped += 1;
    }

    const challenge = await fetchChallengeProgress(config.baseUrl, config.serviceKey, userId);
    const completedDays = extractCompletedDays(challenge);
    const milestoneDay = [7, 14, 21, 28, 56, 84].find((value) => completedDays.length === value);
    if (milestoneDay) {
      const result = await createNotification({
        userId,
        eventType: "challenge_milestone",
        metadata: { milestoneDay },
        dedupeKey: `challenge_milestone:${milestoneDay}`,
      });
      if (result.ok && !("skipped" in result)) created += 1;
      else skipped += 1;
    }

    const streakDays = completedDays.length;
    if (streakDays >= 3 && !completedToday && hour >= 18) {
      const result = await createNotification({
        userId,
        eventType: "streak_at_risk",
        metadata: { streakDays, logDate: dayKey },
        dedupeKey: `streak_at_risk:${dayKey}`,
      });
      if (result.ok && !("skipped" in result)) created += 1;
      else skipped += 1;
    }

    const rewardSummary = await fetchRewardSummary(config.baseUrl, config.serviceKey, userId);
    const balance = Number(rewardSummary?.balance || 0);
    const unlockedReward = [...rewardCatalog].reverse().find((reward) => balance >= reward.cost);
    if (unlockedReward) {
      const result = await createNotification({
        userId,
        eventType: "reward_unlocked",
        metadata: {
          balance,
          rewardLabel: `${unlockedReward.discountPercent}% reward`,
          rewardCost: unlockedReward.cost,
        },
        dedupeKey: `reward_unlocked:${unlockedReward.id}`,
      });
      if (result.ok && !("skipped" in result)) created += 1;
      else skipped += 1;
    }

    results.push({ userId, created, skipped });
  }

  return { ok: true as const, processedUsers: users.length, results };
}
