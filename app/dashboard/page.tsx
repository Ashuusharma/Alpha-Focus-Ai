"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/AuthProvider";
import { useUserStore } from "@/stores/useUserStore";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { supabase } from "@/lib/supabaseClient";
import { calculateProgressMetricsForCategory } from "@/lib/calculateProgressMetrics";
import { generateDailyProtocolTasks, getCurrentProtocolPhase, getProtocolTemplate, type ProtocolTask } from "@/lib/protocolTemplates";
import { maybeSendRoutineReminder } from "@/lib/routineReminderSystem";
import { categories, CategoryId } from "@/lib/questions";

type RoutineLogRow = {
  id?: string;
  log_date: string;
  am_done?: boolean | null;
  pm_done?: boolean | null;
  sleep_hours?: number | null;
  hydration_ml?: number | null;
  stress_level?: number | null;
};

type ProgressSummary = {
  improvement_pct: number;
  inflammation_reduction_rate: number;
  consistency_score: number;
  recovery_velocity: number;
  discipline_index: number;
  confidence_score: number;
};

function todayDateKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { user, loading } = useContext(AuthContext);
  const storeLoading = useUserStore((state) => state.loading);
  const profile = useUserStore((state) => state.profile);
  const alphaSummary = useUserStore((state) => state.alphaSummary as Record<string, unknown> | null);
  const reports = useUserStore((state) => state.reports as Array<Record<string, unknown>>);
  const assessments = useUserStore((state) => state.assessments as Array<Record<string, unknown>>);
  const routines = useUserStore((state) => state.routines as Array<Record<string, unknown>>);
  const products = useUserStore((state) => state.products as Array<Record<string, unknown>>);
  const [refreshing, setRefreshing] = useState(false);
  const [todayRoutine, setTodayRoutine] = useState<RoutineLogRow | null>(null);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [todayProtocolTasks, setTodayProtocolTasks] = useState<ProtocolTask[]>([]);
  const [phaseName, setPhaseName] = useState<string>("Stabilization");

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      setRefreshing(true);
      await hydrateUserData(user.id);
      setRefreshing(false);
    };

    void run();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const loadTodayRoutine = async () => {
      const today = todayDateKey();
      const { data } = await supabase
        .from("routine_logs")
        .select("id,log_date,am_done,pm_done,sleep_hours,hydration_ml,stress_level")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle();

      setTodayRoutine(
        (data as RoutineLogRow | null) || {
          log_date: today,
          am_done: false,
          pm_done: false,
          sleep_hours: null,
          hydration_ml: null,
          stress_level: null,
        }
      );
    };

    void loadTodayRoutine();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const loadClinicalPanel = async () => {
      const { data: activeAnalysis } = await supabase
        .from("user_active_analysis")
        .select("selected_category")
        .eq("user_id", user.id)
        .maybeSingle();

      const selectedCategory = (activeAnalysis?.selected_category || null) as CategoryId | null;
      if (!selectedCategory) return;

      setActiveCategory(selectedCategory);

      await calculateProgressMetricsForCategory(user.id, selectedCategory);

      const { data: progressRow } = await supabase
        .from("user_progress_metrics")
        .select("improvement_pct,inflammation_reduction_rate,consistency_score,recovery_velocity,discipline_index,confidence_score")
        .eq("user_id", user.id)
        .eq("category", selectedCategory)
        .maybeSingle();

      setProgressSummary((progressRow || null) as ProgressSummary | null);

      const { data: latestScan } = await supabase
        .from("photo_scans")
        .select("scan_date")
        .eq("user_id", user.id)
        .eq("analyzer_category", selectedCategory)
        .order("scan_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const dayNumber = latestScan?.scan_date
        ? Math.max(1, Math.min(30, Math.floor((Date.now() - new Date(latestScan.scan_date).getTime()) / (1000 * 60 * 60 * 24)) + 1))
        : 1;

      const template = getProtocolTemplate(selectedCategory);
      if (template) {
        setPhaseName(getCurrentProtocolPhase(template, dayNumber).name);
      }
      setTodayProtocolTasks(generateDailyProtocolTasks(selectedCategory, dayNumber));
    };

    void loadClinicalPanel();
  }, [user?.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      maybeSendRoutineReminder();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const saveTodayRoutine = async (updates: Partial<RoutineLogRow>) => {
    if (!user || !todayRoutine || savingRoutine) return;
    setSavingRoutine(true);

    const next = {
      ...todayRoutine,
      ...updates,
      user_id: user.id,
      log_date: todayRoutine.log_date || todayDateKey(),
    } as RoutineLogRow & { user_id: string };

    if (todayRoutine.id) {
      const { data } = await supabase
        .from("routine_logs")
        .update({
          am_done: next.am_done,
          pm_done: next.pm_done,
          sleep_hours: next.sleep_hours,
          hydration_ml: next.hydration_ml,
          stress_level: next.stress_level,
        })
        .eq("id", todayRoutine.id)
        .select("id,log_date,am_done,pm_done,sleep_hours,hydration_ml,stress_level")
        .maybeSingle();

      if (data) setTodayRoutine(data as RoutineLogRow);
    } else {
      const { data } = await supabase
        .from("routine_logs")
        .insert(next)
        .select("id,log_date,am_done,pm_done,sleep_hours,hydration_ml,stress_level")
        .maybeSingle();

      if (data) setTodayRoutine(data as RoutineLogRow);
      else setTodayRoutine({ ...todayRoutine, ...updates });
    }

    setSavingRoutine(false);
  };

  const balance = Number(alphaSummary?.current_balance ?? 0);
  const alphaScore = Number((reports[0]?.alpha_score as number | undefined) ?? 0);
  const reportCount = reports.length;
  const assessmentCount = assessments.length;
  const routineCount = routines.length;
  const recommendationCount = products.length;
  const consistencyScore = useMemo(() => {
    const am = todayRoutine?.am_done ? 25 : 0;
    const pm = todayRoutine?.pm_done ? 25 : 0;
    const hydration = (todayRoutine?.hydration_ml || 0) >= 2500 ? 25 : 0;
    const sleep = (todayRoutine?.sleep_hours || 0) >= 7 ? 25 : 0;
    return am + pm + hydration + sleep;
  }, [todayRoutine]);

  if (loading || storeLoading || refreshing || !user) {
    return (
      <main className="min-h-screen bg-[#F8F6F0] px-4 py-6 text-[#1F3D2B] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-[#6B665D]">Loading personalized dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F6F0] px-4 py-6 text-[#1F3D2B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-2 text-sm text-[#6B665D]">Diagnose → Improve → Track → Transform. All values are loaded from your Supabase records.</p>
        </section>

        <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Today&apos;s Routine Loop</h2>
              <p className="mt-1 text-xs text-[#6B665D]">Complete your daily system to build streak, confidence, and visible improvement.</p>
            </div>
            <p className="text-sm font-semibold text-[#2F6F57]">Consistency {consistencyScore}%</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              onClick={() => saveTodayRoutine({ am_done: !todayRoutine?.am_done })}
              className={`rounded-xl border px-4 py-3 text-left transition ${todayRoutine?.am_done ? "border-[#2F6F57] bg-[#E8F4EE]" : "border-[#E2DDD3] bg-[#F8F6F3]"}`}
            >
              <p className="text-xs text-[#6B665D]">Morning Routine</p>
              <p className="font-semibold">{todayRoutine?.am_done ? "Completed" : "Mark as complete"}</p>
            </button>

            <button
              onClick={() => saveTodayRoutine({ pm_done: !todayRoutine?.pm_done })}
              className={`rounded-xl border px-4 py-3 text-left transition ${todayRoutine?.pm_done ? "border-[#2F6F57] bg-[#E8F4EE]" : "border-[#E2DDD3] bg-[#F8F6F3]"}`}
            >
              <p className="text-xs text-[#6B665D]">Night Routine</p>
              <p className="font-semibold">{todayRoutine?.pm_done ? "Completed" : "Mark as complete"}</p>
            </button>

            <label className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3">
              <p className="text-xs text-[#6B665D]">Sleep (hours)</p>
              <input
                type="number"
                min={0}
                max={12}
                step={0.5}
                value={todayRoutine?.sleep_hours ?? ""}
                onChange={(e) => saveTodayRoutine({ sleep_hours: e.target.value === "" ? null : Number(e.target.value) })}
                className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
              />
            </label>

            <label className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3">
              <p className="text-xs text-[#6B665D]">Hydration (ml)</p>
              <input
                type="number"
                min={0}
                max={6000}
                step={100}
                value={todayRoutine?.hydration_ml ?? ""}
                onChange={(e) => saveTodayRoutine({ hydration_ml: e.target.value === "" ? null : Number(e.target.value) })}
                className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
              />
            </label>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[#6B665D]">
            <span>Daily check-in feeds relapse risk and protocol recalculation.</span>
            <span>{savingRoutine ? "Saving..." : "Saved"}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Performance Intelligence</h2>
              <p className="mt-1 text-xs text-[#6B665D]">Live progress, discipline, and confidence from your latest category data.</p>
            </div>
            <p className="text-xs font-semibold text-[#2F6F57]">
              {activeCategory ? `Category: ${categories.find((c) => c.id === activeCategory)?.label || activeCategory}` : "No active category"}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3"><p className="text-xs text-[#6B665D]">Inflammation Change</p><p className="text-xl font-bold">{progressSummary?.inflammation_reduction_rate ?? 0}%</p></div>
            <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3"><p className="text-xs text-[#6B665D]">Severity Improvement</p><p className="text-xl font-bold">{progressSummary?.improvement_pct ?? 0}%</p></div>
            <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3"><p className="text-xs text-[#6B665D]">Consistency Score</p><p className="text-xl font-bold">{progressSummary?.consistency_score ?? 0}</p></div>
            <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3"><p className="text-xs text-[#6B665D]">Discipline Score</p><p className="text-xl font-bold">{progressSummary?.discipline_index ?? 0}</p></div>
            <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3"><p className="text-xs text-[#6B665D]">Recovery Velocity</p><p className="text-xl font-bold">{progressSummary?.recovery_velocity ?? 0}</p></div>
            <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3"><p className="text-xs text-[#6B665D]">Confidence Score</p><p className="text-xl font-bold">{progressSummary?.confidence_score ?? 0}</p></div>
          </div>

          <div className="mt-4 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
            <p className="text-sm font-semibold">Today&apos;s Category Protocol Tasks ({phaseName})</p>
            <div className="mt-2 grid md:grid-cols-2 gap-2 text-sm">
              {todayProtocolTasks.length > 0 ? (
                todayProtocolTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-[#E2DDD3] bg-white px-3 py-2">
                    <p className="font-medium">{task.label}</p>
                    <p className="text-xs text-[#6B665D] capitalize">{task.slot} · {task.frequency.replace(/_/g, " ")}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#6B665D]">Complete analyzer and assessment to generate daily protocol tasks.</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Alpha Score</p><p className="mt-2 text-3xl font-bold">{alphaScore}</p></article>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Alpha Sikka</p><p className="mt-2 text-3xl font-bold">{balance} A$</p></article>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Reports</p><p className="mt-2 text-3xl font-bold">{reportCount}</p></article>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Assessments</p><p className="mt-2 text-3xl font-bold">{assessmentCount}</p></article>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Routine Logs</p><p className="mt-2 text-3xl font-bold">{routineCount}</p></article>
          <article className="rounded-2xl border border-[#E2DDD3] bg-white p-4 shadow-sm"><p className="text-xs text-[#6B665D]">Products</p><p className="mt-2 text-3xl font-bold">{recommendationCount}</p></article>
        </section>

        {reportCount === 0 && (
          <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm text-sm text-[#6B665D]">
            Run first scan
          </section>
        )}

        {routineCount === 0 && (
          <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm text-sm text-[#6B665D]">
            Start routine
          </section>
        )}

        {!profile && (
          <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm text-sm text-[#6B665D]">
            Complete Profile
          </section>
        )}
      </div>
    </main>
  );
}
