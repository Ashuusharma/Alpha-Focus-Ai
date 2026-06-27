import { IngredientIntelligence } from "@/ingredients/types";

export const azelaicAcidIntelligence: IngredientIntelligence = {
  key: "azelaic_acid",
  displayName: "Azelaic Acid",
  whatItDoes: [
    "Supports redness reduction and post-inflammatory mark care.",
    "Helpful for acne-prone and pigmentation-prone skin.",
  ],
  idealCategories: ["acne", "dark_circles", "skin_dullness"],
  concentrationGuidance: ["Often used at 10-15% in cosmetic routines", "Start low frequency if skin is reactive"],
  whenToUse: ["Day or night depending on product format", "Best when redness and marks are both concerns"],
  whenToAvoid: ["Avoid over-layering with multiple strong actives when tolerance is low"],
  howMuch: "Thin layer for the target area.",
  commonCombinations: ["Niacinamide", "Sunscreen", "Ceramides"],
  conflicts: ["May sting if barrier is compromised or too many actives are stacked."],
  beginnerSuitability: "medium",
  expectedTimeline: "4-12 weeks for visible tone and redness support.",
  safetyNotes: ["Patch test first.", "Use sunscreen daily."],
};
