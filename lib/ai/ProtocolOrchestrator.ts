import { buildFallbackProtocolReport } from "@/lib/protocol/fallbackReport";
import { ProtocolInput, validateDefaultProtocolOutput } from "@/lib/protocol/contract";
import { ProtocolReport } from "@/types/protocolReport";
import { PROTOCOL_ENGINE_VERSION } from "@/lib/protocol/versioning";
import {
  buildProtocolCacheKey,
  buildProtocolPrompt,
  estimateProtocolUsageMetrics,
  getCachedProtocolPayload,
  getProtocolGovernanceConfig,
  selectProtocolModel,
  recordProtocolRunMetrics,
  setCachedProtocolPayload,
  trimPromptToLimit,
} from "@/lib/ai/protocolGovernance";
import { getAIConfig } from "@/lib/ai/config";
import { getAIGovernanceConfig } from "@/lib/ai/aiGovernanceConfig";
import { checkBudgetStatus, recordAIFailure } from "@/lib/ai/aiUsageLog";

type OrchestratorStatus = "ok" | "fallback";

const PROTOCOL_TEMPERATURE = 0.2;

export type ProtocolOrchestratorResult = {
  report: ProtocolReport;
  status: OrchestratorStatus;
  model: string;
  promptVersion: string;
  protocolVersion: string;
  temperature: number;
  cacheKey: string;
  cacheHit: boolean;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costEstimateUsd: number;
  latencyMs: number;
  fallbackReason?: string;
};

function maskBaseUrl(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    const host = url.hostname;
    const maskedHost = host.length <= 6
      ? `${host.slice(0, 2)}***`
      : `${host.slice(0, 3)}***${host.slice(-3)}`;
    return `${url.protocol}//${maskedHost}${url.port ? `:${url.port}` : ""}`;
  } catch {
    return "invalid_base_url";
  }
}

