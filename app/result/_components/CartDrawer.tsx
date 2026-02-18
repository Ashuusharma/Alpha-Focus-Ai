"use client";

import React, { useRef } from "react";
import { useMounted } from "@/app/hooks/useMounted";
import { useCartStore } from "@/lib/cartStore";
import { useRewardsStore } from "@/lib/rewardsStore";
import { useToast } from "@/app/toast/ToastContext";
import { useRouter } from "next/navigation";

export default function CartDrawer({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const mounted = useMounted();
  const router = useRouter();
  const { items, isOpen, closeCart, removeItem, updateQty, totalPrice } = useCartStore();
  const activeDiscount = useRewardsStore((s) => s.activeDiscount);
  const getDiscountAmount = useRewardsStore((s) => s.getDiscountAmount);
  const getPayableTotal = useRewardsStore((s) => s.getPayableTotal);
  const { showToast } = useToast();

  const isControlled = typeof open === "boolean";
  const drawerOpen = isControlled ? !!open : isOpen;
  const handleClose = onClose ?? closeCart;

  const drawerRef = useRef<HTMLDivElement>(null);
  // Touch gesture state
  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  // Handle touch start
  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchCurrentX.current = e.touches[0].clientX;
    }
  }
  // Handle touch move
  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current !== null && e.touches.length === 1) {
      touchCurrentX.current = e.touches[0].clientX;
      // Optionally, you can add visual feedback here
    }
  }
  // Handle touch end (swipe right to close)
  function handleTouchEnd() {
    if (
      touchStartX.current !== null &&
      touchCurrentX.current !== null &&
      touchCurrentX.current - touchStartX.current > 60 // swipe right threshold
    ) {
      handleClose();
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  }

  if (!mounted) return null;

  const subtotal = totalPrice();
  const discountAmount = getDiscountAmount(subtotal);
  const payableTotal = getPayableTotal(subtotal);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed inset-y-0 right-0 w-80 max-w-full sm:w-80 bg-white shadow-2xl transform transition-transform duration-500 z-50 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ willChange: 'transform', color: '#111' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-extrabold text-onyx text-xl tracking-tight drop-shadow">Cart</h3>
          <button onClick={handleClose} aria-label="Close cart" className="p-2 rounded-full hover:bg-mist transition text-onyx text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-accent">
            ✕
          </button>
        </div>

        <div className="p-4 overflow-auto h-[calc(100%-128px)]">
          {items.length === 0 ? (
            <p className="text-sm text-mist">Your saved products will appear here.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-mist rounded-2xl group transition shadow shadow-accent/10">
                  <div>
                    <div className="font-medium text-onyx">{item.name}</div>
                    <div className="text-xs text-ocean/60">{item.quantity} unit{item.quantity > 1 ? 's' : ''}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        aria-label="Decrease quantity"
                        className="px-2 py-1 rounded-xl bg-accent/20 hover:bg-accent/50 text-accent font-extrabold transition focus:outline-none focus:ring-2 focus:ring-accent"
                        onClick={() => {
                          updateQty(item.id, item.quantity - 1);
                          showToast("Quantity decreased", "info");
                        }}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="px-2 font-semibold text-onyx text-base">{item.quantity}</span>
                      <button
                        aria-label="Increase quantity"
                        className="px-2 py-1 rounded-xl bg-accent/20 hover:bg-accent/50 text-accent font-extrabold transition focus:outline-none focus:ring-2 focus:ring-accent"
                        onClick={() => {
                          updateQty(item.id, item.quantity + 1);
                          showToast("Quantity increased", "info");
                        }}
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ocean">₹{item.price * item.quantity}</span>
                      <button
                        aria-label="Remove item"
                        className="ml-2 text-xs text-accent hover:underline transition font-extrabold"
                        onClick={() => {
                          removeItem(item.id);
                          showToast("Item removed from cart", "error");
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="p-4 flex flex-col gap-3 bg-white sticky bottom-0 shadow-inner rounded-b-2xl">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-lg text-onyx drop-shadow">Subtotal</span>
            <span className="font-extrabold text-ocean text-xl drop-shadow">₹{subtotal}</span>
          </div>
          {activeDiscount && discountAmount > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-emerald-700">Discount ({activeDiscount.discountPercent}% • {activeDiscount.code})</span>
                <span className="font-bold text-emerald-700">-₹{discountAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-lg text-onyx drop-shadow">Total</span>
                <span className="font-extrabold text-accent text-xl drop-shadow">₹{payableTotal}</span>
              </div>
            </>
          )}
          {(!activeDiscount || discountAmount <= 0) && (
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-lg text-onyx drop-shadow">Total</span>
              <span className="font-extrabold text-accent text-xl drop-shadow">₹{subtotal}</span>
            </div>
          )}
          <button
            className="w-full py-3 mt-2 bg-gradient-to-r from-accent to-ocean text-white font-extrabold rounded-xl hover:from-accent/80 hover:to-ocean/80 transition text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            onClick={() => {
              // Redirect to main website cart page
              router.push("/cart");
              handleClose();
            }}
            disabled={items.length === 0}
          >
            Go to Checkout
          </button>
        </div>
      </div>
    </>
  );
}
