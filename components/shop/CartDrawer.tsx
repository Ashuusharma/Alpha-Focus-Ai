"use client";

import { X, Minus, Plus, Trash2, ShieldCheck, ArrowRight, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cartStore";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { formatINR } from "@/lib/currency";
import { getActiveRewardUnlock, getRewardCountdownLabel } from "@/lib/rewardUnlockService";
import { useRewardStore } from "@/stores/useRewardStore";

export default function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQty } = useCartStore();
  const activeReward = useRewardStore((state) => state.activeReward);
  const isExpiringSoon = useRewardStore((state) => state.isExpiringSoon);
  const initializeRewardStore = useRewardStore((state) => state.initialize);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= 1000 ? 0 : 99;
  const total = subtotal + shipping;

  useEffect(() => initializeRewardStore(), [initializeRewardStore]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={closeCart}
      />

      {/* Drawer Panel */}
      <div 
        ref={drawerRef}
        className="relative h-full w-full max-w-md bg-[#F9F7F2] shadow-2xl transition-transform duration-300 ease-in-out border-l border-[#E2DDD4]"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E2DDD4] px-6 py-5 bg-white">
            <h2 className="text-xl font-bold text-[#1F3D2B]">Your Regimen ({items.length})</h2>
            <button 
              onClick={closeCart}
              className="rounded-full p-2 text-[#6B665D] hover:bg-[#F4EFE6] hover:text-[#1F3D2B] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <div className="mb-4 rounded-full bg-[#E8EFEA] p-4 text-[#2F6F57]">
                   <ShoppingCart className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-[#1F3D2B]">Your cart is empty</h3>
                <p className="mt-2 text-sm text-[#6B665D]">Start building your personalized routine from the catalogue.</p>
                <button 
                  onClick={closeCart}
                  className="mt-6 rounded-xl bg-[#2F6F57] px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-[#1F4D3B] transition-colors"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-[#E2DDD4] bg-white">
                    <Image
                      src={item.imageUrl || "/images/product-placeholder.png"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between">
                        <Link href={`/shop/${item.id}`} className="font-bold text-[#1F3D2B] hover:text-[#2F6F57] line-clamp-1">
                          {item.name}
                        </Link>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-[#8C6A5A] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-[#6B665D] mt-1">{item.protocolTier || "Standard Regimen"}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                       <div className="flex items-center rounded-lg border border-[#E2DDD4] bg-white">
                         <button 
                           onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                           className="p-1.5 text-[#6B665D] hover:text-[#1F3D2B]"
                         >
                           <Minus className="h-3 w-3" />
                         </button>
                         <span className="w-8 text-center text-sm font-semibold text-[#1F3D2B]">{item.quantity}</span>
                         <button 
                           onClick={() => updateQty(item.id, item.quantity + 1)}
                           className="p-1.5 text-[#6B665D] hover:text-[#1F3D2B]"
                         >
                           <Plus className="h-3 w-3" />
                         </button>
                       </div>
                       <span className="font-bold text-[#1F3D2B]">{formatINR(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="border-t border-[#E2DDD4] bg-white p-6 shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
              {activeReward && (
                <div className={`mb-5 rounded-2xl border px-4 py-4 text-sm shadow-sm transition-colors ${
                  isExpiringSoon 
                    ? "border-[#E85D4E]/30 bg-[#FFF5F3] text-[#A63C31]" 
                    : "border-[#C8DACF] bg-[#E8EFEA] text-[#1F3D2B]"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] ${isExpiringSoon ? "text-[#E85D4E]" : "text-[#2F6F57]"}`}>
                      {isExpiringSoon ? "⚠️ Expiring Soon" : "✨ Active Reward"}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isExpiringSoon ? "bg-[#E85D4E]/10" : "bg-white/50"}`}>
                      {getRewardCountdownLabel(activeReward.expiresAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-base leading-tight">Your {activeReward.discountPercent}% OFF</p>
                      <p className={`mt-0.5 text-xs font-medium ${isExpiringSoon ? "text-[#A63C31]" : "text-[#6B665D]"}`}>
                        {isExpiringSoon ? "Use in the next 2h or it expires." : "Auto-applies at checkout."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-[#6B665D]">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#6B665D]">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : formatINR(shipping)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1F3D2B] pt-3 border-t border-[#E2DDD4]">
                  <span>Total</span>
                  <span>{formatINR(total)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Link 
                  href="/checkout"
                  onClick={closeCart}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] ${
                    activeReward ? "bg-gradient-to-r from-[#1A3626] to-[#2F6F57] hover:shadow-[0_8px_30px_rgba(47,111,87,0.3)]" : "bg-[#1F3D2B] hover:bg-[#2A5239]"
                  }`}
                >
                  {activeReward ? (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Apply Reward Now
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Proceed to Checkout
                    </>
                  )}
                </Link>
                <p className="text-center text-[10px] text-[#6B665D]">
                  Secure checkout powered by Stripe. 30-day money-back guarantee.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
