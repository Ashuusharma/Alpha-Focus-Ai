"use client";

import { Product } from "@/lib/recommendationRules";
import { useCartStore } from "@/lib/cartStore";
import IngredientsDisplay from "./IngredientsDisplay";

interface EnhancedProductCardProps {
  product: Product;
}

export default function EnhancedProductCard({
  product,
}: EnhancedProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);

  const existing = items.find((i) => i.id === product.id);
  const isAdded = !!existing;

  return (
    <div className="border rounded-2xl bg-white hover:shadow-lg transition-all overflow-hidden">
      {/* Header with Badge */}
      <div className="bg-gradient-to-r from-blue-50 to-slate-100 p-5 border-b flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-slate-900">
            {product.name}
          </h4>
          <p className="text-sm text-slate-600 mt-1">
            {product.description}
          </p>
        </div>

        {/* Badge */}
        {product.badge && (
          <div className="ml-3 px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap bg-green-100 text-green-700">
            {product.badge === "Best Seller" && "⭐ Best Seller"}
            {product.badge === "Recommended" && "👍 Recommended"}
            {product.badge === "New" && "✨ New"}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-lg">
                {i < Math.floor(product.rating) ? "⭐" : "☆"}
              </span>
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating} ({product.reviews} reviews)
          </span>
        </div>

        {/* Why This Product */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <p className="text-xs font-semibold text-blue-900 mb-1">
            Why This Works:
          </p>
          <p className="text-sm text-blue-800">{product.why}</p>
        </div>

        {/* Key Ingredients */}
        <IngredientsDisplay productName={product.name} />

        {/* Usage & Frequency */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-1">
              How to Use:
            </p>
            <p className="text-sm text-gray-600">{product.usage}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-1">
              Frequency:
            </p>
            <p className="text-sm text-gray-600">{product.frequency}</p>
          </div>
        </div>

        {/* Expected Results Timeline */}
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <p className="text-xs font-semibold text-amber-900 mb-2">
            ⏰ When You'll See Results:
          </p>
          <div className="space-y-1 text-xs text-amber-800">
            <p>
              <strong>Week 1-2:</strong> Initial cleansing, reduced irritation
            </p>
            <p>
              <strong>Week 3-4:</strong> Visible improvement in condition
            </p>
            <p>
              <strong>Month 2+:</strong> Significant transformation, lasting results
            </p>
          </div>
        </div>

        {/* Price & Cart */}
        <div className="border-t pt-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="text-2xl font-bold text-gray-900">
              ₹{product.price}
            </p>
          </div>

          {isAdded ? (
            <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
              <span className="text-green-700 font-semibold text-sm">
                ✓ In Cart
              </span>
              <span className="text-green-700 font-bold">
                ({existing?.quantity})
              </span>
            </div>
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
              className="bg-slate-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-slate-800 transition min-h-[44px]"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
