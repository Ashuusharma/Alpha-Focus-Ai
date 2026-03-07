"use client";

import { useMemo } from "react";
import { Product } from "@/lib/recommendationRules";
import { useCartStore } from "@/lib/cartStore";
import { useToast } from "@/app/toast/ToastContext";
import IngredientsDisplay from "./IngredientsDisplay";
import { ShoppingCart, Check, Star } from "lucide-react";
import { getActiveUserName } from "@/lib/userScopedStorage";
import { formatINR } from "@/lib/currency";

type ExtendedProduct = Product & {
  benefits?: string[];
  ingredients?: string[];
};

interface EnhancedProductCardProps {
  product: ExtendedProduct;
}

export default function EnhancedProductCard({
  product,
}: EnhancedProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { showToast } = useToast();
  const items = useCartStore((s) => s.items);
  const activeUserId = (getActiveUserName() || "guest").trim() || "guest";

  const userItems = useMemo(
    () => items.filter((i) => (((i.userId || "guest").trim() || "guest") === activeUserId)),
    [activeUserId, items]
  );

  const existing = userItems.find((i) => i.id === product.id);
  const isAdded = !!existing;

  const handleAdd = () => {
    if (!isAdded) {
      if (!product.price) product.price = 2999;
      addItem({ id: product.id, name: product.name, price: product.price, quantity: 1 });
      showToast(`${product.name} added to cart!`, "success");
    } else {
        useCartStore.getState().openCart();
    }
  };

  return (
    <div className="rounded-2xl bg-transparent transition-all overflow-hidden flex flex-col h-full border border-white/5 hover:border-primary/30 group">
      {/* Header with Badge */}
      <div className="bg-gradient-to-r from-white/5 to-transparent p-5 flex justify-between items-start border-b border-white/5">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
            {product.name}
          </h4>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Badge */}
        {product.badge && (
          <div className="ml-3 px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap bg-primary/20 text-primary border border-primary/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            {product.badge === "Best Seller" && "⭐ Best Seller"}
            {product.badge === "Recommended" && "👍 Recommended"}
            {product.badge === "New" && "✨ New"}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex text-yellow-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < 4 ? 'fill-yellow-500 text-yellow-500' : 'text-gray-600'}`} />
            ))}
          </div>
          <span className="text-xs text-gray-400 font-medium">4.8 (120 reviews)</span>
        </div>

        {/* Benefits */}
        <div className="space-y-2 mb-2">
           <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Key Benefits</p>
           <div className="flex flex-wrap gap-2">
                {product.benefits && product.benefits.slice(0,2).map((b: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 bg-white/5 text-gray-300 rounded border border-white/5">
                        {b}
                    </span>
                ))}
            </div>
        </div>

        {/* Ingredients */}
        <IngredientsDisplay productName={product.name} ingredients={product.ingredients} />

        <div className="flex-1" />

        {/* Action Area */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
          <div>
            <span className="text-xs text-gray-500 line-through mr-2">{formatINR(3999)}</span>
            <span className="text-xl font-bold text-white">{formatINR(product.price || 2999)}</span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isAdded}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all duration-300
              ${
                isAdded
                  ? "bg-green-500/20 text-green-400 border border-green-500/50 cursor-pointer hover:bg-green-500/30"
                  : "bg-primary text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)]"
              }
            `}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4" /> Added
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
