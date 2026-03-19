"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#030917] text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-gray-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-300 mx-auto mb-4 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h1 className="text-clinical-heading text-2xl font-extrabold tracking-tight mb-2">Checkout Coming Soon</h1>
          <p className="mb-6 text-zinc-300">Your cart integration point is ready. Connect payment and order APIs to complete this flow.</p>
          <button onClick={() => router.push("/result")} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold">
            Return to Report
          </button>
        </div>
      </div>
    </div>
  );
}
