"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { categories, CategoryId } from "@/lib/questions";
import { recalculateClinicalScores } from "@/lib/recalculateClinicalScores";
import { calculateProgressMetricsForCategory } from "@/lib/calculateProgressMetrics";
import { productRecommendationLogic, type ProductJustification } from "@/lib/productRecommendationLogic";
import { getProgressTimeline, type ProgressTimeline } from "@/lib/progressTimeline";
import { generateDailyProtocolTasks, getCategoryRecoveryProfile, getCurrentProtocolPhase, getProtocolTemplate, getRecoveryLevelDisplay, normalizeRecoveryLevel, type ProtocolTask } from "@/lib/protocolTemplates";
import { resolveClinicalChildCategoryFromAny } from "@/lib/categorySync";
import { getRecoveryProgramLevel } from "@/lib/userProfile";
import EnhancedProductCard from "./_components/EnhancedProductCard";

type SubscriptionPlan = "basic" | "plus" | "pro";

type ClinicalRow = {
  user_id: string;
  category: string;
  severity_score: number;
  confidence_score: number;
  risk_level: string;
  recovery_probability: number;
  condition_label: string;
  assessment_completeness: number;
  domain_scores: Record<string, number>;
  root_cause_map: Array<{ domain: string; score: number; impact_pct: number }>;
  report_payload: {
    insufficient_data?: boolean;
    message?: string;
    clinical_overview?: {
      primary_condition?: string;
      severity_score?: number;
      risk_level?: string;
      recovery_probability?: number;
      confidence_pct?: number;
      stage_label?: string;
      clinical_description?: string;
    };
    what_this_means?: string;
    protocol_30_day?: { phase_1?: string; phase_2?: string; phase_3?: string };
    routine_schedule?: { morning?: string; night?: string; weekly_reset?: string };
    product_logic?: { why_recommended?: string; target_symptom?: string; timeline_expectation?: string };
    risk_if_ignored?: string;
    performance_metrics?: { adherence_pct?: number; projected_recovery_days?: number };
  };
};

type GlobalDomainsRow = {
  inflammation_load: number;
  hormonal_instability: number;
  stress_load: number;
  sleep_deprivation: number;
  barrier_integrity: number;
  oxidative_stress: number;
  metabolic_load: number;
};

type RelapseRiskRow = {
  relapse_score: number;
  risk_level: string;
  predicted_trigger: string;
  behavior_response: string;
};

type ProgressRow = {
  scans_count: number;
  first_severity: number;
  latest_severity: number;
  improvement_pct: number;
  inflammation_reduction_rate: number;
  consistency_score: number;
  recovery_velocity: number;
  discipline_index: number;
  confidence_score: number;
  trend_direction: string;
  trend_message: string;
};

type ResultProductCard = {
  id: string;
  name: string;
  description: string;
  usage: string;
  frequency: string;
  why: string;
  price: number;
  rating: number;
  reviews: number;
  badge?: "Best Seller" | "Recommended" | "New";
  shopifyHandle?: string;
  benefits?: string[];
  ingredients?: string[];
};

type AiGuidance = {
  summary: string;
  actions: string[];
  source: "ai" | "fallback";
};

function mapRecommendationToProductCard(
  recommendation: ProductJustification,
  index: number,
  categoryId: CategoryId
): ResultProductCard {
  return {
    id: recommendation.product_id || `${categoryId}-product-${index + 1}`,
    name: recommendation.product_name,
    description: recommendation.targets.join(" • ") || recommendation.product_type.replace(/_/g, " "),
    usage: recommendation.usage_note,
    frequency: recommendation.expected_timeline,
    why: recommendation.why_recommended,
    price: recommendation.price_inr || 2999,
    rating: 4.8,
    reviews: 120 + index * 34,
    badge: index === 0 ? "Recommended" : "New",
    shopifyHandle: recommendation.shopify_handle,
    benefits: recommendation.benefits || recommendation.targets,
    ingredients: recommendation.ingredient ? [recommendation.ingredient] : undefined,
  };
}

function safeLabel(category: string) {
  return categories.find((item) => item.id === category)?.label || category.replace(/_/g, " ");
}

