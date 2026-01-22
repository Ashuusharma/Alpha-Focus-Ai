"use client";

import { useCartStore } from "@/lib/cartStore";
import { useMounted } from "@/app/hooks/useMounted";

export default function CartBadge() {
  /* ✅ ALL HOOKS FIRST */
  const mounted = useMounted();
  const { items, totalPrice } = useCartStore();

  /* ✅ GUARDS AFTER HOOKS */
  if (!mounted) return null;
  if (!items.length) return null;

  return (
    <button className="fixed top-6 right-6 z-50 bg-black text-white px-4 py-2 rounded-full shadow-lg">
      🛒 {items.length} items · ₹{totalPrice()}
    </button>
  );
}
