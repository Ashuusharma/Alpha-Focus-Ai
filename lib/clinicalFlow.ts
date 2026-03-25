import { AnalyzerType, DetectedIssue } from "@/lib/analyzeImage";
import { CategoryId } from "@/lib/questions";

export const analyzerToCategoryMap: Partial<Record<AnalyzerType, CategoryId>> = {
  scalp: "scalp_health",
  scalp_health: "scalp_health",
  acne: "acne",
  dark_circles: "dark_circles",
  hair: "hair_loss",
  hair_loss: "hair_loss",
  beard: "beard_growth",
  beard_growth: "beard_growth",
  body_acne: "body_acne",
  body_odor: "body_odor",
  lips: "lip_care",
  lip_care: "lip_care",
  aging: "anti_aging",
  anti_aging: "anti_aging",
  skin_dullness: "skin_dullness",
  energy_fatigue: "energy_fatigue",
  fitness_recovery: "fitness_recovery",
};

export function getCategoryFromAnalyzer(type: AnalyzerType): CategoryId | null {
  return analyzerToCategoryMap[type] || null;
}

const categoryToAnalyzerMap: Partial<Record<CategoryId, AnalyzerType>> = {
  scalp_health: "scalp_health",
  acne: "acne",
  dark_circles: "dark_circles",
  hair_loss: "hair_loss",
  beard_growth: "beard_growth",
  body_acne: "body_acne",
  body_odor: "body_odor",
  lip_care: "lip_care",
  anti_aging: "anti_aging",
  skin_dullness: "skin_dullness",
  energy_fatigue: "energy_fatigue",
  fitness_recovery: "fitness_recovery",
};

export function getAnalyzerFromCategory(category: CategoryId): AnalyzerType | null {
  return categoryToAnalyzerMap[category] || null;
}

export type OnboardingConcern = {
  label: string;
  category: CategoryId;
};

export const onboardingConcerns: OnboardingConcern[] = [
  { label: "Hair Loss", category: "hair_loss" },
  { label: "Acne", category: "acne" },
  { label: "Skin Health", category: "anti_aging" },
  { label: "Dark Circles", category: "dark_circles" },
  { label: "Beard Growth", category: "beard_growth" },
  { label: "Confidence Routine", category: "scalp_health" },
  { label: "Skin Dullness", category: "skin_dullness" },
  { label: "Energy / Fatigue", category: "energy_fatigue" },
];

export function getAssessmentContextIntro(category: CategoryId, severityHint: "mild" | "moderate" | "high" = "moderate") {
  const prefix = severityHint === "high"
    ? "We detected a higher clinical signal"
    : severityHint === "mild"
      ? "We detected an early clinical signal"
      : "We detected a moderate clinical signal";

  const categoryMessage: Record<CategoryId, string> = {
    scalp_health: "in scalp inflammation and barrier stress.",
    acne: "in inflammatory acne activity and pore congestion.",
    dark_circles: "in under-eye vascular and sleep-linked stress markers.",
    hair_loss: "in follicle density and shedding risk.",
    beard_growth: "in beard patchiness and irritation tendency.",
    body_acne: "in sweat-friction driven body breakouts.",
    body_odor: "in sweat volume, odor retention, and hygiene-triggered body odor patterns.",
    lip_care: "in dryness and pigmentation stress around lips.",
    anti_aging: "in elasticity decline and expression-line burden.",
    skin_dullness: "in tanning, dull tone, and texture fatigue from pollution and sleep stress.",
    energy_fatigue: "in sleep debt, hydration gaps, and energy-crash drivers.",
    fitness_recovery: "in soreness load, protein recovery, and training balance stress.",
    hairCare: "in hair and scalp resilience factors.",
    skinCare: "in skin inflammation and texture balance.",
    beardCare: "in beard growth consistency and irritation markers.",
    bodyCare: "in body skin congestion and recovery.",
    healthCare: "in lifestyle-driven recovery markers.",
    fitness: "in structural recovery and stress burden.",
    fragrance: "in barrier sensitivity and irritation response.",
  };

  return `${prefix} ${categoryMessage[category]} Let’s calibrate sleep, stress, diet, and grooming habits to build your exact protocol.`;
}

export type RoutineTemplate = {
  morning: string[];
  night: string[];
  weeklyReset: string;
};

