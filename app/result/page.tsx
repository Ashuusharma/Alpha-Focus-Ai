"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildClinicalProfileFromAssessmentAndAnalysis } from "@/lib/clinical/buildClinicalProfileFromAssessmentAndAnalysis";
import { buildProtocolInput } from "@/lib/protocol/contract";
import { buildFallbackProtocolReport } from "@/lib/protocol/fallbackReport";
import { AnalysisResult } from "@/lib/analyzeImage";
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

type SavedPhotoAnalysis = {
  type?: AnalysisResult["type"];
  confidence?: number;
  severity?: AnalysisResult["severity"];
  detectedIssues?: AnalysisResult["detectedIssues"];
  capturedPhotos?: string[];
};

type LocalEnv = {
  uv?: number;
  humidity?: number;
  pm25?: number;
};

const REPORT_CACHE_KEY = "protocol_report_v1";

export default function ResultPage() {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ProtocolReport | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const cached = parseJson<ProtocolReport | null>(localStorage.getItem(REPORT_CACHE_KEY), null);
    if (cached) {
      setReport(cached);
      setLoading(false);
      return;
    }

    const answers = parseJson<Record<string, string>>(sessionStorage.getItem("assessment_answers_v1"), {});
    const savedAnalysis = parseJson<SavedPhotoAnalysis | null>(sessionStorage.getItem("photoAnalysis"), null);
    const env = parseJson<LocalEnv | null>(localStorage.getItem("envSummary"), null);
    const category = sessionStorage.getItem("analysisCategory") || undefined;

    const hasAssessment = Object.keys(answers).length > 0;
    const hasAnalysis = Boolean(savedAnalysis?.severity && savedAnalysis?.confidence !== undefined);

    if (!hasAssessment && !hasAnalysis) {
      setError("No result data found. Complete assessment or image analysis first.");
      setLoading(false);
      return;
    }

    const analysis: AnalysisResult | null = hasAnalysis
      ? {
          type: savedAnalysis?.type || "skin",
          confidence: Math.round(savedAnalysis?.confidence || 0),
          severity: savedAnalysis?.severity || "moderate",
          detectedIssues: savedAnalysis?.detectedIssues || [],
          recommendations: [],
          tips: [],
          products: [],
          weeklyRoutines: [],
          capturedPhotos: savedAnalysis?.capturedPhotos || [],
        }
      : null;

    const profile = buildClinicalProfileFromAssessmentAndAnalysis(answers, analysis, {
      userId: "guest",
      locale: "en-IN",
      category,
      environment: {
        uvIndex: env?.uv,
        humidity: env?.humidity,
        aqi: env?.pm25,
      },
    });

    const protocolInput = buildProtocolInput(profile);
    const generated = buildFallbackProtocolReport(protocolInput);

    localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(generated));
    setReport(generated);
    setLoading(false);
  }, []);

  const sectionCards = useMemo(() => {
    if (!report) return [];
    return [
      {
        id: "issue",
        title: "Issue Snapshot",
        body: (
          <>
            <p className="text-sm text-[#6e6e73]">{report.issueSnapshot.headline}</p>
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              <p><span className="font-semibold text-[#1d1d1f]">Primary:</span> {report.issueSnapshot.primaryIssue}</p>
              <p><span className="font-semibold text-[#1d1d1f]">Severity:</span> {report.issueSnapshot.severityLabel}</p>
              <p><span className="font-semibold text-[#1d1d1f]">Confidence:</span> {report.issueSnapshot.confidenceLabel}</p>
            </div>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#5e5e5e]">
              {report.issueSnapshot.keyDrivers.map((driver) => (
                <li key={driver}>{driver}</li>
              ))}
            </ul>
          </>
        ),
      },
      {
        id: "ingredients",
        title: "Ingredients",
        body: (
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="font-semibold text-[#1d1d1f]">Must Have</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5e5e5e]">
                {report.ingredients.mustHave.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1d1d1f]">Optional</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5e5e5e]">
                {report.ingredients.optional.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1d1d1f]">Avoid Mixes</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5e5e5e]">
                {report.ingredients.avoidMixes.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: "fix",
        title: "Let's Fix This",
        body: (
          <>
            <p className="text-sm text-[#6e6e73]">Execution Window: {report.letsFixThis.weekWindow}</p>
            <div className="mt-3 space-y-2">
              {report.letsFixThis.steps.map((step) => (
                <div key={`${step.title}-${step.timeOfDay}`} className="rounded-xl border border-[#d9d9de] bg-white p-3 text-sm">
                  <p className="font-semibold text-[#1d1d1f]">{step.title}</p>
                  <p className="mt-1 text-[#5e5e5e]">{step.details}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#6e6e73]">{step.timeOfDay} · {step.frequency}</p>
                </div>
              ))}
            </div>
          </>
        ),
      },
      {
        id: "avoid",
        title: "Avoid",
        body: (
          <ul className="list-disc space-y-1 pl-5 text-sm text-[#5e5e5e]">
            {report.avoid.map((item) => <li key={item}>{item}</li>)}
          </ul>
        ),
      },
      {
        id: "products",
        title: "Products",
        body: (
          <div className="grid gap-3 md:grid-cols-2">
            {report.products.map((product, idx) => (
              <div key={`${product.name}-${idx}`} className="rounded-xl border border-[#d9d9de] bg-white p-4">
                <p className="text-base font-bold text-[#1d1d1f]">{product.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#6e6e73]">{product.role} · {product.priority}</p>
                <p className="mt-2 text-sm text-[#5e5e5e]"><span className="font-semibold text-[#1d1d1f]">Why:</span> {product.why}</p>
                <p className="mt-1 text-sm text-[#5e5e5e]"><span className="font-semibold text-[#1d1d1f]">Usage:</span> {product.usage}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1d1d1f]">{formatINR(999 + idx * 400)}</p>
                  <button
                    onClick={() => {
                      addItem({ id: `${product.name}-${idx}`, name: product.name, price: 999 + idx * 400, quantity: 1 });
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
        title: "Diet",
        body: (
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="font-semibold text-[#1d1d1f]">Include</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5e5e5e]">
                {report.diet.include.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#1d1d1f]">Reduce</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[#5e5e5e]">
                {report.diet.reduce.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
            <p className="rounded-xl bg-[#f5f5f7] p-3 text-[#1d1d1f] md:col-span-2"><span className="font-semibold">Hydration Rule:</span> {report.diet.hydrationRule}</p>
          </div>
        ),
      },
      {
        id: "progress",
        title: "Progress Expectation",
        body: (
          <>
            <p className="text-sm text-[#6e6e73]">{report.progressExpectation.timelineSummary}</p>
            <div className="mt-3 space-y-2">
              {report.progressExpectation.milestones.map((item) => (
                <div key={`wk-${item.week}`} className="rounded-xl border border-[#d9d9de] bg-white p-3 text-sm">
                  <p className="font-semibold text-[#1d1d1f]">Week {item.week}</p>
                  <p className="mt-1 text-[#5e5e5e]"><span className="font-semibold text-[#1d1d1f]">Expected:</span> {item.expectedChange}</p>
                  <p className="mt-1 text-[#5e5e5e]"><span className="font-semibold text-[#1d1d1f]">Review focus:</span> {item.reviewFocus}</p>
                </div>
              ))}
            </div>
          </>
        ),
      },
    ];
  }, [report, addItem, openCart]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] px-6">
        <div className="rounded-2xl border border-[#d9d9de] bg-white px-6 py-5 text-sm text-[#6e6e73]">Preparing your result...</div>
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
          <p className="mt-2 text-sm text-[#a7a7a7]">Source: {report.source} · Model: {report.model}</p>
        </section>

        {sectionCards.map((section) => (
          <section key={section.id} className="nv-section-white">
            <h2 className="text-xl font-black text-[#1d1d1f]">{section.title}</h2>
            <div className="mt-3">{section.body}</div>
          </section>
        ))}

        <section className="nv-section-white">
          <h2 className="text-xl font-black text-[#1d1d1f]">Important Notes</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#5e5e5e]">
            {report.disclaimers.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
      </main>
    </div>
  );
}
