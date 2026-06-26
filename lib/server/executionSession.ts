import { getSupabaseRequestUser } from "@/lib/server/supabaseRequestAuth";
import { getAlphaSikkaActivityDate } from "@/lib/server/alphaSikkaServer";
import { type CategoryId } from "@/lib/questions";
import { generateDailyExecutionPayload } from "@/lib/protocolTemplates";
import { NextRequest } from "next/server";

const INDIA_TIMEZONE = "Asia/Kolkata";

type SupabaseConfig = {
  baseUrl: string;
  serviceKey: string;
};

type ExecutionStartInput = {
  referenceId: string;
  category: CategoryId;
  dayNumber: number;
  taskId: string;
};

type ExecutionSessionRow = {
  id: string;
  user_id: string;
  reference_id: string;
  category: string;
  day_number: number;
  task_core_id: string;
  expected_duration_sec: number;
  window_start: string;
  window_end: string;
  product_required: boolean;
  product_verified: boolean;
  status: "running" | "completed" | "expired";
  started_at: string;
  completed_at: string | null;
};

type TaskVerificationResult = {
  ok: boolean;
  error?: string;
  statusCode?: number;
  session?: ExecutionSessionRow;
  timerCompleted?: boolean;
  withinWindow?: boolean;
  completedOnce?: boolean;
  cooldownLock?: boolean;
  productVerified?: boolean;
  trustScore?: number;
  trustLabel?: "Trusted" | "Needs Review";
  trustFactors?: {
    verifiedDuration: number;
    missed: number;
    duplicate: number;
    offline: number;
    productOwned: number;
    consistency: number;
  };
};

type TrustFactors = {
  verifiedDuration: number;
  missed: number;
  duplicate: number;
  offline: number;
  productOwned: number;
  consistency: number;
};

function toTrustScore(factors: TrustFactors): { score: number; label: "Trusted" | "Needs Review" } {
  const total = factors.verifiedDuration + factors.missed + factors.duplicate + factors.offline + factors.productOwned + factors.consistency;
  const score = Math.max(0, Math.min(100, Math.round(total / 6)));
  return {
    score,
    label: score >= 70 ? "Trusted" : "Needs Review",
  };
}

function getConfig(): SupabaseConfig | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !serviceKey) return null;
  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    serviceKey,
  };
}

function headers(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function requestJson<T>(config: SupabaseConfig, path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${config.baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...headers(config.serviceKey),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`supabase_request_failed:${response.status}:${detail}`);
  }

  return (await response.json()) as T;
}

function parseHHMM(value: string) {
  const [hourPart, minutePart] = value.split(":");
  const hour = Number(hourPart || 0);
  const minute = Number(minutePart || 0);
  return Math.max(0, Math.min(23, hour)) * 60 + Math.max(0, Math.min(59, minute));
}

function minutesInIndia(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: INDIA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value || "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value || "0");
  return hour * 60 + minute;
}

function nowInWindow(start: string, end: string, now: Date) {
  const minute = minutesInIndia(now);
  const startMin = parseHHMM(start);
  const endMin = parseHHMM(end);
  return minute >= startMin && minute <= endMin;
}

function extractTaskCoreId(taskId: string) {
  const parts = taskId.split(":");
  return parts[parts.length - 1] || taskId;
}