export function getDailyRoutineTemplate(category: CategoryId): RoutineTemplate {
  const templates: Record<CategoryId, RoutineTemplate> = {
    scalp_health: {
      morning: ["Scalp cleanse", "Anti-inflammatory serum", "Hydration + SPF"],
      night: ["Gentle rinse", "Barrier scalp tonic", "Stress wind-down (10 min)"],
      weeklyReset: "Deep scalp reset + pillowcase change",
    },
    acne: {
      morning: ["Gentle cleanser", "Targeted anti-acne active", "SPF 50"],
      night: ["Cleanse", "Retinoid / treatment", "Barrier moisturizer"],
      weeklyReset: "Assess breakout map + replace towel/pillowcase",
    },
    dark_circles: {
      morning: ["Hydration boost", "Caffeine eye support", "SPF around eyes"],
      night: ["Cleanse", "Eye repair layer", "Sleep preparation routine"],
      weeklyReset: "Sleep debt correction and sodium review",
    },
    hair_loss: {
      morning: ["Scalp stimulation", "Follicle support serum", "Protein hydration"],
      night: ["Scalp cleanse", "Growth active", "Stress regulation (10 min)"],
      weeklyReset: "Shedding check-in + regimen adherence review",
    },
    beard_growth: {
      morning: ["Beard cleanse", "Growth serum", "Moisturize beard line"],
      night: ["Warm cleanse", "Growth support", "Comb + oil seal"],
      weeklyReset: "Exfoliation + neckline reset",
    },
    body_acne: {
      morning: ["Sweat-control cleanse", "Target spray/serum", "Breathable layer"],
      night: ["Post-sweat shower", "Anti-bacterial active", "Barrier lotion"],
      weeklyReset: "Laundry and friction trigger reset",
    },
    body_odor: {
      morning: ["Anti-bacterial body wash", "Underarm protection", "Breathable clothing check"],
      night: ["Post-commute rinse", "Drying powder or roll-on", "Fresh sleepwear"],
      weeklyReset: "Laundry, shoe, and towel odor reset",
    },
    lip_care: {
      morning: ["Hydrating balm", "UV lip shield", "Water goal check"],
      night: ["Gentle exfoliation (if needed)", "Overnight lip mask", "Hydration close"],
      weeklyReset: "Irritant audit + balm replacement",
    },
    anti_aging: {
      morning: ["Cleanse", "Antioxidant serum", "SPF 50"],
      night: ["Cleanse", "Retinoid/peptide layer", "Barrier moisturizer"],
      weeklyReset: "Progress photo + active tolerance review",
    },
    skin_dullness: {
      morning: ["Gentle cleanse", "Brightening serum", "High-protection SPF"],
      night: ["Cleanse", "Repair serum", "Barrier moisturizer"],
      weeklyReset: "Tan, sleep, and hydration audit",
    },
    energy_fatigue: {
      morning: ["Water + daylight", "Protein-first breakfast", "2-minute activation walk"],
      night: ["Screen cutoff", "Light dinner timing", "Sleep setup reset"],
      weeklyReset: "Sleep debt and workload review",
    },
    fitness_recovery: {
      morning: ["Mobility warm-up", "Hydration + electrolytes", "Protein anchor"],
      night: ["Cooldown stretch", "Recovery meal", "Sleep protection"],
      weeklyReset: "Load, soreness, and injury-risk review",
    },
    hairCare: {
      morning: ["Scalp cleanse", "Growth support", "Hydration"],
      night: ["Scalp repair", "Stress reset", "Sleep prep"],
      weeklyReset: "Scalp and shed trend audit",
    },
    skinCare: {
      morning: ["Cleanse", "Target active", "SPF"],
      night: ["Cleanse", "Repair active", "Moisturize"],
      weeklyReset: "Inflammation and trigger review",
    },
    beardCare: {
      morning: ["Cleanse", "Growth support", "Shape and protect"],
      night: ["Repair oil", "Comb", "Hydrate"],
      weeklyReset: "Beard line reset",
    },
    bodyCare: {
      morning: ["Body cleanse", "Target active", "Breathable wear"],
      night: ["Post-sweat cleanse", "Barrier support", "Hydration"],
      weeklyReset: "Trigger and laundry reset",
    },
    healthCare: {
      morning: ["Hydration", "Breathwork", "Recovery stack"],
      night: ["Stress downshift", "Sleep prep", "Hydration"],
      weeklyReset: "Lifestyle risk review",
    },
    fitness: {
      morning: ["Mobility warm-up", "Hydration", "Protein anchor"],
      night: ["Recovery stretch", "Sleep hygiene", "Hydration"],
      weeklyReset: "Load management review",
    },
    fragrance: {
      morning: ["Skin prep", "Targeted fragrance use", "Hydration"],
      night: ["Cleanse application zones", "Barrier repair", "Hydration"],
      weeklyReset: "Irritation and tolerance check",
    },
  };

  return templates[category];
}

