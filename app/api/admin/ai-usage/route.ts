import { NextRequest, NextResponse } from "next/server";
import { secureCompare } from "@/lib/server/secureCompare";
import { writeAuditLog } from "@/lib/server/auditLog";
import { getEstimatedSpendUsd } from "@/lib/ai/aiUsageLog";

export const runtime = "nodejs";

const DEFAULT_WINDOW_DAYS = 30;
const MAX_ROWS = 5000;

// Failure-reason substrings that indicate the completion was cut off before
// finishing valid JSON — see lib/ai/ProtocolOrchestrator.ts's
// parseAssistantJson, which throws exactly these V8 JSON.parse messages.
const TRUNCATION_MARKERS = ["Unterminated string", "Unexpected end of JSON"];

type UsageRow = {
  provider: string;
  model: string;
  feature: "vision" | "protocol";
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  latency_ms: number;
  cached: boolean;
  user_id: string | null;
  created_at: string;
  success?: boolean | null;
  failure_reason?: string | null;
  image_hash?: string | null;
  category?: string | null;
  latency_saved_ms?: number | null;
  tokens_saved?: number | null;
  cost_saved_usd?: number | null;
};

function isAuthorized(request: NextRequest): boolean {
  const routeSecret = process.env.AI_ADMIN_SECRET;
  if (!routeSecret) return false;

  const header = request.headers.get("x-admin-secret") || "";
  if (header && secureCompare(header, routeSecret)) return true;

  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  return bearerToken.length > 0 && secureCompare(bearerToken, routeSecret);
}

function getSupabaseServerConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), serviceKey };
}

async function fetchUsageRows(sinceIso: string): Promise<UsageRow[]> {
  const config = getSupabaseServerConfig();
  if (!config) return [];

  const url = new URL(`${config.baseUrl}/rest/v1/ai_usage_log`);
  url.searchParams.set(
    "select",
    [
      "provider", "model", "feature", "prompt_tokens", "completion_tokens", "total_tokens",
      "estimated_cost_usd", "latency_ms", "cached", "user_id", "created_at",
      "success", "failure_reason", "image_hash", "category",
      "latency_saved_ms", "tokens_saved", "cost_saved_usd",
    ].join(",")
  );
  url.searchParams.set("created_at", `gte.${sinceIso}`);
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", String(MAX_ROWS));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${config.serviceKey}`, apikey: config.serviceKey },
    cache: "no-store",
  });

  // Falls back to the Phase 5.8 column set if schema_v2.sql (success,
  // failure_reason, image_hash, etc.) hasn't been applied yet — PostgREST
  // 400s on unknown columns, so this keeps the dashboard usable either way.
  if (!response.ok) {
    const fallbackUrl = new URL(`${config.baseUrl}/rest/v1/ai_usage_log`);
    fallbackUrl.searchParams.set(
      "select",
      "provider,model,feature,prompt_tokens,completion_tokens,total_tokens,estimated_cost_usd,latency_ms,cached,user_id,created_at"
    );
    fallbackUrl.searchParams.set("created_at", `gte.${sinceIso}`);
    fallbackUrl.searchParams.set("order", "created_at.desc");
    fallbackUrl.searchParams.set("limit", String(MAX_ROWS));

    const fallbackResponse = await fetch(fallbackUrl.toString(), {
      headers: { Authorization: `Bearer ${config.serviceKey}`, apikey: config.serviceKey },
      cache: "no-store",
    });
    if (!fallbackResponse.ok) return [];
    return (await fallbackResponse.json()) as UsageRow[];
  }

  return (await response.json()) as UsageRow[];
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function averageCost(values: number[]): number {
  if (!values.length) return 0;
  return Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(6));
}

function isTruncationFailure(reason: string | null | undefined): boolean {
  if (!reason) return false;
  return TRUNCATION_MARKERS.some((marker) => reason.includes(marker));
}

