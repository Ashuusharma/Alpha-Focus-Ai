"use client";

import { useCartStore } from "@/lib/cartStore";

export default function ProductCard({ product }: any) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);

  const existing = items.find((i) => i.id === product.id);

  return (
    <div
      className="
        border rounded-xl
        p-4 sm:p-5
        flex flex-col sm:flex-row
        sm:items-center sm:justify-between
        gap-4
        bg-white
      "
    >
      {/* LEFT */}
      <div className="space-y-1">
        <p className="font-medium text-base sm:text-lg">
          {product.name}
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          {product.description}
        </p>
        <p className="font-semibold mt-1">
          ₹{product.price}
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex justify-end sm:justify-start">
        {existing ? (
          <span
            className="
              bg-green-600 text-white
              text-sm font-medium
              px-4 py-2
              rounded-lg
            "
          >
            Added ✓
          </span>
        ) : (
          <button
            onClick={() =>
              addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
              })
            }
            className="
              bg-black text-white
              text-sm sm:text-base
              px-5 py-3
              rounded-xl
              min-h-[44px]
              hover:opacity-90
              transition
            "
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}
