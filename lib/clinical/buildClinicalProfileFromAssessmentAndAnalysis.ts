import { AnalysisResult } from "@/lib/analyzeImage";
import {
  ClinicalConcern,
  ClinicalProfile,
  clinicalProfileSchema,
} from "@/types/clinicalProfile";

type BuildClinicalProfileOptions = {
  userId: string;
  locale?: string;
  category?: string;
  demographics?: {
    ageRange?: string;
    gender?: string;
    skinType?: string;
  };
  environment?: {
    uvIndex?: number;
    humidity?: number;
    aqi?: number;
    climateZone?: string;
  };
  lifestyle?: {
    sleepScore?: number;
    hydrationScore?: number;
    stressScore?: number;
    workMode?: string;
    workoutFrequency?: string;
  };
  protocolContext?: {
    toleranceMode?: "beginner" | "intermediate" | "advanced";
    adherenceScore?: number;
    relapseRiskScore?: number;
    ownedProductIds?: string[];
  };
  rewardContext?: {
    alphaBalance?: number;
    streakCount?: number;
    rewardTier?: string;
    loyaltyLevel?: number;
  };
  appBuild?: string;
};

const ANSWER_SEVERITY_KEYWORDS: Array<{ regex: RegExp; score: number }> = [
  { regex: /severe|very high|intense|always|daily/gi, score: 90 },
  { regex: /moderate|often|regular/gi, score: 68 },
  { regex: /mild|sometimes|occasional/gi, score: 44 },
  { regex: /minimal|rare|none|never|low/gi, score: 20 },
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function phaseFromDay(dayNumber: number): "Reset" | "Repair" | "Stabilize" {
  if (dayNumber <= 7) return "Reset";
  if (dayNumber <= 14) return "Repair";
  return "Stabilize";
}

function computeAssessmentSeverity(answers: Record<string, string>): number {
  const values = Object.values(answers);
  if (values.length === 0) return 0;

  const mapped = values.map((value) => {
    for (const rule of ANSWER_SEVERITY_KEYWORDS) {
      if (rule.regex.test(value)) return rule.score;
    }
    return 50;
  });

  return average(mapped);
}

function severityToScore(severity: AnalysisResult["severity"]): number {
  if (severity === "high") return 82;
  if (severity === "moderate") return 58;
  return 28;
}

function buildConcernList(
  answers: Record<string, string>,
  analysis?: AnalysisResult | null
): ClinicalConcern[] {
  const concerns: ClinicalConcern[] = [];

  if (analysis) {
    for (const issue of analysis.detectedIssues.slice(0, 8)) {
      const impactScore = issue.impact === "significant" ? 86 : issue.impact === "moderate" ? 64 : 42;
      concerns.push({
        key: issue.name.toLowerCase().replace(/\s+/g, "_"),
        title: issue.name,
        severity: clamp(Math.round((impactScore + issue.confidence) / 2)),
        confidence: clamp(Math.round(issue.confidence)),
        source: "analysis",
        evidence: [issue.description, `Affected area: ${issue.affectedArea}`],
      });
    }
  }

  const severeAnswers = Object.entries(answers)
    .filter(([, value]) => /severe|very high|intense|always|daily/i.test(value))
    .slice(0, 6);

  for (const [key, value] of severeAnswers) {
    concerns.push({
      key,
      title: key.replace(/_/g, " "),
      severity: 76,
      confidence: 62,
      source: "assessment",
      evidence: [`User reported: ${value}`],
    });
  }

  const deduped: ClinicalConcern[] = [];
  const seen = new Set<string>();

  for (const concern of concerns) {
    if (seen.has(concern.key)) continue;
    seen.add(concern.key);
    deduped.push(concern);
  }

  return deduped.slice(0, 12);
}

export function buildClinicalProfileFromAssessmentAndAnalysis(
  assessmentAnswers: Record<string, string>,
  analysis: AnalysisResult | null | undefined,
  options: BuildClinicalProfileOptions
): ClinicalProfile {
  const answers = assessmentAnswers || {};
  const answerCount = Object.keys(answers).length;

  const assessmentSeverity = computeAssessmentSeverity(answers);
  const analysisSeverity = analysis ? severityToScore(analysis.severity) : 0;
  const overallSeverity = analysis
    ? Math.round(assessmentSeverity * 0.45 + analysisSeverity * 0.55)
    : assessmentSeverity;

  const confidenceScore = analysis
    ? clamp(Math.round(analysis.confidence * 0.7 + Math.max(35, answerCount * 4) * 0.3))
    : clamp(Math.max(35, answerCount * 5));

  const concerns = buildConcernList(answers, analysis);

  const completionPct = clamp(Math.round((answerCount / 24) * 100));
  const toleranceMode = options.protocolContext?.toleranceMode || "intermediate";
  const adherenceScore = clamp(Math.round(Number(options.protocolContext?.adherenceScore || 0)));
  const relapseRiskScore = clamp(Math.round(Number(options.protocolContext?.relapseRiskScore || Math.max(0, 100 - adherenceScore))));
  const dayNumberGuess = Math.max(1, Math.min(30, Math.round(Math.max(1, adherenceScore / 4))));

  const parsed = clinicalProfileSchema.parse({
    userId: options.userId,
    locale: options.locale || "en-IN",
    generatedAt: new Date().toISOString(),
    category: options.category,
    assessment: {
      answerCount,
      answers,
      completionPct,
    },
    concerns,
    overallSeverity,
    confidenceScore,
    signals: {
      sleepScore: options.lifestyle?.sleepScore,
      hydrationScore: options.lifestyle?.hydrationScore,
      stressScore: options.lifestyle?.stressScore,
      uvIndex: options.environment?.uvIndex,
      humidity: options.environment?.humidity,
      aqi: options.environment?.aqi,
    },
    demographics: {
      ageRange: options.demographics?.ageRange,
      gender: options.demographics?.gender,
      skinType: options.demographics?.skinType,
    },
    environment: {
      uvIndex: options.environment?.uvIndex,
      humidity: options.environment?.humidity,
      aqi: options.environment?.aqi,
      climateZone: options.environment?.climateZone,
    },
    clinicalScores: {
      overallSeverity,
      confidenceScore,
      adherenceScore,
      relapseRiskScore,
    },
    protocolDecisions: {
      category: options.category,
      toleranceMode,
      currentPhase: phaseFromDay(dayNumberGuess),
      sourceVersion: "v2",
      ownedProductIds: options.protocolContext?.ownedProductIds || [],
    },
    lifestyleContext: {
      sleepScore: options.lifestyle?.sleepScore,
      hydrationScore: options.lifestyle?.hydrationScore,
      stressScore: options.lifestyle?.stressScore,
      workMode: options.lifestyle?.workMode,
      workoutFrequency: options.lifestyle?.workoutFrequency,
    },
    rewardContext: {
      alphaBalance: options.rewardContext?.alphaBalance,
      streakCount: options.rewardContext?.streakCount,
      rewardTier: options.rewardContext?.rewardTier,
      loyaltyLevel: options.rewardContext?.loyaltyLevel,
    },
    photo: analysis
      ? {
          analyzerType: analysis.type,
          severity: analysis.severity,
          confidence: analysis.confidence,
          detectedIssueCount: analysis.detectedIssues.length,
          detectedIssues: analysis.detectedIssues,
          capturedPhotos: Array.isArray(analysis.capturedPhotos) ? analysis.capturedPhotos : [],
        }
      : undefined,
    metadata: {
      sourceVersion: "v2",
      appBuild: options.appBuild,
    },
  });

  return parsed;
}
