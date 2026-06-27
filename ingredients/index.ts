import { IngredientIntelligence } from "@/ingredients/types";
import { niacinamideIntelligence } from "@/ingredients/niacinamide";
import { ketoconazoleIntelligence } from "@/ingredients/ketoconazole";
import { salicylicIntelligence } from "@/ingredients/salicylic";
import { retinolIntelligence } from "@/ingredients/retinol";
import { vitaminCIntelligence } from "@/ingredients/vitaminC";
import { ceramideIntelligence } from "@/ingredients/ceramide";
import { hyaluronicAcidIntelligence } from "@/ingredients/hyaluronicAcid";
import { azelaicAcidIntelligence } from "@/ingredients/azelaicAcid";
import { sunscreenIntelligence } from "@/ingredients/sunscreen";

export const ingredientIntelligenceMap: Record<string, IngredientIntelligence> = {
  niacinamide: niacinamideIntelligence,
  ketoconazole: ketoconazoleIntelligence,
  salicylic_acid: salicylicIntelligence,
  retinol: retinolIntelligence,
  vitamin_c: vitaminCIntelligence,
  ceramides: ceramideIntelligence,
  hyaluronic_acid: hyaluronicAcidIntelligence,
  azelaic_acid: azelaicAcidIntelligence,
  sunscreen: sunscreenIntelligence,
};

export function getIngredientIntelligence(keys: string[]): IngredientIntelligence[] {
  return keys
    .map((key) => ingredientIntelligenceMap[key])
    .filter((item): item is IngredientIntelligence => Boolean(item));
}
