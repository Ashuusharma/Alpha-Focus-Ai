"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, CheckCircle2, ShieldCheck, ShoppingCart } from "lucide-react";
import { useClinicalProfile } from "@/hooks/useClinicalProfile";
import { useCartStore } from "@/lib/cartStore";
import { findProductCatalogItemByName } from "@/lib/productCatalogData";

function formatDate(iso?: string) {
  if (!iso) return "Not available";
  const date = new Date(iso);
  return date.toLocaleDateString();
}

function formatDateTime(iso?: string) {
  if (!iso) return "Not available";
  const date = new Date(iso);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

function getSeverityLabel(score: number) {
  if (score >= 75) return "High";
  if (score >= 45) return "Moderate";
  return "Low";
}

function getRecoveryRisk(score: number) {
  if (score >= 75) return "Elevated risk of progression and visible density decline within 6-8 weeks.";
  if (score >= 45) return "Moderate escalation risk if protocol adherence drops below baseline.";
  return "Low escalation risk; maintain consistency to prevent regression.";
}

function buildConcernList(answers: Record<string, string>) {
  const entries = Object.entries(answers);
  const concerns = entries.filter(([key]) => key.includes("concern") || key.includes("issue"));
  const goals = entries.filter(([key]) => key.includes("goal"));
  return {
    primary: concerns[0]?.[1] || goals[0]?.[1] || "General optimization",
    secondary: concerns[1]?.[1] || goals[1]?.[1] || "Barrier resilience",
  };
}

function buildRootCausePanels(severity: number, signals: { sleepScore?: number; hydrationLevel?: number; stressLevel?: number; uvIndex?: number; routineAdherence?: number; }) {
  const biological = [
    { label: "Follicle sensitivity", weight: Math.min(55, Math.round(30 + severity * 0.4)) },
    { label: "Barrier disruption", weight: Math.min(40, Math.round(20 + severity * 0.25)) },
    { label: "Inflammatory load", weight: Math.min(35, Math.round(18 + severity * 0.2)) },
  ];

  const behavioral = [
    { label: "Routine inconsistency", weight: Math.min(45, Math.round(10 + (100 - (signals.routineAdherence || 0)) * 0.35)) },
    { label: "Sleep quality", weight: Math.min(35, Math.round(12 + (100 - (signals.sleepScore || 55)) * 0.2)) },
    { label: "Hydration intake", weight: Math.min(30, Math.round(10 + (100 - (signals.hydrationLevel || 55)) * 0.2)) },
  ];

  const environmental = [
    { label: "UV exposure", weight: Math.min(30, Math.round(8 + (signals.uvIndex || 4) * 3)) },
    { label: "Stress load", weight: Math.min(35, Math.round(10 + (signals.stressLevel || 55) * 0.18)) },
    { label: "Urban pollutants", weight: 22 },
  ];

  return { biological, behavioral, environmental };
}

function buildIngredientTable(primaryConcern: string) {
  const normalized = primaryConcern.toLowerCase();
  if (/(hair|shed|thin|density)/.test(normalized)) {
    return [
      { ingredient: "Caffeine", mechanism: "Boosts follicle circulation", evidence: "High", usage: "Daily scalp serum", notes: "Safe with minoxidil" },
      { ingredient: "Niacinamide", mechanism: "Calms inflammation", evidence: "Moderate", usage: "Night serum", notes: "Compatible with retinoids" },
      { ingredient: "Ketoconazole", mechanism: "Reduces scalp irritation", evidence: "High", usage: "2-3x weekly shampoo", notes: "Avoid over-drying" },
    ];
  }

  if (/(acne|breakout|oil|skin)/.test(normalized)) {
    return [
      { ingredient: "Salicylic Acid", mechanism: "Clears pore buildup", evidence: "High", usage: "2-3x weekly", notes: "Avoid pairing with strong retinoids" },
      { ingredient: "Niacinamide", mechanism: "Balances oil & redness", evidence: "High", usage: "Daily", notes: "Layer before moisturizer" },
      { ingredient: "Azelaic Acid", mechanism: "Refines tone & texture", evidence: "Moderate", usage: "Night serum", notes: "Patch test first" },
    ];
  }

  return [
    { ingredient: "Peptides", mechanism: "Supports repair", evidence: "Moderate", usage: "Daily serum", notes: "Compatible with vitamin C" },
    { ingredient: "Hyaluronic Acid", mechanism: "Hydration binding", evidence: "High", usage: "Daily", notes: "Seal with moisturizer" },
    { ingredient: "Ceramides", mechanism: "Barrier recovery", evidence: "High", usage: "Night moisturizer", notes: "Pairs with retinol" },
  ];
}

function buildProductGrid(primaryConcern: string, confidence: number) {
  const normalized = primaryConcern.toLowerCase();
  const baseScore = Math.min(95, Math.max(70, Math.round(confidence + 8)));

  const items = /(hair|shed|thin|density)/.test(normalized)
    ? [
        { name: "Caffeine Scalp Tonic", driver: "Follicle stimulation", benefit: "Reduced shedding", justification: "Targets circulation + inflammation" },
        { name: "Ketoconazole Cleanse", driver: "Scalp irritation", benefit: "Calmer scalp", justification: "Controls microbial stress" },
        { name: "Protein Recovery Mask", driver: "Shaft strength", benefit: "Improved resilience", justification: "Reinforces weakened strands" },
      ]
    : [
        { name: "Barrier Repair Serum", driver: "Inflammation control", benefit: "Reduced redness", justification: "Supports low-irritation recovery" },
        { name: "Clarifying Cleanser", driver: "Oil balance", benefit: "Less congestion", justification: "Resets sebum + debris" },
        { name: "Daily Defense SPF", driver: "UV protection", benefit: "Prevents relapse", justification: "Protects recovery gains" },
      ];

  return items.map((item, index) => {
    const catalog = findProductCatalogItemByName(item.name);
    return {
      ...item,
      match: Math.max(60, baseScore - index * 6),
      window: `${4 + index * 2}-${8 + index * 2} weeks`,
      imageUrl: catalog?.imageUrl || "/images/report-fallback.svg",
      buyUrl: catalog?.buyUrl || "/shop",
      price: 24 + index * 4,
      sku: catalog?.sku || item.name.toLowerCase().replace(/\s+/g, "-"),
    };
  });
}

export default function ResultPage() {
  const { clinicalProfile } = useClinicalProfile();
  const addItem = useCartStore((s) => s.addItem);

  const primaryConcern = useMemo(() => {
    if (!clinicalProfile?.assessment?.answers) return "General optimization";
    return buildConcernList(clinicalProfile.assessment.answers).primary;
  }, [clinicalProfile]);

  if (!clinicalProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F4EFE6] via-[#EFE8DD] to-[#E5E0D4] flex items-center justify-center px-8">
        <div className="max-w-xl w-full bg-white rounded-2xl border border-[#E2DDD3] p-6 text-center">
          <p className="text-sm text-[#6B665D]">No clinical data found yet.</p>
        </div>
      </div>
    );
  }

  const { metrics, signals, projections, photoAnalysis, history, rewards } = clinicalProfile;
  const concerns = buildConcernList(clinicalProfile.assessment?.answers || {});
  const severityLabel = getSeverityLabel(metrics.severityIndex);
  const rootCausePanels = buildRootCausePanels(metrics.severityIndex, signals);
  const ingredientTable = buildIngredientTable(concerns.primary);
  const products = buildProductGrid(concerns.primary, metrics.confidenceScore);
  const reassessDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EFE6] via-[#EFE8DD] to-[#E5E0D4] text-[#1F3D2B]">
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6 md:space-y-10">
        {/* REPORT HEADER */}
        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-5 md:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8C867D]">AI Dermatology Clinical Report</p>
              <h1 className="text-2xl md:text-3xl font-bold">Patient: {clinicalProfile.userName || "Guest"}</h1>
              <div className="text-sm text-[#6B665D] space-y-1">
                <p>Report ID: {clinicalProfile.userId}-{metrics.alphaScore}</p>
                <p>Date: {formatDate(clinicalProfile.lastUpdated)}</p>
                <p>Last Updated: {formatDateTime(clinicalProfile.lastUpdated)}</p>
              </div>
              <p className="text-xs text-[#6B665D]">Generated using Alpha Focus Clinical Intelligence Engine</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 w-full lg:w-auto min-w-[260px]">
              <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
                <p className="text-[11px] uppercase tracking-wider text-[#6B665D]">Alpha Score</p>
                <p className="text-2xl font-bold">{metrics.alphaScore}</p>
              </div>
              <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
                <p className="text-[11px] uppercase tracking-wider text-[#6B665D]">Severity Index</p>
                <p className="text-2xl font-bold">{metrics.severityIndex}</p>
              </div>
              <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
                <p className="text-[11px] uppercase tracking-wider text-[#6B665D]">Confidence</p>
                <p className="text-2xl font-bold">{metrics.confidenceScore}%</p>
              </div>
              <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
                <p className="text-[11px] uppercase tracking-wider text-[#6B665D]">Recovery</p>
                <p className="text-2xl font-bold">{metrics.recoveryProbability}%</p>
              </div>
            </div>
          </div>
        </section>

        {/* EXECUTIVE SUMMARY */}
        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-5 md:p-8 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">Executive Clinical Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><span className="font-semibold">Primary Concern:</span> {concerns.primary}</p>
              <p><span className="font-semibold">Secondary Concern:</span> {concerns.secondary}</p>
              <p><span className="font-semibold">Severity Classification:</span> {severityLabel}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-semibold">Confidence Level:</span> {metrics.confidenceScore}%</p>
              <p><span className="font-semibold">Estimated Recovery Timeline:</span> {projections.estimatedWeeksToImprove} weeks</p>
              <p><span className="font-semibold">Risk If Untreated:</span> {getRecoveryRisk(metrics.severityIndex)}</p>
            </div>
          </div>
          <p className="text-sm text-[#6B665D] leading-relaxed">
            Your clinical profile indicates a {severityLabel.toLowerCase()} severity pattern with the highest signal weight coming from
            combined assessment responses and routine adherence patterns. The clinical engine projects measurable improvement within
            the next {projections.estimatedWeeksToImprove} weeks if daily protocol adherence remains consistent and environmental stressors
            are managed proactively.
          </p>
        </section>

        {/* CLINICAL METRICS TABLE */}
        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-5 md:p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Clinical Metrics Table</h2>
          <div className="overflow-x-auto -mx-5 md:mx-0 px-5 md:px-0">
            <table className="w-full text-sm border-collapse min-w-[600px]">
              <thead className="text-left text-xs uppercase tracking-wider text-[#6B665D]">
                <tr>
                  <th className="py-2">Category</th>
                  <th className="py-2">Severity</th>
                  <th className="py-2">Confidence</th>
                  <th className="py-2">Evidence Points</th>
                  <th className="py-2">Signal Source</th>
                </tr>
              </thead>
              <tbody className="text-[#1F3D2B]">
                <tr className="border-t border-[#E2DDD3]">
                  <td className="py-3">Hair Density</td>
                  <td className="py-3">{photoAnalysis?.densityScore ?? "-"}</td>
                  <td className="py-3">{metrics.confidenceScore}%</td>
                  <td className="py-3">Photo scan + assessment</td>
                  <td className="py-3">Photo analysis</td>
                </tr>
                <tr className="border-t border-[#E2DDD3]">
                  <td className="py-3">Inflammation Index</td>
                  <td className="py-3">{photoAnalysis?.inflammationScore ?? "-"}</td>
                  <td className="py-3">{metrics.confidenceScore}%</td>
                  <td className="py-3">Scan signal + stress profile</td>
                  <td className="py-3">Photo + lifestyle</td>
                </tr>
                <tr className="border-t border-[#E2DDD3]">
                  <td className="py-3">Oil Balance</td>
                  <td className="py-3">{photoAnalysis?.oilBalanceScore ?? "-"}</td>
                  <td className="py-3">{metrics.confidenceScore}%</td>
                  <td className="py-3">Sebum and hydration pattern</td>
                  <td className="py-3">Photo + hydration logs</td>
                </tr>
                <tr className="border-t border-[#E2DDD3]">
                  <td className="py-3">Shedding Frequency</td>
                  <td className="py-3">{signals.stressLevel ? Math.max(10, Math.round(100 - signals.stressLevel)) : "-"}</td>
                  <td className="py-3">{metrics.confidenceScore}%</td>
                  <td className="py-3">Assessment response trend</td>
                  <td className="py-3">Assessment</td>
                </tr>
                <tr className="border-t border-[#E2DDD3]">
                  <td className="py-3">Scalp Irritation</td>
                  <td className="py-3">{signals.stressLevel ?? "-"}</td>
                  <td className="py-3">{metrics.confidenceScore}%</td>
                  <td className="py-3">Stress + routine adherence</td>
                  <td className="py-3">Lifestyle + routine</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ROOT CAUSE ANALYSIS */}
        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Root Cause Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
              <h3 className="font-semibold mb-3">A. Biological Drivers</h3>
              <div className="space-y-2">
                {rootCausePanels.biological.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
              <h3 className="font-semibold mb-3">B. Behavioral Contributors</h3>
              <div className="space-y-2">
                {rootCausePanels.behavioral.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
              <h3 className="font-semibold mb-3">C. Environmental Stressors</h3>
              <div className="space-y-2">
                {rootCausePanels.environmental.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TREATMENT PROTOCOL */}
        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Prescribed Treatment Protocol</h2>
          <div className="space-y-4 text-sm">
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
              <h3 className="font-semibold">Phase 1 – Stabilization (Week 1–2)</h3>
              <p className="text-[#6B665D]">Objective: reduce acute irritation and stabilize routine consistency.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Implement daily gentle cleansing + hydration.</li>
                <li>Introduce barrier-supporting actives at low frequency.</li>
                <li>Monitor stress and sleep recovery markers.</li>
              </ul>
              <p className="mt-2">Expected Outcome: visible reduction in flare-ups and improved scalp comfort.</p>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
              <h3 className="font-semibold">Phase 2 – Active Repair (Week 3–6)</h3>
              <p className="text-[#6B665D]">Objective: address core drivers and rebuild density/support.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Apply targeted active treatments based on clinical metrics.</li>
                <li>Strengthen adherence to AM/PM protocol.</li>
                <li>Weekly monitoring of progress photos.</li>
              </ul>
              <p className="mt-2">Expected Outcome: improved density markers and reduced inflammation index.</p>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
              <h3 className="font-semibold">Phase 3 – Maintenance (Week 7–12)</h3>
              <p className="text-[#6B665D]">Objective: maintain gains and prevent regression.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Lock in maintenance routine with weekly check-ins.</li>
                <li>Adjust protocol to seasonal changes or lifestyle shifts.</li>
                <li>Set next clinical review at {formatDate(reassessDate)}.</li>
              </ul>
              <p className="mt-2">Expected Outcome: stable improvement and reduced escalation risk.</p>
            </div>
          </div>
        </section>

        {/* INGREDIENT PRESCRIPTION */}
        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-5 md:p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Ingredient Prescription</h2>
          <div className="overflow-x-auto -mx-5 md:mx-0 px-5 md:px-0">
            <table className="w-full text-sm border-collapse min-w-[600px]">
              <thead className="text-left text-xs uppercase tracking-wider text-[#6B665D]">
                <tr>
                  <th className="py-2">Ingredient</th>
                  <th className="py-2">Mechanism of Action</th>
                  <th className="py-2">Evidence Level</th>
                  <th className="py-2">Recommended Usage</th>
                  <th className="py-2">Compatibility Notes</th>
                </tr>
              </thead>
              <tbody>
                {ingredientTable.map((row) => (
                  <tr key={row.ingredient} className="border-t border-[#E2DDD3]">
                    <td className="py-3 font-semibold">{row.ingredient}</td>
                    <td className="py-3">{row.mechanism}</td>
                    <td className="py-3">{row.evidence}</td>
                    <td className="py-3">{row.usage}</td>
                    <td className="py-3">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* PRODUCT RECOMMENDATIONS */}
        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Prescribed Regimen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {products.map((product) => (
              <div key={product.name} className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] overflow-hidden">
                <div className="relative h-40 bg-white">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-3 right-3 rounded-full bg-[#1F3D2B] px-2.5 py-1 text-xs font-semibold text-white">
                    {product.match}% Match
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-base">{product.name}</h3>
                    <span className="text-sm font-semibold text-[#2F6F57]">${product.price.toFixed(2)}</span>
                  </div>
                  <p><span className="font-semibold">Why:</span> {product.justification}</p>
                  <p><span className="font-semibold">Target Driver:</span> {product.driver}</p>
                  <p><span className="font-semibold">Expected Benefit Window:</span> {product.window}</p>
                  <p className="text-[#6B665D]">Clinical justification: {product.benefit}.</p>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => addItem({
                        id: product.sku,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        usageDays: 30,
                      })}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F3D2B] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2A5239]"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </button>
                    <Link
                      href={product.buyUrl}
                      className="inline-flex items-center justify-center rounded-xl border border-[#D9D2C7] px-3 py-2 text-xs font-semibold text-[#1F3D2B] hover:bg-white"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LIFESTYLE PRESCRIPTION */}
        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Lifestyle Prescription</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><span className="font-semibold">Sleep target:</span> 7.5–8 hours (impact {Math.round((signals.sleepScore || 55) * 0.2)}%)</p>
              <p><span className="font-semibold">Hydration target:</span> 2.7–3.2L (impact {Math.round((signals.hydrationLevel || 55) * 0.18)}%)</p>
              <p><span className="font-semibold">Stress management:</span> daily 10-minute reset (impact {Math.round((100 - (signals.stressLevel || 55)) * 0.2)}%)</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-semibold">Diet guidance:</span> high-protein, low glycemic load</p>
              <p><span className="font-semibold">Exercise frequency:</span> 3-4 sessions/week</p>
              <p><span className="font-semibold">Routine adherence target:</span> {signals.routineAdherence ?? 70}%</p>
            </div>
          </div>
        </section>

        {/* FOLLOW-UP */}
        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Follow-up & Reassessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-semibold">Recommended reassessment date:</span> {formatDate(reassessDate)}</p>
              <p><span className="font-semibold">Projected alpha score next check:</span> {Math.min(99, metrics.alphaScore + 6)}</p>
              <p><span className="font-semibold">Routine adherence target:</span> {signals.routineAdherence ?? 70}%</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#F8F6F3] border border-[#E2DDD3] flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#2F6F57]" />
              </div>
              <div>
                <p className="font-semibold">Reminder toggle</p>
                <p className="text-xs text-[#6B665D]">Enable reminders in Settings for automated check-ins.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ALPHA SIKKA & REWARDS */}
        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-5 md:p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Alpha Sikka & Reward Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
              <p className="text-xs uppercase tracking-wider text-[#6B665D]">Alpha Sikka</p>
              <p className="text-xl md:text-2xl font-semibold">{rewards?.alphaSikka ?? 0} A$</p>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
              <p className="text-xs uppercase tracking-wider text-[#6B665D]">Level Status</p>
              <p className="text-xl md:text-2xl font-semibold">{rewards?.levelLabel || "BRONZE"}</p>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
              <p className="text-xs uppercase tracking-wider text-[#6B665D]">Next Tier</p>
              <p className="text-xl md:text-2xl font-semibold">{rewards?.nextTierName || "SILVER"}</p>
            </div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
              <p className="text-xs uppercase tracking-wider text-[#6B665D]">Discount Eligibility</p>
              <p className="text-sm font-semibold">{rewards?.discountEligibility || "No active coupon"}</p>
            </div>
          </div>
        </section>

        {/* DATA SIGNALS */}
        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Data Signals & Transparency</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#2F6F57]" />
              Photo analysis {photoAnalysis?.imageUrl ? "integrated" : "not available"}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#2F6F57]" />
              Assessment responses ingested
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#2F6F57]" />
              Environmental exposure from UV and stress signals
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#2F6F57]" />
              Routine tracking incorporated in confidence model
            </div>
          </div>
          <p className="text-xs text-[#6B665D] mt-4">
            Confidence calculation method: baseline 65% + data source boosts from photo scan, full questionnaire coverage,
            and routine adherence logs.
          </p>
        </section>

        {/* DISCLAIMER */}
        <section className="text-xs text-[#6B665D] text-center">
          AI-generated educational report. Not a substitute for licensed medical diagnosis.
        </section>
      </main>
    </div>
  );
}
