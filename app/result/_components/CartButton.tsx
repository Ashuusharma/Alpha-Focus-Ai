"use client";

import { useCartStore } from "@/lib/cartStore";
import { useMounted } from "@/lib/useMounted";

export default function CartButton() {
  const mounted = useMounted();
  const { openCart, totalItems, totalPrice, isOpen } = useCartStore();

  if (!mounted) return null;
  if (isOpen) return null;
  if (totalItems() === 0) return null;

  return (
    <button
      onClick={openCart}
      className="
        fixed top-5 right-5 z-40
        bg-black text-white
        px-4 py-3
        rounded-xl
        shadow-lg
        text-sm sm:text-base
      "
    >
       {totalItems()} items
      <br />
      Rs {totalPrice()}
    </button>
  );
}

