import { IngredientIntelligence } from "@/ingredients/types";

export const salicylicIntelligence: IngredientIntelligence = {
  key: "salicylic_acid",
  displayName: "Salicylic Acid",
  whatItDoes: [
    "Penetrates pores and reduces congestion.",
    "Supports comedonal acne and body acne control.",
  ],
  idealCategories: ["acne", "body_acne", "beard_growth"],
  concentrationGuidance: ["Typical leave-on range around 0.5-2%", "Use lower frequency in sensitive routines"],
  whenToUse: [
    "Night use for acne-prone zones or post-workout body congestion.",
    "Alternate days in beginner tolerance mode.",
  ],
  whenToAvoid: [
    "Avoid overuse on highly sensitive or barrier-compromised skin.",
  ],
  howMuch: "Pea-sized amount for face or a thin layer on target body zones.",
  commonCombinations: ["Niacinamide", "Barrier moisturizer"],
  conflicts: ["Do not combine with multiple exfoliants in same session."],
  beginnerSuitability: "medium",
  expectedTimeline: "3-8 weeks for visible congestion reduction.",
  safetyNotes: ["Start low frequency and increase gradually.", "Use sunscreen daily."],
};
