import { buildFallbackProtocolReport } from "@/lib/protocol/fallbackReport";
import { ProtocolInput, validateDefaultProtocolOutput } from "@/lib/protocol/contract";
import { ProtocolReport } from "@/types/protocolReport";
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

type OrchestratorStatus = "ok" | "fallback";

export type ProtocolOrchestratorResult = {
  report: ProtocolReport;
  status: OrchestratorStatus;
  model: string;
  promptVersion: string;
  cacheKey: string;
  cacheHit: boolean;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  costEstimateUsd: number;
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
        temperature: 0.2,
        max_tokens: input.maxTokens,
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

function fallbackResult(input: ProtocolInput, model: string, promptVersion: string, cacheKey: string, reason: string): ProtocolOrchestratorResult {
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
    cacheKey,
    cacheHit: false,
    tokenUsage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    },
    costEstimateUsd: 0,
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
  const cacheKey = buildProtocolCacheKey(input, promptVersion);

  const cached = getCachedProtocolPayload(cacheKey);
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
        model: "cache",
        promptVersion,
        cacheKey,
        cacheHit: true,
        tokenUsage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        costEstimateUsd: 0,
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
    return fallbackResult(input, "fallback-template-v2", promptVersion, cacheKey, "ai_config_missing");
  }

  const selected = selectProtocolModel(input);
  const prompt = trimPromptToLimit(buildProtocolPrompt(input), config.maxPromptChars);
  const maxTokens = Number(process.env.PROTOCOL_AI_MAX_TOKENS || 2200);

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

      setCachedProtocolPayload(cacheKey, report, config.cacheTtlMs);

      const usage = estimateProtocolUsageMetrics({
        tier: selected.tier,
        promptTokens: parsed.promptTokens,
        completionTokens: parsed.completionTokens,
      });

      recordProtocolRunMetrics({
        ok: true,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        costEstimateUsd: usage.costEstimateUsd,
        latencyMs: Date.now() - startedAt,
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
        cacheKey,
        cacheHit: false,
        tokenUsage: {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
        },
        costEstimateUsd: usage.costEstimateUsd,
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

  return fallbackResult(input, selected.model, promptVersion, cacheKey, lastError);
}
