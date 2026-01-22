import { recommendationRules, Recommendation } from "./recommendationRules";
import { CategoryId } from "./questions";

type Answers = Record<string, string>;

/**
 * Intelligent recommendation engine
 * - Returns results ONLY for answered categories
 * - AI-style scoring within category scope
 * - No cross-category leakage
 */
export function getRecommendations(answers: Answers): Recommendation[] {
  if (!answers || Object.keys(answers).length === 0) {
    return [];
  }

  /**
   * 1️⃣ Detect which categories were answered
   * (based on questionId prefixes)
   */
  const answeredCategories = new Set<CategoryId>();

  Object.keys(answers).forEach((questionId) => {
    if (questionId.startsWith("hair_")) answeredCategories.add("hairCare");
    if (questionId.startsWith("skin_")) answeredCategories.add("skinCare");
    if (questionId.startsWith("beard_")) answeredCategories.add("beardCare");
    if (questionId.startsWith("body_")) answeredCategories.add("bodyCare");
    if (questionId.startsWith("health_")) answeredCategories.add("healthCare");
    if (questionId.startsWith("fitness_")) answeredCategories.add("fitness");
    if (questionId.startsWith("fragrance_")) answeredCategories.add("fragrance");
  });

  /**
   * 2️⃣ Hard filter recommendations by answered categories
   */
  const scopedRules = recommendationRules.filter((rec) =>
    answeredCategories.has(rec.category)
  );

  /**
   * 3️⃣ AI-style scoring (ONLY within scoped categories)
   */
  const scored = scopedRules.map((rec) => {
    let score = 0;

    Object.values(answers).forEach((answer) => {
      const a = answer.toLowerCase();

      if (rec.title.toLowerCase().includes(a)) score += 3;
      if (rec.cause.toLowerCase().includes(a)) score += 2;
      if (rec.solution.toLowerCase().includes(a)) score += 2;

      rec.steps.forEach((step) => {
        if (step.toLowerCase().includes(a)) score += 1;
      });

      rec.products.forEach((product) => {
        if (
          product.description.toLowerCase().includes(a) ||
          product.why.toLowerCase().includes(a)
        ) {
          score += 1;
        }
      });
    });

    return { rec, score };
  });

  /**
   * 4️⃣ Sort & return
   */
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.rec);
}
