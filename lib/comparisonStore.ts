import { create } from "zustand";

export interface CompareProduct {
  id: string;
  name: string;
  type: string;
  price: string;
  rating: number;
  keyIngredients: { name: string; benefit: string; effectiveness: number }[];
  howToUse: string;
  whenToUse: string;
  whyItHelps: string;
  beneficialInfo: string;
}

interface ComparisonState {
  products: CompareProduct[];
  isOpen: boolean;
  addProduct: (product: CompareProduct) => void;
  removeProduct: (id: string) => void;
  clearAll: () => void;
  openComparison: () => void;
  closeComparison: () => void;
  isInComparison: (id: string) => boolean;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  products: [],
  isOpen: false,
  
  addProduct: (product) => {
    const current = get().products;
    if (current.length >= 3) {
      // Max 3 products for comparison
      return;
    }
    if (current.find((p) => p.id === product.id)) {
      return;
    }
    set({ products: [...current, product] });
  },
  
  removeProduct: (id) => {
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },
  
  clearAll: () => {
    set({ products: [], isOpen: false });
  },
  
  openComparison: () => {
    set({ isOpen: true });
  },
  
  closeComparison: () => {
    set({ isOpen: false });
  },
  
  isInComparison: (id) => {
    return get().products.some((p) => p.id === id);
  },
}));
