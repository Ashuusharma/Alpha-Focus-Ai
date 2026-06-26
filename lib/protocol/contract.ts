import { z, ZodTypeAny } from "zod";
import { ClinicalProfile } from "@/types/clinicalProfile";
import { ProtocolReport, protocolReportSchema } from "@/types/protocolReport";
import { buildRoutineIntelligence, RoutineIntelligence } from "@/lib/protocol/routineIntelligence";
import { buildProductIntelligence, ProductIntelligence } from "@/lib/protocol/productIntelligence";

export type ProtocolInput = {
  context: {
    locale: string;
    category?: string;
    generatedAt: string;
  };
  scores: {
    overallSeverity: number;
    confidenceScore: number;
    assessmentCompletionPct: number;
    adherenceScore?: number;
    relapseRiskScore?: number;
  };
  canonicalProfile: {
    demographics: {
      ageRange?: string;
      gender?: string;
      skinType?: string;
    };
    protocolDecisions: {
      category?: string;
      toleranceMode: "beginner" | "intermediate" | "advanced";
      currentPhase?: "Reset" | "Repair" | "Stabilize";
      sourceVersion: string;
      ownedProductIds: string[];
    };
    rewardContext: {
      alphaBalance?: number;
      streakCount?: number;
      rewardTier?: string;
      loyaltyLevel?: number;
    };
  };
  concerns: Array<{
    title: string;
    severity: number;
    confidence: number;
    evidence: string[];
  }>;
  assessmentFacts: {
    completionPct: number;
    answerCount: number;
    topSignals: string[];
  };
  environment: {
    uvIndex?: number;
    humidity?: number;
    aqi?: number;
    climateZone?: string;
  };
  lifestyle: {
    sleepScore?: number;
    hydrationScore?: number;
    stressScore?: number;
    workMode?: string;
    workoutFrequency?: string;
  };
  analysis: {
    analyzerType?: string;
    severity?: "low" | "moderate" | "high";
    confidence?: number;
    detectedIssueCount?: number;
  };
  routineIntelligence: RoutineIntelligence | null;
  productIntelligence: ProductIntelligence;
};

export function buildProtocolInput(profile: ClinicalProfile): ProtocolInput {
  const topSignals = profile.concerns
    .slice(0, 6)
    .flatMap((concern) => concern.evidence || [])
    .filter(Boolean)
    .slice(0, 12);

  return {
    context: {
      locale: profile.locale,
      category: profile.category,
      generatedAt: profile.generatedAt,
    },
    scores: {
      overallSeverity: profile.overallSeverity,
      confidenceScore: profile.confidenceScore,
      assessmentCompletionPct: profile.assessment.completionPct,
      adherenceScore: profile.clinicalScores?.adherenceScore,
      relapseRiskScore: profile.clinicalScores?.relapseRiskScore,
    },
    canonicalProfile: {
      demographics: {
        ageRange: profile.demographics?.ageRange,
        gender: profile.demographics?.gender,
        skinType: profile.demographics?.skinType,
      },
      protocolDecisions: {
        category: profile.protocolDecisions?.category || profile.category,
        toleranceMode: profile.protocolDecisions?.toleranceMode || "intermediate",
        currentPhase: profile.protocolDecisions?.currentPhase,
        sourceVersion: profile.protocolDecisions?.sourceVersion || profile.metadata?.sourceVersion || "v2",
        ownedProductIds: profile.protocolDecisions?.ownedProductIds || [],
      },
      rewardContext: {
        alphaBalance: profile.rewardContext?.alphaBalance,
        streakCount: profile.rewardContext?.streakCount,
        rewardTier: profile.rewardContext?.rewardTier,
        loyaltyLevel: profile.rewardContext?.loyaltyLevel,
      },
    },
    concerns: profile.concerns.map((concern) => ({
      title: concern.title,
      severity: concern.severity,
      confidence: concern.confidence,
      evidence: concern.evidence,
    })),
    assessmentFacts: {
      completionPct: profile.assessment.completionPct,
      answerCount: profile.assessment.answerCount,
      topSignals,
    },
    environment: {
      uvIndex: profile.environment?.uvIndex ?? profile.signals.uvIndex,
      humidity: profile.environment?.humidity ?? profile.signals.humidity,
      aqi: profile.environment?.aqi ?? profile.signals.aqi,
      climateZone: profile.environment?.climateZone,
    },
    lifestyle: {
      sleepScore: profile.lifestyleContext?.sleepScore ?? profile.signals.sleepScore,
      hydrationScore: profile.lifestyleContext?.hydrationScore ?? profile.signals.hydrationScore,
      stressScore: profile.lifestyleContext?.stressScore ?? profile.signals.stressScore,
      workMode: profile.lifestyleContext?.workMode,
      workoutFrequency: profile.lifestyleContext?.workoutFrequency,
    },
    analysis: {
      analyzerType: profile.photo?.analyzerType,
      severity: profile.photo?.severity,
      confidence: profile.photo?.confidence,
      detectedIssueCount: profile.photo?.detectedIssueCount,
    },
    routineIntelligence: buildRoutineIntelligence({
      category: profile.category,
      toleranceMode: profile.protocolDecisions?.toleranceMode,
      adherenceScore: profile.clinicalScores?.adherenceScore,
      relapseRiskScore: profile.clinicalScores?.relapseRiskScore,
      climateZone: profile.environment?.climateZone,
      ownedProductIds: profile.protocolDecisions?.ownedProductIds,
      severity: profile.overallSeverity,
    }),
    productIntelligence: buildProductIntelligence({
      category: profile.category,
      severity: profile.overallSeverity,
      toleranceMode: profile.protocolDecisions?.toleranceMode,
      ownedProductIds: profile.protocolDecisions?.ownedProductIds,
    }),
  };
}

export function validateProtocolOutput<TSchema extends ZodTypeAny>(
  schema: TSchema,
  payload: unknown
): z.infer<TSchema> {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((item) => `${item.path.join(".") || "root"}: ${item.message}`).join("; ");
    throw new Error(`Invalid protocol output: ${detail}`);
  }
  return parsed.data;
}

export function validateDefaultProtocolOutput(payload: unknown): ProtocolReport {
  return validateProtocolOutput(protocolReportSchema, payload);
}
