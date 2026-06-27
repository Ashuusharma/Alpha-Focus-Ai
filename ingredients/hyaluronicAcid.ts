import { IngredientIntelligence } from "@/ingredients/types";

export const hyaluronicAcidIntelligence: IngredientIntelligence = {
  key: "hyaluronic_acid",
  displayName: "Hyaluronic Acid",
  whatItDoes: [
    "Helps skin hold water and improves hydration feel.",
    "Useful as a low-conflict support layer.",
  ],
  idealCategories: ["acne", "dark_circles", "anti_aging", "lip_care"],
  concentrationGuidance: ["Commonly used in low to moderate percentages", "Layer on damp skin if formula allows"],
  whenToUse: ["Morning or night after cleansing", "When hydration or plumpness is low"],
  whenToAvoid: ["If a formula feels sticky or congesting, reduce frequency"],
  howMuch: "A few drops or a thin layer.",
  commonCombinations: ["Ceramides", "Niacinamide", "Vitamin C"],
  conflicts: ["Minimal conflicts; can be used broadly with gentle routines."],
  beginnerSuitability: "high",
  expectedTimeline: "Immediate comfort support; 1-4 weeks for visible hydration benefit.",
  safetyNotes: ["Seal with moisturizer if skin is very dry."],
};
