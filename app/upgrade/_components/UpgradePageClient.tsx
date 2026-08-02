"use client";

import { useState } from "react";
import Script from "next/script";
import { AlertCircle, CheckCircle2, Crown, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import type { PlanId } from "@/lib/server/entitlements";
import Button from "@/components/ui/Button";
import StatChip from "@/components/ui/StatChip";

type Tier = {
  id: PlanId;
  name: string;
  price: string;
  subtitle: string;
  features: string[];
  spotlight?: boolean;
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
    spotlight: true,
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
        <main className="max-w-7xl mx-auto px-4 pt-8 md:pt-12 space-y-8">
          <section className="af-hero-dark p-8 md:p-10">
            <span className="af-page-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Subscription Plans
            </span>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold leading-tight text-white">
              Upgrade your Alpha Focus experience
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#b7c4d7]">
              Unlimited scans, deeper protocol reports, and priority AI processing. Sandbox pricing shown for testing — final pricing will be confirmed before launch.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <StatChip icon={<ShieldCheck className="h-4 w-4" />} value="Cancel anytime" label="No lock-in on monthly" />
              <StatChip icon={<Zap className="h-4 w-4" />} value="Instant activation" label="Applied right after checkout" />
            </div>

            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
                <AlertCircle className="h-4 w-4 shrink-0 text-[var(--warning-accent)]" />
                {error}
              </div>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {TIERS.map((tier) => {
              const isCurrent = tier.id === currentPlan;
              const isFree = tier.id === "free";

              return (
                <article
                  key={tier.id}
                  className={tier.spotlight ? "af-hero-dark relative p-6" : "af-surface-card relative p-6"}
                >
                  {tier.spotlight && (
                    <span className="absolute -top-3 left-6 rounded-full bg-[var(--accent-green)] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--ink)]">
                      Most Popular
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-lg font-semibold ${tier.spotlight ? "text-white" : "text-[var(--ink)]"}`}>{tier.name}</p>
                      <p className={`mt-1 text-xs ${tier.spotlight ? "text-[#b7c4d7]" : "text-[var(--ink-soft)]"}`}>{tier.subtitle}</p>
                    </div>
                    {isCurrent && (
                      <span className="rounded-full border border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/10 px-2 py-1 text-[11px] font-semibold text-[var(--link-blue-dark)]">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <p className={`mt-4 text-2xl font-bold ${tier.spotlight ? "text-white" : "text-[var(--ink)]"}`}>{tier.price}</p>

                  <ul className={`mt-4 space-y-2 text-sm ${tier.spotlight ? "text-white" : "text-[var(--ink)]"}`}>
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${tier.spotlight ? "text-[var(--accent-green)]" : "text-[var(--accent-blue)]"}`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleChoosePlan(tier.id)}
                    disabled={isFree || isCurrent || loadingPlan !== null}
                    variant={tier.spotlight ? "accent" : "outline"}
                    className="mt-5 w-full justify-center disabled:opacity-60"
                  >
                    {isCurrent ? "Current Plan" : isFree ? "Free" : loadingPlan === tier.id ? "Starting checkout..." : `Choose ${tier.name}`}
                  </Button>
                </article>
              );
            })}
          </section>

          <section className="af-surface-card flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
            <div>
              <h3 className="text-lg font-semibold text-[var(--ink)]">Try before you commit</h3>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">Start on Free, see your results, upgrade whenever you&apos;re ready.</p>
            </div>
            <Button href="/image-analyzer" variant="primary">
              <Crown className="h-4 w-4" />
              Start Free Trial Flow
            </Button>
          </section>
        </main>
      </div>
    </>
  );
}
