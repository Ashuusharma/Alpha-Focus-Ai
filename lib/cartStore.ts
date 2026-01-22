import { create } from "zustand";

/* ================= TYPES ================= */

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;

  /* UI */
  openCart: () => void;
  closeCart: () => void;

  /* CART ACTIONS */
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  resetCart: () => void;

  /* DERIVED */
  totalItems: () => number;
  totalPrice: () => number;
};

/* ================= STORE ================= */

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isOpen: false,

  /* UI */
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  /* ADD ITEM */
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);

      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === item.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }

      return { items: [...state.items, item] };
    }),

  /* REMOVE ITEM */
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),

  /* UPDATE QUANTITY */
  updateQty: (id, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.id !== id)
          : state.items.map((i) =>
              i.id === id ? { ...i, quantity } : i
            ),
    })),

  /* RESET CART (IMPORTANT FOR AI RESULT PAGE) */
  resetCart: () => set({ items: [] }),

  /* DERIVED */
  totalItems: () =>
    get().items.reduce((sum, item) => sum + item.quantity, 0),

  totalPrice: () =>
    get().items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),
}));
