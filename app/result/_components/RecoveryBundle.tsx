"use client";

import { useCartStore } from "@/lib/cartStore";

type RecoveryBundleProps = {
  products: any[];
  onCheckout?: () => void;
};

export default function RecoveryBundle({
  products,
  onCheckout,
}: RecoveryBundleProps) {
  const { items } = useCartStore();

  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="border rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-semibold">
         Your AI-Generated Recovery Bundle
      </h3>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center text-sm"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-gray-500">
                Rs {item.price} x {item.quantity}
              </p>
            </div>
            <p className="font-medium">
              Rs {item.price * item.quantity}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 flex justify-between items-center">
        <span className="font-medium">Total Bundle Value</span>
        <span className="font-semibold">Rs {totalPrice}</span>
      </div>

      <button
        onClick={onCheckout}
        className="w-full bg-gray-300 text-gray-700 py-3 rounded-xl font-medium cursor-not-allowed"
      >
        Checkout (Available soon)
      </button>

      <p className="text-xs text-gray-400 text-center">
        Products will be purchasable once Oneman Store is live
      </p>
    </div>
  );
}