export async function startExecutionSession(request: NextRequest, input: ExecutionStartInput) {
  const authUser = await getSupabaseRequestUser(request);
  if (!authUser) {
    return { ok: false as const, error: "unauthorized", statusCode: 401 };
  }

  const config = getConfig();
  if (!config) {
    return { ok: false as const, error: "supabase_not_configured", statusCode: 500 };
  }

  const payload = generateDailyExecutionPayload(input.category, input.dayNumber, {}, { completedTaskIds: [], ownedProductIds: [] });
  if (!payload) {
    return { ok: false as const, error: "invalid_category_or_day", statusCode: 400 };
  }

  const expectedTask = [...payload.tasks.morning, ...payload.tasks.afternoon, ...payload.tasks.night].find((task) => task.id === input.taskId);
  if (!expectedTask) {
    return { ok: false as const, error: "task_not_found", statusCode: 400 };
  }

  if (!nowInWindow(expectedTask.timeWindow.start, expectedTask.timeWindow.end, new Date())) {
    return { ok: false as const, error: "outside_time_window", statusCode: 400 };
  }

  const existingRows = await requestJson<ExecutionSessionRow[]>(
    config,
    `execution_task_sessions?select=id,user_id,reference_id,category,day_number,task_core_id,expected_duration_sec,window_start,window_end,product_required,product_verified,status,started_at,completed_at&user_id=eq.${authUser.id}&reference_id=eq.${encodeURIComponent(input.referenceId)}&limit=1`,
    { method: "GET" }
  );

  const existing = existingRows[0];
  if (existing) {
    if (existing.status === "completed") {
      return { ok: false as const, error: "already_completed", statusCode: 409 };
    }

    return { ok: true as const, sessionId: existing.id, startedAt: existing.started_at };
  }

  const coreTaskId = extractTaskCoreId(expectedTask.id);
  const sessionInsert = {
    user_id: authUser.id,
    reference_id: input.referenceId,
    category: input.category,
    day_number: input.dayNumber,
    task_core_id: coreTaskId,
    expected_duration_sec: expectedTask.durationMin * 60,
    window_start: expectedTask.timeWindow.start,
    window_end: expectedTask.timeWindow.end,
    product_required: expectedTask.product.required,
    product_verified: false,
    status: "running",
    started_at: new Date().toISOString(),
    verification_payload: {
      taskId: expectedTask.id,
      activityDate: getAlphaSikkaActivityDate(new Date()),
      timezone: INDIA_TIMEZONE,
      startedBy: "server",
    },
  };

  const inserted = await requestJson<Array<{ id: string; started_at: string }>>(
    config,
    "execution_task_sessions?select=id,started_at",
    {
      method: "POST",
      body: JSON.stringify(sessionInsert),
    }
  );

  const created = inserted[0];
  if (!created?.id) {
    return { ok: false as const, error: "session_start_failed", statusCode: 500 };
  }

  return {
    ok: true as const,
    sessionId: created.id,
    startedAt: created.started_at,
  };
}

