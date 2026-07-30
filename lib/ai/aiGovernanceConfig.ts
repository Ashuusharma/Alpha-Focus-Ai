import "server-only";

export type AIGovernanceConfig = {
  softDailyBudgetUsd: number;
  hardDailyBudgetUsd: number;
  softMonthlyBudgetUsd: number;
  hardMonthlyBudgetUsd: number;
  maxVisionRequestsPerMinute: number;
  maxProtocolRequestsPerMinute: number;
  maxTokensPerRequest: number;
  maxImageSizeMb: number;
};

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

let cached: AIGovernanceConfig | null = null;

/**
 * Single source of truth for cost/rate limits across the Vision and Protocol
 * pipelines. All values are configurable via env vars with defaults that
 * match what was previously hardcoded inline (20 req/min for Vision,
 * 12 req/min for Protocol, 6MB image cap) so existing behavior doesn't
 * silently change unless these env vars are actually set.
 */
export function getAIGovernanceConfig(): AIGovernanceConfig {
  if (cached) return cached;

  cached = {
    // Soft: continue processing, log a warning, surface it in the admin
    // dashboard. Hard: skip the real OpenAI call and fall through to the
    // existing graceful degradation path (Galaxy/baseline for Vision, the
    // template report for Protocol) — never exceeded intentionally.
    // Defaults: soft = 80% of hard, matching the Phase 5.8 values as the
    // hard ceiling so existing budget behavior doesn't silently change.
    softDailyBudgetUsd: envNumber("AI_GOVERNANCE_SOFT_DAILY_BUDGET_USD", 4),
    hardDailyBudgetUsd: envNumber("AI_GOVERNANCE_HARD_DAILY_BUDGET_USD", 5),
    softMonthlyBudgetUsd: envNumber("AI_GOVERNANCE_SOFT_MONTHLY_BUDGET_USD", 80),
    hardMonthlyBudgetUsd: envNumber("AI_GOVERNANCE_HARD_MONTHLY_BUDGET_USD", 100),
    maxVisionRequestsPerMinute: envNumber("AI_GOVERNANCE_MAX_VISION_RPM", 20),
    maxProtocolRequestsPerMinute: envNumber("AI_GOVERNANCE_MAX_PROTOCOL_RPM", 12),
    // A safety ceiling, not a target — set above both features' own tuned
    // defaults (Vision: 1200, Protocol: 3800 as of the Phase 5.9 truncation
    // fix — see lib/ai/ProtocolOrchestrator.ts) so it doesn't silently
    // loosen either one. Each feature caps its own request at
    // min(its own default, this ceiling).
    maxTokensPerRequest: envNumber("AI_GOVERNANCE_MAX_TOKENS_PER_REQUEST", 4200),
    maxImageSizeMb: envNumber("AI_GOVERNANCE_MAX_IMAGE_SIZE_MB", 6),
  };

  return cached;
}

export type BudgetStatus = {
  dailySpendUsd: number;
  monthlySpendUsd: number;
  softExceeded: boolean;
  hardExceeded: boolean;
};

export function evaluateBudgetStatus(dailySpendUsd: number, monthlySpendUsd: number, config: AIGovernanceConfig): BudgetStatus {
  return {
    dailySpendUsd,
    monthlySpendUsd,
    softExceeded: dailySpendUsd >= config.softDailyBudgetUsd || monthlySpendUsd >= config.softMonthlyBudgetUsd,
    hardExceeded: dailySpendUsd >= config.hardDailyBudgetUsd || monthlySpendUsd >= config.hardMonthlyBudgetUsd,
  };
}

type ModelPricing = { inputPer1k: number; outputPer1k: number };

// Approximate per-1K-token pricing for cost tracking/dashboards, not
// billing-accurate figures — update from your OpenAI account's actual
// pricing page if precise accounting is needed. gpt-5.4-mini/nano rates
// match the ones already used for protocol cost estimation
// (lib/ai/protocolGovernance.ts) for consistency across the two pipelines.
const MODEL_PRICING_PER_1K_USD: Record<string, ModelPricing> = {
  "gpt-5.4-mini": { inputPer1k: 0.0025, outputPer1k: 0.01 },
  "gpt-5.4-nano": { inputPer1k: 0.0008, outputPer1k: 0.003 },
  "gpt-4.1-mini": { inputPer1k: 0.0004, outputPer1k: 0.0016 },
};

// Unknown/unlisted models fall back to the most expensive known tier rather
// than 0 — a newly-configured model should never silently report zero cost.
const FALLBACK_PRICING: ModelPricing = MODEL_PRICING_PER_1K_USD["gpt-5.4-mini"];

export function estimateCostUsd(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING_PER_1K_USD[model] || FALLBACK_PRICING;
  const cost =
    (Math.max(0, promptTokens) / 1000) * pricing.inputPer1k +
    (Math.max(0, completionTokens) / 1000) * pricing.outputPer1k;
  return Number(cost.toFixed(6));
}