async function callChatCompletions(input: {
  apiKey: string;
  baseUrl: string;
  model: string;
  prompt: string;
  timeoutMs: number;
  maxTokens: number;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

  try {
    const response = await fetch(`${input.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        temperature: PROTOCOL_TEMPERATURE,
        max_completion_tokens: input.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a deterministic clinical JSON transformer. Use only supplied canonical ClinicalProfile context. Never invent products, ingredients, routines, diagnosis, severity, or extra keys. Output valid JSON only.",
          },
          {
            role: "user",
            content: input.prompt,
          },
        ],
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function parseAssistantJson(payload: unknown): { parsed: unknown; promptTokens: number; completionTokens: number } {
  const completion = payload as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };

  const content = completion?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("ai_empty_content");
  }

  const parsed = JSON.parse(content) as unknown;
  const promptTokens = Number(completion?.usage?.prompt_tokens || 0);
  const completionTokens = Number(completion?.usage?.completion_tokens || 0);

  return { parsed, promptTokens, completionTokens };
}

function fallbackResult(
  input: ProtocolInput,
  model: string,
  promptVersion: string,
  cacheKey: string,
  reason: string,
  latencyMs: number
): ProtocolOrchestratorResult {
  console.info("[protocol.orchestrator] fallback_enter", {
    model,
    promptVersion,
    cacheKey,
    reason,
  });

  const report = buildFallbackProtocolReport(input);

  console.info("[protocol.orchestrator] fallback_success", {
    model,
    promptVersion,
    cacheKey,
    reason,
  });

  return {
    report,
    status: "fallback",
    model,
    promptVersion,
    protocolVersion: PROTOCOL_ENGINE_VERSION,
    temperature: PROTOCOL_TEMPERATURE,
    cacheKey,
    cacheHit: false,
    tokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    },
    costEstimateUsd: 0,
    latencyMs,
    fallbackReason: reason,
  };
}

export async function generateProtocolWithOrchestrator(input: ProtocolInput): Promise<ProtocolOrchestratorResult> {
  console.info("[protocol.orchestrator] entry", {
    category: input.context.category || null,
    locale: input.context.locale,
  });

  const startedAt = Date.now();
  const config = getProtocolGovernanceConfig();
  const promptVersion = config.promptVersion;

  // Model must be known before the cache key is built (the key now includes
  // it, alongside promptVersion and protocolVersion) — selectProtocolModel
  // is synchronous/deterministic from `input`, so this is safe to do before
  // any cache or AI call.
  const selected = selectProtocolModel(input);
  const cacheKey = buildProtocolCacheKey(input, promptVersion, PROTOCOL_ENGINE_VERSION, selected.model);
  const cacheMeta = { promptVersion, protocolVersion: PROTOCOL_ENGINE_VERSION, model: selected.model };

  const cached = await getCachedProtocolPayload(cacheKey, cacheMeta);
  console.info("[protocol.orchestrator] cache_check", {
    cacheKey,
    hit: Boolean(cached),
  });

  if (cached) {
    try {
      const report = validateDefaultProtocolOutput(cached);
      console.info("[protocol.orchestrator] final_return", {
        source: "cache",
        status: "ok",
        model: "cache",
        promptVersion,
        cacheKey,
      });

      return {
        report,
        status: "ok",
        model: selected.model,
        promptVersion,
        protocolVersion: PROTOCOL_ENGINE_VERSION,
        temperature: PROTOCOL_TEMPERATURE,
        cacheKey,
        cacheHit: true,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        costEstimateUsd: 0,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      console.error("[protocol.orchestrator] cache_validation_error", {
        message: error instanceof Error ? error.message : "unknown_error",
        stack: error instanceof Error ? error.stack : null,
      });
      // Ignore stale/invalid cache entries and proceed with generation.
    }
  }

  let aiConfig: { apiKey: string; baseUrl: string; model: string };
  try {
    aiConfig = getAIConfig();
  } catch (error) {
    console.error("[protocol.orchestrator] ai_config_error", {
      message: error instanceof Error ? error.message : "unknown_error",
      stack: error instanceof Error ? error.stack : null,
    });
    return fallbackResult(input, "fallback-template-v2", promptVersion, cacheKey, "ai_config_missing", Date.now() - startedAt);
  }

  const governance = getAIGovernanceConfig();
  const budget = await checkBudgetStatus();
  if (budget.softExceeded) {
    console.warn("[protocol.orchestrator] budget_soft_exceeded", budget);
  }
  if (budget.hardExceeded) {
    console.error("[protocol.orchestrator] budget_hard_exceeded", budget);
    await recordAIFailure({
      provider: "openai",
      model: selected.model,
      feature: "protocol",
      userId: null,
      promptVersion,
      failureReason: "hard_budget_exceeded",
    });
    return fallbackResult(input, selected.model, promptVersion, cacheKey, "budget_exceeded", Date.now() - startedAt);
  }

  const prompt = trimPromptToLimit(buildProtocolPrompt(input), config.maxPromptChars);
  // Capped by the shared governance ceiling — whichever is lower wins, same
  // pattern as lib/ai/visionAnalysis.ts's VISION_MAX_TOKENS.
  // 2200 (the old default) was measured to be *below* the typical
  // requirement, not just an occasional edge case: 4 real generations across
  // different categories needed 2134-2966 completion tokens (avg ~2525), so
  // most requests were truncating, not a rare tail. 3800 gives ~28% headroom
  // over the measured max, combined with the verbosity limits added to
  // buildProtocolPrompt() above (Phase 5.9 truncation fix).
  const maxTokens = Math.min(Number(process.env.PROTOCOL_AI_MAX_TOKENS || 3800), governance.maxTokensPerRequest);

  console.info("[protocol.orchestrator] ai_config_resolved", {
    baseUrl: maskBaseUrl(aiConfig.baseUrl),
    model: selected.model,
    openAiApiKeyExists: Boolean(aiConfig.apiKey),
    maxRetries: config.maxRetries,
  });

  let lastError = "ai_generation_failed";

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    const attemptNumber = attempt + 1;
    const totalAttempts = config.maxRetries + 1;

    console.info("[protocol.orchestrator] retry_attempt", {
      attempt: attemptNumber,
      totalAttempts,
      model: selected.model,
    });

    try {
      console.info("[protocol.orchestrator] before_callChatCompletions", {
        attempt: attemptNumber,
        totalAttempts,
        model: selected.model,
        timeoutMs: config.timeoutMs,
      });

      const response = await callChatCompletions({
        apiKey: aiConfig.apiKey,
        baseUrl: aiConfig.baseUrl,
        model: selected.model,
        prompt,
        timeoutMs: config.timeoutMs,
        maxTokens,
      });

      console.info("[protocol.orchestrator] openai_http_status", {
        attempt: attemptNumber,
        totalAttempts,
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        console.error("[protocol.orchestrator] openai_non_2xx", {
          attempt: attemptNumber,
          totalAttempts,
          status: response.status,
          bodyPreview: errorBody.slice(0, 300),
        });
        lastError = `ai_http_${response.status}`;
        continue;
      }

      const payload = await response.json();
      const parsed = parseAssistantJson(payload);
      const report = validateDefaultProtocolOutput(parsed.parsed);

      await setCachedProtocolPayload(cacheKey, report, config.cacheTtlMs, cacheMeta);

      const usage = estimateProtocolUsageMetrics({
        tier: selected.tier,
        promptTokens: parsed.promptTokens,
        completionTokens: parsed.completionTokens,
      });

      const latencyMs = Date.now() - startedAt;

      recordProtocolRunMetrics({
        ok: true,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        costEstimateUsd: usage.costEstimateUsd,
        latencyMs,
      });

      console.info("[protocol.orchestrator] final_return", {
        source: "ai",
        status: "ok",
        model: selected.model,
        promptVersion,
        cacheKey,
        cacheHit: false,
      });

      return {
        report,
        status: "ok",
        model: selected.model,
        promptVersion,
        protocolVersion: PROTOCOL_ENGINE_VERSION,
        temperature: PROTOCOL_TEMPERATURE,
        cacheKey,
        cacheHit: false,
        tokenUsage: {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
        },
        costEstimateUsd: usage.costEstimateUsd,
        latencyMs,
      };
    } catch (error) {
      console.error("[protocol.orchestrator] attempt_error", {
        attempt: attemptNumber,
        totalAttempts,
        message: error instanceof Error ? error.message : "unknown_error",
        stack: error instanceof Error ? error.stack : null,
      });
      lastError = error instanceof Error ? error.message : "ai_runtime_error";
    }
  }

  recordProtocolRunMetrics({
    ok: false,
    promptTokens: 0,
    completionTokens: 0,
    costEstimateUsd: 0,
    latencyMs: Date.now() - startedAt,
  });

  // failureReason keeps the raw error text (not pre-bucketed) so the admin
  // dashboard can pattern-match truncation ("Unterminated string" /
  // "Unexpected end of JSON") separately from other failure classes while
  // still preserving full detail for debugging.
  await recordAIFailure({
    provider: "openai",
    model: selected.model,
    feature: "protocol",
    userId: null,
    promptVersion,
    failureReason: lastError,
  });

  return fallbackResult(input, selected.model, promptVersion, cacheKey, lastError, Date.now() - startedAt);
}