export async function verifyAndCompleteExecutionTask(input: {
  userId: string;
  referenceId: string;
  category: CategoryId;
  dayNumber: number;
  taskId: string;
  isRecovery: boolean;
}) : Promise<TaskVerificationResult> {
  const config = getConfig();
  if (!config) {
    return { ok: false, error: "supabase_not_configured", statusCode: 500 };
  }

  const payload = generateDailyExecutionPayload(input.category, input.dayNumber, {}, { completedTaskIds: [], ownedProductIds: [] });
  if (!payload) {
    return { ok: false, error: "invalid_category_or_day", statusCode: 400 };
  }

  const expectedTask = [...payload.tasks.morning, ...payload.tasks.afternoon, ...payload.tasks.night].find((task) => task.id === input.taskId);
  if (!expectedTask) {
    return { ok: false, error: "task_not_found", statusCode: 400 };
  }

  const rows = await requestJson<ExecutionSessionRow[]>(
    config,
    `execution_task_sessions?select=id,user_id,reference_id,category,day_number,task_core_id,expected_duration_sec,window_start,window_end,product_required,product_verified,status,started_at,completed_at&user_id=eq.${input.userId}&reference_id=eq.${encodeURIComponent(input.referenceId)}&limit=1`,
    { method: "GET" }
  );

  const session = rows[0];
  if (!session) {
    return { ok: false, error: "execution_session_missing", statusCode: 409 };
  }

  if (session.status === "completed") {
    return { ok: false, error: "execution_session_already_completed", statusCode: 200, completedOnce: false };
  }

  const startedAtMs = new Date(session.started_at).getTime();
  const elapsedSec = Number.isFinite(startedAtMs) ? Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)) : 0;
  const timerCompleted = elapsedSec >= session.expected_duration_sec;
  const withinWindow = nowInWindow(session.window_start, session.window_end, new Date());
  const cooldownLock = elapsedSec >= Math.max(60, Math.min(session.expected_duration_sec, 5 * 60));

  let productVerified = !session.product_required;
  if (session.product_required) {
    const productRows = await requestJson<Array<{ product_id: string }>>(
      config,
      `user_products?select=product_id&user_id=eq.${input.userId}&product_id=eq.${encodeURIComponent(expectedTask.product.id)}&limit=1`,
      { method: "GET" }
    );
    productVerified = productRows.length > 0;
  }

  const trustFactors: TrustFactors = {
    verifiedDuration: timerCompleted ? 100 : 25,
    missed: withinWindow ? 100 : 20,
    duplicate: 100,
    offline: 100,
    productOwned: productVerified ? 100 : 30,
    consistency: cooldownLock ? 100 : 40,
  };
  const trust = toTrustScore(trustFactors);

  if (!input.isRecovery) {
    if (!timerCompleted || !withinWindow || !cooldownLock || !productVerified) {
      return {
        ok: false,
        error: "reward_policy_violation",
        statusCode: 400,
        timerCompleted,
        withinWindow,
        cooldownLock,
        productVerified,
        trustScore: trust.score,
        trustLabel: trust.label,
        trustFactors,
      };
    }
  }

  await requestJson<Array<{ id: string }>>(
    config,
    `execution_task_sessions?id=eq.${session.id}&user_id=eq.${input.userId}&select=id`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "completed",
        completed_at: new Date().toISOString(),
        product_verified: productVerified,
        verification_payload: {
          ...(session as unknown as { verification_payload?: Record<string, unknown> }).verification_payload,
          timerCompleted,
          withinWindow,
          cooldownLock,
          productVerified,
          elapsedSec,
          verifiedAt: new Date().toISOString(),
          isRecovery: input.isRecovery,
        },
      }),
    }
  );

  return {
    ok: true,
    session,
    timerCompleted,
    withinWindow,
    cooldownLock,
    completedOnce: true,
    productVerified,
    trustScore: trust.score,
    trustLabel: trust.label,
    trustFactors,
  };
}

export async function verifyExecutionDayCompletion(input: {
  userId: string;
  category: CategoryId;
  dayNumber: number;
}) {
  const config = getConfig();
  if (!config) {
    return { ok: false as const, error: "supabase_not_configured", statusCode: 500 };
  }

  const payload = generateDailyExecutionPayload(input.category, input.dayNumber, {}, { completedTaskIds: [], ownedProductIds: [] });
  if (!payload) {
    return { ok: false as const, error: "invalid_category_or_day", statusCode: 400 };
  }

  const expectedCoreIds = new Set(
    [...payload.tasks.morning, ...payload.tasks.afternoon, ...payload.tasks.night].map((task) => extractTaskCoreId(task.id))
  );

  const rows = await requestJson<ExecutionSessionRow[]>(
    config,
    `execution_task_sessions?select=id,task_core_id,status,user_id,category,day_number&user_id=eq.${input.userId}&category=eq.${encodeURIComponent(input.category)}&day_number=eq.${input.dayNumber}&status=eq.completed`,
    { method: "GET" }
  );

  const completedCoreIds = new Set(rows.map((row) => row.task_core_id));
  const allTasksVerified = [...expectedCoreIds].every((taskCoreId) => completedCoreIds.has(taskCoreId));

  return {
    ok: true as const,
    allTasksVerified,
    completedCount: completedCoreIds.size,
    expectedCount: expectedCoreIds.size,
  };
}
