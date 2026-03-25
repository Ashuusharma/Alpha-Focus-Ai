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
    <div className="flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-[#E2DDD3] bg-white transition-all shadow-[0_10px_26px_rgba(17,17,17,0.04)] hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(17,17,17,0.08)] group">
      {/* Header with Badge */}
      <div className="flex items-start justify-between border-b border-[#eee4d7] bg-[linear-gradient(180deg,#fffaf3_0%,#f5ecdf_100%)] p-5">
        <div className="flex-1">
          <h4 className="text-lg font-black text-[#111] group-hover:text-[#2F6F57] transition-colors">
            {product.name}
          </h4>
          <p className="mt-1 line-clamp-2 text-sm text-[#6B665D]">
            {product.description}
          </p>
        </div>

        {/* Badge */}
        {product.badge && (
          <div className="ml-3 whitespace-nowrap rounded-full border border-[#C8DACF] bg-[#E8EFEA] px-3 py-1 text-xs font-black text-[#2F6F57] shadow-sm">
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
              <Star key={i} className={`h-3.5 w-3.5 ${i < 4 ? 'fill-yellow-500 text-yellow-500' : 'text-[#cabfae]'}`} />
            ))}
          </div>
          <span className="text-xs font-medium text-[#8C6A5A]">4.8 (120 reviews)</span>
        </div>

        {/* Benefits */}
        <div className="space-y-2 mb-2">
           <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Key Benefits</p>
           <div className="flex flex-wrap gap-2">
                {product.benefits && product.benefits.slice(0,2).map((b: string, i: number) => (
                    <span key={i} className="rounded-full border border-[#e2d8ca] bg-[#f7f1e7] px-2.5 py-1 text-xs font-semibold text-[#5F5A51]">
                        {b}
                    </span>
                ))}
            </div>
        </div>

        {/* Ingredients */}
        <IngredientsDisplay productName={product.name} ingredients={product.ingredients} />

        <div className="flex-1" />

        {/* Action Area */}
        <div className="mt-auto flex items-center justify-between border-t border-[#eee4d7] pt-4">
          <div>
            <span className="mr-2 text-xs text-[#a09180] line-through">{formatINR(3999)}</span>
            <span className="text-xl font-black text-[#111]">{formatINR(product.price || 2999)}</span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isAdded}
            className={`
              flex items-center gap-2 rounded-xl px-6 py-2.5 font-semibold transition-all duration-300
              ${
                isAdded
                  ? "cursor-pointer border border-[#C8DACF] bg-[#E8EFEA] text-[#2F6F57] hover:bg-[#dce9df]"
                  : "bg-[#2F6F57] text-white shadow-[0_14px_28px_rgba(47,111,87,0.18)] hover:bg-[#275c48]"
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
