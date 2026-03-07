import { CategoryId } from "@/lib/questions";

export type ClinicalRelevance = "Low" | "Moderate" | "High";

export interface QuestionAdminContent {
  text?: string;
  context?: string;
  clinicalRelevance: ClinicalRelevance;
  imageExternal?: string;
  imageLocal: string;
}

export interface CategoryAdminContent {
  imageExternal?: string;
  imageLocal: string;
}

export const CATEGORY_CONTENT_MAP: Partial<Record<CategoryId, CategoryAdminContent>> = {
  scalp_health: {
    imageExternal: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1400&auto=format&fit=crop",
    imageLocal: "/images/assessment/male-hair.svg",
  },
  acne: {
    imageExternal: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1400&auto=format&fit=crop",
    imageLocal: "/images/assessment/male-skin.svg",
  },
  dark_circles: {
    imageExternal: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=1400&auto=format&fit=crop",
    imageLocal: "/images/assessment/male-skin.svg",
  },
  hair_loss: {
    imageExternal: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1400&auto=format&fit=crop",
    imageLocal: "/images/assessment/male-hair.svg",
  },
  beard_growth: {
    imageExternal: "https://images.unsplash.com/photo-1621607512214-68297480165e?q=80&w=1400&auto=format&fit=crop",
    imageLocal: "/images/assessment/male-beard.svg",
  },
  body_acne: {
    imageExternal: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?q=80&w=1400&auto=format&fit=crop",
    imageLocal: "/images/assessment/male-body.svg",
  },
  lip_care: {
    imageExternal: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1400&auto=format&fit=crop",
    imageLocal: "/images/assessment/male-skin.svg",
  },
  anti_aging: {
    imageExternal: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1400&auto=format&fit=crop",
    imageLocal: "/images/assessment/male-skin.svg",
  },
};

export const QUESTION_CONTENT_MAP: Record<string, QuestionAdminContent> = {
  hair_concern: { clinicalRelevance: "High", imageLocal: "/images/assessment/male-hair.svg" },
  hair_type: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-hair.svg" },
  scalp_type: { clinicalRelevance: "High", imageLocal: "/images/assessment/male-hair.svg" },
  hair_damage: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-hair.svg" },
  hair_goal: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-hair.svg" },

  skin_type: { clinicalRelevance: "High", imageLocal: "/images/assessment/male-skin.svg" },
  skin_concern: { clinicalRelevance: "High", imageLocal: "/images/assessment/male-skin.svg" },
  breakouts: { clinicalRelevance: "High", imageLocal: "/images/assessment/male-skin.svg" },
  sun_exposure: {
    clinicalRelevance: "High",
    imageExternal: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?q=80&w=1400&auto=format&fit=crop",
    imageLocal: "/images/assessment/male-skin.svg",
    context: "High UV exposure strongly increases tanning, pigmentation, and visible aging risk.",
  },
  skin_goal: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-skin.svg" },

  beard_growth: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-beard.svg" },
  beard_issue: { clinicalRelevance: "High", imageLocal: "/images/assessment/male-beard.svg" },
  beard_length: { clinicalRelevance: "Low", imageLocal: "/images/assessment/male-beard.svg" },
  beard_care: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-beard.svg" },
  beard_goal: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-beard.svg" },

  body_skin: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-body.svg" },
  body_issue: { clinicalRelevance: "High", imageLocal: "/images/assessment/male-body.svg" },
  sweat: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-body.svg" },
  shower_freq: { clinicalRelevance: "Low", imageLocal: "/images/assessment/male-body.svg" },
  body_goal: { clinicalRelevance: "Low", imageLocal: "/images/assessment/male-body.svg" },

  energy: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-health.svg" },
  sleep: { clinicalRelevance: "High", imageLocal: "/images/assessment/male-health.svg" },
  stress: { clinicalRelevance: "High", imageLocal: "/images/assessment/male-health.svg" },
  diet: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-health.svg" },
  health_goal: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-health.svg" },

  activity: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-fitness.svg" },
  workout: { clinicalRelevance: "High", imageLocal: "/images/assessment/male-fitness.svg" },
  goal: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-fitness.svg" },
  injury: { clinicalRelevance: "High", imageLocal: "/images/assessment/male-fitness.svg" },
  fitness_focus: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-fitness.svg" },

  scent_type: { clinicalRelevance: "Low", imageLocal: "/images/assessment/male-fragrance.svg" },
  usage: { clinicalRelevance: "Low", imageLocal: "/images/assessment/male-fragrance.svg" },
  strength: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-fragrance.svg" },
  climate: { clinicalRelevance: "Moderate", imageLocal: "/images/assessment/male-fragrance.svg" },
  fragrance_goal: { clinicalRelevance: "Low", imageLocal: "/images/assessment/male-fragrance.svg" },
};

export function getClinicalRelevance(questionId: string): ClinicalRelevance {
  return QUESTION_CONTENT_MAP[questionId]?.clinicalRelevance || "Moderate";
}

export function getCategoryImageCandidates(categoryId: CategoryId, defaultImage?: string): string[] {
  const mapped = CATEGORY_CONTENT_MAP[categoryId];
  return [mapped?.imageExternal, mapped?.imageLocal, defaultImage, "/images/question-fallback.svg"].filter(Boolean) as string[];
}

export function getQuestionImageCandidates(categoryId: CategoryId, questionId: string, defaultImage?: string): string[] {
  const mapped = QUESTION_CONTENT_MAP[questionId];
  const categoryMapped = CATEGORY_CONTENT_MAP[categoryId];
  return [
    mapped?.imageExternal,
    mapped?.imageLocal,
    categoryMapped?.imageExternal,
    categoryMapped?.imageLocal,
    defaultImage,
    "/images/question-fallback.svg",
  ].filter(Boolean) as string[];
}

export function getQuestionLabel(questionId: string, defaultText: string): string {
  return QUESTION_CONTENT_MAP[questionId]?.text || defaultText;
}

export function getQuestionContextOverride(questionId: string): string | undefined {
  return QUESTION_CONTENT_MAP[questionId]?.context;
}
