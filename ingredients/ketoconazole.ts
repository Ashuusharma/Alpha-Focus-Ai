import { IngredientIntelligence } from "@/ingredients/types";

export const ketoconazoleIntelligence: IngredientIntelligence = {
  key: "ketoconazole",
  displayName: "Ketoconazole",
  whatItDoes: [
    "Targets dandruff-associated fungal load.",
    "Helps reduce scalp flaking and itch in seborrheic patterns.",
  ],
  idealCategories: ["scalp_health", "hair_loss"],
  concentrationGuidance: ["Follow labeled therapeutic concentration and wash frequency guidance"],
  whenToUse: [
    "Use on scheduled scalp wash days when flaking/itch is active.",
    "Best for scalp health and inflammation-driven dandruff routines.",
  ],
  whenToAvoid: [
    "Avoid excessive daily use if scalp is dry and non-flaky.",
  ],
  howMuch: "Enough to cover scalp skin, not hair length.",
  commonCombinations: ["Gentle conditioner on hair lengths", "Scalp soothing tonic"],
  conflicts: ["Avoid harsh exfoliating scalp acids on same day if irritation is present."],
  beginnerSuitability: "medium",
  expectedTimeline: "1-4 weeks for itch/flake improvement.",
  safetyNotes: ["Do not use on broken skin.", "Seek clinician advice if severe redness persists."],
};