function normalizeDomainName(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildProtocolTimeline(severity: number, recoveryProbability: number) {
  const week1 = Math.max(0, Math.min(100, severity));
  const week2 = Math.max(0, Math.round(week1 - recoveryProbability * 0.22));
  const week3 = Math.max(0, Math.round(week2 - recoveryProbability * 0.18));
  const week4 = Math.max(0, Math.round(week3 - recoveryProbability * 0.15));
  return [week1, week2, week3, week4];
}

function getSeverityStage(score: number) {
  if (score >= 80) {
    return {
      label: "Intensive correction",
      summary: "Active correction is needed now. Tight routine adherence will make the biggest difference over the next 2 to 4 weeks.",
      accent: "#A95F3B",
    };
  }

  if (score >= 60) {
    return {
      label: "High attention",
      summary: "The condition is still materially affecting recovery. Good discipline should create measurable change inside the next cycle.",
      accent: "#C08A39",
    };
  }

  if (score >= 40) {
    return {
      label: "Controlled recovery",
      summary: "You have enough stability to improve steadily if routine consistency stays high.",
      accent: "#6E9F87",
    };
  }

  return {
    label: "Maintenance-ready",
    summary: "The pattern is relatively controlled. The job now is to protect gains and avoid rebound triggers.",
    accent: "#2F6F57",
  };
}

function buildTimelineSummary(projectedDays: number, recoveryProbability: number) {
  if (projectedDays > 0) {
    const weeks = Math.max(3, Math.round(projectedDays / 7));
    return `With current adherence, meaningful change is realistic in about ${weeks} weeks.`;
  }

  if (recoveryProbability >= 75) {
    return "You are in a favorable recovery band. Visible improvement is realistic within the next 3 to 5 weeks.";
  }

  if (recoveryProbability >= 55) {
    return "Expect gradual but meaningful improvement over the next 4 to 8 weeks if adherence remains stable.";
  }

  return "Recovery is possible, but the next 2 to 3 weeks need tighter execution before results accelerate.";
}

function buildBeforeAfterExpectation(conditionLabel: string, severityLabel: string) {
  return `Before: ${conditionLabel} is still being reinforced by repeated triggers and inconsistent recovery windows. After: with ${severityLabel.toLowerCase()} execution, you should see lower symptom intensity, better day-to-day control, and more stable confidence in the mirror.`;
}

export default function ResultPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clinical, setClinical] = useState<ClinicalRow | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan>("basic");
  const [globalDomains, setGlobalDomains] = useState<GlobalDomainsRow | null>(null);
  const [relapseRisk, setRelapseRisk] = useState<RelapseRiskRow | null>(null);
  const [progress, setProgress] = useState<ProgressRow | null>(null);
  const [timelineData, setTimelineData] = useState<ProgressTimeline | null>(null);
  const [protocolTasks, setProtocolTasks] = useState<ProtocolTask[]>([]);
  const [protocolPhaseName, setProtocolPhaseName] = useState<string>("Stabilization");
  const [protocolDayNumber, setProtocolDayNumber] = useState<number>(1);
  const [programLevel, setProgramLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [recommendedProducts, setRecommendedProducts] = useState<ResultProductCard[]>([]);
  const [aiGuidance, setAiGuidance] = useState<AiGuidance | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClinicalResult() {
      if (!user) {
        setError("Please log in to view clinical report.");
        setLoading(false);
        return;
      }

      const queryCategory = params?.get("category");
      const queryLevel = params?.get("level");
      const sessionCategory = typeof window !== "undefined" ? sessionStorage.getItem("analysisCategory") : null;
      const sessionLevel = typeof window !== "undefined" ? sessionStorage.getItem("recoveryProgramLevel") : null;
      let category = resolveClinicalChildCategoryFromAny(queryCategory, sessionCategory as CategoryId | null);
      const resolvedProgramLevel = normalizeRecoveryLevel(queryLevel || sessionLevel || getRecoveryProgramLevel());
      setProgramLevel(resolvedProgramLevel);

      if (!category) {
        const { data: activeAnalysis } = await supabase
          .from("user_active_analysis")
          .select("selected_category")
          .eq("user_id", user.id)
          .maybeSingle();
        category = resolveClinicalChildCategoryFromAny(activeAnalysis?.selected_category || null, sessionCategory as CategoryId | null);
      }

      if (!category) {
        setError("No active category found. Please complete analyzer and assessment flow first.");
        setLoading(false);
        return;
      }

      const categoryId = (categories.find((item) => item.id === category)?.id || category) as CategoryId;

      await recalculateClinicalScores(user.id, categoryId);
      const [, recommendationsResult] = await Promise.allSettled([
        calculateProgressMetricsForCategory(user.id, categoryId),
        productRecommendationLogic(user.id, categoryId),
      ]);

      if (recommendationsResult.status === "fulfilled") {
        setRecommendedProducts(
          recommendationsResult.value.map((entry, index) =>
            mapRecommendationToProductCard(entry, index, categoryId)
          )
        );
      } else {
        setRecommendedProducts([]);
      }

      const timeline = await getProgressTimeline(user.id, categoryId);
      setTimelineData(timeline);

      const firstSnapshotDate = timeline.snapshots[0]?.scan_date;
      const derivedDayNumber = firstSnapshotDate
        ? Math.max(1, Math.min(30, Math.floor((Date.now() - new Date(firstSnapshotDate).getTime()) / (1000 * 60 * 60 * 24)) + 1))
        : 1;
      setProtocolDayNumber(derivedDayNumber);

      const template = getProtocolTemplate(categoryId);
      const tasks = generateDailyProtocolTasks(categoryId, derivedDayNumber, { toleranceMode: resolvedProgramLevel });
      setProtocolTasks(tasks);
      if (template) {
        setProtocolPhaseName(getCurrentProtocolPhase(template, derivedDayNumber).name);
      }

      const [
        clinicalRes,
        subscriptionRes,
        globalRes,
        relapseRes,
        progressRes,
      ] = await Promise.all([
        supabase
          .from("user_category_clinical_scores")
          .select("*")
          .eq("user_id", user.id)
          .eq("category", categoryId)
          .maybeSingle(),
        supabase
          .from("user_subscriptions")
          .select("plan,active,expires_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_global_domains")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_relapse_risk")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("user_progress_metrics")
          .select("*")
          .eq("user_id", user.id)
          .eq("category", categoryId)
          .maybeSingle(),
      ]);

      if (clinicalRes.error || !clinicalRes.data) {
        setError("No clinical report data available for this category.");
        setLoading(false);
        return;
      }

      const rawPlan = String(subscriptionRes.data?.plan || "basic").toLowerCase();
      const isActiveSubscription = subscriptionRes.data?.active !== false
        && (!subscriptionRes.data?.expires_at || new Date(subscriptionRes.data.expires_at) > new Date());
      const effectivePlan: SubscriptionPlan = isActiveSubscription && (rawPlan === "plus" || rawPlan === "pro")
        ? (rawPlan as SubscriptionPlan)
        : "basic";

      setPlan(effectivePlan);
      setClinical(clinicalRes.data as ClinicalRow);
      setGlobalDomains((globalRes.data || null) as GlobalDomainsRow | null);
      setRelapseRisk((relapseRes.data || null) as RelapseRiskRow | null);
      setProgress((progressRes.data || null) as ProgressRow | null);
      setLoading(false);
    }

    loadClinicalResult();
  }, [params, user]);

  const timeline = useMemo(() => {
    if (!clinical) return [0, 0, 0, 0];
    return buildProtocolTimeline(clinical.severity_score, clinical.recovery_probability);
  }, [clinical]);

  useEffect(() => {
    if (!clinical) return;

    let cancelled = false;

    const loadGuidance = async () => {
      setGuidanceLoading(true);
      setGuidanceError(null);

      try {
        const response = await fetch("/api/ai/advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issues: [clinical.condition_label, ...clinical.root_cause_map.slice(0, 3).map((item) => normalizeDomainName(item.domain))],
            answers: Object.fromEntries(
              Object.entries(clinical.domain_scores || {}).map(([key, value]) => [key, String(value)])
            ),
            category: clinical.category,
            severity:
              clinical.severity_score >= 75 ? "high" : clinical.severity_score >= 45 ? "moderate" : "mild",
            locale: "en-IN",
            lifestyle: {
              workMode: "mobile-first daily routine",
              stressLevel: String(globalDomains?.stress_load ?? "moderate"),
              sleepHours: globalDomains ? Math.max(4, 8 - Math.round((globalDomains.sleep_deprivation || 0) / 25)) : undefined,
            },
          }),
        });

        const payload = (await response.json()) as AiGuidance & { error?: string };
        if (!response.ok || !payload.summary || !Array.isArray(payload.actions)) {
          throw new Error(payload.error || "Could not generate guided routine.");
        }

        if (!cancelled) {
          setAiGuidance({
            summary: payload.summary,
            actions: payload.actions,
            source: payload.source,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setGuidanceError(error instanceof Error ? error.message : "Could not generate guided routine.");
        }
      } finally {
        if (!cancelled) {
          setGuidanceLoading(false);
        }
      }
    };

    void loadGuidance();

    return () => {
      cancelled = true;
    };
  }, [clinical, globalDomains]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center px-6">
        <div className="rounded-2xl border border-[#E2DDD3] bg-white px-6 py-5 text-sm text-[#6B665D]">Generating deterministic clinical report...</div>
      </div>
    );
  }

  if (error || !clinical) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-3xl bg-white border border-[#E2DDD3] p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-[#1F3D2B]">Clinical Report Unavailable</h1>
          <p className="text-sm text-[#6B665D]">{error || "No report found."}</p>
          <button
            onClick={() => router.push("/image-analyzer")}
            className="rounded-full bg-[#1F3D2B] px-6 py-3 text-sm font-semibold text-white"
          >
            Restart Flow
          </button>
        </div>
      </div>
    );
  }

  if (clinical.report_payload?.insufficient_data || clinical.assessment_completeness < 60) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center px-6">
        <div className="max-w-2xl w-full rounded-3xl bg-white border border-[#E2DDD3] p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#1F3D2B]">Insufficient structured data to generate clinical protocol.</h1>
          <p className="text-sm text-[#6B665D]">Complete a valid photo scan and at least 60% category assessment to unlock report generation.</p>
          <button
            onClick={() => router.push(`/assessment?category=${clinical.category}`)}
            className="rounded-full bg-[#2F6F57] px-6 py-3 text-sm font-semibold text-white"
          >
            Continue Assessment
          </button>
        </div>
      </div>
    );
  }

  const overview = clinical.report_payload?.clinical_overview;
  const protocol = clinical.report_payload?.protocol_30_day;
  const schedule = clinical.report_payload?.routine_schedule;
  const productLogic = clinical.report_payload?.product_logic;
  const performance = clinical.report_payload?.performance_metrics;
  const isPlusOrPro = plan === "plus" || plan === "pro";
  const isPro = plan === "pro";
  const shouldAdjustProtocol = Boolean(
    isPlusOrPro
    && progress
    && progress.scans_count >= 3
    && (progress.improvement_pct <= 5 || progress.trend_direction === "worsening")
  );
  const recoveryProfile = getCategoryRecoveryProfile(clinical.category as CategoryId);
  const severityStage = getSeverityStage(overview?.severity_score ?? clinical.severity_score);
  const projectedRecoveryDays = performance?.projected_recovery_days ?? 0;
  const topRootCauses = [...(clinical.root_cause_map || [])]
    .sort((left, right) => right.impact_pct - left.impact_pct)
    .slice(0, 3);
  const diagnosisSummary = overview?.clinical_description || recoveryProfile?.issueSummary || clinical.report_payload?.what_this_means || "Clinical interpretation is stabilizing.";
  const timelineSummary = buildTimelineSummary(projectedRecoveryDays, overview?.recovery_probability ?? clinical.recovery_probability);
  const beforeAfterExpectation = buildBeforeAfterExpectation(overview?.primary_condition || clinical.condition_label, severityStage.label);
  const actionableSteps = protocolTasks.slice(0, 4);

  return (
    <div className="skeuo-report-shell min-h-screen bg-[#F4EFE6] text-[#1F3D2B]">
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">
        <section className="skeuo-panel rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">Clinical Output</p>
          <h1 className="text-2xl md:text-3xl font-bold mt-1">Clinical Report - {safeLabel(clinical.category)}</h1>
          <p className="text-sm text-[#6B665D] mt-2">Deterministic protocol generated from latest valid scan + weighted category assessment.</p>
          <div className="skeuo-chip mt-4 inline-flex items-center gap-2 rounded-full border border-[#DCCFBD] bg-[#F8F3EC] px-4 py-2 text-xs font-semibold text-[#6F5647]">
            <span>Recovery Track</span>
            <span className="rounded-full bg-white px-3 py-1 text-[#1F3D2B]">{getRecoveryLevelDisplay(programLevel).label}</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3 text-sm">
            <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3">
              <p className="text-xs text-[#6B665D] uppercase tracking-wider">Step 1</p>
              <p className="font-semibold mt-1">Diagnose</p>
              <p className="text-xs text-[#6B665D] mt-1">Validated scan + assessment merged into category score model.</p>
            </div>
            <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3">
              <p className="text-xs text-[#6B665D] uppercase tracking-wider">Step 2</p>
              <p className="font-semibold mt-1">Execute</p>
              <p className="text-xs text-[#6B665D] mt-1">Follow your daily protocol and complete routine + challenge loop.</p>
            </div>
            <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3">
              <p className="text-xs text-[#6B665D] uppercase tracking-wider">Step 3</p>
              <p className="font-semibold mt-1">Transform</p>
              <p className="text-xs text-[#6B665D] mt-1">Track measurable progress and refine protocol at each checkpoint.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => router.push("/dashboard")} className="min-h-[40px] rounded-full bg-[#1F3D2B] px-4 py-2 text-xs font-semibold text-white">Open Dashboard</button>
            <button onClick={() => router.push("/challenges")} className="min-h-[40px] rounded-full border border-[#1F3D2B] px-4 py-2 text-xs font-semibold text-[#1F3D2B]">Start Challenge</button>
            <button onClick={() => router.push("/shop")} className="min-h-[40px] rounded-full border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-2 text-xs font-semibold text-[#1F3D2B]">Review Products</button>
          </div>
        </section>

        <section className="skeuo-panel rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_1fr]">
            <div className="skeuo-inset p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Severity meter</p>
                  <p className="mt-2 text-2xl font-bold text-[#1F3D2B]">{severityStage.label}</p>
                  <p className="mt-2 text-sm text-[#6B665D]">{severityStage.summary}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6B665D]">Current score</p>
                  <p className="text-4xl font-bold" style={{ color: severityStage.accent }}>{overview?.severity_score ?? clinical.severity_score}</p>
                </div>
              </div>
              <div className="skeuo-progress mt-5 h-4 w-full">
                <div className="skeuo-progress-bar" style={{ width: `${Math.max(6, Math.min(100, overview?.severity_score ?? clinical.severity_score))}%` }} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#6B665D]">
                <div className="rounded-full bg-white/70 px-3 py-2 text-center">Stabilize</div>
                <div className="rounded-full bg-white/70 px-3 py-2 text-center">Correct</div>
                <div className="rounded-full bg-white/70 px-3 py-2 text-center">Maintain</div>
              </div>
            </div>

            <div className="skeuo-inset p-5 md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Diagnosis summary</p>
              <p className="mt-3 text-base font-semibold text-[#1F3D2B]">{overview?.primary_condition || clinical.condition_label}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#4A453E]">{diagnosisSummary}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-2xl bg-white/70 px-4 py-3">
                  <p className="text-xs text-[#6B665D]">Risk level</p>
                  <p className="mt-1 font-semibold uppercase">{overview?.risk_level ?? clinical.risk_level}</p>
                </div>
                <div className="rounded-2xl bg-white/70 px-4 py-3">
                  <p className="text-xs text-[#6B665D]">Confidence</p>
                  <p className="mt-1 font-semibold">{overview?.confidence_pct ?? clinical.confidence_score}%</p>
                </div>
              </div>
            </div>

            <div className="skeuo-inset p-5 md:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Improvement timeline</p>
              <p className="mt-3 text-sm leading-relaxed text-[#4A453E]">{timelineSummary}</p>
              <div className="mt-4 space-y-3 text-sm text-[#1F3D2B]">
                <div className="rounded-2xl bg-white/70 px-4 py-3">
                  <p className="font-semibold">Week 1</p>
                  <p className="mt-1 text-[#6B665D]">Reduce triggers, tighten routine timing, and stabilize symptom spikes.</p>
                </div>
                <div className="rounded-2xl bg-white/70 px-4 py-3">
                  <p className="font-semibold">Week 2-3</p>
                  <p className="mt-1 text-[#6B665D]">Expect steadier control, lower rebound episodes, and clearer recovery feedback.</p>
                </div>
                <div className="rounded-2xl bg-white/70 px-4 py-3">
                  <p className="font-semibold">Week 4+</p>
                  <p className="mt-1 text-[#6B665D]">Visible change becomes easier to notice when adherence and re-checks stay consistent.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="skeuo-inset p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Top root causes</p>
              <div className="mt-3 space-y-2">
                {topRootCauses.length > 0 ? topRootCauses.map((item) => (
                  <div key={item.domain} className="rounded-2xl bg-white/70 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[#1F3D2B]">{normalizeDomainName(item.domain)}</p>
                      <span className="text-sm font-bold text-[#2F6F57]">{item.impact_pct}%</span>
                    </div>
                    <p className="mt-1 text-xs text-[#6B665D]">Domain score {item.score}</p>
                  </div>
                )) : (
                  <p className="text-sm text-[#6B665D]">Root-cause ranking will become sharper as more structured inputs are added.</p>
                )}
              </div>
            </div>

            <div className="skeuo-inset p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Before / after expectation</p>
              <p className="mt-3 text-sm leading-relaxed text-[#4A453E]">{beforeAfterExpectation}</p>
              {recoveryProfile?.benefitSummary ? <p className="mt-3 text-sm text-[#2F6F57]">{recoveryProfile.benefitSummary}</p> : null}
            </div>

            <div className="skeuo-inset p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Next best actions</p>
              <div className="mt-3 space-y-2">
                {actionableSteps.map((task, index) => (
                  <div key={task.id} className="rounded-2xl bg-white/70 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#8C6A5A]">Action {index + 1}</p>
                    <p className="mt-1 font-semibold text-[#1F3D2B]">{task.label}</p>
                    {task.whyItHelps ? <p className="mt-1 text-xs text-[#6B665D]">{task.whyItHelps}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {recoveryProfile?.whenToEscalate?.length ? (
            <div className="skeuo-inset mt-4 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Escalate if you notice</p>
              <div className="mt-3 grid gap-2 md:grid-cols-3 text-sm text-[#4A453E]">
                {recoveryProfile.whenToEscalate.slice(0, 3).map((item) => (
                  <div key={item} className="rounded-2xl bg-white/70 px-4 py-3">{item}</div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Section 1 - Clinical Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="text-xs text-[#6B665D]">Primary Condition</p><p className="font-semibold mt-1">{overview?.primary_condition || clinical.condition_label}</p></div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="text-xs text-[#6B665D]">Severity Score</p><p className="text-2xl font-bold">{overview?.severity_score ?? clinical.severity_score}</p></div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="text-xs text-[#6B665D]">Risk Level</p><p className="text-2xl font-bold">{overview?.risk_level ?? clinical.risk_level}</p></div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="text-xs text-[#6B665D]">Recovery Probability</p><p className="text-2xl font-bold">{overview?.recovery_probability ?? clinical.recovery_probability}%</p></div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="text-xs text-[#6B665D]">Confidence</p><p className="text-2xl font-bold">{overview?.confidence_pct ?? clinical.confidence_score}%</p></div>
          </div>
          {isPlusOrPro && (
            <div className="mt-4 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4 text-sm">
              <p className="font-semibold">Severity Stage: {overview?.stage_label || "Unstaged"}</p>
              <p className="text-[#6B665D] mt-1">{overview?.clinical_description || "Clinical staging description unavailable."}</p>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Section 2 - Root Cause Map</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {(clinical.root_cause_map || []).map((item) => (
              <div key={item.domain} className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{normalizeDomainName(item.domain)}</p>
                  <p className="text-xs text-[#6B665D]">Domain score: {item.score}</p>
                </div>
                <p className="text-lg font-bold text-[#2F6F57]">{item.impact_pct}%</p>
              </div>
            ))}
          </div>
          {isPlusOrPro ? (
            <div className="mt-4 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4 text-sm">
              <p className="font-semibold mb-2">Cross-Category Interaction Model</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <p>Inflammation: <span className="font-semibold">{globalDomains?.inflammation_load ?? 0}</span></p>
                <p>Hormonal: <span className="font-semibold">{globalDomains?.hormonal_instability ?? 0}</span></p>
                <p>Stress: <span className="font-semibold">{globalDomains?.stress_load ?? 0}</span></p>
                <p>Sleep Deprivation: <span className="font-semibold">{globalDomains?.sleep_deprivation ?? 0}</span></p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3">
              <p className="text-xs text-[#6B665D]">Upgrade to Plus for cross-category interaction analytics.</p>
              <button
                onClick={() => router.push("/settings")}
                className="rounded-full bg-[#1F3D2B] px-4 py-1.5 text-xs font-semibold text-white"
              >
                Upgrade
              </button>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Section 3 - What This Means</h2>
          <p className="text-sm text-[#4A453E] leading-relaxed">{clinical.report_payload?.what_this_means}</p>
        </section>

        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Section 4 - 30-Day Protocol</h2>
          {isPro ? (
            <>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="font-semibold mb-2">Phase 1 - Stabilize</p><p>{protocol?.phase_1}</p></div>
                <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="font-semibold mb-2">Phase 2 - Correct</p><p>{protocol?.phase_2}</p></div>
                <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="font-semibold mb-2">Phase 3 - Reinforce</p><p>{protocol?.phase_3}</p></div>
              </div>
              <div className="grid grid-cols-4 gap-3 items-end h-28 mt-6">
                {timeline.map((value, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    <div className="w-full max-w-[72px] rounded-t-xl bg-[#2F6F57]" style={{ height: `${Math.max(10, value)}%` }} />
                    <p className="text-xs text-[#6B665D]">W{index + 1}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#6B665D]">Basic protocol: cleanse, targeted active, and barrier-support nightly. Upgrade to Pro for full 30-day structured protocol timeline.</p>
              <button
                onClick={() => router.push("/settings")}
                className="rounded-full bg-[#1F3D2B] px-4 py-2 text-xs font-semibold text-white"
              >
                Upgrade to Pro
              </button>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
            <p className="font-semibold text-sm">Today&apos;s Dynamic Tasks - Day {protocolDayNumber} ({protocolPhaseName})</p>
            <div className="mt-2 grid md:grid-cols-2 gap-2 text-sm">
              {protocolTasks.length > 0 ? (
                protocolTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-[#E2DDD3] bg-white px-3 py-2">
                    <p className="font-medium">{task.label}</p>
                    <p className="text-xs text-[#6B665D] capitalize">{task.slot} · {task.frequency.replace(/_/g, " ")}</p>
                    {task.howTo ? <p className="mt-1 text-xs text-[#4A453E]">How: {task.howTo}</p> : null}
                    {task.whyItHelps ? <p className="mt-1 text-xs text-[#2F6F57]">Why: {task.whyItHelps}</p> : null}
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#6B665D]">Protocol tasks will appear after valid category protocol initialization.</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Section 5 - Routine Schedule</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="font-semibold mb-2">Morning</p><p>{schedule?.morning}</p></div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="font-semibold mb-2">Night</p><p>{schedule?.night}</p></div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="font-semibold mb-2">Weekly Reset</p><p>{schedule?.weekly_reset}</p></div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Section 5A - Guided Daily Plan</h2>
              <p className="mt-1 text-sm text-[#6B665D]">A simplified routine tuned for Indian climate, commute, sweat, and daily schedule constraints.</p>
            </div>
            <button
              onClick={() => setAiGuidance(null)}
              className="rounded-full border border-[#E2DDD3] px-3 py-1.5 text-xs font-semibold text-[#1F3D2B]"
            >
              Refresh on next load
            </button>
          </div>

          {guidanceLoading ? (
            <div className="mt-4 rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4 text-sm text-[#6B665D]">Generating your guided routine plan...</div>
          ) : null}

          {guidanceError ? (
            <div className="mt-4 rounded-2xl border border-[#E7C2B7] bg-[#FFF5F1] p-4 text-sm text-[#8C4C3A]">
              <p>{guidanceError}</p>
            </div>
          ) : null}

          {aiGuidance ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4 text-sm">
                <p className="font-semibold text-[#1F3D2B]">Plan Summary</p>
                <p className="mt-2 text-[#4A453E]">{aiGuidance.summary}</p>
                <p className="mt-2 text-xs text-[#6B665D]">Source: {aiGuidance.source === "ai" ? "AI guided" : "Local fallback guidance"}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {aiGuidance.actions.map((action, index) => (
                  <div key={`${action}-${index}`} className="rounded-2xl border border-[#E2DDD3] bg-white p-4 text-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#8C6A5A]">Step {index + 1}</p>
                    <p className="mt-2 text-[#1F3D2B]">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Section 6 - Product Logic</h2>
          <div className="space-y-3 text-sm">
            <p className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3"><strong>Why Recommended:</strong> {productLogic?.why_recommended}</p>
            <p className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3"><strong>Target Symptom:</strong> {productLogic?.target_symptom}</p>
            <p className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3"><strong>Timeline:</strong> {productLogic?.timeline_expectation}</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {recommendedProducts.map((product) => (
              <EnhancedProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Section 7 - Risk If Ignored</h2>
          <p className="text-sm text-[#4A453E] leading-relaxed">{clinical.report_payload?.risk_if_ignored}</p>
        </section>

        <section className="rounded-3xl border border-[#E2DDD3] bg-white p-6 md:p-8">
          <h2 className="text-xl font-semibold mb-4">Section 8 - Performance Metrics</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="text-xs text-[#6B665D]">Adherence</p><p className="text-2xl font-bold">{performance?.adherence_pct ?? 0}%</p></div>
            <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4"><p className="text-xs text-[#6B665D]">Projected Recovery Days</p><p className="text-2xl font-bold">{performance?.projected_recovery_days ?? 0}</p></div>
          </div>
          {isPlusOrPro ? (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
                <p className="font-semibold">Progress Trend</p>
                <p className="text-[#6B665D] mt-1">{progress?.trend_message || "Trend data is stabilizing."}</p>
                <p className="mt-1">Improvement: <span className="font-semibold">{progress?.improvement_pct ?? 0}%</span> | Scan History Used: <span className="font-semibold">{progress?.scans_count ?? 0}</span></p>
              </div>

              <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
                <p className="font-semibold">Relapse Prediction</p>
                {relapseRisk ? (
                  <>
                    <p className="mt-1">Risk: <span className="font-semibold">{relapseRisk.risk_level}</span> ({relapseRisk.relapse_score})</p>
                    <p className="text-[#6B665D] mt-1">{relapseRisk.behavior_response}</p>
                  </>
                ) : (
                  <p className="text-[#6B665D] mt-1">No relapse prediction available yet.</p>
                )}
              </div>

              {isPro && (
                <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
                  <p className="font-semibold">Transformation Performance Matrix</p>
                  <div className="grid md:grid-cols-2 gap-2 mt-2">
                    <p>Consistency Score: <span className="font-semibold">{progress?.consistency_score ?? 0}</span></p>
                    <p>Recovery Velocity: <span className="font-semibold">{progress?.recovery_velocity ?? 0}</span></p>
                    <p>Discipline Index: <span className="font-semibold">{progress?.discipline_index ?? 0}</span></p>
                    <p>Inflammation Reduction Rate: <span className="font-semibold">{progress?.inflammation_reduction_rate ?? 0}%</span></p>
                    <p>Confidence Score: <span className="font-semibold">{progress?.confidence_score ?? clinical.confidence_score}</span></p>
                  </div>
                </div>
              )}

              {shouldAdjustProtocol && (
                <div className="rounded-xl border border-[#DAB8A6] bg-[#FFF6F1] p-4">
                  <p className="font-semibold text-[#7A3E2B]">Protocol Adjustment Recommended</p>
                  <p className="text-[#6B665D] mt-1">Improvement appears stalled across recent check-ins. Re-analysis + reassessment will recalculate your protocol with updated signals.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => router.push(`/image-analyzer?category=${clinical.category}`)}
                      className="rounded-full bg-[#1F3D2B] px-4 py-2 text-xs font-semibold text-white"
                    >
                      Re-analyze Now
                    </button>
                    <button
                      onClick={() => router.push(`/assessment?category=${clinical.category}`)}
                      className="rounded-full border border-[#1F3D2B] px-4 py-2 text-xs font-semibold text-[#1F3D2B]"
                    >
                      Update Assessment
                    </button>
                  </div>
                </div>
              )}

              {timelineData && timelineData.deltas.length > 0 && (
                <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
                  <p className="font-semibold">Proof of Improvement Timeline</p>
                  <div className="mt-2 space-y-2">
                    {timelineData.deltas.map((delta, index) => (
                      <div key={`${delta.from_scan_date}-${delta.to_scan_date}-${index}`} className="rounded-lg border border-[#E2DDD3] bg-white px-3 py-2">
                        <p className="text-xs text-[#6B665D]">{new Date(delta.from_scan_date).toLocaleDateString()} → {new Date(delta.to_scan_date).toLocaleDateString()}</p>
                        <p className="text-sm">{delta.improvement_message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3">
              <p className="text-xs text-[#6B665D]">Upgrade to Plus for trend tracking and relapse risk analytics.</p>
              <button
                onClick={() => router.push("/settings")}
                className="rounded-full bg-[#1F3D2B] px-4 py-1.5 text-xs font-semibold text-white"
              >
                Upgrade
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
