import { createHash } from "crypto";
import { ProtocolInput } from "@/lib/protocol/contract";

export type ProtocolModelTier = "mini" | "nano";

export type ProtocolGovernanceConfig = {
  promptVersion: string;
  maxRetries: number;
  timeoutMs: number;
  cacheTtlMs: number;
  maxPromptChars: number;
};

export type ProtocolUsageMetrics = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costEstimateUsd: number;
};

const DEFAULT_CONFIG: ProtocolGovernanceConfig = {
  promptVersion: process.env.PROTOCOL_PROMPT_VERSION || "v2.0.0",
  maxRetries: Number(process.env.PROTOCOL_AI_MAX_RETRIES || 2),
  timeoutMs: Number(process.env.PROTOCOL_AI_TIMEOUT_MS || 20_000),
  cacheTtlMs: Number(process.env.PROTOCOL_AI_CACHE_TTL_MS || 15 * 60 * 1000),
  maxPromptChars: Number(process.env.PROTOCOL_AI_MAX_PROMPT_CHARS || 14_000),
};

const MODEL_BY_TIER: Record<ProtocolModelTier, string> = {
  mini: process.env.PROTOCOL_AI_MODEL_MINI || "gpt-5.4-mini",
  nano: process.env.PROTOCOL_AI_MODEL_NANO || "gpt-5.4-nano",
};

const COST_PER_1K_TOKENS_USD: Record<ProtocolModelTier, { input: number; output: number }> = {
  mini: { input: 0.0025, output: 0.01 },
  nano: { input: 0.0008, output: 0.003 },
};

const protocolCache = new Map<string, { expiresAt: number; payload: unknown }>();

function sanitizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 280);
}

function buildCompactInput(input: ProtocolInput): ProtocolInput {
  return {
    context: input.context,
    scores: input.scores,
    canonicalProfile: {
      demographics: input.canonicalProfile.demographics,
      protocolDecisions: input.canonicalProfile.protocolDecisions,
      rewardContext: input.canonicalProfile.rewardContext,
    },
    concerns: input.concerns.slice(0, 6).map((item) => ({
      title: sanitizeText(item.title),
      severity: item.severity,
      confidence: item.confidence,
      evidence: item.evidence.slice(0, 5).map((line) => sanitizeText(line)).filter(Boolean),
    })),
    assessmentFacts: {
      completionPct: input.assessmentFacts.completionPct,
      answerCount: input.assessmentFacts.answerCount,
      topSignals: input.assessmentFacts.topSignals.slice(0, 12).map((line) => sanitizeText(line)).filter(Boolean),
    },
    environment: input.environment,
    lifestyle: input.lifestyle,
    analysis: input.analysis,
    routineIntelligence: input.routineIntelligence
      ? {
          category: input.routineIntelligence.category,
          dayNumber: input.routineIntelligence.dayNumber,
          phase: input.routineIntelligence.phase,
          toleranceMode: input.routineIntelligence.toleranceMode,
          adherenceScore: input.routineIntelligence.adherenceScore,
          relapseRiskScore: input.routineIntelligence.relapseRiskScore,
          climateZone: input.routineIntelligence.climateZone,
          taskShape: input.routineIntelligence.taskShape,
          missingProductIds: input.routineIntelligence.missingProductIds,
          weeklyMilestones: input.routineIntelligence.weeklyMilestones,
          quality: input.routineIntelligence.quality,
        }
      : null,
    productIntelligence: input.productIntelligence,
  };
}

export function getProtocolGovernanceConfig(): ProtocolGovernanceConfig {
  return DEFAULT_CONFIG;
}

export function selectProtocolModel(input: ProtocolInput): { tier: ProtocolModelTier; model: string } {
  const highSeverity = input.scores.overallSeverity >= 70;
  const lowConfidence = input.scores.confidenceScore < 55;
  const manyConcerns = input.concerns.length >= 4;
  const tier: ProtocolModelTier = highSeverity || lowConfidence || manyConcerns ? "mini" : "nano";
  return { tier, model: MODEL_BY_TIER[tier] };
}

export function buildProtocolCacheKey(input: ProtocolInput, promptVersion: string): string {
  const compact = buildCompactInput(input);
  const digest = createHash("sha256")
    .update(JSON.stringify({ promptVersion, compact }))
    .digest("hex");
  return `protocol:${promptVersion}:${digest}`;
}

export function getCachedProtocolPayload(cacheKey: string): unknown | null {
  const found = protocolCache.get(cacheKey);
  if (!found) return null;
  if (Date.now() > found.expiresAt) {
    protocolCache.delete(cacheKey);
    return null;
  }
  return found.payload;
}

export function setCachedProtocolPayload(cacheKey: string, payload: unknown, ttlMs: number): void {
  protocolCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + Math.max(1_000, ttlMs),
  });
}

export function estimateProtocolUsageMetrics(input: {
  promptTokens?: number;
  completionTokens?: number;
  tier: ProtocolModelTier;
}): ProtocolUsageMetrics {
  const promptTokens = Math.max(0, Number(input.promptTokens || 0));
  const completionTokens = Math.max(0, Number(input.completionTokens || 0));
  const totalTokens = promptTokens + completionTokens;

  const pricing = COST_PER_1K_TOKENS_USD[input.tier];
  const costEstimateUsd = Number(
    ((promptTokens / 1000) * pricing.input + (completionTokens / 1000) * pricing.output).toFixed(6)
  );

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    costEstimateUsd,
  };
}

export function buildProtocolPrompt(input: ProtocolInput): string {
  const compact = buildCompactInput(input);
  return [
    "You are ALPHA FOCUS Clinical AI Protocol Pipeline V2.",
    "Return valid JSON only. Do not include markdown, prose, or extra keys.",
    "Required top-level keys exactly:",
    "issueSummary, mainResolvingIngredients, monthlyRecoveryPlan, thingsToAvoid, recommendedProducts, dietPlan, motivation, expectedTimeline, weeklyMilestones, confidenceNotes",
    "Safety and quality constraints:",
    "- No diagnosis claims and no guaranteed outcomes",
    "- Use concise and practical language for India daily-life constraints",
    "- Keep all recommendations behavior-safe and adherence-oriented",
    "- Never choose or invent products; only explain products present in productIntelligence.selectedProducts",
    "Clinical input JSON:",
    JSON.stringify(compact),
  ].join("\n");
}

export function trimPromptToLimit(prompt: string, maxChars: number): string {
  if (prompt.length <= maxChars) return prompt;
  return prompt.slice(0, maxChars);
}
