export type CorrelationInput = {
  sleepHours: number;
  hydrationMl: number;
  mood: "calm" | "neutral" | "stressed";
};

export type CorrelationResult = {
  inflammationRiskDelta: number;
  drynessRiskDelta: number;
  adjustedRiskScore: number;
  reasons: string[];
};

export function calculateRiskAdjustment(input: CorrelationInput): CorrelationResult {
  let inflammationRiskDelta = 0;
  let drynessRiskDelta = 0;
  const reasons: string[] = [];

  if (input.sleepHours < 6 && input.mood === "stressed") {
    inflammationRiskDelta += 15;
    reasons.push("Low sleep combined with stress increases inflammation risk.");
  }

  if (input.hydrationMl < 2000) {
    drynessRiskDelta += 12;
    reasons.push("Low hydration increases dryness risk.");
  }

  if (input.mood === "stressed") {
    inflammationRiskDelta += 5;
  }

  const adjustedRiskScore = Math.max(0, Math.min(100, 50 + inflammationRiskDelta + drynessRiskDelta));

  return { inflammationRiskDelta, drynessRiskDelta, adjustedRiskScore, reasons };
}
