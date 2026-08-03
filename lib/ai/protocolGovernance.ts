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

type GovernanceMetrics = {
  successfulRequests: number;
  failedRequests: number;
  cacheHits: number;
  cacheMisses: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostEstimateUsd: number;
  totalLatencyMs: number;
  lastSuccessfulRequestAt: string | null;
};

const governanceMetrics: GovernanceMetrics = {
  successfulRequests: 0,
  failedRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalPromptTokens: 0,
  totalCompletionTokens: 0,
  totalCostEstimateUsd: 0,
  totalLatencyMs: 0,
  lastSuccessfulRequestAt: null,
};

export type ProtocolGovernanceHealth = {
  cacheEntries: number;
  cacheHitRatePct: number;
  successfulRequests: number;
  failedRequests: number;
  averageInputTokens: number;
  averageOutputTokens: number;
  averageCostPerReportUsd: number;
  averageLatencyMs: number;
  lastSuccessfulRequestAt: string | null;
};

function sanitizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 280);
}

function buildCompactInput(input: ProtocolInput): ProtocolInput {
  return {
    // generatedAt is a fresh timestamp on every request (set in
    // buildClinicalProfileFromAssessmentAndAnalysis) and carries no
    // semantic meaning for either the prompt or the cache key — leaving it
    // untouched here would make buildProtocolCacheKey() hash a different
    // value on every call for a logically identical assessment, guaranteeing
    // a permanent cache miss. Normalized to a constant so two calls with the
    // same clinical input produce the same cache key.
    context: { ...input.context, generatedAt: "normalized" },
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
          knowledgeVersion: input.routineIntelligence.knowledgeVersion,
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
          homeCarePriority: input.routineIntelligence.homeCarePriority,
        }
      : null,
    productIntelligence: input.productIntelligence,
    knowledgePack: input.knowledgePack
      ? {
          category: input.knowledgePack.category,
          version: input.knowledgePack.version,
          clinicalOverview: input.knowledgePack.clinicalOverview,
          commonCauses: input.knowledgePack.commonCauses,
          thirtyDayPlan: input.knowledgePack.thirtyDayPlan,
          severityStages: input.knowledgePack.severityStages,
          recoveryGoals: input.knowledgePack.recoveryGoals,
          weeklyObjectives: input.knowledgePack.weeklyObjectives,
          routineTemplates: input.knowledgePack.routineTemplates,
          ingredientPriorities: input.knowledgePack.ingredientPriorities,
          productMapping: input.knowledgePack.productMapping,
          homeCareGuidance: input.knowledgePack.homeCareGuidance,
          dietGuidance: input.knowledgePack.dietGuidance,
          commonMistakes: input.knowledgePack.commonMistakes,
          lifestyleGuidance: input.knowledgePack.lifestyleGuidance,
          indianAdaptations: input.knowledgePack.indianAdaptations,
          contraindications: input.knowledgePack.contraindications,
          escalationCriteria: input.knowledgePack.escalationCriteria,
          expectedTimeline: input.knowledgePack.expectedTimeline,
          confidenceRules: input.knowledgePack.confidenceRules,
        }
      : null,
    ingredientIntelligence: input.ingredientIntelligence,
    knowledgeGraph: input.knowledgeGraph,
    explainability: input.explainability,
    protocolVersions: input.protocolVersions,
  };
}

function buildCanonicalClinicalProfileForPrompt(input: ProtocolInput): Record<string, unknown> {
  const compact = buildCompactInput(input);

  return {
    context: compact.context,
    scores: compact.scores,
    canonicalProfile: compact.canonicalProfile,
    concerns: compact.concerns,
    assessmentFacts: compact.assessmentFacts,
    environment: compact.environment,
    lifestyle: compact.lifestyle,
    analysis: compact.analysis,
    routineIntelligence: compact.routineIntelligence,
    productIntelligence: compact.productIntelligence,
    knowledgePack: compact.knowledgePack,
    ingredientIntelligence: compact.ingredientIntelligence,
    knowledgeGraph: compact.knowledgeGraph,
    explainability: compact.explainability,
    protocolVersions: compact.protocolVersions,
  };
}

export function getProtocolGovernanceConfig(): ProtocolGovernanceConfig {
  return DEFAULT_CONFIG;
}

export function selectProtocolModel(_input: ProtocolInput): { tier: ProtocolModelTier; model: string } {
  return { tier: "mini", model: MODEL_BY_TIER.mini };
}

// Folds promptVersion, protocolVersion, and model into the key itself
// (rather than tracking invalidation separately) so a change in any of the
// three is a guaranteed cache miss, never a stale hit — matching how the
// Vision cache (lib/ai/visionCache.ts) handles category/model/promptVersion.
export function buildProtocolCacheKey(
  input: ProtocolInput,
  promptVersion: string,
  protocolVersion: string,
  model: string
): string {
  const compact = buildCompactInput(input);
  const digest = createHash("sha256")
    .update(JSON.stringify({ promptVersion, protocolVersion, model, compact }))
    .digest("hex");
  return `protocol:${promptVersion}:${protocolVersion}:${model}:${digest}`;
}

function getSupabaseServerConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!baseUrl || !serviceKey) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ""), serviceKey };
}

/**
 * Persistent (Postgres-backed) protocol cache, replacing the previous
 * in-memory Map — survives restarts and is shared across serverless
 * instances, unlike process memory. Falls back to the in-memory
 * `protocolCache` Map (still declared above) only if Supabase env vars are
 * unavailable, so caching degrades gracefully in that case rather than
 * throwing.
 */
export async function getCachedProtocolPayload(
  cacheKey: string,
  meta: { promptVersion: string; protocolVersion: string; model: string }
): Promise<unknown | null> {
  const config = getSupabaseServerConfig();

  if (!config) {
    const found = protocolCache.get(cacheKey);
    if (!found) return null;
    if (Date.now() > found.expiresAt) {
      protocolCache.delete(cacheKey);
      governanceMetrics.cacheMisses += 1;
      return null;
    }
    governanceMetrics.cacheHits += 1;
    return found.payload;
  }

  try {
    const url = new URL(`${config.baseUrl}/rest/v1/protocol_generation_cache`);
    url.searchParams.set("select", "report_payload,expires_at");
    url.searchParams.set("cache_key", `eq.${cacheKey}`);
    url.searchParams.set("limit", "1");

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${config.serviceKey}`, apikey: config.serviceKey },
      cache: "no-store",
    });

    if (!response.ok) {
      governanceMetrics.cacheMisses += 1;
      return null;
    }

    const rows = (await response.json()) as Array<{ report_payload: unknown; expires_at: string }>;
    const row = rows[0];
    if (!row || new Date(row.expires_at).getTime() <= Date.now()) {
      governanceMetrics.cacheMisses += 1;
      return null;
    }

    governanceMetrics.cacheHits += 1;
    return row.report_payload;
  } catch (error) {
    console.error("[ai.protocolCache] lookup_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    governanceMetrics.cacheMisses += 1;
    return null;
  } finally {
    void meta; // reserved for future per-dimension cache-hit breakdowns
  }
}

export async function setCachedProtocolPayload(
  cacheKey: string,
  payload: unknown,
  ttlMs: number,
  meta: { promptVersion: string; protocolVersion: string; model: string }
): Promise<void> {
  const config = getSupabaseServerConfig();

  if (!config) {
    protocolCache.set(cacheKey, { payload, expiresAt: Date.now() + Math.max(1_000, ttlMs) });
    return;
  }

  try {
    const response = await fetch(`${config.baseUrl}/rest/v1/protocol_generation_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceKey}`,
        apikey: config.serviceKey,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        cache_key: cacheKey,
        prompt_version: meta.promptVersion,
        protocol_version: meta.protocolVersion,
        model: meta.model,
        report_payload: payload,
        expires_at: new Date(Date.now() + Math.max(1_000, ttlMs)).toISOString(),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[ai.protocolCache] write_failed", { status: response.status, bodyPreview: body.slice(0, 300) });
    }
  } catch (error) {
    console.error("[ai.protocolCache] write_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
  }
}

export function recordProtocolRunMetrics(input: {
  ok: boolean;
  promptTokens: number;
  completionTokens: number;
  costEstimateUsd: number;
  latencyMs: number;
}): void {
  if (input.ok) {
    governanceMetrics.successfulRequests += 1;
    governanceMetrics.totalPromptTokens += Math.max(0, input.promptTokens || 0);
    governanceMetrics.totalCompletionTokens += Math.max(0, input.completionTokens || 0);
    governanceMetrics.totalCostEstimateUsd += Math.max(0, input.costEstimateUsd || 0);
    governanceMetrics.totalLatencyMs += Math.max(0, input.latencyMs || 0);
    governanceMetrics.lastSuccessfulRequestAt = new Date().toISOString();
    return;
  }

  governanceMetrics.failedRequests += 1;
}

export function getProtocolGovernanceHealth(): ProtocolGovernanceHealth {
  const successfulRequests = Math.max(0, governanceMetrics.successfulRequests);
  const cacheEntries = protocolCache.size;

  return {
    cacheEntries,
    cacheHitRatePct: governanceMetrics.cacheHits + governanceMetrics.cacheMisses > 0
      ? Math.round((governanceMetrics.cacheHits / (governanceMetrics.cacheHits + governanceMetrics.cacheMisses)) * 100)
      : 0,
    successfulRequests,
    failedRequests: governanceMetrics.failedRequests,
    averageInputTokens: successfulRequests > 0 ? Math.round(governanceMetrics.totalPromptTokens / successfulRequests) : 0,
    averageOutputTokens: successfulRequests > 0 ? Math.round(governanceMetrics.totalCompletionTokens / successfulRequests) : 0,
    averageCostPerReportUsd: successfulRequests > 0 ? Number((governanceMetrics.totalCostEstimateUsd / successfulRequests).toFixed(6)) : 0,
    averageLatencyMs: successfulRequests > 0 ? Math.round(governanceMetrics.totalLatencyMs / successfulRequests) : 0,
    lastSuccessfulRequestAt: governanceMetrics.lastSuccessfulRequestAt,
  };
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
  const canonicalClinicalProfile = buildCanonicalClinicalProfileForPrompt(input);

  return [
    "You are ALPHA FOCUS Clinical AI Protocol Pipeline V2.",
    "Task: transform the supplied canonical ClinicalProfile into protocol report JSON.",
    "Deterministic pipeline remains the source of truth. Do not recompute rules or invent data.",
    "Return valid JSON only. No markdown, no prose, no code fences, no extra keys.",
    "Use only data from canonical ClinicalProfile. If data is missing, use conservative safe phrasing without inventing products, ingredients, routines, diagnoses, or severity.",
    "JSON schema instructions:",
    "{",
    '  "issueSummary": { "whatWasDetected": string[], "whyItHappens": string[], "whyConsistencyMatters": string[] },',
    '  "mainResolvingIngredients": [{ "ingredient": string, "purpose": string, "targets": string[], "whyItWorks": string, "expectedTimeline": string, "safetyNotes": string[] }],',
    '  "monthlyRecoveryPlan": {',
    '    "morning": [{ "title": string, "purpose": string, "why": string, "steps": string[], "timing": string, "amount"?: string, "frequency": string, "expectedImprovement": string, "mistakesToAvoid": string[], "escalationCues": string[] }],',
    '    "afternoon": [same item schema],',
    '    "night": [same item schema],',
    '    "weekly": [same item schema]',
    "  },",
    '  "thingsToAvoid": {',
    '    "food": [{ "item": string, "whyAvoid": string, "effectOnRecovery": string, "betterAlternative": string }],',
    '    "habits": [same item schema],',
    '    "environment": [same item schema],',
    '    "productMistakes": [same item schema]',
    "  },",
    '  "recommendedProducts": [{ "productId": string, "name": string, "ingredientMatch"?: string, "whyRecommended": string, "howToUse": string, "applicationArea": string, "amount": string, "timing": string, "expectedImprovement": string, "compatibilityWithCurrentRoutine": string }],',
    '  "dietPlan": { "breakfast": string[], "lunch": string[], "dinner": string[], "snacks": string[], "hydration": string, "wellnessGuidance": string[] },',
    '  "motivation": string,',
    '  "expectedTimeline": [{ "week": 1|2|3|4, "expectedImprovements": string[], "possibleSetbacks": string[], "continueDoing": string[] }],',
    '  "weeklyMilestones": [{ "week": 1|2|3|4, "milestone": string, "adherenceTarget": string }],',
    '  "confidenceNotes": string[]',
    "}",
    "Hard constraints:",
    "- recommendedProducts must reference productIntelligence.selectedProducts only",
    "- mainResolvingIngredients must align to ingredientIntelligence and knowledgePack.ingredientPriorities",
    "- monthlyRecoveryPlan must align to routineIntelligence and knowledgePack.routineTemplates",
    "- thingsToAvoid and dietPlan must align to knowledgePack contraindications/lifestyle guidance",
    "- Keep wording concise, clinically safe, and practical",
    // Added in the Phase 5.9 truncation fix: measured across real generations,
    // monthlyRecoveryPlan alone was ~45-55% of total output and the single
    // largest source of completion tokens, with thingsToAvoid second. The
    // schema's own array bounds allow far more items than the model was
    // actually using productively — these limits ask for the terser end of
    // what the schema already permits, they do not change the schema itself.
    "Length limits (apply strictly, these keep the report inside its token budget):",
    "- Every \"why\"/\"whyAvoid\"/\"whyItWorks\"/\"effectOnRecovery\"/\"betterAlternative\" field: one sentence, under 18 words.",
    "- monthlyRecoveryPlan: each step's \"steps\" array max 3 items, \"mistakesToAvoid\" max 2 items, \"escalationCues\" max 2 items.",
    "- thingsToAvoid: max 2 items per category (food/habits/environment/productMistakes).",
    "- mainResolvingIngredients: max 2 ingredients, \"safetyNotes\" max 2 items each.",
    "- dietPlan arrays (breakfast/lunch/dinner/snacks/wellnessGuidance): max 2 items each.",
    "Canonical ClinicalProfile JSON:",
    JSON.stringify(canonicalClinicalProfile),
  ].join("\n");
}

export function trimPromptToLimit(prompt: string, maxChars: number): string {
  if (prompt.length <= maxChars) return prompt;
  return prompt.slice(0, maxChars);
}