/**
 * Internal cost/usage dashboard. Not linked from any UI — gated behind
 * AI_ADMIN_SECRET (same header/bearer pattern as
 * /api/notifications/scheduler's cron secret). Returns aggregates computed
 * in-process over up to MAX_ROWS recent rows; see the "known scaling
 * limitation" note in lib/ai/aiUsageLog.ts if this table grows large.
 *
 * Fields that depend on supabase/ai_governance_schema_v2.sql (success,
 * failure_reason, cache-savings columns) degrade to 0/null rather than
 * erroring if that migration hasn't been applied yet.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    await writeAuditLog({ action: "admin.ai_usage.view", userId: "admin", ok: false, route: "/api/admin/ai-usage", detail: "unauthorized" });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const days = Math.max(1, Math.min(90, Number(request.nextUrl.searchParams.get("days")) || DEFAULT_WINDOW_DAYS));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [rows, todaysSpendUsd, monthlySpendUsd] = await Promise.all([
    fetchUsageRows(since),
    getEstimatedSpendUsd("day"),
    getEstimatedSpendUsd("month"),
  ]);

  const visionRows = rows.filter((r) => r.feature === "vision");
  const protocolRows = rows.filter((r) => r.feature === "protocol");
  const cacheHits = rows.filter((r) => r.cached);
  const cacheMisses = rows.filter((r) => !r.cached);

  // "success" is undefined on rows written before schema_v2.sql — treat
  // those as successful (they only existed for completed calls/hits back
  // then; failures weren't logged at all pre-Phase-5.9).
  const protocolAttempts = protocolRows.length;
  const protocolSuccesses = protocolRows.filter((r) => r.success !== false).length;
  const protocolFailures = protocolRows.filter((r) => r.success === false).length;
  const protocolTruncations = protocolRows.filter((r) => r.success === false && isTruncationFailure(r.failure_reason)).length;

  const visionRealCosts = visionRows.filter((r) => !r.cached && r.success !== false).map((r) => Number(r.estimated_cost_usd || 0));
  const protocolRealCosts = protocolRows.filter((r) => !r.cached && r.success !== false).map((r) => Number(r.estimated_cost_usd || 0));

  const totalVisionCost = visionRows.reduce((sum, r) => sum + Number(r.estimated_cost_usd || 0), 0);
  const totalProtocolCost = protocolRows.reduce((sum, r) => sum + Number(r.estimated_cost_usd || 0), 0);
  const successfulProtocolCount = protocolRows.filter((r) => r.cached || r.success !== false).length;
  const averageUserJourneyCostUsd = successfulProtocolCount > 0
    ? Number(((totalVisionCost + totalProtocolCost) / successfulProtocolCount).toFixed(6))
    : 0;

  const cacheSavings = cacheHits.reduce(
    (acc, r) => {
      acc.latencyMs += Number(r.latency_saved_ms || 0);
      acc.tokens += Number(r.tokens_saved || 0);
      acc.costUsd += Number(r.cost_saved_usd || 0);
      return acc;
    },
    { latencyMs: 0, tokens: 0, costUsd: 0 }
  );

  // Smoothed projection: average daily spend over the query window * 30,
  // rather than just today's figure (which can be noisy for a single day).
  const windowTotalCost = rows.reduce((sum, r) => sum + Number(r.estimated_cost_usd || 0), 0);
  const estimatedMonthlyProjectionUsd = Number(((windowTotalCost / days) * 30).toFixed(2));

  const mostExpensiveRequests = [...rows]
    .sort((a, b) => Number(b.estimated_cost_usd || 0) - Number(a.estimated_cost_usd || 0))
    .slice(0, 10)
    .map((r) => ({
      feature: r.feature,
      model: r.model,
      userId: r.user_id,
      costUsd: Number(r.estimated_cost_usd || 0),
      totalTokens: r.total_tokens,
      cached: r.cached,
      createdAt: r.created_at,
    }));

  const userCostTotals = new Map<string, number>();
  const userTokenTotals = new Map<string, number>();
  for (const row of rows) {
    const key = row.user_id || "anonymous";
    userCostTotals.set(key, (userCostTotals.get(key) || 0) + Number(row.estimated_cost_usd || 0));
    userTokenTotals.set(key, (userTokenTotals.get(key) || 0) + row.total_tokens);
  }
  const mostExpensiveUsers = Array.from(userCostTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, costUsd]) => ({ userId, costUsd: Number(costUsd.toFixed(6)) }));
  const topTokenConsumers = Array.from(userTokenTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, totalTokens]) => ({ userId, totalTokens }));

  const modelTotals = new Map<string, { requests: number; totalTokens: number; costUsd: number }>();
  for (const row of rows) {
    const existing = modelTotals.get(row.model) || { requests: 0, totalTokens: 0, costUsd: 0 };
    existing.requests += 1;
    existing.totalTokens += row.total_tokens;
    existing.costUsd += Number(row.estimated_cost_usd || 0);
    modelTotals.set(row.model, existing);
  }
  const perModelUsage = Array.from(modelTotals.entries()).map(([model, stats]) => ({
    model,
    requests: stats.requests,
    totalTokens: stats.totalTokens,
    costUsd: Number(stats.costUsd.toFixed(6)),
  }));

  await writeAuditLog({ action: "admin.ai_usage.view", userId: "admin", ok: true, route: "/api/admin/ai-usage", detail: `days=${days}` });

  return NextResponse.json({
    ok: true,
    windowDays: days,
    generatedAt: new Date().toISOString(),

    // Part 7 fields
    todaysSpendUsd: Number(todaysSpendUsd.toFixed(6)),
    monthlySpendUsd: Number(monthlySpendUsd.toFixed(6)),
    averageVisionCostUsd: averageCost(visionRealCosts),
    averageProtocolCostUsd: averageCost(protocolRealCosts),
    averageUserJourneyCostUsd,
    cacheHitRatePct: rows.length ? Math.round((cacheHits.length / rows.length) * 100) : 0,
    cacheMissRatePct: rows.length ? Math.round((cacheMisses.length / rows.length) * 100) : 0,
    cacheSavings: {
      latencyMsSaved: cacheSavings.latencyMs,
      tokensSaved: cacheSavings.tokens,
      costUsdSaved: Number(cacheSavings.costUsd.toFixed(6)),
    },
    estimatedMonthlyProjectionUsd,
    mostExpensiveRequests,
    mostExpensiveUsers,
    protocolSuccessRatePct: protocolAttempts ? Math.round((protocolSuccesses / protocolAttempts) * 100) : null,
    protocolFailureRatePct: protocolAttempts ? Math.round((protocolFailures / protocolAttempts) * 100) : null,
    protocolTruncationCount: protocolTruncations,

    // Carried over from Phase 5.8
    visionRequests: visionRows.length,
    protocolRequests: protocolRows.length,
    averageTokens: average(rows.map((r) => r.total_tokens)),
    averageLatencyMs: average(rows.filter((r) => !r.cached).map((r) => r.latency_ms)),
    estimatedDailyCostUsd: Number(todaysSpendUsd.toFixed(6)),
    estimatedMonthlyCostUsd: Number(monthlySpendUsd.toFixed(6)),
    topTokenConsumers,
    perModelUsage,
  });
}
