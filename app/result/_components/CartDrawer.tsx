"use client";

import React from "react";
import { useMounted } from "@/app/hooks/useMounted";
import { useCartStore } from "@/lib/cartStore";

export default function CartDrawer({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const mounted = useMounted();
  const { items, isOpen, closeCart } = useCartStore();

  const isControlled = typeof open === "boolean";
  const drawerOpen = isControlled ? !!open : isOpen;
  const handleClose = onClose ?? closeCart;

  if (!mounted) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={handleClose}
      />

      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-xl transform transition-transform duration-300 z-50 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Cart</h3>
          <button onClick={handleClose} aria-label="Close cart" className="p-2 rounded-md hover:bg-blue-100">
            ✕
          </button>
        </div>

        <div className="p-4 overflow-auto h-[calc(100%-64px)]">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">Your saved products will appear here.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-blue-50 rounded">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.quantity} unit{item.quantity > 1 ? 's' : ''}</div>
                  </div>
                  <div className="font-semibold">₹{item.price * item.quantity}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
