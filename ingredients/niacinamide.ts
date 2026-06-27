import { IngredientIntelligence } from "@/ingredients/types";

export const niacinamideIntelligence: IngredientIntelligence = {
  key: "niacinamide",
  displayName: "Niacinamide",
  whatItDoes: [
    "Reduces visible oiliness and supports barrier function.",
    "Calms inflammatory signals in acne-prone and reactive skin.",
  ],
  idealCategories: ["acne", "dark_circles", "anti_aging", "beard_growth", "body_acne"],
  concentrationGuidance: ["Typical cosmetic range 4-10%", "Start lower if barrier is reactive"],
  whenToUse: [
    "Morning or night for oil imbalance and redness-prone routines.",
    "As a support layer when introducing stronger actives.",
  ],
  whenToAvoid: [
    "Pause temporarily during acute irritation flare with burning/stinging.",
  ],
  howMuch: "2-3 drops or a thin layer for full face.",
  commonCombinations: ["Ceramides", "Hyaluronic acid", "Sunscreen"],
  conflicts: ["Do not stack too many new actives on same day when tolerance is low."],
  beginnerSuitability: "high",
  expectedTimeline: "2-6 weeks for visible oil/redness support.",
  safetyNotes: ["Patch test before first use.", "Reduce frequency if irritation occurs."],
};
