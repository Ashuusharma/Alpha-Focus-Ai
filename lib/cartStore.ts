import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getActiveUserName } from "@/lib/userScopedStorage";

/* ================= TYPES ================= */

export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  protocolTier?: string;
  recommendationReason?: string;
  recommendedConcern?: string;
  addedAt?: string;
  usageStartedAt?: string;
  usageDays?: number;
  lastResultNote?: string;
  upgradeNeeded?: boolean;
  improvementImpactPct?: number;
  userId?: string;
};

export type ProductHistoryEntry = {
  id: string;
  itemId: string;
  userId: string;
  productName: string;
  event: "added" | "removed" | "quantity_updated" | "usage_updated";
  details: string;
  createdAt: string;
};

type CartState = {
  items: CartItem[];
  history: ProductHistoryEntry[];
  isOpen: boolean;

  /* UI */
  openCart: () => void;
  closeCart: () => void;

  /* CART ACTIONS */
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  updateProductUsage: (itemId: string, updates: Pick<CartItem, "usageDays" | "lastResultNote" | "upgradeNeeded">) => void;
  resetCart: () => void;

  /* DERIVED */
  getUserItems: (userId?: string | null) => CartItem[];
  getProductHistory: (userId?: string | null) => ProductHistoryEntry[];
  totalItems: (userId?: string | null) => number;
  totalPrice: (userId?: string | null) => number;
};

function resolveUserId(userId?: string | null): string {
  return (userId || getActiveUserName() || "guest").trim() || "guest";
}

function createHistoryEntry(
  event: ProductHistoryEntry["event"],
  itemId: string,
  userId: string,
  productName: string,
  details: string,
  createdAt: string
): ProductHistoryEntry {
  return {
    id: `ch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    itemId,
    userId,
    productName,
    event,
    details,
    createdAt,
  };
}

/* ================= STORE ================= */

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      history: [],
      isOpen: false,

  /* UI */
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

  /* ADD ITEM */
      addItem: (item) =>
        set((state) => {
          const userId = resolveUserId(item.userId);
          const now = new Date().toISOString();
          const existing = state.items.find((i) => i.id === item.id && resolveUserId(i.userId) === userId);

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id && resolveUserId(i.userId) === userId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
              history: [
                createHistoryEntry("quantity_updated", item.id, userId, item.name, `Quantity increased by ${item.quantity}`, now),
                ...state.history,
              ].slice(0, 200),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                userId,
                addedAt: item.addedAt || now,
                usageStartedAt: item.usageStartedAt || now,
                protocolTier: item.protocolTier || "Core Protocol",
                recommendationReason: item.recommendationReason || "Suggested based on concern severity and routine adherence.",
                improvementImpactPct: item.improvementImpactPct ?? 12,
              },
            ],
            history: [
              createHistoryEntry("added", item.id, userId, item.name, "Product added to cart", now),
              ...state.history,
            ].slice(0, 200),
          };
        }),

  /* REMOVE ITEM */
      removeItem: (id) =>
        set((state) => {
          const userId = resolveUserId();
          const removed = state.items.find((i) => i.id === id && resolveUserId(i.userId) === userId);

          return {
            items: state.items.filter((i) => !(i.id === id && resolveUserId(i.userId) === userId)),
            history: removed
              ? [
                  createHistoryEntry("removed", id, userId, removed.name, "Product removed from cart", new Date().toISOString()),
                  ...state.history,
                ].slice(0, 200)
              : state.history,
          };
        }),

  /* UPDATE QUANTITY */
      updateQty: (id, quantity) =>
        set((state) => {
          const userId = resolveUserId();
          const now = new Date().toISOString();
          const target = state.items.find((i) => i.id === id && resolveUserId(i.userId) === userId);

          return {
            items:
              quantity <= 0
                ? state.items.filter((i) => !(i.id === id && resolveUserId(i.userId) === userId))
                : state.items.map((i) =>
                    i.id === id && resolveUserId(i.userId) === userId ? { ...i, quantity } : i
                  ),
            history: target
              ? [
                  createHistoryEntry("quantity_updated", id, userId, target.name, quantity <= 0 ? "Quantity set to zero" : `Quantity updated to ${quantity}`, now),
                  ...state.history,
                ].slice(0, 200)
              : state.history,
          };
        }),

      updateProductUsage: (itemId, updates) =>
        set((state) => {
          const userId = resolveUserId();
          const now = new Date().toISOString();
          const target = state.items.find((i) => i.id === itemId && resolveUserId(i.userId) === userId);

          return {
            items: state.items.map((i) =>
              i.id === itemId && resolveUserId(i.userId) === userId ? { ...i, ...updates } : i
            ),
            history: target
              ? [
                  createHistoryEntry("usage_updated", itemId, userId, target.name, updates.lastResultNote || "Usage insight updated", now),
                  ...state.history,
                ].slice(0, 200)
              : state.history,
          };
        }),

  /* RESET CART (IMPORTANT FOR AI RESULT PAGE) */
      resetCart: () =>
        set((state) => {
          const userId = resolveUserId();
          return {
            items: state.items.filter((i) => resolveUserId(i.userId) !== userId),
          };
        }),

  /* DERIVED */
      getUserItems: (userId) => {
        const resolved = resolveUserId(userId);
        return get().items.filter((item) => resolveUserId(item.userId) === resolved);
      },

      getProductHistory: (userId) => {
        const resolved = resolveUserId(userId);
        return get().history.filter((entry) => entry.userId === resolved);
      },

      totalItems: (userId) =>
        get()
          .getUserItems(userId)
          .reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: (userId) =>
        get()
          .getUserItems(userId)
          .reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    {
      name: "oneman_cart_store_v2",
      partialize: (state) => ({ items: state.items, history: state.history }),
    }
  )
);
