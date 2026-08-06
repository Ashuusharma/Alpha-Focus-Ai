"use client";

import Link from "next/link";
import { ShieldCheck, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cartStore";

// Product checkout isn't wired to a real payment provider yet (unlike
// /upgrade's subscription checkout, which genuinely runs through Cashfree).
// The catalog's own data model (shopifyHandle on every product) points at
// Shopify as the intended real backend, currently a long-term roadmap item —
// see Phase 9S.1. Rather than show card-number/CVC fields that silently
// discard input, this page states that plainly. No cart/product/Shopify-
// oriented code is touched by this change.
export default function CheckoutPage() {
  const { items } = useCartStore();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="af-page-shell min-h-screen flex items-center justify-center px-4 py-16">
      <div className="af-card-primary w-full max-w-lg space-y-5 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--tint-neutral)] text-[var(--accent-blue)]">
          <ShoppingBag className="h-7 w-7" />
        </div>
        <h1 className="text-clinical-heading text-2xl font-extrabold tracking-tight md:text-3xl">
          Product checkout is not available during the beta
        </h1>
        <p className="text-sm leading-7 text-[var(--ink-soft)]">
          {itemCount > 0
            ? `Your cart is saved (${itemCount} item${itemCount === 1 ? "" : "s"}) — nothing is lost. We're not able to process product payments yet, so there's nothing to complete here right now.`
            : "We're not able to process product payments yet, so there's nothing to complete here right now."}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--ink-soft)]">
          <ShieldCheck className="h-4 w-4 text-[var(--accent-blue)]" />
          Your recovery protocol, scans, and progress tracking are unaffected.
        </div>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard" className="af-btn-primary px-5 py-3 text-sm">
            Back to Dashboard
          </Link>
          <Link href="/shop" className="af-btn-outline px-5 py-3 text-sm">
            Continue Browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
