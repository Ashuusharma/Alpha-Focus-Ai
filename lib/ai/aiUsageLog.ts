import "server-only";
import { getAIGovernanceConfig, evaluateBudgetStatus, BudgetStatus } from "@/lib/ai/aiGovernanceConfig";

export type AIUsageFeature = "vision" | "protocol";

export type AIUsageEntry = {
  provider: string;
  model: string;
  feature: AIUsageFeature;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  cached: boolean;
  userId: string | null;
  reportId?: string | null;
  promptVersion?: string | null;
  temperature?: number | null;
  responseSchemaVersion?: string | null;
  /** Vision-only (Phase 5.9 Part 4). Requires supabase/ai_governance_schema_v2.sql. */
  imageHash?: string | null;
  category?: string | null;
  latencySavedMs?: number | null;
  tokensSaved?: number | null;
  costSavedUsd?: number | null;
};

function getSupabaseServerConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), serviceKey };
}

/**
 * Records one AI request (Vision or Protocol, cached or not) to
 * ai_usage_log for cost accounting and the admin dashboard. Best-effort:
 * failures are logged, never thrown — a broken usage log must not break the
 * actual AI response it's trying to record.
 */
export async function recordAIUsage(entry: AIUsageEntry): Promise<void> {
  const config = getSupabaseServerConfig();
  if (!config) {
    console.error("[ai.usageLog] supabase_config_missing");
    return;
  }

  try {
    const response = await fetch(`${config.baseUrl}/rest/v1/ai_usage_log`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
        apikey: config.serviceKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        provider: entry.provider,
        model: entry.model,
        feature: entry.feature,
        prompt_tokens: entry.promptTokens,
        completion_tokens: entry.completionTokens,
        total_tokens: entry.totalTokens,
        estimated_cost_usd: entry.estimatedCostUsd,
        latency_ms: entry.latencyMs,
        cached: entry.cached,
        user_id: entry.userId,
        report_id: entry.reportId ?? null,
        prompt_version: entry.promptVersion ?? null,
        temperature: entry.temperature ?? null,
        response_schema_version: entry.responseSchemaVersion ?? null,
        success: true,
        image_hash: entry.imageHash ?? null,
        category: entry.category ?? null,
        latency_saved_ms: entry.latencySavedMs ?? null,
        tokens_saved: entry.tokensSaved ?? null,
        cost_saved_usd: entry.costSavedUsd ?? null,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[ai.usageLog] insert_failed", { status: response.status, bodyPreview: body.slice(0, 300) });
    }
  } catch (error) {
    console.error("[ai.usageLog] insert_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

export type AIFailureEntry = {
  provider: string;
  model: string;
  feature: AIUsageFeature;
  userId: string | null;
  reportId?: string | null;
  promptVersion?: string | null;
  failureReason: string;
};

/**
 * Records a failed/skipped AI attempt (truncation, budget block, upstream
 * error) — distinct from recordAIUsage, which is only for successful calls
 * and cache hits. Powers Part 7's success/failure/truncation rate metrics.
 * Same best-effort semantics: never throws. Requires
 * supabase/ai_governance_schema_v2.sql (success/failure_reason columns).
 */
export async function recordAIFailure(entry: AIFailureEntry): Promise<void> {
  const config = getSupabaseServerConfig();
  if (!config) return;

  try {
    const response = await fetch(`${config.baseUrl}/rest/v1/ai_usage_log`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
        apikey: config.serviceKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        provider: entry.provider,
        model: entry.model,
        feature: entry.feature,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        estimated_cost_usd: 0,
        latency_ms: 0,
        cached: false,
        user_id: entry.userId,
        report_id: entry.reportId ?? null,
        prompt_version: entry.promptVersion ?? null,
        success: false,
        failure_reason: entry.failureReason,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[ai.usageLog] failure_insert_failed", { status: response.status, bodyPreview: body.slice(0, 300) });
    }
  } catch (error) {
    console.error("[ai.usageLog] failure_insert_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

export type SpendWindow = "day" | "month";

/**
 * Sums estimated_cost_usd from ai_usage_log for the current UTC day or
 * calendar month, across both features. Fails open (returns 0) on any
 * error, so an unreachable log table blocks nothing rather than wrongly
 * refusing every request as "over budget."
 *
 * Known scaling limitation: this pulls matching rows and sums them
 * in-process rather than using a server-side aggregate, since this
 * project's PostgREST setup has no aggregate RPC defined. Fine at current
 * volume (checked once per request, not per token); worth replacing with a
 * Postgres RPC or a rollup table if ai_usage_log grows into the
 * hundreds of thousands of rows per month.
 */
export async function getEstimatedSpendUsd(window: SpendWindow): Promise<number> {
  const config = getSupabaseServerConfig();
  if (!config) return 0;

  const since = window === "day"
    ? new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`)
    : new Date(`${new Date().toISOString().slice(0, 7)}-01T00:00:00.000Z`);

  try {
    const url = new URL(`${config.baseUrl}/rest/v1/ai_usage_log`);
    url.searchParams.set("select", "estimated_cost_usd");
    url.searchParams.set("created_at", `gte.${since.toISOString()}`);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${config.serviceKey}`, apikey: config.serviceKey },
      cache: "no-store",
    });

    if (!response.ok) return 0;

    const rows = (await response.json()) as Array<{ estimated_cost_usd: number | string }>;
    return rows.reduce((sum, row) => sum + Number(row.estimated_cost_usd || 0), 0);
  } catch (error) {
    console.error("[ai.usageLog] spend_query_error", {
      window,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return 0;
  }
}

/**
 * Combines the day/month spend queries with the configured soft/hard
 * thresholds (Phase 5.9 Part 6). Callers check `.hardExceeded` to decide
 * whether to skip the real AI call, and `.softExceeded` to decide whether to
 * log a warning while still proceeding.
 */
export async function checkBudgetStatus(): Promise<BudgetStatus> {
  const [dailySpendUsd, monthlySpendUsd] = await Promise.all([
    getEstimatedSpendUsd("day"),
    getEstimatedSpendUsd("month"),
  ]);
  return evaluateBudgetStatus(dailySpendUsd, monthlySpendUsd, getAIGovernanceConfig());
}
