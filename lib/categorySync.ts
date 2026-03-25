import { AnalyzerType } from "@/lib/analyzeImage";
import { CategoryId } from "@/lib/questions";

export type ParentCategory = "skin" | "hair" | "beard" | "body" | "health" | "fitness";

const analyzerToChildCategoryMap: Partial<Record<AnalyzerType, CategoryId>> = {
  scalp: "scalp_health",
  acne: "acne",
  dark_circles: "dark_circles",
  scalp_health: "scalp_health",
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
  skin: "acne",
};

const childToParentCategoryMap: Record<CategoryId, ParentCategory> = {
  scalp_health: "hair",
  acne: "skin",
  dark_circles: "skin",
  hair_loss: "hair",
  beard_growth: "beard",
  body_acne: "body",
  body_odor: "body",
  lip_care: "skin",
  anti_aging: "skin",
  skin_dullness: "skin",
  energy_fatigue: "health",
  fitness_recovery: "fitness",
  hairCare: "hair",
  skinCare: "skin",
  beardCare: "beard",
  bodyCare: "body",
  healthCare: "health",
  fitness: "fitness",
  fragrance: "skin",
};

const parentToDefaultChildCategoryMap: Record<ParentCategory, CategoryId> = {
  skin: "acne",
  hair: "hair_loss",
  beard: "beard_growth",
  body: "body_acne",
  health: "energy_fatigue",
  fitness: "fitness_recovery",
};

const legacyToClinicalChildMap: Partial<Record<CategoryId, CategoryId>> = {
  hairCare: "hair_loss",
  skinCare: "acne",
  beardCare: "beard_growth",
  bodyCare: "body_acne",
  healthCare: "dark_circles",
  fitness: "fitness_recovery",
  fragrance: "lip_care",
};

function isParentCategory(value: string): value is ParentCategory {
  return value === "skin" || value === "hair" || value === "beard" || value === "body" || value === "health" || value === "fitness";
}

export function getChildCategoryFromAnalyzer(analyzer: AnalyzerType): CategoryId | null {
  return analyzerToChildCategoryMap[analyzer] || null;
}

export function getParentCategoryFromChild(category: CategoryId): ParentCategory {
  return childToParentCategoryMap[category] || "skin";
}

export function normalizeToClinicalChildCategory(category: CategoryId): CategoryId {
  return (legacyToClinicalChildMap[category] || category) as CategoryId;
}

export function resolveClinicalChildCategoryFromAny(
  input: string | null | undefined,
  preferredChild?: CategoryId | null
): CategoryId | null {
  if (!input) return preferredChild || null;

  if (isParentCategory(input)) {
    if (preferredChild) {
      const normalizedPreferred = normalizeToClinicalChildCategory(preferredChild);
      if (getParentCategoryFromChild(normalizedPreferred) === input) {
        return normalizedPreferred;
      }
    }
    return parentToDefaultChildCategoryMap[input];
  }

  const analyzerMatch = analyzerToChildCategoryMap[input as AnalyzerType];
  if (analyzerMatch) return analyzerMatch;

  const asCategory = input as CategoryId;
  if (childToParentCategoryMap[asCategory]) {
    return normalizeToClinicalChildCategory(asCategory);
  }

  return preferredChild || null;
}