import { create } from "zustand";

export interface WishlistItem {
  id: string;
  name: string;
  type: string;
  price: string;
  rating: number;
  addedAt: string;
  forIssue?: string;
  imageUrl?: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, "addedAt">) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  clearAll: () => void;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
      items: [],
      
      addItem: (item) => {
        const exists = get().items.find((i) => i.id === item.id);
        if (exists) return;
        
        const newItem: WishlistItem = {
          ...item,
          addedAt: new Date().toISOString(),
        };
        set((state) => ({ items: [newItem, ...state.items] }));
      },
      
      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },
      
      isInWishlist: (id) => {
        return get().items.some((i) => i.id === id);
      },
      
      clearAll: () => {
        set({ items: [] });
      },
    })
);
