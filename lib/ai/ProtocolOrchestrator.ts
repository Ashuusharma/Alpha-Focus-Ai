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
  setCachedProtocolPayload,
  trimPromptToLimit,
} from "@/lib/ai/protocolGovernance";

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
            content: "You generate safe, practical, strictly structured recovery protocols. Output valid JSON only.",
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
  const report = buildFallbackProtocolReport(input);
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
  const config = getProtocolGovernanceConfig();
  const promptVersion = config.promptVersion;
  const cacheKey = buildProtocolCacheKey(input, promptVersion);

  const cached = getCachedProtocolPayload(cacheKey);
  if (cached) {
    try {
      const report = validateDefaultProtocolOutput(cached);
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
    } catch {
      // Ignore stale/invalid cache entries and proceed with generation.
    }
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  if (!apiKey) {
    return fallbackResult(input, "fallback-template-v2", promptVersion, cacheKey, "ai_key_missing");
  }

  const selected = selectProtocolModel(input);
  const prompt = trimPromptToLimit(buildProtocolPrompt(input), config.maxPromptChars);
  const maxTokens = Number(process.env.PROTOCOL_AI_MAX_TOKENS || 2200);

  let lastError = "ai_generation_failed";

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    try {
      const response = await callChatCompletions({
        apiKey,
        baseUrl,
        model: selected.model,
        prompt,
        timeoutMs: config.timeoutMs,
        maxTokens,
      });

      if (!response.ok) {
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
      lastError = error instanceof Error ? error.message : "ai_runtime_error";
    }
  }

  return fallbackResult(input, selected.model, promptVersion, cacheKey, lastError);
}
