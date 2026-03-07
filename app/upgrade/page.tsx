"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Crown, Sparkles, TrendingUp } from "lucide-react";

type Tier = {
  name: string;
  price: string;
  subtitle: string;
  aiCost: string;
  profit: string;
  recommended?: boolean;
  features: string[];
  limitations?: string[];
};

const tiers: Tier[] = [
  {
    name: "Basic",
    price: "₹0/month",
    subtitle: "Free",
    aiCost: "No AI cost",
    profit: "Top of funnel",
    features: [
      "Limited reports",
      "20% redemption cap",
      "2 scans/month",
      "Basic scoring",
    ],
    limitations: ["Upgrade for detailed analytics and higher scan limits"],
  },
  {
    name: "Plus",
    price: "₹199/month",
    subtitle: "Balanced growth",
    aiCost: "Minimal infra cost",
    profit: "High-margin",
    recommended: true,
    features: [
      "5 scans/month",
      "Detailed reports",
      "25% redemption cap",
      "Streak multiplier 1.2x",
      "Progress analytics",
    ],
  },
  {
    name: "Pro",
    price: "₹399/month",
    subtitle: "Premium affordable",
    aiCost: "Minimal infra cost",
    profit: "High-margin",
    features: [
      "Unlimited scans",
      "Advanced report breakdown",
      "30% redemption cap",
      "Streak multiplier 1.5x",
      "Faster recovery projections",
      "Exclusive premium bundle access",
    ],
  },
];

const profitStrategies = [
  "Affiliate revenue via Amazon, Flipkart, Nykaa product links",
  "Upsell premium tiers with free trial to paid conversion",
  "Gamification with streaks and challenges for retention",
  "Corporate tie-ups with salons, dermatologists, and brands",
];

export default function UpgradePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#030917] text-white pb-28">
      <main className="max-w-7xl mx-auto px-4 pt-24 space-y-10">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_12px_30px_rgba(2,6,23,0.22)]">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-blue-300 mb-4">
            <Sparkles className="w-4 h-4" /> Subscription Plans
          </p>
          <h1 className="text-[2rem] md:text-[2.25rem] font-semibold leading-tight">Upgrade Your Alpha Focus Experience</h1>
          <p className="mt-3 text-gray-300 max-w-3xl">
            Smart Indian 3-tier model optimized for conversion and retention.
          </p>
        </section>

        <section className="grid lg:grid-cols-3 gap-4">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`rounded-2xl border p-5 bg-white/[0.03] shadow-[0_10px_24px_rgba(2,6,23,0.2)] ${
                tier.recommended ? "border-blue-400/40" : "border-white/10"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-white">{tier.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{tier.subtitle}</p>
                </div>
                {tier.recommended && (
                  <span className="text-[11px] px-2 py-1 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-200">Most Popular</span>
                )}
              </div>

              <p className="text-2xl font-bold mt-4 text-white">{tier.price}</p>
              <p className="text-xs text-gray-400 mt-2">AI Cost: {tier.aiCost}</p>
              <p className="text-xs text-blue-300 mt-1">Profit: {tier.profit}</p>

              <ul className="mt-4 space-y-2 text-sm text-gray-200">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-300 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.limitations && (
                <ul className="mt-3 space-y-1 text-xs text-gray-400 list-disc pl-5">
                  {tier.limitations.map((limit) => (
                    <li key={limit}>{limit}</li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => router.push(tier.name === "Basic" ? "/" : "/settings")}
                className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                  tier.recommended
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white"
                }`}
              >
                {tier.name === "Basic" ? "Continue Free" : `Choose ${tier.name}`}
              </button>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_24px_rgba(2,6,23,0.2)]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-300" />
            <h2 className="text-2xl font-semibold">Profit Strategy</h2>
          </div>
          <ul className="space-y-2 text-sm text-gray-200">
            {profitStrategies.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Free Trial Conversion Strategy</h3>
            <p className="text-sm text-blue-100/80 mt-1">Start users on Free, nudge with results proof, and convert into Premium/Pro in 7–14 days.</p>
          </div>
          <button onClick={() => router.push("/image-analyzer")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
            <Crown className="w-4 h-4" />
            Start Free Trial Flow
          </button>
        </section>
      </main>
    </div>
  );
}
