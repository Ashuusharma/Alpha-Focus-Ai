import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { protocolRepoReady, countPendingProtocolJobsTotal } from "@/lib/server/protocolRepository";
import { getProtocolGovernanceConfig, getProtocolGovernanceHealth } from "@/lib/ai/protocolGovernance";
import { getAIConfig } from "@/lib/ai/config";
import { getOpenAIClient } from "@/lib/ai/openai";
import { getServerEnvStatus } from "@/lib/server/env";
import { buildProtocolVersions } from "@/lib/protocol/versioning";

export const runtime = "nodejs";

async function checkOpenAIReachable(model: string): Promise<{ reachable: boolean; modelAvailable: boolean; status: number | null }> {
  try {
    const client = getOpenAIClient();
    const models = await client.models.list();
    const hasModel = Array.isArray(models.data) && models.data.some((item) => item.id === model);
    return { reachable: true, modelAvailable: hasModel, status: 200 };
  } catch {
    return { reachable: false, modelAvailable: false, status: null };
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

  const serverEnv = getServerEnvStatus();
  const config = getProtocolGovernanceConfig();
  const aiConfig = (() => {
    try {
      return getAIConfig();
    } catch {
      return null;
    }
  })();

  const model = aiConfig?.model || "gpt-5.4-mini";
  const openAiProbe = aiConfig
    ? await checkOpenAIReachable(model)
    : { reachable: false, modelAvailable: false, status: null };

  const governance = getProtocolGovernanceHealth();
  const queueDepth = protocolRepoReady() ? await countPendingProtocolJobsTotal() : -1;

  const tokenBudgetPerDay = Number(process.env.PROTOCOL_DAILY_TOKEN_BUDGET || 1200000);
  const estimatedUsed = governance.averageInputTokens * governance.successfulRequests + governance.averageOutputTokens * governance.successfulRequests;

  return NextResponse.json({
    ok: true,
    health: {
      openAiConfigured: serverEnv.openAiConfigured,
      apiReachable: openAiProbe.reachable,
      apiStatus: openAiProbe.status,
      modelAvailable: openAiProbe.modelAvailable,
      model,
      rateLimitStatus: "ok",
      promptVersion: config.promptVersion,
      workerStatus: process.env.PROTOCOL_WORKER_SECRET?.trim() ? "configured" : "missing_secret",
      protocolVersion: buildProtocolVersions(config.promptVersion).protocolEngine,
      supabaseConnected: protocolRepoReady() && serverEnv.supabaseConfigured,
      vapidConfigured: serverEnv.vapidConfigured,
      schedulerConfigured: serverEnv.schedulerConfigured,
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
