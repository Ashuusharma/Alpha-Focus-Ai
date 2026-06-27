export type IngredientIntelligence = {
  key: string;
  displayName: string;
  whatItDoes: string[];
  idealCategories: string[];
  concentrationGuidance: string[];
  whenToUse: string[];
  whenToAvoid: string[];
  howMuch: string;
  commonCombinations: string[];
  conflicts: string[];
  beginnerSuitability: "high" | "medium" | "low";
  expectedTimeline: string;
  safetyNotes: string[];
};
