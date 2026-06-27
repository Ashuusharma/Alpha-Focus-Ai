import { IngredientIntelligence } from "@/ingredients/types";

export const ceramideIntelligence: IngredientIntelligence = {
  key: "ceramides",
  displayName: "Ceramides",
  whatItDoes: [
    "Supports skin barrier repair and reduces dryness-induced irritation.",
    "Improves tolerance to active routines.",
  ],
  idealCategories: ["acne", "dark_circles", "anti_aging", "body_acne", "lip_care", "scalp_health"],
  concentrationGuidance: ["Use in moisturizer or barrier cream formats", "Suitable for daily supportive use"],
  whenToUse: ["After cleansing and with active routines", "When barrier needs recovery support"],
  whenToAvoid: ["Generally low conflict; pause only if a specific formula irritates"],
  howMuch: "Thin layer or moisturizer-sized amount across the target area.",
  commonCombinations: ["Niacinamide", "Retinol", "Salicylic acid"],
  conflicts: ["Rare conflicts; check fragrance-sensitive formulas."],
  beginnerSuitability: "high",
  expectedTimeline: "Days to 2 weeks for comfort and barrier support.",
  safetyNotes: ["Good first-line support ingredient for many routines."],
};
