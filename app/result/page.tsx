"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileWarning, Sparkles } from "lucide-react";
import { useCartStore } from "@/lib/cartStore";
import { ProtocolReport } from "@/types/protocolReport";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import Button from "@/components/ui/Button";
import ProtocolTableOfContents, { ProtocolTocEntry } from "./_sections/ProtocolTableOfContents";
import ProtocolHeader from "./_sections/ProtocolHeader";
import PrimaryFindings from "./_sections/PrimaryFindings";
import RecoveryRoadmap from "./_sections/RecoveryRoadmap";
import ProtocolIngredients from "./_sections/ProtocolIngredients";
import DailyRoutine from "./_sections/DailyRoutine";
import LifestyleGuidance from "./_sections/LifestyleGuidance";
import ThingsToAvoid from "./_sections/ThingsToAvoid";
import RecommendedProducts from "./_sections/RecommendedProducts";
import ProtocolFollowUp from "./_sections/ProtocolFollowUp";
import ProtocolMobileActionBar from "./_sections/ProtocolMobileActionBar";

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

/** Derived from the report's own generatedAt timestamp (already present in
 * the existing /api/protocol/report response - no new fetch). Never shown
 * if generatedAt is unavailable (e.g. the offline localStorage-cache
 * fallback path below), rather than fabricating a start date. */
function getDayAndWeek(generatedAt: string | null) {
  if (!generatedAt) return null;
  const generatedMs = new Date(generatedAt).getTime();
  if (!Number.isFinite(generatedMs)) return null;

  const daysSince = Math.floor((Date.now() - generatedMs) / (24 * 60 * 60 * 1000));
  return {
    day: Math.min(30, Math.max(1, daysSince + 1)),
    week: Math.min(4, Math.max(1, Math.floor(daysSince / 7) + 1)),
  };
}

const TOC_ENTRIES: ProtocolTocEntry[] = [
  { id: "overview", label: "Overview" },
  { id: "findings", label: "Primary Findings" },
  { id: "roadmap", label: "Recovery Roadmap" },
  { id: "ingredients", label: "Ingredients & Treatments" },
  { id: "routine", label: "Daily Routine" },
  { id: "lifestyle", label: "Lifestyle Guidance" },
  { id: "avoid", label: "Things To Avoid" },
  { id: "products", label: "Recommended Products" },
];

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ProtocolReport | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const load = async () => {
      const reportId = sessionStorage.getItem("protocolReportId") || "";
      const cached = parseJson<ProtocolReport | null>(localStorage.getItem(REPORT_CACHE_KEY), null);
      const query = reportId
        ? `/api/protocol/report?reportId=${encodeURIComponent(reportId)}&sourceVersion=v2`
        : "/api/protocol/report?sourceVersion=v2";

      try {
        for (let attempt = 1; attempt <= REPORT_POLL_MAX_ATTEMPTS; attempt += 1) {
          if (cancelled) return;
          setPollAttempt(attempt);

          const headers = await getSupabaseAuthHeaders();
          const res = await fetch(query, {
            method: "GET",
            cache: "no-store",
            headers,
          });
          const payload = (await res.json()) as {
            ok?: boolean;
            report?: { id?: string; status?: string; generatedAt?: string | null; payload?: ProtocolReport | null };
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
              setGeneratedAt(payload.report.generatedAt || null);
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
      } catch (error) {
        if (!reportId && cached) {
          if (!cancelled) {
            setReport(cached);
            setReportStatus("ready");
            setLoading(false);
          }
          return;
        }
        throw error;
      }
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

  const progress = useMemo(() => getDayAndWeek(generatedAt), [generatedAt]);

  const handleAddToCart = (product: ProtocolReport["recommendedProducts"][number], idx: number) => {
    addItem({ id: `${product.productId}-${idx}`, name: product.name, price: 999 + idx * 400, quantity: 1 });
    openCart();
  };

  if (loading) {
    // Human-readable protocol-building journey, driven by the real
    // reportStatus from the server plus poll count as a time proxy for how
    // far into the (single, real) generating/processing phase we are - no
    // raw status strings, queue positions, or check-counters shown to the
    // user. See ../assessment/page.tsx for the same pattern on submission.
    const loadingLabel = (() => {
      if (!reportStatus || reportStatus === "queued") return "Understanding your clinical profile";
      if (reportStatus === "generating" || reportStatus === "processing") {
        if (pollAttempt <= 4) return "Building your daily protocol";
        if (pollAttempt <= 9) return "Selecting your ingredients";
        return "Final quality review";
      }
      return "Preparing your protocol";
    })();
    const loadingStages = ["Understanding your clinical profile", "Building your daily protocol", "Selecting your ingredients", "Final quality review"];
    const currentStageIndex = Math.max(0, loadingStages.indexOf(loadingLabel));

    return (
      <div className="af-page flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center">
        <div className="glass-card relative p-8">
          <div className="relative h-24 w-24">
            <div className="h-24 w-24 animate-spin rounded-full border-4 border-[var(--border-hairline)] border-t-[var(--accent-blue)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-8 w-8 animate-pulse text-[var(--accent-blue)]" />
            </div>
          </div>
        </div>

        <div className="mt-6 max-w-xl space-y-2" role="status" aria-live="polite">
          <h2 className="text-2xl font-bold text-[var(--ink)]">{loadingLabel}</h2>
          <p className="text-sm text-[var(--ink-soft)]">This usually takes under a minute. Please keep this tab open.</p>
        </div>

        <div className="glass-card mt-6 w-full max-w-md p-5">
          <div className="flex items-center gap-1.5">
            {loadingStages.map((stage, index) => (
              <div key={stage} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border-hairline)]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${index <= currentStageIndex ? "w-full bg-[var(--accent-blue)]" : "w-0"}`}
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
            Step {currentStageIndex + 1} of {loadingStages.length}
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="af-page flex min-h-screen items-center justify-center px-6">
        <div className="af-card-primary w-full max-w-xl space-y-4 p-8 text-center">
          <FileWarning className="mx-auto h-8 w-8 text-[var(--warning-accent)]" />
          <h1 className="text-xl font-bold text-[var(--ink)]">Result unavailable</h1>
          <p className="text-sm text-[var(--ink-soft)]">{error || "No report found."}</p>
          <Button onClick={() => router.push("/assessment")} variant="primary">Start Assessment</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="af-page min-h-screen">
      <ProtocolMobileActionBar />
      <main className="mx-auto flex max-w-6xl gap-6 px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8">
        <ProtocolTableOfContents entries={TOC_ENTRIES} />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ProtocolHeader
            category={searchParams?.get("category") || null}
            level={searchParams?.get("level") || null}
            currentDay={progress?.day ?? null}
            currentWeek={progress?.week ?? null}
          />

          <PrimaryFindings issueSummary={report.issueSummary} confidenceNotes={report.confidenceNotes} />
          <RecoveryRoadmap
            expectedTimeline={report.expectedTimeline}
            weeklyMilestones={report.weeklyMilestones}
            currentWeek={progress?.week ?? null}
          />
          <ProtocolIngredients ingredients={report.mainResolvingIngredients} />
          <DailyRoutine monthlyRecoveryPlan={report.monthlyRecoveryPlan} />
          <LifestyleGuidance dietPlan={report.dietPlan} />
          <ThingsToAvoid thingsToAvoid={report.thingsToAvoid} />
          <RecommendedProducts products={report.recommendedProducts} onAddToCart={handleAddToCart} />
          <ProtocolFollowUp motivation={report.motivation} />
        </div>
      </main>
    </div>
  );
}
