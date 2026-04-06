"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Droplets,
  Flame,
  Gauge,
  HeartPulse,
  MoonStar,
  Pill,
  ScanLine,
  ShieldAlert,
  Sparkles,
  SunMedium,
  Target,
  TimerReset,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  ReferenceArea,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { categories, CategoryId } from "@/lib/questions";
import { recalculateClinicalScores } from "@/lib/recalculateClinicalScores";
import { calculateProgressMetricsForCategory } from "@/lib/calculateProgressMetrics";
import { productRecommendationLogic, type ProductJustification } from "@/lib/productRecommendationLogic";
import { getProgressTimeline, type ProgressTimeline } from "@/lib/progressTimeline";
import {
  generateDailyProtocolTasks,
  getCategoryRecoveryProfile,
  getCurrentProtocolPhase,
  getProtocolTemplate,
  getRecoveryLevelDisplay,
  normalizeRecoveryLevel,
  type ProtocolTask,
} from "@/lib/protocolTemplates";
import { resolveClinicalChildCategoryFromAny } from "@/lib/categorySync";
import { getRecoveryProgramLevel } from "@/lib/userProfile";
import TrendCharts, { type TrendPoint } from "@/components/dashboard/TrendCharts";
import EnhancedProductCard from "./_components/EnhancedProductCard";

type SubscriptionPlan = "basic" | "plus" | "pro";
type StageKey = "diagnose" | "execute" | "transform";

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

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function safeLabel(category: string) {
  return categories.find((item) => item.id === category)?.label || category.replace(/_/g, " ");
}

