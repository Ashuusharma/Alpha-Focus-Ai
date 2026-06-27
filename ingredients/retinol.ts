import { IngredientIntelligence } from "@/ingredients/types";

export const retinolIntelligence: IngredientIntelligence = {
  key: "retinol",
  displayName: "Retinol/Retinoid",
  whatItDoes: [
    "Supports texture refinement and long-term collagen pathways.",
    "Helps reduce acne marks and uneven skin renewal.",
  ],
  idealCategories: ["anti_aging", "dark_circles", "acne"],
  concentrationGuidance: ["Begin with low-strength derivatives", "Escalate only after tolerance is established"],
  whenToUse: [
    "Night only with gradual escalation.",
    "Use in anti-aging or persistent texture-focused protocols.",
  ],
  whenToAvoid: [
    "Avoid during active irritation flare until barrier calms.",
    "Avoid stacking with high-strength acids initially.",
  ],
  howMuch: "Pea-sized thin layer for full face, avoid eye corners/lip folds.",
  commonCombinations: ["Ceramide moisturizer", "Sunscreen next morning"],
  conflicts: ["Avoid aggressive layering with strong peels or scrubs."],
  beginnerSuitability: "low",
  expectedTimeline: "6-16 weeks for meaningful structural improvements.",
  safetyNotes: ["Use 2-3 nights per week initially.", "Stop and reassess if persistent irritation occurs."],
};
