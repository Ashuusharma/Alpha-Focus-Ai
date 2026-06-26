"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cartStore";
import { formatINR } from "@/lib/currency";
import { ProtocolReport } from "@/types/protocolReport";

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

const REPORT_CACHE_KEY = "protocol_report_v2";
const REPORT_POLL_INTERVAL_MS = 2500;
const REPORT_POLL_MAX_ATTEMPTS = 48;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ResultPage() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ProtocolReport | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const load = async () => {
      const cached = parseJson<ProtocolReport | null>(localStorage.getItem(REPORT_CACHE_KEY), null);
      if (cached) {
        if (!cancelled) {
          setReport(cached);
          setLoading(false);
          setReportStatus("ready");
        }
        return;
      }

      const reportId = sessionStorage.getItem("protocolReportId") || "";
      const query = reportId
        ? `/api/protocol/report?reportId=${encodeURIComponent(reportId)}&sourceVersion=v2`
        : "/api/protocol/report?sourceVersion=v2";

      for (let attempt = 1; attempt <= REPORT_POLL_MAX_ATTEMPTS; attempt += 1) {
        if (cancelled) return;
        setPollAttempt(attempt);

        const res = await fetch(query, { method: "GET", cache: "no-store" });
        const payload = (await res.json()) as {
          ok?: boolean;
          report?: { id?: string; status?: string; payload?: ProtocolReport | null };
          error?: string;
        };

        if (!res.ok || !payload?.ok || !payload.report) {
          if (payload?.error === "not_found" && attempt < REPORT_POLL_MAX_ATTEMPTS) {
            await wait(REPORT_POLL_INTERVAL_MS);
            continue;
          }
          throw new Error(payload?.error || "protocol_report_not_ready");
        }

        if (payload.report.id) {
          sessionStorage.setItem("protocolReportId", payload.report.id);
        }

        const status = payload.report.status || "unknown";
        setReportStatus(status);

        if (status === "ready" && payload.report.payload) {
          localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(payload.report.payload));
          if (!cancelled) {
            setReport(payload.report.payload);
            setLoading(false);
          }
          return;
        }

        if (status === "failed") {
          throw new Error("protocol_report_failed");
        }

        if (attempt < REPORT_POLL_MAX_ATTEMPTS) {
          await wait(REPORT_POLL_INTERVAL_MS);
        }
      }

      throw new Error("protocol_report_generation_timeout");
    };

    load()
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load protocol report.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sectionCards = useMemo(() => {
    if (!report) return [];

    return [
      {
        id: "issue",
        title: "Issue Summary",
        body: (
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="font-semibold text-[#1d1d1f]">What Was Detected</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5e5e5e]">
                {report.issueSummary.whatWasDetected.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1d1d1f]">Why It Happens</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5e5e5e]">
                {report.issueSummary.whyItHappens.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1d1d1f]">Why Consistency Matters</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5e5e5e]">
                {report.issueSummary.whyConsistencyMatters.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: "ingredients",
        title: "Main Resolving Ingredients",
        body: (
          <div className="grid gap-3 md:grid-cols-2">
            {report.mainResolvingIngredients.map((item) => (
              <div key={item.ingredient} className="rounded-xl border border-[#d9d9de] bg-white p-4 text-sm">
                <p className="font-semibold text-[#1d1d1f]">{item.ingredient}</p>
                <p className="mt-1 text-[#5e5e5e]"><span className="font-semibold text-[#1d1d1f]">Purpose:</span> {item.purpose}</p>
                <p className="mt-1 text-[#5e5e5e]"><span className="font-semibold text-[#1d1d1f]">How it helps:</span> {item.howItHelps}</p>
                <p className="mt-1 text-[#5e5e5e]"><span className="font-semibold text-[#1d1d1f]">Expected benefit:</span> {item.expectedRecoveryBenefit}</p>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "monthly-plan",
        title: "Monthly Recovery Plan",
        body: (
          <div className="grid gap-3 md:grid-cols-2">
            {(["morning", "afternoon", "night", "weekly"] as const).map((bucket) => (
              <div key={bucket} className="rounded-xl border border-[#d9d9de] bg-white p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6e6e73]">{bucket}</p>
                <div className="mt-2 space-y-2">
                  {report.monthlyRecoveryPlan[bucket].map((step) => (
                    <div key={`${bucket}-${step.stepTitle}`}>
                      <p className="font-semibold text-[#1d1d1f]">{step.stepTitle}</p>
                      <p className="text-[#5e5e5e]">{step.exactlyHowToPerform}</p>
                      <p className="mt-1 text-xs text-[#6e6e73]">{step.time} · {step.quantity} · {step.applicationArea}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "avoid",
        title: "Things To Avoid",
        body: (
          <div className="grid gap-3 text-sm md:grid-cols-2">
            {(["food", "habits", "environment", "productMistakes"] as const).map((bucket) => (
              <div key={bucket}>
                <p className="font-semibold capitalize text-[#1d1d1f]">{bucket}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5e5e5e]">
                  {report.thingsToAvoid[bucket].map((item) => (
                    <li key={`${bucket}-${item.item}`}>
                      <span className="font-semibold text-[#1d1d1f]">{item.item}:</span> {item.whyItDelaysRecovery}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "products",
        title: "Recommended Products",
        body: (
          <div className="grid gap-3 md:grid-cols-2">
            {report.recommendedProducts.map((product, idx) => (
              <div key={`${product.productId}-${idx}`} className="rounded-xl border border-[#d9d9de] bg-white p-4">
                <p className="text-base font-bold text-[#1d1d1f]">{product.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#6e6e73]">{product.ingredientMatch} · {product.whenToUse}</p>
                <p className="mt-2 text-sm text-[#5e5e5e]"><span className="font-semibold text-[#1d1d1f]">Why:</span> {product.whyRecommended}</p>
                <p className="mt-1 text-sm text-[#5e5e5e]"><span className="font-semibold text-[#1d1d1f]">How:</span> {product.howToUse}</p>
                <p className="mt-1 text-sm text-[#5e5e5e]"><span className="font-semibold text-[#1d1d1f]">Amount:</span> {product.howMuch}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1d1d1f]">{formatINR(999 + idx * 400)}</p>
                  <button
                    onClick={() => {
                      addItem({ id: `${product.productId}-${idx}`, name: product.name, price: 999 + idx * 400, quantity: 1 });
                      openCart();
                    }}
                    className="rounded-lg bg-[#1d1d1f] px-3 py-2 text-xs font-semibold text-white"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "diet",
        title: "Diet Plan",
        body: (
          <div className="grid gap-3 text-sm md:grid-cols-2">
            {(["breakfast", "lunch", "dinner", "snacks"] as const).map((meal) => (
              <div key={meal}>
                <p className="font-semibold capitalize text-[#1d1d1f]">{meal}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5e5e5e]">
                  {report.dietPlan[meal].map((item) => <li key={`${meal}-${item}`}>{item}</li>)}
                </ul>
              </div>
            ))}
            <p className="rounded-xl bg-[#f5f5f7] p-3 text-[#1d1d1f] md:col-span-2"><span className="font-semibold">Hydration:</span> {report.dietPlan.hydration}</p>
            <div className="md:col-span-2">
              <p className="font-semibold text-[#1d1d1f]">Weekly Nutrition Goals</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5e5e5e]">
                {report.dietPlan.weeklyNutritionGoals.map((goal) => <li key={goal}>{goal}</li>)}
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: "timeline",
        title: "Expected Timeline",
        body: (
          <div className="space-y-2">
            {report.expectedTimeline.map((item) => (
              <div key={`timeline-${item.week}`} className="rounded-xl border border-[#d9d9de] bg-white p-3 text-sm">
                <p className="font-semibold text-[#1d1d1f]">Week {item.week}</p>
                <p className="mt-1 font-semibold text-[#1d1d1f]">Expected Improvements</p>
                <ul className="list-disc pl-5 text-[#5e5e5e]">
                  {item.expectedImprovements.map((line) => <li key={`improve-${item.week}-${line}`}>{line}</li>)}
                </ul>
                <p className="mt-2 font-semibold text-[#1d1d1f]">Possible Setbacks</p>
                <ul className="list-disc pl-5 text-[#5e5e5e]">
                  {item.possibleSetbacks.map((line) => <li key={`setback-${item.week}-${line}`}>{line}</li>)}
                </ul>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "milestones",
        title: "Weekly Milestones",
        body: (
          <div className="space-y-2">
            {report.weeklyMilestones.map((item) => (
              <div key={`milestone-${item.week}`} className="rounded-xl border border-[#d9d9de] bg-white p-3 text-sm">
                <p className="font-semibold text-[#1d1d1f]">Week {item.week}: {item.milestone}</p>
                <p className="mt-1 text-[#5e5e5e]"><span className="font-semibold text-[#1d1d1f]">Adherence target:</span> {item.adherenceTarget}</p>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "motivation",
        title: "Motivation",
        body: <p className="text-sm text-[#5e5e5e]">{report.motivation}</p>,
      },
    ];
  }, [report, addItem, openCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-6">
        <div className="space-y-2 rounded-2xl border border-[#d9d9de] bg-white px-6 py-5 text-sm text-[#6e6e73]">
          <p>Preparing your result...</p>
          <p className="text-xs uppercase tracking-[0.1em] text-[#8e8e93]">
            {reportStatus ? `Status: ${reportStatus}` : "Status: queued"}
            {pollAttempt > 0 ? ` · Check ${pollAttempt}/${REPORT_POLL_MAX_ATTEMPTS}` : ""}
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-6">
        <div className="w-full max-w-xl space-y-4 rounded-3xl border border-[#d9d9de] bg-white p-8 text-center">
          <h1 className="text-xl font-bold text-[#1d1d1f]">Result unavailable</h1>
          <p className="text-sm text-[#6e6e73]">{error || "No report found."}</p>
          <button onClick={() => router.push("/assessment")} className="rounded-full bg-[#1d1d1f] px-6 py-3 text-sm font-semibold text-white">Start Assessment</button>
        </div>
      </div>
    );
  }

  return (
    <div className="af-page-shell min-h-screen text-[#ffffff]">
      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 md:px-6 md:py-8">
        <section className="nv-section-dark">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#2997ff]">Single Source Clinical Result</p>
          <h1 className="apple-section-title mt-2 text-white">Your Recovery Protocol Report</h1>
          <p className="mt-2 text-sm text-[#a7a7a7]">Pipeline: ALPHA FOCUS V2 · Structured server report</p>
        </section>

        {sectionCards.map((section) => (
          <section key={section.id} className="nv-section-white">
            <h2 className="text-xl font-black text-[#1d1d1f]">{section.title}</h2>
            <div className="mt-3">{section.body}</div>
          </section>
        ))}

        <section className="nv-section-white">
          <h2 className="text-xl font-black text-[#1d1d1f]">Confidence Notes</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#5e5e5e]">
            {report.confidenceNotes.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
      </main>
    </div>
  );
}
