"use client";

import { useMemo, useState } from "react";
import { Product } from "@/lib/recommendationRules";
import { useCartStore } from "@/lib/cartStore";
import { useToast } from "@/app/toast/ToastContext";
import IngredientsDisplay from "./IngredientsDisplay";
import { ShoppingCart, Check, Star, ShieldCheck, Clock3 } from "lucide-react";
import { getActiveUserName } from "@/lib/userScopedStorage";
import { formatINR } from "@/lib/currency";

type ExtendedProduct = Product & {
  benefits?: string[];
  ingredients?: string[];
  usage?: string;
  frequency?: string;
  why?: string;
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
  const [markedOwned, setMarkedOwned] = useState(false);

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

  const handleAlreadyHave = () => {
    setMarkedOwned((current) => {
      const next = !current;
      showToast(next ? `Marked ${product.name} as already available.` : `Removed owned mark for ${product.name}.`, "success");
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-[#E2DDD3] bg-white transition-all shadow-[0_10px_26px_rgba(17,17,17,0.04)] hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(17,17,17,0.08)] group">
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

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex text-yellow-500">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < 4 ? 'fill-yellow-500 text-yellow-500' : 'text-[#cabfae]'}`} />
            ))}
          </div>
          <span className="text-xs font-medium text-[#8C6A5A]">4.8 (120 reviews)</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-[#C8DACF] bg-[#E8F4EE] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#2F6F57]">Recommended by experts</span>
          <span className="rounded-full border border-[#E2DDD3] bg-[#FFF8EF] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#A46A2D]">Used by 10k+ users</span>
        </div>

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

        {product.why ? (
          <div className="rounded-2xl border border-[#E6DED0] bg-[#FBF7F0] px-4 py-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-[#2F6F57]" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Why this works</p>
                <p className="mt-1 text-sm text-[#4F4A43]">{product.why}</p>
              </div>
            </div>
          </div>
        ) : null}

        {(product.usage || product.frequency) ? (
          <div className="rounded-2xl border border-[#E6DED0] bg-white px-4 py-3">
            <div className="flex items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 text-[#8C6A5A]" />
              <div className="space-y-1 text-sm text-[#4F4A43]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">How to use</p>
                {product.usage ? <p>{product.usage}</p> : null}
                {product.frequency ? <p className="text-[#6B665D]">Expected timeline: {product.frequency}</p> : null}
              </div>
            </div>
          </div>
        ) : null}

        <IngredientsDisplay productName={product.name} ingredients={product.ingredients} />

        <div className="flex-1" />

        <div className="mt-auto border-t border-[#eee4d7] pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
            <span className="mr-2 text-xs text-[#a09180] line-through">{formatINR(3999)}</span>
            <span className="text-xl font-black text-[#111]">{formatINR(product.price || 2999)}</span>
            </div>
            {markedOwned ? (
              <span className="rounded-full border border-[#C8DACF] bg-[#E8EFEA] px-3 py-1 text-xs font-black text-[#2F6F57]">
                Already in your routine
              </span>
            ) : (
              <span className="rounded-full border border-[#F1D1B9] bg-[#FFF4EA] px-3 py-1 text-xs font-black text-[#B16035]">
                Low stock batch
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              onClick={handleAdd}
              className={`
                flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-semibold transition-all duration-300
                ${
                  isAdded
                    ? "border border-[#C8DACF] bg-[#E8EFEA] text-[#2F6F57] hover:bg-[#dce9df]"
                    : "bg-[#2F6F57] text-white shadow-[0_14px_28px_rgba(47,111,87,0.18)] hover:bg-[#275c48]"
                }
              `}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4" /> Open cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" /> Buy recommended
                </>
              )}
            </button>

            <button
              onClick={handleAlreadyHave}
              className={`flex items-center justify-center gap-2 rounded-xl border px-6 py-2.5 font-semibold transition-all duration-300 ${markedOwned ? "border-[#C8DACF] bg-[#E8EFEA] text-[#2F6F57]" : "border-[#E2DDD3] bg-[#FBF8F3] text-[#5F5A51] hover:bg-[#F4EEE4]"}`}
            >
              <Check className="h-4 w-4" />
              {markedOwned ? "Marked owned" : "I already have this"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