export function getFailSafeAdjustment(category: CategoryId) {
  const map: Record<CategoryId, string> = {
    scalp_health: "Shift to barrier-first scalp protocol for 14 days and reduce irritant actives.",
    acne: "Switch to lower-irritation anti-inflammatory protocol and reduce treatment frequency for 7 days.",
    dark_circles: "Prioritize sleep-recovery protocol and hydration intensity for the next 14 days.",
    hair_loss: "Move to consistency-first growth cycle with stress-load reduction and weekly reassessment.",
    beard_growth: "Reduce irritation triggers and switch to low-friction growth protocol for 2 weeks.",
    body_acne: "Apply friction-control + post-workout cleanse protocol with targeted antibacterial rotation.",
    body_odor: "Move to sweat-control, fabric-hygiene, and antibacterial body-care protocol for 14 days.",
    lip_care: "Switch to strict barrier and UV-protection protocol until cracking/pigmentation stabilizes.",
    anti_aging: "Step down active intensity and rebuild tolerance before re-escalating anti-aging actives.",
    skin_dullness: "Reduce exfoliation intensity, prioritize brightening plus sunscreen, and stabilize sleep and hydration.",
    energy_fatigue: "Reset with sleep, hydration, and meal-timing structure before adding harder productivity goals.",
    fitness_recovery: "Reset with lower training load, more protein, hydration, mobility, and two full recovery nights.",
    hairCare: "Reset with scalp-barrier and consistency protocol.",
    skinCare: "Reset with low-irritation inflammation control protocol.",
    beardCare: "Reset with gentle growth and anti-ingrown protocol.",
    bodyCare: "Reset with sweat/friction management protocol.",
    healthCare: "Reset with sleep-stress-hydration protocol.",
    fitness: "Reset with recovery-focused workload protocol.",
    fragrance: "Reset with sensitivity-safe fragrance protocol.",
  };

  return map[category];
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildCategoryPhotoMetrics(category: CategoryId, issues: DetectedIssue[], confidence = 0) {
  const impacts = issues.map((issue) => {
    if (issue.impact === "significant") return 90;
    if (issue.impact === "moderate") return 65;
    return 35;
  });

  const confidenceValues = issues.map((issue) => issue.confidence || 0);
  const issueLoad = clamp(Math.round(average([...impacts, ...confidenceValues])));
  const inverseConfidence = clamp(100 - (confidence || 0));

  if (category === "scalp_health") {
    return {
      redness_score: clamp(Math.round(issueLoad * 0.9 + inverseConfidence * 0.1)),
      flake_density: clamp(Math.round(issueLoad * 0.85)),
      oil_reflectance: clamp(Math.round(issueLoad * 0.75 + 10)),
      pore_visibility: clamp(Math.round(issueLoad * 0.65 + 15)),
      hair_density: clamp(Math.round(100 - issueLoad * 0.7)),
      image_valid: confidence >= 45,
    };
  }

  if (category === "acne") {
    return {
      active_lesion_count: clamp(Math.round(issueLoad / 2), 0, 100),
      redness_intensity: clamp(Math.round(issueLoad * 0.9)),
      pore_visibility: clamp(Math.round(issueLoad * 0.75)),
      pigmentation_index: clamp(Math.round(issueLoad * 0.7)),
      oiliness_index: clamp(Math.round(issueLoad * 0.8)),
      image_valid: confidence >= 45,
    };
  }

  if (category === "body_odor") {
    return {
      sweat_score: clamp(Math.round(issueLoad * 0.85)),
      odor_load: clamp(Math.round(issueLoad * 0.9 + inverseConfidence * 0.1)),
      friction_index: clamp(Math.round(issueLoad * 0.65 + 10)),
      fabric_retention_score: clamp(Math.round(issueLoad * 0.7)),
      image_valid: confidence >= 45,
    };
  }

  if (category === "skin_dullness") {
    return {
      dullness_index: clamp(Math.round(issueLoad * 0.85)),
      tan_load: clamp(Math.round(issueLoad * 0.8)),
      texture_roughness: clamp(Math.round(issueLoad * 0.7)),
      hydration_drop: clamp(Math.round(issueLoad * 0.6 + inverseConfidence * 0.2)),
      image_valid: confidence >= 45,
    };
  }

  return {
    marker_1: clamp(Math.round(issueLoad * 0.85)),
    marker_2: clamp(Math.round(issueLoad * 0.7)),
    marker_3: clamp(Math.round(issueLoad * 0.55 + inverseConfidence * 0.2)),
    image_valid: confidence >= 45,
  };
}
