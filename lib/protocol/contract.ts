import { z, ZodTypeAny } from "zod";
import { ClinicalProfile } from "@/types/clinicalProfile";
import { ProtocolReport, protocolReportSchema } from "@/types/protocolReport";

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
  };
  concerns: Array<{
    title: string;
    severity: number;
    confidence: number;
    evidence: string[];
  }>;
  assessmentAnswers: Record<string, string>;
  environment: {
    uvIndex?: number;
    humidity?: number;
    aqi?: number;
  };
  lifestyle: {
    sleepScore?: number;
    hydrationScore?: number;
    stressScore?: number;
  };
  analysis: {
    analyzerType?: string;
    severity?: "low" | "moderate" | "high";
    confidence?: number;
    detectedIssueCount?: number;
  };
};

export function buildProtocolInput(profile: ClinicalProfile): ProtocolInput {
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
    },
    concerns: profile.concerns.map((concern) => ({
      title: concern.title,
      severity: concern.severity,
      confidence: concern.confidence,
      evidence: concern.evidence,
    })),
    assessmentAnswers: profile.assessment.answers,
    environment: {
      uvIndex: profile.signals.uvIndex,
      humidity: profile.signals.humidity,
      aqi: profile.signals.aqi,
    },
    lifestyle: {
      sleepScore: profile.signals.sleepScore,
      hydrationScore: profile.signals.hydrationScore,
      stressScore: profile.signals.stressScore,
    },
    analysis: {
      analyzerType: profile.photo?.analyzerType,
      severity: profile.photo?.severity,
      confidence: profile.photo?.confidence,
      detectedIssueCount: profile.photo?.detectedIssueCount,
    },
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
