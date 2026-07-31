"use client";

import { useState } from "react";
import Script from "next/script";
import { CheckCircle2, Crown, Sparkles } from "lucide-react";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import type { PlanId } from "@/lib/server/entitlements";

type Tier = {
  id: PlanId;
  name: string;
  price: string;
  subtitle: string;
  features: string[];
};

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: "Rs 0/month",
    subtitle: "Get started",
    features: ["2 scans/month", "Basic scoring", "Core routine guidance"],
  },
  {
    id: "premium_monthly",
    name: "Premium Monthly",
    price: "Rs 199/month",
    subtitle: "Billed monthly",
    features: ["Unlimited scans", "Detailed protocol reports", "Progress analytics", "Priority AI processing"],
  },
  {
    id: "premium_yearly",
    name: "Premium Yearly",
    price: "Rs 1,999/year",
    subtitle: "Save vs. monthly",
    features: ["Everything in Premium Monthly", "2 months free vs. monthly billing", "Locked-in annual price"],
  },
];

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget: string }) => void;
    };
  }
}

export default function UpgradePageClient({ currentPlan }: { currentPlan: PlanId }) {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const handleChoosePlan = async (planId: PlanId) => {
    if (planId === "free" || planId === currentPlan) return;
    if (!sdkReady || !window.Cashfree) {
      setError("Payment SDK is still loading — please try again in a moment.");
      return;
    }

    setError(null);
    setLoadingPlan(planId);

    try {
      const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/billing/create-order", {
        method: "POST",
        headers,
        body: JSON.stringify({ plan: planId }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok || !data.paymentSessionId) {
        throw new Error(data.error || "Could not start checkout.");
      }

      const cashfree = window.Cashfree({ mode: "sandbox" });
      cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" onLoad={() => setSdkReady(true)} />

      <div className="af-page pb-28">
        <main className="max-w-7xl mx-auto px-4 pt-24 space-y-10">
          <section className="af-card p-8">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider af-accent mb-4">
              <Sparkles className="w-4 h-4" /> Subscription Plans
            </p>
            <h1 className="text-[2rem] md:text-[2.25rem] font-semibold leading-tight">Upgrade Your Alpha Focus Experience</h1>
            <p className="mt-3 af-muted max-w-3xl">
              Sandbox pricing shown for testing — final pricing will be confirmed before launch.
            </p>
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </section>

          <section className="grid lg:grid-cols-3 gap-4">
            {TIERS.map((tier) => {
              const isCurrent = tier.id === currentPlan;
              const isFree = tier.id === "free";

              return (
                <article
                  key={tier.id}
                  className={`af-card p-5 ${tier.id === "premium_monthly" ? "border-[#0071e3]" : "border-[#d9d9de]"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[#1d1d1f]">{tier.name}</p>
                      <p className="text-xs af-muted mt-1">{tier.subtitle}</p>
                    </div>
                    {isCurrent && (
                      <span className="text-[11px] px-2 py-1 rounded-full border border-[#0071e3]/30 bg-[#E8F4EE] text-[#0071e3]">Current Plan</span>
                    )}
                  </div>

                  <p className="text-2xl font-bold mt-4 text-[#1d1d1f]">{tier.price}</p>

                  <ul className="mt-4 space-y-2 text-sm text-[#1d1d1f]">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#0071e3] mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleChoosePlan(tier.id)}
                    disabled={isFree || isCurrent || loadingPlan !== null}
                    className={`mt-5 w-full py-2.5 text-sm transition-colors disabled:opacity-60 ${
                      tier.id === "premium_monthly" ? "af-btn-primary" : "af-btn-soft"
                    }`}
                  >
                    {isCurrent ? "Current Plan" : isFree ? "Free" : loadingPlan === tier.id ? "Starting checkout..." : `Choose ${tier.name}`}
                  </button>
                </article>
              );
            })}
          </section>

          <section className="af-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Free Trial Conversion Strategy</h3>
              <p className="text-sm af-muted mt-1">Start on Free, see your results, upgrade whenever you're ready.</p>
            </div>
            <a href="/image-analyzer" className="inline-flex items-center gap-2 af-btn-primary px-5 py-2.5 text-sm">
              <Crown className="w-4 h-4" />
              Start Free Trial Flow
            </a>
          </section>
        </main>
      </div>
    </>
  );
}
