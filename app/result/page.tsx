"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { FileWarning } from "lucide-react";
import { useCartStore } from "@/lib/cartStore";
import { ProtocolReport } from "@/types/protocolReport";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import Button from "@/components/ui/Button";
import Timeline, { type TimelineStep } from "@/components/ui/Timeline";
import LoadingExperience from "@/components/ui/LoadingExperience";
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
  const prefersReducedMotion = useReducedMotion();
  const reportRevealStagger = prefersReducedMotion ? 0 : 0.08;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ProtocolReport | null>(null);
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  // Purely presentational — a brief "your plan is ready" beat shown once
  // the real status flips to "ready", before the report itself renders.
  // Does not delay or alter when the report is actually fetched/ready.
  const [celebrating, setCelebrating] = useState(false);

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
              // Real data is already set above — this is a brief, purely
              // presentational "your plan is ready" beat before the report
              // itself renders, not a delay in when the work finishes.
              setCelebrating(true);
              await wait(900);
              if (!cancelled) setLoading(false);
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
    // Real backend states only: protocol_reports.status is exactly
    // queued -> processing -> ready|failed (confirmed against
    // app/api/protocol/generate/route.ts and lib/protocol/jobProcessor.ts).
    // The previous version subdivided "processing" into three labels
    // purely by elapsed poll count - an honest but soft time-proxy, not
    // real checkpoints. Two real pre-ready stages here, no more.
    const loadingStages = ["Understanding your clinical profile", "Building your recovery plan"];
    const currentStageIndex = reportStatus === "processing" ? 1 : 0;

    // Continues the same 4-node journey the assessment submit screen
    // shows, so the wait reads as one continuous journey across the
    // page handoff rather than two unrelated loading screens.
    const resultJourneySteps: TimelineStep[] = [
      { label: "Scan", status: "done" },
      { label: "Questions", status: "done" },
      { label: "AI Reasoning", status: celebrating ? "done" : "current", progressWithinStep: 70 },
      { label: "Recovery Plan", status: celebrating ? "current" : "upcoming" },
    ];

    return (
      <div className="af-page flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center sm:py-20">
        <div className="mb-8 w-full max-w-xs">
          <Timeline steps={resultJourneySteps} />
        </div>
        <LoadingExperience
          stages={loadingStages}
          currentIndex={currentStageIndex}
          isComplete={celebrating}
          completeLabel="Your recovery plan is ready"
          helperText="This usually takes under a minute. Please keep this tab open."
          completeHelperText="Bringing your plan into view now."
        />
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

  // Staged reveal — the "seamless handoff" moment: sections fade/rise in
  // with a short stagger on first render instead of appearing all at once.
  // Runs once (this branch only mounts after `loading` flips false); the
  // reduced-motion check keeps it to a plain opacity fade with no motion.
  const revealContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: reportRevealStagger } },
  };
  const revealItem = reportRevealStagger === 0
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  const sections = [
    <ProtocolHeader
      key="header"
      category={searchParams?.get("category") || null}
      level={searchParams?.get("level") || null}
      currentDay={progress?.day ?? null}
      currentWeek={progress?.week ?? null}
      todaysFocus={report.monthlyRecoveryPlan.morning[0]?.title || null}
    />,
    <PrimaryFindings key="findings" issueSummary={report.issueSummary} confidenceNotes={report.confidenceNotes} />,
    <RecoveryRoadmap
      key="roadmap"
      expectedTimeline={report.expectedTimeline}
      weeklyMilestones={report.weeklyMilestones}
      currentWeek={progress?.week ?? null}
    />,
    <ProtocolIngredients key="ingredients" ingredients={report.mainResolvingIngredients} />,
    <DailyRoutine key="routine" monthlyRecoveryPlan={report.monthlyRecoveryPlan} />,
    <LifestyleGuidance key="lifestyle" dietPlan={report.dietPlan} />,
    <ThingsToAvoid key="avoid" thingsToAvoid={report.thingsToAvoid} />,
    <RecommendedProducts key="products" products={report.recommendedProducts} onAddToCart={handleAddToCart} />,
    <ProtocolFollowUp key="followup" motivation={report.motivation} />,
  ];

  return (
    <div className="af-page min-h-screen">
      <ProtocolMobileActionBar />
      <main className="mx-auto flex max-w-6xl gap-6 px-4 py-6 pb-24 md:px-6 md:py-8 md:pb-8">
        <ProtocolTableOfContents entries={TOC_ENTRIES} />

        <motion.div
          className="flex min-w-0 flex-1 flex-col gap-4"
          initial="hidden"
          animate="visible"
          variants={revealContainer}
        >
          {sections.map((section) => (
            <motion.div key={section.key} variants={revealItem} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              {section}
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
