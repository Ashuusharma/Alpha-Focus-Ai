import { IngredientIntelligence } from "@/ingredients/types";

export const vitaminCIntelligence: IngredientIntelligence = {
  key: "vitamin_c",
  displayName: "Vitamin C",
  whatItDoes: [
    "Supports antioxidant defense against daily oxidative stress.",
    "Improves visible brightness and helps post-inflammatory marks.",
  ],
  idealCategories: ["anti_aging", "dark_circles", "lip_care", "skin_dullness"],
  concentrationGuidance: ["Use concentration matched to tolerance", "Stabilized formulations are preferred for sensitive users"],
  whenToUse: [
    "Morning before sunscreen for photoprotection support.",
    "Useful in anti-aging and skin dullness protocols.",
  ],
  whenToAvoid: [
    "Reduce frequency when skin is actively irritated.",
  ],
  howMuch: "2-4 drops for face and neck.",
  commonCombinations: ["Sunscreen", "Niacinamide", "Hydrating serum"],
  conflicts: ["Do not combine too many low-pH actives in one routine if sensitive."],
  beginnerSuitability: "medium",
  expectedTimeline: "4-12 weeks for visible tone/brightness improvements.",
  safetyNotes: ["Store away from direct heat/light.", "Patch test first."],
};
