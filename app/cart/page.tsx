"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export default function CartPage() {
  const router = useRouter();

  return (
    <div className="af-page-shell min-h-screen px-4 py-8 text-[#1F3D2B] md:px-6 md:py-10">
      <div className="mx-auto max-w-5xl af-section-grid">
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-[#6B665D] hover:text-[#1F3D2B]">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <section className="af-page-hero p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="af-badge-row">
                <span className="af-badge-chip text-[#2F6F57]">Cart checkpoint</span>
                <span className="af-badge-chip text-[#A46A2D]">Ready for checkout</span>
              </div>
              <h1 className="text-clinical-heading text-3xl font-extrabold tracking-tight md:text-4xl">Review your regimen before secure payment.</h1>
              <p className="max-w-xl text-sm leading-7 text-[#6B665D]">This page is the handoff between recommendations and payment. Use it to confirm your routine stack, then continue to checkout where discounts and guarantees are already surfaced.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => router.push("/checkout")} className="af-btn-primary px-5 py-3 text-sm">
                  Continue to checkout
                </button>
                <button onClick={() => router.push("/shop")} className="af-btn-outline px-5 py-3 text-sm">
                  Add more products
                </button>
              </div>
            </div>

            <div className="af-card-secondary p-5 md:min-w-[280px]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EFEA] text-[#2F6F57]">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Purchase flow</p>
                  <p className="mt-1 text-lg font-bold text-[#1F3D2B]">Cart to checkout</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-[#5F5A51]">
                <div className="af-card-subtle px-4 py-3">Discounts and Alpha rewards are applied inside checkout automatically.</div>
                <div className="af-card-subtle px-4 py-3">Shipping, payment, and guarantee messaging are already structured for trust.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="af-card-secondary p-5">
            <div className="mb-3 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#2F6F57]" />
              <p className="text-sm font-bold text-[#1F3D2B]">Secure checkout</p>
            </div>
            <p className="text-sm leading-6 text-[#6B665D]">Encrypted checkout with guarantee and trust messaging carried through the purchase step.</p>
          </div>
          <div className="af-card-secondary p-5">
            <div className="mb-3 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#A46A2D]" />
              <p className="text-sm font-bold text-[#1F3D2B]">Routine-linked buying</p>
            </div>
            <p className="text-sm leading-6 text-[#6B665D]">The purchase flow is tied to your regimen, not generic catalog browsing.</p>
          </div>
          <div className="af-card-secondary p-5">
            <div className="mb-3 flex items-center gap-3">
              <ArrowRight className="h-5 w-5 text-[#B16035]" />
              <p className="text-sm font-bold text-[#1F3D2B]">Next action</p>
            </div>
            <p className="text-sm leading-6 text-[#6B665D]">Continue to checkout for payment, coupons, active rewards, and shipping selection.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
