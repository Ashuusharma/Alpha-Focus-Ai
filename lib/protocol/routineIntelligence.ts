import { CategoryId, ClinicalCategoryId } from "@/lib/questions";
import {
  DailyProtocolOptions,
  ProtocolToleranceMode,
  generateDailyExecutionPayload,
  generateDailyProtocolMeta,
} from "@/lib/protocolTemplates";

export type RoutineQuality = {
  score: number;
  reasons: string[];
};

export type RoutineIntelligence = {
  category?: string;
  dayNumber: number;
  phase: "Reset" | "Repair" | "Stabilize";
  toleranceMode: ProtocolToleranceMode;
  adherenceScore: number;
  relapseRiskScore: number;
  climateZone?: string;
  taskShape: {
    morning: number;
    afternoon: number;
    night: number;
  };
  missingProductIds: string[];
  weeklyMilestones: Array<{
    week: number;
    phase: "Reset" | "Repair" | "Stabilize";
    focus: string;
    adherenceTarget: string;
    relapseGuardrail: string;
  }>;
  quality: RoutineQuality;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function normalizeTolerance(value?: string): ProtocolToleranceMode {
  if (value === "beginner" || value === "intermediate" || value === "advanced") {
    return value;
  }
  return "intermediate";
}

function asClinicalCategory(category?: string): ClinicalCategoryId | null {
  const valid: ClinicalCategoryId[] = [
    "scalp_health",
    "acne",
    "dark_circles",
    "hair_loss",
    "beard_growth",
    "body_acne",
    "body_odor",
    "lip_care",
    "anti_aging",
    "skin_dullness",
    "energy_fatigue",
    "fitness_recovery",
  ];

  return valid.includes(category as ClinicalCategoryId) ? (category as ClinicalCategoryId) : null;
}

function estimateRoutineQuality(input: {
  adherenceScore: number;
  relapseRiskScore: number;
  ownershipCoveragePct: number;
  hasClimateSignal: boolean;
  toleranceMode: ProtocolToleranceMode;
}): RoutineQuality {
  const base =
    input.adherenceScore * 0.5 +
    (100 - input.relapseRiskScore) * 0.3 +
    input.ownershipCoveragePct * 0.15 +
    (input.hasClimateSignal ? 5 : 0) +
    (input.toleranceMode === "advanced" ? -4 : input.toleranceMode === "beginner" ? 4 : 0);

  const score = clamp(Math.round(base));
  const reasons: string[] = [];

  if (input.adherenceScore < 60) reasons.push("Adherence is below target and needs a lower-friction routine.");
  if (input.relapseRiskScore >= 60) reasons.push("Relapse risk is elevated, so weekly guardrails are emphasized.");
  if (input.ownershipCoveragePct < 50) reasons.push("Product ownership coverage is low, so fallback steps must stay active.");
  if (!input.hasClimateSignal) reasons.push("Climate signals are missing; use conservative irritation safeguards.");
  if (reasons.length === 0) reasons.push("Routine quality is stable for current adherence and tolerance mode.");

  return { score, reasons };
}

export function buildRoutineIntelligence(input: {
  category?: string;
  toleranceMode?: string;
  adherenceScore?: number;
  relapseRiskScore?: number;
  climateZone?: string;
  ownedProductIds?: string[];
  severity?: number;
}): RoutineIntelligence | null {
  const clinicalCategory = asClinicalCategory(input.category);
  if (!clinicalCategory) return null;

  const toleranceMode = normalizeTolerance(input.toleranceMode);
  const adherenceScore = clamp(Math.round(input.adherenceScore || 0));
  const relapseRiskScore = clamp(
    Math.round(
      Number.isFinite(input.relapseRiskScore as number)
        ? Number(input.relapseRiskScore)
        : Math.max(0, 100 - adherenceScore)
    )
  );
  const dayNumber = Math.max(1, Math.min(30, Math.round(Math.max(1, adherenceScore / 4))));

  const options: DailyProtocolOptions = {
    toleranceMode,
    completedDaysThisWeek: Math.round((adherenceScore / 100) * 7),
    contraindications: {
      sensitiveSkin: (input.severity || 0) >= 70,
      activeIrritation: relapseRiskScore >= 65,
    },
  };

  const today = generateDailyExecutionPayload(
    clinicalCategory as CategoryId,
    dayNumber,
    options,
    { ownedProductIds: input.ownedProductIds || [] }
  );

  if (!today) return null;

  const allTaskProducts = [
    ...today.tasks.morning,
    ...today.tasks.afternoon,
    ...today.tasks.night,
  ].map((task) => task.product.id);

  const owned = new Set(input.ownedProductIds || []);
  const missingProductIds = Array.from(new Set(allTaskProducts.filter((id) => !owned.has(id)))).slice(0, 12);
  const ownershipCoveragePct = allTaskProducts.length > 0
    ? Math.round(((allTaskProducts.length - missingProductIds.length) / allTaskProducts.length) * 100)
    : 0;

  const weeklyMilestones = [1, 8, 15, 22].map((startDay, index) => {
    const meta = generateDailyProtocolMeta(clinicalCategory as CategoryId, startDay);
    const week = index + 1;
    const adherenceTarget = week <= 2 ? ">=75%" : ">=85%";

    return {
      week,
      phase: meta?.phaseName || (week === 1 ? "Reset" : week === 2 ? "Repair" : "Stabilize"),
      focus: meta?.dailyGoal || "Sustain consistent execution windows.",
      adherenceTarget,
      relapseGuardrail:
        relapseRiskScore >= 60
          ? "Keep fallback routine active when a day is missed."
          : "Protect sleep and hydration rhythm to avoid drift.",
    };
  });

  const quality = estimateRoutineQuality({
    adherenceScore,
    relapseRiskScore,
    ownershipCoveragePct,
    hasClimateSignal: Boolean(input.climateZone),
    toleranceMode,
  });

  return {
    category: input.category,
    dayNumber,
    phase: today.phase,
    toleranceMode,
    adherenceScore,
    relapseRiskScore,
    climateZone: input.climateZone,
    taskShape: {
      morning: today.tasks.morning.length,
      afternoon: today.tasks.afternoon.length,
      night: today.tasks.night.length,
    },
    missingProductIds,
    weeklyMilestones,
    quality,
  };
}
