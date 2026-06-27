import { IngredientIntelligence } from "@/ingredients/types";

export const sunscreenIntelligence: IngredientIntelligence = {
  key: "sunscreen",
  displayName: "Broad Spectrum Sunscreen",
  whatItDoes: [
    "Protects against UV-driven inflammation, pigmentation, and photoaging.",
    "Core relapse-prevention layer for most skin protocols.",
  ],
  idealCategories: ["acne", "dark_circles", "anti_aging", "lip_care", "skin_dullness"],
  concentrationGuidance: ["Use SPF 30+ broad spectrum or higher as appropriate", "Reapply when outdoors"],
  whenToUse: ["Every morning as the final daytime protective layer", "Reapply during prolonged outdoor exposure"],
  whenToAvoid: ["Avoid skipping on cloudy or indoor commute days with UV exposure"],
  howMuch: "Two-finger amount for face and neck or the labeled body amount.",
  commonCombinations: ["Vitamin C", "Niacinamide", "Azelaic acid"],
  conflicts: ["None clinically meaningful, but formula tolerance still matters."],
  beginnerSuitability: "high",
  expectedTimeline: "Immediate protection; cumulative benefit over weeks and months.",
  safetyNotes: ["Use every day for best results.", "Reapply after sweating or outdoor exposure."],
};
