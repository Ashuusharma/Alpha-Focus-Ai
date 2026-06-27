import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { protocolRepoReady, countPendingProtocolJobsTotal } from "@/lib/server/protocolRepository";
import { getProtocolGovernanceHealth } from "@/lib/ai/protocolGovernance";

export const runtime = "nodejs";

async function checkOpenAIReachable(baseUrl: string, apiKey: string): Promise<{ reachable: boolean; status: number | null }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return { reachable: res.ok, status: res.status };
  } catch {
    return { reachable: false, status: null };
  }
}

export async function GET(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (!auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (isRateLimited(`ai:health:${auth.userId}`, 30, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "";
  const baseUrl = (process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.PROTOCOL_AI_MODEL_MINI || "gpt-5.4-mini";

  const openAiConfigured = Boolean(apiKey);
  const openAiProbe = openAiConfigured
    ? await checkOpenAIReachable(baseUrl, apiKey)
    : { reachable: false, status: null };

  const governance = getProtocolGovernanceHealth();
  const queueDepth = protocolRepoReady() ? await countPendingProtocolJobsTotal() : -1;

  const tokenBudgetPerDay = Number(process.env.PROTOCOL_DAILY_TOKEN_BUDGET || 1200000);
  const estimatedUsed = governance.averageInputTokens * governance.successfulRequests + governance.averageOutputTokens * governance.successfulRequests;

  return NextResponse.json({
    ok: true,
    health: {
      openAiConfigured,
      apiReachable: openAiProbe.reachable,
      apiStatus: openAiProbe.status,
      modelAvailable: openAiProbe.reachable,
      model,
      rateLimitStatus: "ok",
      cacheStatus: {
        entries: governance.cacheEntries,
        hitRatePct: governance.cacheHitRatePct,
      },
      queueDepth,
      estimatedTokenBudget: {
        perDay: tokenBudgetPerDay,
        estimatedUsed,
        estimatedRemaining: Math.max(0, tokenBudgetPerDay - estimatedUsed),
      },
      lastSuccessfulRequest: governance.lastSuccessfulRequestAt,
      metrics: {
        averageInputTokens: governance.averageInputTokens,
        averageOutputTokens: governance.averageOutputTokens,
        averageCostPerReportUsd: governance.averageCostPerReportUsd,
        averageLatencyMs: governance.averageLatencyMs,
      },
    },
  });
}
