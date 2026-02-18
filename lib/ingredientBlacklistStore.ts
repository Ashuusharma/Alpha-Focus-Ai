import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BlacklistedIngredient {
  id: string;
  name: string;
  reason: "allergy" | "sensitivity" | "preference" | "other";
  notes?: string;
  addedAt: string;
}

// Common allergens and sensitizing ingredients
export const commonAllergens = [
  { name: "Fragrance/Parfum", description: "Common skin irritant and allergen" },
  { name: "Parabens", description: "Preservatives that some prefer to avoid" },
  { name: "Sulfates (SLS/SLES)", description: "Can strip natural oils, cause dryness" },
  { name: "Formaldehyde", description: "Known allergen and irritant" },
  { name: "Alcohol Denat", description: "Can be drying and irritating" },
  { name: "Retinoids", description: "Can cause sensitivity, not for pregnancy" },
  { name: "Salicylic Acid", description: "Aspirin derivative, some are allergic" },
  { name: "Coconut Oil", description: "Comedogenic for some skin types" },
  { name: "Lanolin", description: "Wool-derived, can cause reactions" },
  { name: "Essential Oils", description: "Natural but potentially sensitizing" },
  { name: "Propylene Glycol", description: "Can cause contact dermatitis" },
  { name: "Benzyl Alcohol", description: "Preservative that can irritate" },
];

interface IngredientBlacklistState {
  blacklist: BlacklistedIngredient[];
  addIngredient: (ingredient: Omit<BlacklistedIngredient, "id" | "addedAt">) => void;
  removeIngredient: (id: string) => void;
  isBlacklisted: (ingredientName: string) => boolean;
  getBlacklistReasons: () => Record<string, string[]>;
  clearAll: () => void;
}

export const useIngredientBlacklistStore = create<IngredientBlacklistState>()(
  persist(
    (set, get) => ({
      blacklist: [],
      
      addIngredient: (ingredient) => {
        const exists = get().blacklist.find(
          (i) => i.name.toLowerCase() === ingredient.name.toLowerCase()
        );
        if (exists) return;
        
        const newIngredient: BlacklistedIngredient = {
          ...ingredient,
          id: `ing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          addedAt: new Date().toISOString(),
        };
        set((state) => ({ blacklist: [newIngredient, ...state.blacklist] }));
      },
      
      removeIngredient: (id) => {
        set((state) => ({
          blacklist: state.blacklist.filter((i) => i.id !== id),
        }));
      },
      
      isBlacklisted: (ingredientName) => {
        return get().blacklist.some(
          (i) => ingredientName.toLowerCase().includes(i.name.toLowerCase())
        );
      },
      
      getBlacklistReasons: () => {
        const reasons: Record<string, string[]> = {
          allergy: [],
          sensitivity: [],
          preference: [],
          other: [],
        };
        
        get().blacklist.forEach((ing) => {
          reasons[ing.reason].push(ing.name);
        });
        
        return reasons;
      },
      
      clearAll: () => {
        set({ blacklist: [] });
      },
    }),
    {
      name: "oneman-ingredient-blacklist",
    }
  )
);
