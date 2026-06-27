import { ProtocolReport } from "@/types/protocolReport";
import { ProtocolInput } from "@/lib/protocol/contract";

export type ProtocolQualityScores = {
  coverage: number;
  consistency: number;
  productMatch: number;
  routineCompleteness: number;
  indianAdaptation: number;
  safetyRules: number;
  promptConfidence: number;
  missingInformation: number;
  personalizationDepth: number;
  explainabilityScore: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function evaluateProtocolQuality(input: {
  protocolInput: ProtocolInput;
  report: ProtocolReport;
}): ProtocolQualityScores {
  const report = input.report;

  const coverageSignals = [
    report.issueSummary.whatWasDetected.length > 0,
    report.mainResolvingIngredients.length > 0,
    report.monthlyRecoveryPlan.morning.length > 0,
    report.thingsToAvoid.food.length > 0,
    report.recommendedProducts.length > 0,
    report.weeklyMilestones.length > 0,
  ].filter(Boolean).length;

  const coverage = clamp(Math.round((coverageSignals / 6) * 100));

  const consistency = clamp(
    70 +
      (report.expectedTimeline.length >= 4 ? 15 : 0) +
      (report.monthlyRecoveryPlan.weekly.length > 0 ? 10 : 0)
  );

  const selected = input.protocolInput.productIntelligence.selectedProducts.map((p) => p.name.toLowerCase());
  const productMatchHits = report.recommendedProducts.filter((item) =>
    selected.some((name) => item.name.toLowerCase().includes(name) || name.includes(item.name.toLowerCase()))
  ).length;
  const productMatch = clamp(selected.length > 0 ? Math.round((productMatchHits / selected.length) * 100) : 85);

  const routineCompleteness = clamp(
    60 +
      Math.min(20, report.monthlyRecoveryPlan.morning.length * 5) +
      Math.min(20, report.monthlyRecoveryPlan.night.length * 5)
  );

  const indianAdaptation = clamp(
    input.protocolInput.knowledgePack?.indianAdaptations?.length
      ? 90
      : 75
  );

  const safetyRules = clamp(
    70 +
      (report.thingsToAvoid.productMistakes.length > 0 ? 15 : 0) +
      (report.confidenceNotes.length > 0 ? 10 : 0)
  );

  const promptConfidence = clamp(
    Math.round(
      (input.protocolInput.scores.confidenceScore * 0.35) +
      (coverage * 0.25) +
      (consistency * 0.2) +
      (safetyRules * 0.2)
    )
  );

  const missingInformation = clamp(
    100 - Math.round(
      [
        input.protocolInput.canonicalProfile.demographics.ageRange,
        input.protocolInput.canonicalProfile.demographics.gender,
        input.protocolInput.canonicalProfile.demographics.skinType,
        input.protocolInput.environment.climateZone,
        input.protocolInput.lifestyle.workMode,
        input.protocolInput.lifestyle.workoutFrequency,
      ].filter(Boolean).length * 12
    )
  );

  const personalizationDepth = clamp(
    Math.round(
      (input.protocolInput.routineIntelligence?.quality.score || 0) * 0.45 +
      (input.protocolInput.productIntelligence.selectedProducts.length > 0 ? 25 : 0) +
      (input.protocolInput.knowledgeGraph.edges.length > 0 ? 20 : 0) +
      (input.protocolInput.explainability.recommendationExplanations.length > 0 ? 10 : 0)
    )
  );

  const explainabilityScore = clamp(
    Math.round(
      (input.protocolInput.explainability.summary.length > 0 ? 35 : 0) +
      (input.protocolInput.explainability.recommendationExplanations.length * 15) +
      (input.protocolInput.knowledgeGraph.edges.length > 0 ? 20 : 0) +
      (input.protocolInput.knowledgePack?.confidenceRules.length ? 20 : 0)
    )
  );

  return {
    coverage,
    consistency,
    productMatch,
    routineCompleteness,
    indianAdaptation,
    safetyRules,
    promptConfidence,
    missingInformation,
    personalizationDepth,
    explainabilityScore,
  };
}
