"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const router = useRouter();

  return (
    <div className="af-page-shell min-h-screen text-[#1F3D2B] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-[#6B665D] hover:text-[#1F3D2B]">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="af-surface-card p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#E8EFEA] text-[#2F6F57] mx-auto mb-4 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h1 className="text-clinical-heading text-2xl font-extrabold tracking-tight mb-2">Checkout Coming Soon</h1>
          <p className="mb-6 text-[#6B665D]">Your cart integration point is ready. Connect payment and order APIs to complete this flow.</p>
          <button onClick={() => router.push("/result")} className="px-4 py-2 rounded-xl bg-[#2F6F57] hover:bg-[#275c48] text-sm font-semibold text-white shadow-[0_14px_28px_rgba(47,111,87,0.18)]">
            Return to Report
          </button>
        </div>
      </div>
    </div>
  );
}
