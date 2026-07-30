import { NextRequest, NextResponse } from "next/server";
import { secureCompare } from "@/lib/server/secureCompare";
import { writeAuditLog } from "@/lib/server/auditLog";
import { getEstimatedSpendUsd } from "@/lib/ai/aiUsageLog";

export const runtime = "nodejs";

const DEFAULT_WINDOW_DAYS = 30;
const MAX_ROWS = 5000;

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
    "provider,model,feature,prompt_tokens,completion_tokens,total_tokens,estimated_cost_usd,latency_ms,cached,user_id,created_at"
  );
  url.searchParams.set("created_at", `gte.${sinceIso}`);
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", String(MAX_ROWS));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${config.serviceKey}`, apikey: config.serviceKey },
    cache: "no-store",
  });

  if (!response.ok) return [];
  return (await response.json()) as UsageRow[];
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

/**
 * Internal cost/usage dashboard. Not linked from any UI — gated behind
 * AI_ADMIN_SECRET (same header/bearer pattern as
 * /api/notifications/scheduler's cron secret). Returns aggregates computed
 * in-process over up to MAX_ROWS recent rows; see the "known scaling
 * limitation" note in lib/ai/aiUsageLog.ts if this table grows large.
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    await writeAuditLog({ action: "admin.ai_usage.view", userId: "admin", ok: false, route: "/api/admin/ai-usage", detail: "unauthorized" });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const days = Math.max(1, Math.min(90, Number(request.nextUrl.searchParams.get("days")) || DEFAULT_WINDOW_DAYS));
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [rows, dailyCostUsd, monthlyCostUsd] = await Promise.all([
    fetchUsageRows(since),
    getEstimatedSpendUsd("day"),
    getEstimatedSpendUsd("month"),
  ]);

  const visionRows = rows.filter((r) => r.feature === "vision");
  const protocolRows = rows.filter((r) => r.feature === "protocol");
  const cacheHits = rows.filter((r) => r.cached);
  const cacheMisses = rows.filter((r) => !r.cached);

  const consumerTotals = new Map<string, number>();
  for (const row of rows) {
    const key = row.user_id || "anonymous";
    consumerTotals.set(key, (consumerTotals.get(key) || 0) + row.total_tokens);
  }
  const topTokenConsumers = Array.from(consumerTotals.entries())
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
    visionRequests: visionRows.length,
    protocolRequests: protocolRows.length,
    cacheHitRatePct: rows.length ? Math.round((cacheHits.length / rows.length) * 100) : 0,
    cacheMissRatePct: rows.length ? Math.round((cacheMisses.length / rows.length) * 100) : 0,
    averageTokens: average(rows.map((r) => r.total_tokens)),
    averageLatencyMs: average(rows.filter((r) => !r.cached).map((r) => r.latency_ms)),
    estimatedDailyCostUsd: Number(dailyCostUsd.toFixed(6)),
    estimatedMonthlyCostUsd: Number(monthlyCostUsd.toFixed(6)),
    topTokenConsumers,
    perModelUsage,
  });
}
