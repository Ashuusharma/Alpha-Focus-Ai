export type ConciergeMode = "recovery" | "optimization";

export interface ConciergeAction {
  title: string;
  rationale: string;
  expectedWindow: string;
}

export interface ConciergeBriefing {
  mode: ConciergeMode;
  tone: string;
  confidenceRationale: string;
  expectedVisibleChangeWindow: string;
  actions: ConciergeAction[];
}

export interface ConciergeInput {
  alphaScore: number;
  consistencyScore: number;
  completedMissions: number;
  totalMissions: number;
  categoriesCompleted: number;
  totalCategories: number;
  daysSinceLastScan: number | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateConciergeBriefing(input: ConciergeInput): ConciergeBriefing {
  const missionCompletionRate = input.totalMissions > 0 ? input.completedMissions / input.totalMissions : 0;
  const profileCompletionRate = input.totalCategories > 0 ? input.categoriesCompleted / input.totalCategories : 0;
  const scanFreshnessScore = input.daysSinceLastScan === null
    ? 35
    : clamp(100 - input.daysSinceLastScan * 8, 20, 100);

  const adherenceScore = Math.round(
    input.consistencyScore * 0.45 +
      missionCompletionRate * 100 * 0.25 +
      profileCompletionRate * 100 * 0.2 +
      scanFreshnessScore * 0.1
  );

  const mode: ConciergeMode = adherenceScore >= 70 ? "optimization" : "recovery";

  if (mode === "recovery") {
    return {
      mode,
      tone: "Recovery mode: simplify execution, rebuild consistency, and protect barrier stability this week.",
      confidenceRationale:
        "Current adherence signals are moderate-to-low, so this plan prioritizes repeatable daily wins over aggressive intensity.",
      expectedVisibleChangeWindow: "10–21 days",
      actions: [
        {
          title: "Run baseline essentials daily",
          rationale: "Consistent cleanser + moisturizer + SPF restores routine reliability and minimizes inflammation noise.",
          expectedWindow: "7–10 days",
        },
        {
          title: "Complete one mission per day",
          rationale: "Mission completion reinforces behavior loops and improves weekly adherence confidence.",
          expectedWindow: "3–7 days",
        },
        {
          title: "Capture a fresh scan by week-end",
          rationale: "Updated scan data increases personalization precision and allows safer protocol progression.",
          expectedWindow: "By day 7",
        },
      ],
    };
  }

  return {
    mode,
    tone: "Optimization mode: your consistency supports higher-impact refinements this week.",
    confidenceRationale:
      "Adherence and profile coverage are strong, so the system can safely prioritize performance and visible gains.",
    expectedVisibleChangeWindow: "7–14 days",
    actions: [
      {
        title: "Advance one targeted active",
        rationale: "Controlled progression on one active ingredient increases results while keeping irritation risk manageable.",
        expectedWindow: "7–14 days",
      },
      {
        title: "Complete all weekly missions",
        rationale: "Full mission completion compounds behavior quality, XP gain, and consistency performance.",
        expectedWindow: "Within this week",
      },
      {
        title: "Review report + tune protocol",
        rationale: "Use latest report evidence to refine product cadence and maintain momentum.",
        expectedWindow: "3–5 days",
      },
    ],
  };
}
