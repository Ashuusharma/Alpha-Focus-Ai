"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock3,
  Droplets,
  MoonStar,
  Sparkles,
  SunMedium,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
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
  normalizeRecoveryLevel,
  type ProtocolTask,
} from "@/lib/protocolTemplates";
import { resolveClinicalChildCategoryFromAny } from "@/lib/categorySync";
import { getRecoveryProgramLevel } from "@/lib/userProfile";
import { useCartStore } from "@/lib/cartStore";
import { formatINR } from "@/lib/currency";

type ClinicalRow = {
  category: string;
  severity_score: number;
  confidence_score: number;
  condition_label: string;
  recovery_probability: number;
  assessment_completeness: number;
};

type ProgressRow = {
  improvement_pct: number;
  consistency_score: number;
  trend_direction: string;
};

type ProductCard = {
  id: string;
  name: string;
  why: string;
  howTo: string;
  timeline: string;
  price: number;
};

type ChartPoint = {
  week: string;
  severity: number;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function safeLabel(category: string) {
  return categories.find((item) => item.id === category)?.label || category.replace(/_/g, " ");
}

function severityLabel(score: number) {
  if (score >= 70) return "High";
  if (score >= 40) return "Moderate";
  return "Mild";
}

function splitTaskSteps(text?: string) {
  if (!text) return ["Follow guided action", "Repeat in same time window"];

  const steps = text
    .split(/[.\n]+/)
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (steps.length === 1) {
    steps.push("Repeat tomorrow in same slot");
  }

  return steps;
}

function mapRecommendation(rec: ProductJustification, index: number, categoryId: CategoryId): ProductCard {
  return {
    id: rec.product_id || `${categoryId}-${index + 1}`,
    name: rec.product_name,
    why: rec.why_recommended,
    howTo: rec.usage_note,
    timeline: rec.expected_timeline,
    price: rec.price_inr || 2999,
  };
}

function buildChart(timeline: ProgressTimeline | null, severity: number, improvement: number): ChartPoint[] {
  if (timeline?.snapshots.length) {
    const ordered = [...timeline.snapshots].sort(
      (a, b) => new Date(a.scan_date).getTime() - new Date(b.scan_date).getTime()
    );

    return ordered.map((item, index) => ({
      week: index === 0 ? "W1" : `W${index + 1}`,
      severity: clamp(item.severity_snapshot),
    }));
  }

  const end = clamp(severity - Math.max(8, improvement));
  return [
    { week: "W1", severity: clamp(severity) },
    { week: "W2", severity: clamp(severity - 6) },
    { week: "W3", severity: clamp(severity - 11) },
    { week: "W4", severity: end },
  ];
}

function getStatus(improvement: number) {
  if (improvement >= 12) return { label: "Improving", tone: "text-[#0071e3] bg-[#E8F4EE]" };
  if (improvement >= 5) return { label: "Slow", tone: "text-[#A46A2D] bg-[#FFF7E8]" };
  return { label: "Needs attention", tone: "text-[#A95F3B] bg-[#FFF1E8]" };
}

function SeverityRing({ value }: { value: number }) {
  const size = 148;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalized = clamp(value);
  const dashOffset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative flex h-[148px] w-[148px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95),rgba(242,234,220,0.95))] shadow-[0_16px_30px_rgba(17,17,17,0.08)]">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E8E1D4" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0071e3"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#6e6e73]">Severity</span>
        <span className="mt-1 text-4xl font-black text-[#1d1d1f]">{normalized}</span>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useContext(AuthContext);

  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clinical, setClinical] = useState<ClinicalRow | null>(null);
  const [progress, setProgress] = useState<ProgressRow | null>(null);
  const [timeline, setTimeline] = useState<ProgressTimeline | null>(null);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [ownedProductIds, setOwnedProductIds] = useState<string[]>([]);

  const categoryId = clinical?.category as CategoryId | undefined;
  const level = normalizeRecoveryLevel(params?.get("level") || getRecoveryProgramLevel());

  const todayTasks = useMemo(() => {
    if (!categoryId) return [];

    const slotOrder: Record<string, number> = { morning: 0, lifestyle: 1, night: 2, weekly: 3 };
    const tasks = generateDailyProtocolTasks(categoryId, currentDay, { toleranceMode: level })
      .sort((a, b) => (slotOrder[a.slot] ?? 99) - (slotOrder[b.slot] ?? 99))
      .slice(0, 3);

    return tasks;
  }, [categoryId, currentDay, level]);

  const routineFlow = useMemo(() => {
    if (!categoryId) {
      return {
        morning: [],
        day: [],
        night: [],
      };
    }

    const tasks = generateDailyProtocolTasks(categoryId, currentDay, { toleranceMode: level });
    return {
      morning: tasks.filter((task) => task.slot === "morning").slice(0, 2),
      day: tasks.filter((task) => task.slot === "lifestyle").slice(0, 2),
      night: tasks.filter((task) => task.slot === "night").slice(0, 2),
    };
  }, [categoryId, currentDay, level]);

  useEffect(() => {
    async function load() {
      if (!user) {
        setError("Please log in to view results.");
        setLoading(false);
        return;
      }

      let category = resolveClinicalChildCategoryFromAny(
        params?.get("category"),
        typeof window !== "undefined" ? (sessionStorage.getItem("analysisCategory") as CategoryId | null) : null
      );

      if (!category) {
        const { data: activeAnalysis } = await supabase
          .from("user_active_analysis")
          .select("selected_category")
          .eq("user_id", user.id)
          .maybeSingle();

        category = resolveClinicalChildCategoryFromAny(activeAnalysis?.selected_category || null, null);
      }

      if (!category) {
        setError("No active category found. Complete analyzer flow first.");
        setLoading(false);
        return;
      }

      const resolvedCategory = (categories.find((item) => item.id === category)?.id || category) as CategoryId;

      await recalculateClinicalScores(user.id, resolvedCategory);
      await calculateProgressMetricsForCategory(user.id, resolvedCategory);

      const [clinicalRes, progressRes, recommendationsRes, timelineRes] = await Promise.all([
        supabase
          .from("user_category_clinical_scores")
          .select("category,severity_score,confidence_score,condition_label,recovery_probability,assessment_completeness")
          .eq("user_id", user.id)
          .eq("category", resolvedCategory)
          .maybeSingle(),
        supabase
          .from("user_progress_metrics")
          .select("improvement_pct,consistency_score,trend_direction")
          .eq("user_id", user.id)
          .eq("category", resolvedCategory)
          .maybeSingle(),
        productRecommendationLogic(user.id, resolvedCategory),
        getProgressTimeline(user.id, resolvedCategory),
      ]);

      if (clinicalRes.error || !clinicalRes.data) {
        setError("No result data available.");
        setLoading(false);
        return;
      }

      const firstSnapshotDate = timelineRes.snapshots[0]?.scan_date;
      const dayNumber = firstSnapshotDate
        ? Math.max(1, Math.min(30, Math.floor((Date.now() - new Date(firstSnapshotDate).getTime()) / (1000 * 60 * 60 * 24)) + 1))
        : 1;

      setCurrentDay(dayNumber);
      setClinical(clinicalRes.data as ClinicalRow);
      setProgress((progressRes.data || null) as ProgressRow | null);
      setTimeline(timelineRes);
      setProducts(recommendationsRes.slice(0, 2).map((item, index) => mapRecommendation(item, index, resolvedCategory)));
      setLoading(false);
    }

    void load();
  }, [params, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-6">
        <div className="rounded-2xl border border-[#d9d9de] bg-white px-6 py-5 text-sm text-[#6e6e73]">Preparing your protocol...</div>
      </div>
    );
  }

  if (error || !clinical) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-3xl bg-white border border-[#d9d9de] p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-[#1d1d1f]">Result unavailable</h1>
          <p className="text-sm text-[#6e6e73]">{error || "No report found."}</p>
          <button onClick={() => router.push("/image-analyzer")} className="rounded-full bg-[#1d1d1f] px-6 py-3 text-sm font-semibold text-white">Restart flow</button>
        </div>
      </div>
    );
  }

  const issue = safeLabel(clinical.category);
  const severity = clamp(clinical.severity_score);
  const confidence = clamp(clinical.confidence_score);
  const severityText = severityLabel(severity);
  const chart = buildChart(timeline, severity, progress?.improvement_pct ?? 0);
  const latestPoint = chart[chart.length - 1];
  const improvement = clamp(progress?.improvement_pct ?? 0);
  const recoveryProgress = Math.max(5, Math.min(100, Math.round((currentDay / 30) * 100)));
  const status = getStatus(improvement);

  const toggleTaskComplete = (id: string) => {
    setCompletedTaskIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const addToCart = (product: ProductCard) => {
    addItem({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    openCart();
  };

  const toggleOwned = (id: string) => {
    setOwnedProductIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  return (
    <div className="af-page-shell min-h-screen text-[#ffffff]">
      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-5 pb-28 md:gap-5 md:px-6 md:py-8 md:pb-12">
        {/* 1. HERO */}
        <section className="nv-section-dark animate-in fade-in duration-500">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#2997ff]">Result overview</p>
              <h1 className="apple-section-title text-white">Your Skin Recovery Plan</h1>
              <p className="text-base font-semibold text-[#2997ff]">Your Issue: {issue} ({severityText})</p>
              <p className="text-sm text-[#a7a7a7]">Confidence: {confidence}% - Visible improvement in 2-4 weeks</p>
            </div>
            <SeverityRing value={severity} />
          </div>
        </section>

        {/* 2. TODAY'S ACTION */}
        <section className="nv-section-white animate-in fade-in duration-500 delay-75">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#5e5e5e]">Today's Action</p>
              <h2 className="text-xl font-black">Do these 3 tasks</h2>
            </div>
            <span className="rounded-full border border-[#0071e3] bg-white px-3 py-1 text-xs font-black text-[#1d1d1f]">{completedTaskIds.length}/{todayTasks.length || 3} completed</span>
          </div>

          <div className="space-y-3">
            {todayTasks.map((task) => {
              const steps = splitTaskSteps(task.howTo);
              const done = completedTaskIds.includes(task.id);
              return (
                <div key={task.id} className="af-card-secondary p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold">{task.label}</p>
                      <div className="mt-2 space-y-1 text-sm text-[#5e5e5e]">
                        <p>1. {steps[0]}</p>
                        <p>2. {steps[1]}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#5e5e5e]">
                        <span className="rounded-full bg-white px-3 py-1 inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {task.durationMin || 3} min</span>
                        <span className="rounded-full bg-white px-3 py-1">{task.timeWindow ? `${task.timeWindow.start}-${task.timeWindow.end}` : "Anytime"}</span>
                        <span className="rounded-full border border-[#0071e3] bg-white px-3 py-1 text-[#1d1d1f]">+{task.reward || 1} A$</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className={`rounded-full px-4 py-2 text-xs font-bold ${done ? "border border-[#0071e3] bg-white text-[#1d1d1f]" : "border border-[#0071e3] text-[#1d1d1f]"}`}
                    >
                      {done ? "Done" : "Mark"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn-primary mt-4 w-full text-base font-bold">
            Start Routine
          </button>
        </section>

        {/* 3. PROGRESS */}
        <section className="nv-section-dark animate-in fade-in duration-500 delay-100">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">Progress</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${status.tone}`}>{status.label}</span>
          </div>

          <div className="h-56 rounded-2xl border border-[#0071e3] bg-[#121713] p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid stroke="#2a3324" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#a7a7a7", fontSize: 11, fontWeight: 800 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a7a7a7", fontSize: 11, fontWeight: 800 }} domain={[0, 100]} />
                <Tooltip formatter={(value: number | undefined) => [`${clamp(Number(value || 0))}%`, "Severity"]} />
                <Line type="monotone" dataKey="severity" stroke="#0071e3" strokeWidth={4} dot={{ r: 4, fill: "#0071e3" }} />
                {latestPoint ? <ReferenceDot x={latestPoint.week} y={latestPoint.severity} r={6} fill="#2997ff" stroke="#0b0f0c" strokeWidth={2} label={{ value: "You are improving", position: "top", fill: "#2997ff", fontSize: 11, fontWeight: 700 }} /> : null}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Your recovery: {recoveryProgress}% complete</span>
              <span className="text-[#2997ff]">{improvement}% better</span>
            </div>
            <div className="h-2 rounded-full bg-[#2a3324]">
              <div className="h-full rounded-full bg-[#0071e3]" style={{ width: `${recoveryProgress}%` }} />
            </div>
          </div>
        </section>

        {/* 4. ROUTINE FLOW */}
        <section className="nv-section-white animate-in fade-in duration-500 delay-150">
          <h2 className="text-xl font-black">Routine Flow</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="af-card-secondary p-4">
              <p className="text-sm font-black inline-flex items-center gap-2"><SunMedium className="h-4 w-4 text-[#A46A2D]" /> Morning</p>
              <div className="mt-2 space-y-1 text-sm text-[#5D574E]">
                {(routineFlow.morning.length ? routineFlow.morning : [{ id: "m-1", label: "Cleanse and prep" }, { id: "m-2", label: "Apply protective step" }]).map((task) => (
                  <p key={task.id}>- {task.label}</p>
                ))}
              </div>
            </div>
            <div className="af-card-secondary p-4">
              <p className="text-sm font-black inline-flex items-center gap-2"><Droplets className="h-4 w-4 text-[#0071e3]" /> Day</p>
              <div className="mt-2 space-y-1 text-sm text-[#5D574E]">
                {(routineFlow.day.length ? routineFlow.day : [{ id: "d-1", label: "Hydration checkpoint" }, { id: "d-2", label: "Trigger control" }]).map((task) => (
                  <p key={task.id}>- {task.label}</p>
                ))}
              </div>
            </div>
            <div className="af-card-secondary p-4">
              <p className="text-sm font-black inline-flex items-center gap-2"><MoonStar className="h-4 w-4 text-[#5C5A8A]" /> Night</p>
              <div className="mt-2 space-y-1 text-sm text-[#5D574E]">
                {(routineFlow.night.length ? routineFlow.night : [{ id: "n-1", label: "Repair step" }, { id: "n-2", label: "Sleep window" }]).map((task) => (
                  <p key={task.id}>- {task.label}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. PRODUCTS */}
        <section className="nv-section-white animate-in fade-in duration-500 delay-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black">Smart Products</h2>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-[#5e5e5e]">Max 2</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {products.map((product) => (
              <div key={product.id} className="af-card-secondary p-4">
                <p className="text-lg font-bold underline decoration-2 decoration-[#0071e3] underline-offset-4">{product.name}</p>
                <span className="mt-2 inline-flex border border-[#0071e3] bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#1d1d1f]">Recommended</span>
                <div className="mt-3 space-y-2 text-sm text-[#5D574E]">
                  <p><span className="font-semibold text-[#1d1d1f]">Why:</span> {product.why}</p>
                  <p><span className="font-semibold text-[#1d1d1f]">How:</span> {product.howTo}</p>
                  <p><span className="font-semibold text-[#1d1d1f]">Timeline:</span> {product.timeline}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-black text-[#1d1d1f]">{formatINR(product.price)}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => addToCart(product)} className="btn-primary px-4 py-2.5 text-sm font-bold">Buy</button>
                  <button onClick={() => toggleOwned(product.id)} className={`rounded-xl px-4 py-2.5 text-sm font-bold ${ownedProductIds.includes(product.id) ? "bg-[#E8F4EE] text-[#0071e3]" : "border border-[#1d1d1f] text-[#1d1d1f]"}`}>{ownedProductIds.includes(product.id) ? "Owned" : "I already have"}</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="af-mobile-sticky-bar md:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6e6e73]">Next Action</p>
              <p className="text-sm font-semibold text-[#1d1d1f]">Start Today's Routine</p>
            </div>
            <button className="rounded-full bg-[#0071e3] px-4 py-2.5 text-sm font-bold text-white inline-flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> +2 Alpha Sikka
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