function normalizeDomainName(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildProtocolTimeline(severity: number, recoveryProbability: number) {
  const week1 = clamp(severity);
  const week2 = clamp(week1 - recoveryProbability * 0.22);
  const week3 = clamp(week2 - recoveryProbability * 0.18);
  const week4 = clamp(week3 - recoveryProbability * 0.15);
  return [week1, week2, week3, week4];
}

function buildTransformationCurve(severity: number, recoveryProbability: number) {
  const values = buildProtocolTimeline(severity, recoveryProbability);
  return [
    { label: "Today", severity: values[0], recovery: 0 },
    { label: "Week 1", severity: values[1], recovery: clamp(25 + recoveryProbability * 0.18) },
    { label: "Week 2", severity: values[2], recovery: clamp(45 + recoveryProbability * 0.24) },
    { label: "Week 4", severity: values[3], recovery: clamp(65 + recoveryProbability * 0.28) },
  ];
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
  return `Before: ${conditionLabel} is still being reinforced by repeated triggers and inconsistent recovery windows. After: with ${severityLabel.toLowerCase()} execution, you should see lower symptom intensity, better day-to-day control, and more stable confidence.`;
}

function parseHHMM(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function buildTrendData(
  timelineData: ProgressTimeline | null,
  progress: ProgressRow | null,
  clinical: ClinicalRow | null
): TrendPoint[] {
  if (!clinical) {
    return [];
  }

  const baselineConfidence = progress?.confidence_score ?? clinical.confidence_score ?? 60;
  const baselineAdherence = progress?.consistency_score ?? 64;

  if (timelineData?.snapshots.length) {
    const total = timelineData.snapshots.length;
    return timelineData.snapshots.map((snapshot, index) => {
      const progressShare = total === 1 ? 1 : index / (total - 1);
      const adherenceValue = clamp(baselineAdherence - 8 + progressShare * 14);
      const confidenceValue = clamp(baselineConfidence - 10 + progressShare * 18);

      return {
        label: index === 0 ? "Start" : `Scan ${index + 1}`,
        severity: clamp(snapshot.severity_snapshot),
        adherence: adherenceValue,
        confidence: confidenceValue,
      };
    });
  }

  const fallbackTimeline = buildProtocolTimeline(clinical.severity_score, clinical.recovery_probability);
  return fallbackTimeline.map((value, index) => ({
    label: index === 0 ? "Today" : `W${index}`,
    severity: clamp(value),
    adherence: clamp(baselineAdherence - 6 + index * 8),
    confidence: clamp(baselineConfidence - 8 + index * 7),
  }));
}

function groupTasks(tasks: ProtocolTask[]) {
  return {
    morning: tasks.filter((task) => task.slot === "morning"),
    lifestyle: tasks.filter((task) => task.slot === "lifestyle"),
    night: tasks.filter((task) => task.slot === "night"),
    weekly: tasks.filter((task) => task.slot === "weekly"),
  };
}

function isTaskWindowOpen(task: ProtocolTask, now: number) {
  if (!task.timeWindow) return true;
  const currentTime = new Date(now);
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes = parseHHMM(task.timeWindow.start);
  const endMinutes = parseHHMM(task.timeWindow.end);
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function SeverityRing({ value, label }: { value: number; label: string }) {
  const size = 172;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = clamp(value);
  const dashOffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="relative flex h-[172px] w-[172px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.92),rgba(245,236,223,0.92))] shadow-[inset_12px_12px_24px_rgba(255,255,255,0.9),inset_-14px_-14px_28px_rgba(210,196,176,0.6),0_18px_36px_rgba(40,44,32,0.12)]">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E7DED0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2F6F57"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8C6A5A]">Current severity</span>
        <span className="mt-1 text-5xl font-black text-[#1F3D2B]">{normalizedValue}</span>
        <span className="mt-1 max-w-[110px] text-xs font-semibold text-[#6B665D]">{label}</span>
      </div>
    </div>
  );
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
  const [currentProtocolDay, setCurrentProtocolDay] = useState(1);
  const [selectedProtocolDay, setSelectedProtocolDay] = useState(1);
  const [programLevel, setProgramLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [recommendedProducts, setRecommendedProducts] = useState<ResultProductCard[]>([]);
  const [aiGuidance, setAiGuidance] = useState<AiGuidance | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<StageKey>("diagnose");
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);
  const [activeTimerEndsAt, setActiveTimerEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const selectedCategoryId = clinical?.category as CategoryId | undefined;

  const protocolTemplate = useMemo(
    () => (selectedCategoryId ? getProtocolTemplate(selectedCategoryId) : null),
    [selectedCategoryId]
  );

  const protocolTasks = useMemo(
    () => (selectedCategoryId ? generateDailyProtocolTasks(selectedCategoryId, selectedProtocolDay, { toleranceMode: programLevel }) : []),
    [programLevel, selectedCategoryId, selectedProtocolDay]
  );

  const protocolPhaseName = useMemo(
    () => (protocolTemplate ? getCurrentProtocolPhase(protocolTemplate, selectedProtocolDay).name : "Stabilization"),
    [protocolTemplate, selectedProtocolDay]
  );

  const groupedProtocolTasks = useMemo(() => groupTasks(protocolTasks), [protocolTasks]);
  const completedTaskSet = useMemo(() => new Set(completedTaskIds), [completedTaskIds]);
  const chartData = useMemo(() => buildTrendData(timelineData, progress, clinical), [clinical, progress, timelineData]);
  const transformationCurve = useMemo(
    () => (clinical ? buildTransformationCurve(clinical.severity_score, clinical.recovery_probability) : []),
    [clinical]
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (activeTimerEndsAt && activeTimerEndsAt <= now) {
      setActiveTimerEndsAt(null);
      setActiveTimerTaskId(null);
    }
  }, [activeTimerEndsAt, now]);

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
          recommendationsResult.value.map((entry, index) => mapRecommendationToProductCard(entry, index, categoryId))
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

      setCurrentProtocolDay(derivedDayNumber);
      setSelectedProtocolDay(derivedDayNumber);
      setCompletedTaskIds([]);

      const [clinicalRes, subscriptionRes, globalRes, relapseRes, progressRes] = await Promise.all([
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

    void loadClinicalResult();
  }, [params, user]);

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
            severity: clinical.severity_score >= 75 ? "high" : clinical.severity_score >= 45 ? "moderate" : "mild",
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
      } catch (loadError) {
        if (!cancelled) {
          setGuidanceError(loadError instanceof Error ? loadError.message : "Could not generate guided routine.");
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
        <div className="rounded-2xl border border-[#E2DDD3] bg-white px-6 py-5 text-sm text-[#6B665D]">Building your recovery command center...</div>
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
          <h1 className="text-2xl font-bold text-[#1F3D2B]">Insufficient structured data to generate your recovery protocol.</h1>
          <p className="text-sm text-[#6B665D]">Complete a valid photo scan and at least 60% of the category assessment to unlock the full result page.</p>
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
  const topRootCauses = [...(clinical.root_cause_map || [])].sort((left, right) => right.impact_pct - left.impact_pct).slice(0, 4);
  const diagnosisSummary = overview?.clinical_description || recoveryProfile?.issueSummary || clinical.report_payload?.what_this_means || "Clinical interpretation is stabilizing.";
  const timelineSummary = buildTimelineSummary(projectedRecoveryDays, overview?.recovery_probability ?? clinical.recovery_probability);
  const beforeAfterExpectation = buildBeforeAfterExpectation(overview?.primary_condition || clinical.condition_label, severityStage.label);
  const currentSeverity = overview?.severity_score ?? clinical.severity_score;
  const currentConfidence = overview?.confidence_pct ?? clinical.confidence_score;
  const adherencePct = performance?.adherence_pct ?? progress?.consistency_score ?? 0;
  const selectedDayCompletionCount = protocolTasks.filter((task) => completedTaskSet.has(task.id)).length;
  const selectedDayCompletionPct = protocolTasks.length ? Math.round((selectedDayCompletionCount / protocolTasks.length) * 100) : 0;
  const firstVisibleShiftDay = projectedRecoveryDays > 0 ? Math.max(7, Math.round(projectedRecoveryDays * 0.4)) : clinical.recovery_probability >= 70 ? 10 : 14;
  const recheckDay = Math.min(30, Math.max(currentProtocolDay + 7, 14));
  const todayPriorityTask = groupedProtocolTasks.morning[0] || groupedProtocolTasks.lifestyle[0] || groupedProtocolTasks.night[0] || protocolTasks[0] || null;
  const activeTimerRemaining = activeTimerEndsAt ? Math.max(0, Math.floor((activeTimerEndsAt - now) / 1000)) : 0;
  const currentTransformationLabel = currentProtocolDay <= 1 ? "Today" : currentProtocolDay <= 7 ? "Week 1" : currentProtocolDay <= 21 ? "Week 2" : "Week 4";
  const todayTaskSteps = todayPriorityTask ? splitTaskSteps(todayPriorityTask.howTo) : [];
  const todayTimerProgress = todayPriorityTask
    ? activeTimerTaskId === todayPriorityTask.id && activeTimerEndsAt
      ? Math.round((activeTimerRemaining / Math.max(1, Number(todayPriorityTask.durationMin || 3) * 60)) * 100)
      : 100
    : 0;
  const stageProgress = {
    diagnose: Math.max(70, clinical.assessment_completeness),
    execute: selectedProtocolDay === currentProtocolDay ? Math.max(selectedDayCompletionPct, Math.round((currentProtocolDay / 30) * 100)) : Math.round((currentProtocolDay / 30) * 100),
    transform: Math.max(progress?.improvement_pct ?? 0, Math.round((clinical.recovery_probability + currentConfidence) / 2)),
  };

  const stageCards: Array<{ key: StageKey; kicker: string; title: string; body: string; progress: number }> = [
    {
      key: "diagnose",
      kicker: "Diagnose",
      title: "Pinpoint what is driving the issue",
      body: "Your scan signals, assessment answers, and domain scores are already merged into one recovery model.",
      progress: stageProgress.diagnose,
    },
    {
      key: "execute",
      kicker: "Execute",
      title: "Follow the right actions in the right window",
      body: "The routine below is day-aware, category-specific, and tuned to your current track and recovery level.",
      progress: stageProgress.execute,
    },
    {
      key: "transform",
      kicker: "Transform",
      title: "Track proof, not just promises",
      body: "Severity, adherence, and confidence are visualized together so you can see whether recovery is compounding.",
      progress: stageProgress.transform,
    },
  ];

  const metricCards = [
    {
      title: "Severity pressure",
      value: `${currentSeverity}/100`,
      pct: currentSeverity,
      icon: Activity,
      color: getMetricTone(currentSeverity, true).color,
      surface: getMetricTone(currentSeverity, true).surface,
      note: (progress?.scans_count ?? 0) > 1 ? `${Math.abs(progress?.improvement_pct ?? 0)}% vs first checkpoint` : "Based on your latest scan",
      direction: (progress?.improvement_pct ?? 0) >= 0 ? "down" : "up",
      status: getMetricTone(currentSeverity, true).status,
    },
    {
      title: "Recovery probability",
      value: `${overview?.recovery_probability ?? clinical.recovery_probability}%`,
      pct: overview?.recovery_probability ?? clinical.recovery_probability,
      icon: TrendingUp,
      color: getMetricTone(overview?.recovery_probability ?? clinical.recovery_probability).color,
      surface: getMetricTone(overview?.recovery_probability ?? clinical.recovery_probability).surface,
      note: `${Math.max(3, Math.round((projectedRecoveryDays || 28) / 7))}-week recovery path`,
      direction: (overview?.recovery_probability ?? clinical.recovery_probability) >= 60 ? "up" : "down",
      status: getMetricTone(overview?.recovery_probability ?? clinical.recovery_probability).status,
    },
    {
      title: "Routine adherence",
      value: `${adherencePct}%`,
      pct: adherencePct,
      icon: Target,
      color: getMetricTone(adherencePct).color,
      surface: getMetricTone(adherencePct).surface,
      note: selectedDayCompletionPct > 0 ? `${selectedDayCompletionPct}% of today complete` : "Today is still open",
      direction: adherencePct >= 70 ? "up" : "down",
      status: getMetricTone(adherencePct).status,
    },
    {
      title: "Confidence score",
      value: `${currentConfidence}%`,
      pct: currentConfidence,
      icon: Sparkles,
      color: getMetricTone(currentConfidence).color,
      surface: getMetricTone(currentConfidence).surface,
      note: `${clinical.assessment_completeness}% assessment completeness`,
      direction: currentConfidence >= 65 ? "up" : "down",
      status: getMetricTone(currentConfidence).status,
    },
  ];

  const dailyFlowCards = [
    {
      key: "morning",
      title: "Morning activation",
      icon: SunMedium,
      summary: schedule?.morning || "Set the day up with the lowest-friction corrective steps first.",
      tasks: groupedProtocolTasks.morning,
    },
    {
      key: "lifestyle",
      title: "Daytime control",
      icon: HeartPulse,
      summary: recoveryProfile?.benefitSummary || "Protect the routine through food, hydration, sweat control, and commute-safe habits.",
      tasks: groupedProtocolTasks.lifestyle,
    },
    {
      key: "night",
      title: "Night repair",
      icon: MoonStar,
      summary: schedule?.night || "Night actions should reduce rebound, repair damage, and protect tomorrow's recovery window.",
      tasks: groupedProtocolTasks.night,
    },
  ];

  const jumpToStage = (stage: StageKey) => {
    setActiveStage(stage);
    const target = document.getElementById(stage);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const startTaskTimer = (task: ProtocolTask) => {
    const durationMinutes = Math.max(1, Number(task.durationMin || 3));
    setActiveTimerTaskId(task.id);
    setActiveTimerEndsAt(Date.now() + durationMinutes * 60 * 1000);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setCompletedTaskIds((current) => (
      current.includes(taskId) ? current.filter((value) => value !== taskId) : [...current, taskId]
    ));
  };

  return (
    <div className="af-page-shell min-h-screen bg-[#F4EFE6] text-[#1F3D2B]">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 pb-28 md:px-8 md:py-10 md:pb-10">
        <section className="af-card-primary overflow-hidden p-5 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr] lg:items-center">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#8C6A5A]">
                <span className="rounded-full border border-[#DCCFBD] bg-[#FBF7F0] px-3 py-1">Protocol Results</span>
                <span className="rounded-full border border-[#DCCFBD] bg-white px-3 py-1">{safeLabel(clinical.category)}</span>
                <span className="rounded-full border border-[#C8DACF] bg-[#EAF3EE] px-3 py-1 text-[#2F6F57]">{getRecoveryLevelDisplay(programLevel).label}</span>
                <span className="rounded-full border border-[#F1D1B9] bg-[#FFF4EA] px-3 py-1 text-[#B16035]">Based on your latest scan</span>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#B16035]">Focus now: {topRootCauses[0] ? normalizeDomainName(topRootCauses[0].domain) : "tight execution"}</p>
                <h1 className="max-w-3xl text-3xl font-black tracking-tight text-[#183223] md:text-5xl">
                  Your recovery protocol is now organized into one action-first command center.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-[#5D574E] md:text-base">
                  {diagnosisSummary.split(".")[0]}. See what matters, act on the next step, and track whether recovery is compounding.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-[#E2DDD3] bg-white/80 p-4 shadow-[inset_8px_8px_16px_rgba(255,255,255,0.7),inset_-10px_-10px_18px_rgba(225,214,198,0.45)]">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Current diagnosis</p>
                  <p className="mt-2 text-lg font-bold text-[#1F3D2B]">{overview?.primary_condition || clinical.condition_label}</p>
                  <p className="mt-1 text-sm text-[#6B665D]">{severityStage.label}</p>
                </div>
                <div className="rounded-[1.5rem] border border-[#E2DDD3] bg-white/80 p-4 shadow-[inset_8px_8px_16px_rgba(255,255,255,0.7),inset_-10px_-10px_18px_rgba(225,214,198,0.45)]">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">First visible shift</p>
                  <p className="mt-2 text-lg font-bold text-[#1F3D2B]">Day {firstVisibleShiftDay}</p>
                  <p className="mt-1 text-sm text-[#6B665D]">Early control should be noticeable if adherence stays strong.</p>
                </div>
                <div className="rounded-[1.5rem] border border-[#E2DDD3] bg-white/80 p-4 shadow-[inset_8px_8px_16px_rgba(255,255,255,0.7),inset_-10px_-10px_18px_rgba(225,214,198,0.45)]">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Next re-check</p>
                  <p className="mt-2 text-lg font-bold text-[#1F3D2B]">Day {recheckDay}</p>
                  <p className="mt-1 text-sm text-[#6B665D]">Use this as the next checkpoint for scans and protocol adjustment.</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {stageCards.map((stage) => (
                  <button
                    key={stage.key}
                    onClick={() => jumpToStage(stage.key)}
                    className={`rounded-[1.6rem] border p-4 text-left transition-all ${activeStage === stage.key ? "border-[#2F6F57] bg-[#EFF6F1] shadow-[0_16px_32px_rgba(47,111,87,0.12)]" : "border-[#E2DDD3] bg-white hover:border-[#D2C5B4] hover:bg-[#FCFAF6]"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8C6A5A]">{stage.kicker}</p>
                        <p className="mt-1 text-base font-bold text-[#1F3D2B]">{stage.title}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#8C6A5A]" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#655F56]">{stage.body}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8E1D4]">
                      <div className="h-full rounded-full bg-[#2F6F57]" style={{ width: `${stage.progress}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[#2F6F57]">{stage.progress}% complete</p>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => jumpToStage("execute")} className="rounded-full bg-[#1F3D2B] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(31,61,43,0.22)]">
                  Start Routine
                </button>
                <button onClick={() => router.push("/dashboard")} className="rounded-full border border-[#1F3D2B] bg-white px-5 py-3 text-sm font-semibold text-[#1F3D2B]">
                  Open Dashboard
                </button>
                <button onClick={() => router.push("/challenges")} className="rounded-full border border-[#DCCFBD] bg-[#FBF7F0] px-5 py-3 text-sm font-semibold text-[#5D574E]">
                  Add Challenge Layer
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-center rounded-[2rem] border border-[#E2DDD3] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(244,235,223,0.94))] p-6 shadow-[0_24px_40px_rgba(52,54,40,0.12)]">
                <SeverityRing value={currentSeverity} label={severityStage.label} />
              </div>

              <div className="rounded-[1.8rem] border border-[#E2DDD3] bg-white p-5 shadow-[0_12px_28px_rgba(17,17,17,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Improvement timeline</p>
                    <p className="mt-2 text-lg font-bold text-[#1F3D2B]">{timelineSummary}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-[#2F6F57]" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[1.25rem] bg-[#F8F4EC] px-4 py-3">
                    <p className="text-xs text-[#8C6A5A]">Urgency</p>
                    <p className="mt-1 font-bold text-[#1F3D2B]">{overview?.risk_level ?? clinical.risk_level}</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-[#F8F4EC] px-4 py-3">
                    <p className="text-xs text-[#8C6A5A]">Recovery chance</p>
                    <p className="mt-1 font-bold text-[#1F3D2B]">{overview?.recovery_probability ?? clinical.recovery_probability}%</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-[#F8F4EC] px-4 py-3">
                    <p className="text-xs text-[#8C6A5A]">Scan confidence</p>
                    <p className="mt-1 font-bold text-[#1F3D2B]">{currentConfidence}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="diagnose" className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="af-surface-card rounded-[2rem] border border-[#E2DDD3] bg-white p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8C6A5A]">Recovery dashboard</p>
                <h2 className="mt-2 text-2xl font-black text-[#1F3D2B]">The four numbers that define your next month</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-[#5D574E]">These scores explain how heavy the issue is right now, how realistic recovery looks, and how disciplined execution needs to be to accelerate results.</p>
              </div>
              <div className="rounded-full border border-[#DCCFBD] bg-[#FBF7F0] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">{progress?.scans_count ?? 0} scan checkpoints</div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metricCards.map((metric) => {
                const Icon = metric.icon;
                const TrendIcon = metric.direction === "up" ? ArrowUpRight : ArrowDownRight;
                return (
                  <div key={metric.title} className="af-card-secondary p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="rounded-2xl p-3" style={{ backgroundColor: metric.surface }}>
                        <Icon className="h-5 w-5" style={{ color: metric.color }} />
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-[#1F3D2B]">{metric.value}</span>
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em]" style={{ backgroundColor: metric.surface, color: metric.color }}>
                          <TrendIcon className="h-3.5 w-3.5" /> {metric.status}
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-bold text-[#1F3D2B]">{metric.title}</p>
                    <p className="mt-1 text-xs leading-6 text-[#6B665D]">{metric.note}</p>
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: metric.color }}>
                      <TrendIcon className="h-3.5 w-3.5" /> {metric.direction === "up" ? "Improving direction" : "Needs recovery push"}
                    </div>
                    <div className="af-progress-track mt-4 h-2">
                      <div
                        className="af-progress-fill animate-progress"
                        style={{ width: `${metric.pct}%`, ["--progress-target" as string]: `${metric.pct}%`, background: `linear-gradient(90deg, ${metric.color} 0%, ${metric.color}CC 100%)` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.5rem] bg-[#F8F4EC] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">What this means</p>
                <p className="mt-2 text-sm leading-7 text-[#5D574E]">{clinical.report_payload?.what_this_means || diagnosisSummary}</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#F8F4EC] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Program level</p>
                <p className="mt-2 text-lg font-bold text-[#1F3D2B]">{getRecoveryLevelDisplay(programLevel).label}</p>
                <p className="mt-1 text-sm leading-7 text-[#5D574E]">{getRecoveryLevelDisplay(programLevel).description}</p>
              </div>
              <div className="rounded-[1.5rem] bg-[#F8F4EC] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Protocol status</p>
                <p className="mt-2 text-lg font-bold text-[#1F3D2B]">Day {currentProtocolDay} of 30</p>
                <p className="mt-1 text-sm leading-7 text-[#5D574E]">{progress?.trend_message || "Execution has started. Recovery proof gets stronger as the routine compounds."}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="af-surface-card rounded-[2rem] border border-[#E2DDD3] bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8C6A5A]">Ranked root causes</p>
              <h2 className="mt-2 text-2xl font-black text-[#1F3D2B]">Fix these levers first</h2>
              <div className="mt-5 space-y-3">
                {topRootCauses.length > 0 ? topRootCauses.map((item, index) => (
                  <div key={item.domain} className="rounded-[1.4rem] border border-[#E7DFD2] bg-[#FFFCF8] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8C6A5A]">#{index + 1} driver</p>
                        <p className="mt-1 text-base font-bold text-[#1F3D2B]">{normalizeDomainName(item.domain)}</p>
                      </div>
                      <div className="rounded-full bg-[#EFF6F1] px-3 py-1 text-sm font-black text-[#2F6F57]">{item.impact_pct}% impact</div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8E1D4]">
                      <div className="h-full rounded-full bg-[#2F6F57]" style={{ width: `${item.impact_pct}%` }} />
                    </div>
                    <p className="mt-3 text-xs leading-6 text-[#6B665D]">Domain score {item.score}. This is one of the strongest reasons your condition is still being reinforced today.</p>
                  </div>
                )) : (
                  <p className="text-sm text-[#6B665D]">Root-cause ranking will sharpen as more scans and assessment inputs are added.</p>
                )}
              </div>
            </div>

            <div className="af-surface-card rounded-[2rem] border border-[#E2DDD3] bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8C6A5A]">Expected transformation</p>
              <h2 className="mt-2 text-2xl font-black text-[#1F3D2B]">What recovery should feel like if you execute cleanly</h2>
              <p className="mt-3 text-sm leading-7 text-[#5D574E]">{beforeAfterExpectation}</p>
              <div className="mt-5 h-60 rounded-[1.5rem] border border-[#E7DFD2] bg-[#FFFCF8] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={transformationCurve} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <ReferenceArea y1={70} y2={100} fill="#FFF3D9" fillOpacity={0.4} />
                    <CartesianGrid stroke="#EFE7DB" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#8C6A5A", fontSize: 11, fontWeight: 800 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8C6A5A", fontSize: 11, fontWeight: 800 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ borderRadius: "14px", border: "none", boxShadow: "0 12px 28px rgba(17,17,17,0.12)", fontSize: "12px" }}
                      formatter={(value: number | undefined, name: string | undefined) => [`${clamp(Number(value || 0))}%`, name === "severity" ? "Residual severity" : "Recovery progress"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="severity"
                      stroke="#A95F3B"
                      strokeWidth={4}
                      label={{ fill: "#A95F3B", fontSize: 10, fontWeight: 700, position: "top" }}
                      dot={(dotProps) => (
                        <circle cx={dotProps.cx} cy={dotProps.cy} r={dotProps.payload?.label === currentTransformationLabel ? 6 : 4} fill="#A95F3B" stroke="#fff" strokeWidth={2} />
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="recovery"
                      stroke="#2F6F57"
                      strokeWidth={4}
                      label={{ fill: "#2F6F57", fontSize: 10, fontWeight: 700, position: "bottom" }}
                      dot={(dotProps) => (
                        <circle cx={dotProps.cx} cy={dotProps.cy} r={dotProps.payload?.label === currentTransformationLabel ? 6 : 4} fill="#2F6F57" stroke="#fff" strokeWidth={2} />
                      )}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className={`rounded-[1.35rem] px-4 py-3 ${currentTransformationLabel === "Week 1" ? "bg-[#FFF7E8] ring-1 ring-[#A46A2D]/25" : "bg-[#F8F4EC]"}`}>
                  <p className="text-xs text-[#8C6A5A]">Week 1</p>
                  <p className="mt-1 text-sm font-semibold text-[#1F3D2B]">Stabilize triggers and reduce volatility.</p>
                </div>
                <div className={`rounded-[1.35rem] px-4 py-3 ${currentTransformationLabel === "Week 2" ? "bg-[#EAF3EE] ring-1 ring-[#2F6F57]/20" : "bg-[#F8F4EC]"}`}>
                  <p className="text-xs text-[#8C6A5A]">Week 2-3</p>
                  <p className="mt-1 text-sm font-semibold text-[#1F3D2B]">Build visible control and cleaner day-to-day consistency.</p>
                </div>
                <div className={`rounded-[1.35rem] px-4 py-3 ${currentTransformationLabel === "Week 4" ? "bg-[#EEF1FF] ring-1 ring-[#5C5A8A]/20" : "bg-[#F8F4EC]"}`}>
                  <p className="text-xs text-[#8C6A5A]">Week 4</p>
                  <p className="mt-1 text-sm font-semibold text-[#1F3D2B]">Confirm progress with scans and decide the next correction layer.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="execute" className="af-surface-card rounded-[2rem] border border-[#E2DDD3] bg-white p-6 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8C6A5A]">Today&apos;s priority</p>
              <h2 className="mt-2 text-2xl font-black text-[#1F3D2B]">Do the next right action before thinking about the full month</h2>
              <p className="mt-2 text-sm leading-7 text-[#5D574E]">The highest-value move for today is shown first, then the day unfolds by slot. This makes the protocol easier to execute on mobile without losing precision.</p>
            </div>
            <div className="rounded-[1.5rem] border border-[#E2DDD3] bg-[#FBF7F0] px-4 py-3 text-sm font-semibold text-[#5D574E]">
              Day {selectedProtocolDay} · {protocolPhaseName}
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className={`af-card-primary p-5 ${activeTimerTaskId === todayPriorityTask?.id ? "shadow-[0_24px_40px_rgba(47,111,87,0.18)]" : ""}`}>
              {todayPriorityTask ? (
                <>
                  <div className="grid gap-5 lg:grid-cols-[1fr_140px] lg:items-start">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Primary move</p>
                          <h3 className="mt-2 text-2xl font-black text-[#1F3D2B]">{todayPriorityTask.label}</h3>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#2F6F57]">{todayPriorityTask.slot}</div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#B16035]">+{todayPriorityTask.reward || 1} Alpha Sikka</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#2F6F57]">{todayPriorityTask.timeWindow ? `${todayPriorityTask.timeWindow.start} - ${todayPriorityTask.timeWindow.end}` : "Flexible window"}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#8C6A5A]">{todayPriorityTask.durationMin || 3} min</span>
                      </div>
                      <div className="mt-5 space-y-3">
                        {todayTaskSteps.map((step, index) => (
                          <div key={`${todayPriorityTask.id}-step-${index}`} className="flex items-start gap-3 rounded-[1.15rem] bg-white/85 px-4 py-3 text-sm text-[#4F4A43]">
                            <CircleDot className="mt-0.5 h-4 w-4 text-[#2F6F57]" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                      {todayPriorityTask.whyItHelps ? <p className="mt-4 text-sm font-medium text-[#2F6F57]">{todayPriorityTask.whyItHelps}</p> : null}
                    </div>
                    <div className="flex justify-center lg:justify-end">
                      <TimerRing value={todayTimerProgress} label={activeTimerTaskId === todayPriorityTask.id && activeTimerRemaining > 0 ? formatCountdown(activeTimerRemaining) : `${todayPriorityTask.durationMin || 3} min`} active={activeTimerTaskId === todayPriorityTask.id && activeTimerRemaining > 0} />
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() => startTaskTimer(todayPriorityTask)}
                      className="rounded-full bg-[#1F3D2B] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(31,61,43,0.18)]"
                    >
                      {activeTimerTaskId === todayPriorityTask.id && activeTimerRemaining > 0 ? `Routine live ${formatCountdown(activeTimerRemaining)}` : "Start Routine"}
                    </button>
                    <button
                      onClick={() => toggleTaskCompletion(todayPriorityTask.id)}
                      className={`rounded-full px-5 py-3 text-sm font-semibold ${completedTaskSet.has(todayPriorityTask.id) ? "bg-[#E8F4EE] text-[#2F6F57]" : "border border-[#1F3D2B] text-[#1F3D2B]"}`}
                    >
                      {completedTaskSet.has(todayPriorityTask.id) ? "Completed" : "Mark complete"}
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-[#6B665D]">Today&apos;s lead task will appear when the category protocol has enough structure.</p>
              )}
            </div>

            <div className="rounded-[1.8rem] border border-[#E8E0D2] bg-[#FFFCF8] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Coach note</p>
                  <h3 className="mt-2 text-xl font-black text-[#1F3D2B]">Guided daily strategy</h3>
                </div>
                <button
                  onClick={() => setAiGuidance(null)}
                  className="rounded-full border border-[#E2DDD3] px-3 py-1.5 text-xs font-semibold text-[#1F3D2B]"
                >
                  Refresh later
                </button>
              </div>

              {guidanceLoading ? <p className="mt-4 text-sm text-[#6B665D]">Generating your guided routine plan...</p> : null}
              {guidanceError ? <p className="mt-4 rounded-2xl bg-[#FFF4EF] px-4 py-3 text-sm text-[#8C4C3A]">{guidanceError}</p> : null}

              {aiGuidance ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm leading-7 text-[#5D574E]">{aiGuidance.summary}</p>
                  <div className="space-y-2">
                    {aiGuidance.actions.slice(0, 4).map((action, index) => (
                      <div key={`${action}-${index}`} className="flex items-start gap-3 rounded-[1.15rem] bg-[#F8F4EC] px-4 py-3 text-sm text-[#4F4A43]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#2F6F57]" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-[#8C6A5A]">Source: {aiGuidance.source === "ai" ? "AI guided" : "Local fallback guidance"}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="af-surface-card rounded-[2rem] border border-[#E2DDD3] bg-white p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8C6A5A]">30-day protocol</p>
              <h2 className="mt-2 text-2xl font-black text-[#1F3D2B]">Move through the month one precise day at a time</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5D574E]">Each day pulls from your category-specific protocol template. Switch days to preview what changes as the protocol moves from stabilization to correction and reinforcement.</p>
            </div>
            <div className="rounded-[1.5rem] bg-[#F8F4EC] px-4 py-3 text-sm text-[#5D574E]">
              Current live day: <span className="font-bold text-[#1F3D2B]">{currentProtocolDay}</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
              <button
                key={day}
                onClick={() => setSelectedProtocolDay(day)}
                className={`min-w-[60px] rounded-[1rem] border px-4 py-3 text-sm font-bold transition-all ${selectedProtocolDay === day ? "border-[#2F6F57] bg-[#EAF3EE] text-[#2F6F57]" : day === currentProtocolDay ? "border-[#C08A39] bg-[#FFF7E8] text-[#A46A2D]" : "border-[#E2DDD3] bg-[#FFFCF8] text-[#5D574E]"}`}
              >
                D{day}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[1.8rem] border border-[#E8E0D2] bg-[#FFFCF8] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Day {selectedProtocolDay}</p>
                  <h3 className="mt-1 text-xl font-black text-[#1F3D2B]">{protocolPhaseName} execution map</h3>
                </div>
                <div className="rounded-full bg-[#EFF6F1] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[#2F6F57]">{selectedDayCompletionPct}% complete</div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8E1D4]">
                <div className="h-full rounded-full bg-[#2F6F57]" style={{ width: `${selectedDayCompletionPct}%` }} />
              </div>

              <div className="mt-5 space-y-4">
                {protocolTasks.length > 0 ? protocolTasks.map((task) => {
                  const activeTimerForTask = activeTimerTaskId === task.id && activeTimerRemaining > 0;
                  const windowOpen = selectedProtocolDay === currentProtocolDay && isTaskWindowOpen(task, now);
                  const isCompleted = completedTaskSet.has(task.id);
                  const canComplete = selectedProtocolDay === currentProtocolDay ? windowOpen : false;
                  const { Icon, accent, tint, badge } = getTaskVisual(task);
                  const taskSteps = splitTaskSteps(task.howTo);
                  const ingredient = getTaskIngredient(task);

                  return (
                    <div key={task.id} className="af-card-secondary p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: tint }}>
                              <Icon className="h-5 w-5" style={{ color: accent }} />
                            </span>
                            <span className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]" style={{ backgroundColor: tint, color: accent }}>{badge}</span>
                            <span className="rounded-full bg-[#EFF6F1] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#2F6F57]">+{task.reward || 1} reward</span>
                            {task.timeWindow ? <span className="rounded-full bg-[#FFF7E8] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#A46A2D]">{task.timeWindow.start} - {task.timeWindow.end}</span> : null}
                          </div>
                          <h4 className="text-lg font-bold text-[#1F3D2B]">{task.label}</h4>
                          <div className="space-y-2">
                            {taskSteps.map((step, index) => (
                              <div key={`${task.id}-step-${index}`} className="flex items-start gap-3 rounded-[1rem] bg-white/80 px-3 py-2 text-sm text-[#4F4A43]">
                                <CircleDot className="mt-0.5 h-4 w-4 text-[#2F6F57]" />
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#6B665D]">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1"><Clock3 className="h-3.5 w-3.5" /> {task.durationMin || 3} min</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1"><Zap className="h-3.5 w-3.5" /> {task.frequency.replace(/_/g, " ")}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1"><Pill className="h-3.5 w-3.5" /> {ingredient}</span>
                          </div>
                          {task.whyItHelps ? <p className="text-sm font-medium text-[#2F6F57]">{task.whyItHelps}</p> : null}
                        </div>
                        <div className="grid gap-2 sm:min-w-[220px]">
                          <button
                            onClick={() => startTaskTimer(task)}
                            className="rounded-full bg-[#1F3D2B] px-4 py-2.5 text-sm font-semibold text-white"
                          >
                            {activeTimerForTask ? `Running ${formatCountdown(activeTimerRemaining)}` : "Start task"}
                          </button>
                          <button
                            onClick={() => canComplete || isCompleted ? toggleTaskCompletion(task.id) : undefined}
                            className={`rounded-full px-4 py-2.5 text-sm font-semibold ${isCompleted ? "bg-[#E8F4EE] text-[#2F6F57]" : canComplete ? "border border-[#2F6F57] text-[#2F6F57]" : "border border-[#E2DDD3] text-[#9B9488]"}`}
                          >
                            {isCompleted ? "Completed" : canComplete ? "Complete now" : selectedProtocolDay !== currentProtocolDay ? "Locked to live day" : task.timeWindow ? `Unlocks in ${task.timeWindow.start}` : "Locked"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-[#6B665D]">Protocol tasks will appear after valid category protocol initialization.</p>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="af-card-secondary p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Phase guide</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-[#5D574E]">
                  <div className="flex items-start gap-3 rounded-[1.3rem] bg-[#FFF7E8] px-4 py-3"><Flame className="mt-1 h-4 w-4 text-[#A46A2D]" /><div><span className="font-bold text-[#1F3D2B]">Stabilize:</span> {protocol?.phase_1 || "Reduce the main triggers and make the routine easy to repeat."}</div></div>
                  <div className="flex items-start gap-3 rounded-[1.3rem] bg-[#EAF3EE] px-4 py-3"><BadgeCheck className="mt-1 h-4 w-4 text-[#2F6F57]" /><div><span className="font-bold text-[#1F3D2B]">Correct:</span> {protocol?.phase_2 || "Increase the corrective pressure only after the skin or body adapts."}</div></div>
                  <div className="flex items-start gap-3 rounded-[1.3rem] bg-[#EEF1FF] px-4 py-3"><Sparkles className="mt-1 h-4 w-4 text-[#5C5A8A]" /><div><span className="font-bold text-[#1F3D2B]">Reinforce:</span> {protocol?.phase_3 || "Lock in results and reduce the chance of rebound."}</div></div>
                </div>
              </div>

              {groupedProtocolTasks.weekly.length > 0 ? (
                <div className="rounded-[1.8rem] border border-[#E8E0D2] bg-[#FFFCF8] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Weekly reset</p>
                  <div className="mt-3 space-y-3">
                    {groupedProtocolTasks.weekly.map((task) => (
                      <div key={task.id} className="rounded-[1.2rem] bg-[#F8F4EC] px-4 py-3">
                        <p className="font-bold text-[#1F3D2B]">{task.label}</p>
                        <p className="mt-1 text-sm leading-6 text-[#5D574E]">{task.howTo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="af-card-secondary p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Execution note</p>
                <p className="mt-3 text-sm leading-7 text-[#5D574E]">{severityStage.summary}</p>
                <div className="mt-4 rounded-[1.3rem] bg-[#FFF7E8] px-4 py-3 text-sm text-[#A46A2D]">
                  <p className="font-bold">Important</p>
                  <p className="mt-1">Consistency is more valuable than forcing extra intensity inside this phase.</p>
                </div>
                {recoveryProfile?.whenToEscalate?.length ? (
                  <div className="mt-4 rounded-[1.3rem] bg-[#FFF4EF] px-4 py-3 text-sm text-[#7A3E2B]">
                    <p className="font-bold">Escalate for medical review if you notice:</p>
                    <p className="mt-1">{recoveryProfile.whenToEscalate.slice(0, 2).join(" • ")}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="af-surface-card rounded-[2rem] border border-[#E2DDD3] bg-white p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8C6A5A]">Daily flow</p>
              <h2 className="mt-2 text-2xl font-black text-[#1F3D2B]">Run the protocol in the order your day actually happens</h2>
            </div>
            <div className="rounded-[1.4rem] bg-[#F8F4EC] px-4 py-3 text-sm text-[#5D574E]">Day flow view is built from your current category template and routine schedule.</div>
          </div>

          <div className="mt-6 overflow-x-auto pb-2">
            <div className="flex min-w-[860px] items-stretch gap-4">
              {dailyFlowCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div key={card.key} className="flex items-center gap-4">
                    <div className="af-card-secondary w-[260px] p-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-[#EEF4EF] p-3">
                          <Icon className="h-5 w-5 text-[#2F6F57]" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">{card.title}</p>
                          <p className="mt-1 text-sm text-[#5D574E]">{card.summary}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {card.tasks.length > 0 ? card.tasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="rounded-[1.2rem] bg-[#F8F4EC] px-4 py-3 text-sm text-[#4F4A43]">
                            <p className="font-semibold text-[#1F3D2B]">{task.label}</p>
                            <p className="mt-1 text-xs leading-6 text-[#6B665D]">{task.timeWindow ? `${task.timeWindow.start} - ${task.timeWindow.end}` : "Flexible"} · {task.durationMin || 3} min</p>
                          </div>
                        )) : (
                          <div className="rounded-[1.2rem] bg-[#F8F4EC] px-4 py-3 text-sm text-[#6B665D]">No tasks scheduled in this slot for the selected day.</div>
                        )}
                      </div>
                    </div>
                    {index < dailyFlowCards.length - 1 ? <ArrowRight className="h-5 w-5 text-[#A46A2D]" /> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="af-surface-card rounded-[2rem] border border-[#E2DDD3] bg-white p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8C6A5A]">Guided recommendations</p>
              <h2 className="mt-2 text-2xl font-black text-[#1F3D2B]">Products are here to support the protocol, not replace it</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5D574E]">Each recommendation is framed around why it helps, how to use it, and what part of the routine it supports.</p>
            </div>
            <div className="rounded-[1.5rem] bg-[#F8F4EC] px-4 py-3 text-sm text-[#5D574E]">{productLogic?.target_symptom || "Recommendations are aligned to the main symptom cluster detected in your analysis."}</div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.4rem] bg-[#F8F4EC] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Why this stack</p>
              <p className="mt-2 text-sm leading-7 text-[#5D574E]">{productLogic?.why_recommended || recoveryProfile?.benefitSummary || "The product stack is chosen to target the visible symptom while protecting routine adherence."}</p>
            </div>
            <div className="rounded-[1.4rem] bg-[#F8F4EC] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Timeline expectation</p>
              <p className="mt-2 text-sm leading-7 text-[#5D574E]">{productLogic?.timeline_expectation || timelineSummary}</p>
            </div>
            <div className="rounded-[1.4rem] bg-[#F8F4EC] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Safety note</p>
              <p className="mt-2 text-sm leading-7 text-[#5D574E]">Introduce support products inside the time windows already shown above. Do not stack new actives faster than the current phase allows.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-[#C8DACF] bg-[#E8F4EE] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#2F6F57]">Recommended by experts</span>
            <span className="rounded-full border border-[#E2DDD3] bg-[#FFF8EF] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#A46A2D]">Used by 10k+ users</span>
            <span className="rounded-full border border-[#F1D1B9] bg-[#FFF4EA] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#B16035]">Best results with routine adherence</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recommendedProducts.length > 0 ? recommendedProducts.map((product) => (
              <EnhancedProductCard key={product.id} product={product} />
            )) : (
              <div className="rounded-[1.6rem] border border-dashed border-[#D8CBB8] bg-[#FFFCF8] p-6 text-sm text-[#6B665D]">Recommendations will appear once the product logic finishes mapping support products to your category and severity profile.</div>
            )}
          </div>
        </section>

        <section id="transform" className="af-surface-card rounded-[2rem] border border-[#E2DDD3] bg-white p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8C6A5A]">Transformation proof</p>
              <h2 className="mt-2 text-2xl font-black text-[#1F3D2B]">Track severity, adherence, and confidence together</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5D574E]">These charts are designed to show whether recovery is actually compounding. Falling severity without adherence is fragile. Rising adherence without confidence may mean the diagnosis needs a checkpoint.</p>
            </div>
            <div className="rounded-[1.5rem] bg-[#F8F4EC] px-4 py-3 text-sm text-[#5D574E]">Charts use your available scan history and progress metrics. More checkpoints make the curves more accurate.</div>
          </div>

          <TrendCharts data={chartData} />

          <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-[1.8rem] border border-[#E8E0D2] bg-[#FFFCF8] p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Performance matrix</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] bg-[#F8F4EC] px-4 py-3"><p className="text-xs text-[#8C6A5A]">Improvement</p><p className="mt-1 text-xl font-black text-[#1F3D2B]">{progress?.improvement_pct ?? 0}%</p></div>
                <div className="rounded-[1.25rem] bg-[#F8F4EC] px-4 py-3"><p className="text-xs text-[#8C6A5A]">Consistency</p><p className="mt-1 text-xl font-black text-[#1F3D2B]">{progress?.consistency_score ?? 0}</p></div>
                <div className="rounded-[1.25rem] bg-[#F8F4EC] px-4 py-3"><p className="text-xs text-[#8C6A5A]">Recovery velocity</p><p className="mt-1 text-xl font-black text-[#1F3D2B]">{progress?.recovery_velocity ?? 0}</p></div>
                <div className="rounded-[1.25rem] bg-[#F8F4EC] px-4 py-3"><p className="text-xs text-[#8C6A5A]">Inflammation reduction</p><p className="mt-1 text-xl font-black text-[#1F3D2B]">{progress?.inflammation_reduction_rate ?? 0}%</p></div>
              </div>
              <div className="mt-4 rounded-[1.35rem] bg-[#EFF6F1] px-4 py-3 text-sm text-[#2F6F57]">
                {progress?.trend_message || "Trend data will become more precise after more scan checkpoints."}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-[#E8E0D2] bg-[#FFFCF8] p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Risk if ignored</p>
              <p className="mt-3 text-sm leading-7 text-[#5D574E]">{clinical.report_payload?.risk_if_ignored || "If execution is inconsistent, the condition can rebound even after short-term gains."}</p>
              {relapseRisk ? (
                <div className="mt-4 rounded-[1.35rem] bg-[#FFF4EF] px-4 py-3 text-sm text-[#7A3E2B]">
                  <p className="font-bold">Relapse risk: {relapseRisk.risk_level} ({relapseRisk.relapse_score})</p>
                  <p className="mt-1">Likely trigger: {relapseRisk.predicted_trigger}</p>
                  <p className="mt-1">{relapseRisk.behavior_response}</p>
                </div>
              ) : null}
              {shouldAdjustProtocol ? (
                <div className="mt-4 rounded-[1.35rem] border border-[#DAB8A6] bg-[#FFF6F1] px-4 py-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 text-[#A95F3B]" />
                    <div>
                      <p className="font-bold text-[#7A3E2B]">Protocol adjustment recommended</p>
                      <p className="mt-1 text-sm leading-7 text-[#7A3E2B]">Improvement appears stalled across recent check-ins. Re-analysis and an updated assessment will sharpen the next protocol cycle.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => router.push(`/image-analyzer?category=${clinical.category}`)} className="rounded-full bg-[#1F3D2B] px-4 py-2 text-xs font-semibold text-white">Re-analyze now</button>
                        <button onClick={() => router.push(`/assessment?category=${clinical.category}`)} className="rounded-full border border-[#1F3D2B] px-4 py-2 text-xs font-semibold text-[#1F3D2B]">Update assessment</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {timelineData && timelineData.deltas.length > 0 ? (
            <div className="mt-6 rounded-[1.8rem] border border-[#E8E0D2] bg-[#FFFCF8] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8C6A5A]">Proof timeline</p>
                  <h3 className="mt-1 text-xl font-black text-[#1F3D2B]">What changed between real checkpoints</h3>
                </div>
                <ScanLine className="h-5 w-5 text-[#2F6F57]" />
              </div>
              <div className="mt-4 space-y-3">
                {timelineData.deltas.map((delta, index) => (
                  <div key={`${delta.from_scan_date}-${delta.to_scan_date}-${index}`} className="rounded-[1.3rem] bg-[#F8F4EC] px-4 py-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8C6A5A]">Checkpoint {index + 1}</p>
                    <p className="mt-1 text-sm font-semibold text-[#1F3D2B]">{new Date(delta.from_scan_date).toLocaleDateString()} to {new Date(delta.to_scan_date).toLocaleDateString()}</p>
                    <p className="mt-1 text-sm leading-7 text-[#5D574E]">{delta.improvement_message}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!isPlusOrPro ? (
            <div className="mt-6 flex flex-col gap-3 rounded-[1.8rem] border border-[#E2DDD3] bg-[#F8F4EC] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1F3D2B]">Unlock deeper analytics with Plus</p>
                <p className="text-xs text-[#6B665D]">Plus and Pro plans add more relapse interpretation and protocol-adjustment guidance as more scans accumulate.</p>
              </div>
              <button onClick={() => router.push("/settings")} className="rounded-full bg-[#1F3D2B] px-4 py-2 text-xs font-semibold text-white">Upgrade</button>
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.8rem] border border-[#C8DACF] bg-[#EAF3EE] p-5 shadow-[0_12px_24px_rgba(47,111,87,0.08)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/80 p-3"><BadgeCheck className="h-5 w-5 text-[#2F6F57]" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#2F6F57]">Key insight</p>
                <p className="mt-1 text-sm font-semibold text-[#1F3D2B]">Stay on Day {currentProtocolDay} until the current window closes.</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.8rem] border border-[#E7D8B4] bg-[#FFF7E8] p-5 shadow-[0_12px_24px_rgba(164,106,45,0.08)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/80 p-3"><Gauge className="h-5 w-5 text-[#A46A2D]" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#A46A2D]">Priority rule</p>
                <p className="mt-1 text-sm font-semibold text-[#1F3D2B]">Consistency beats intensity in this phase.</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.8rem] border border-[#E8C8B6] bg-[#FFF4EF] p-5 shadow-[0_12px_24px_rgba(169,95,59,0.08)]">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/80 p-3"><AlertTriangle className="h-5 w-5 text-[#A95F3B]" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#A95F3B]">Reset trigger</p>
                <p className="mt-1 text-sm font-semibold text-[#1F3D2B]">Missed routines should be resumed, not doubled.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="af-mobile-sticky-bar md:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8C6A5A]">Today&apos;s move</p>
              <p className="text-sm font-semibold text-[#1F3D2B]">{todayPriorityTask?.label || "Open today&apos;s routine"}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => jumpToStage("execute")} className="rounded-full bg-[#1F3D2B] px-4 py-2.5 text-sm font-semibold text-white">Start</button>
              <button onClick={() => jumpToStage("transform")} className="rounded-full border border-[#1F3D2B] px-4 py-2.5 text-sm font-semibold text-[#1F3D2B]">Proof</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function splitTaskSteps(text?: string) {
  if (!text) return ["Follow the guided routine window.", "Keep the step gentle and consistent."];

  const steps = text
    .split(/[.\n]+/)
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (steps.length === 1) {
    steps.push("Repeat the same window tomorrow for compounding recovery.");
  }

  return steps;
}

function getTaskIngredient(task: ProtocolTask) {
  return task.ingredient || task.recommendedProduct || "Core support";
}

function getTaskVisual(task: ProtocolTask) {
  const haystack = `${task.label} ${task.howTo || ""} ${task.ingredient || ""}`.toLowerCase();

  if (/hydrat|water|rinse|cleanse|wash/.test(haystack)) {
    return { Icon: Droplets, accent: "#5F8A74", tint: "#EAF3EE", badge: "Hydrate" };
  }
  if (/serum|retinoid|active|acid|correct|repair|treat/.test(haystack)) {
    return { Icon: Flame, accent: "#B16035", tint: "#FFF1E8", badge: "Correct" };
  }
  if (/meal|food|breakfast|lunch|dinner|fruit|protein/.test(haystack)) {
    return { Icon: HeartPulse, accent: "#A46A2D", tint: "#FFF7E8", badge: "Lifestyle" };
  }
  if (task.slot === "morning") {
    return { Icon: SunMedium, accent: "#A46A2D", tint: "#FFF7E8", badge: "Morning" };
  }
  if (task.slot === "night") {
    return { Icon: MoonStar, accent: "#5C5A8A", tint: "#F1EEFF", badge: "Night" };
  }
  if (task.slot === "weekly") {
    return { Icon: CalendarDays, accent: "#2F6F57", tint: "#EAF3EE", badge: "Weekly" };
  }
  return { Icon: Pill, accent: "#2F6F57", tint: "#EAF3EE", badge: "Support" };
}

function getMetricTone(score: number, reverse = false) {
  const normalized = reverse ? 100 - score : score;
  if (normalized >= 70) return { color: "#2F6F57", surface: "#EAF3EE", status: "Strong" };
  if (normalized >= 45) return { color: "#A46A2D", surface: "#FFF7E8", status: "Watch" };
  return { color: "#A95F3B", surface: "#FFF1E8", status: "Needs focus" };
}

function TimerRing({ value, label, active }: { value: number; label: string; active: boolean }) {
  const size = 132;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = clamp(value);
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative flex h-[132px] w-[132px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.96),rgba(239,246,241,0.96))] ${active ? "af-ring-glow" : ""}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E6DED0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2F6F57"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black text-[#1F3D2B]">{progress}%</span>
        <span className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#8C6A5A]">{label}</span>
      </div>
    </div>
  );
}