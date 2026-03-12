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
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";

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

const MORNING_UNLOCK_HOUR = 5;
const NIGHT_UNLOCK_HOUR = 18;

type UnlockState = {
  amUnlocked: boolean;
  pmUnlocked: boolean;
  nextUnlockLabel: string | null;
};

function formatHour(hour24: number) {
  const normalized = ((hour24 % 24) + 24) % 24;
  const suffix = normalized >= 12 ? "PM" : "AM";
  const h12 = normalized % 12 || 12;
  return `${h12}:00 ${suffix}`;
}

function getUnlockState(now: Date): UnlockState {
  const hour = now.getHours();
  const amUnlocked = hour >= MORNING_UNLOCK_HOUR;
  const pmUnlocked = hour >= NIGHT_UNLOCK_HOUR;

  let nextUnlockLabel: string | null = null;
  if (!amUnlocked) nextUnlockLabel = `Morning unlocks at ${formatHour(MORNING_UNLOCK_HOUR)}`;
  else if (!pmUnlocked) nextUnlockLabel = `Night unlocks at ${formatHour(NIGHT_UNLOCK_HOUR)}`;

  return { amUnlocked, pmUnlocked, nextUnlockLabel };
}

function normalizeDateKey(input: string) {
  return input.slice(0, 10);
}

function calculateRoutineStreakDays(routineRows: Array<Record<string, unknown>>, today: RoutineLogRow | null) {
  const fullDoneByDate = new Map<string, boolean>();

  for (const row of routineRows) {
    const dateValue = typeof row.log_date === "string" ? normalizeDateKey(row.log_date) : null;
    if (!dateValue) continue;
    const am = Boolean(row.am_done);
    const pm = Boolean(row.pm_done);
    fullDoneByDate.set(dateValue, am && pm);
  }

  if (today?.log_date) {
    fullDoneByDate.set(normalizeDateKey(today.log_date), Boolean(today.am_done) && Boolean(today.pm_done));
  }

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;

  for (let i = 0; i < 365; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (fullDoneByDate.get(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    break;
  }

  return streak;
}

async function awardAlphaSikka(action: string, referenceId: string, metadata?: Record<string, unknown>) {
  try {
    await fetch("/api/alpha-sikka/earn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, referenceId, metadata }),
    });
  } catch {
    // Reward write is best-effort and should never block routine save UX.
  }
}

async function emitNotification(eventType: string, dedupeKey: string, metadata?: Record<string, unknown>) {
  try {
    const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
    await fetch("/api/notifications", {
      method: "POST",
      headers,
      body: JSON.stringify({ eventType, dedupeKey, metadata }),
    });
  } catch {
    // Notifications are best-effort to avoid interrupting routine save.
  }
}

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
  const [draftSleepHours, setDraftSleepHours] = useState<string>("");
  const [draftHydrationMl, setDraftHydrationMl] = useState<string>("");
  const [routineDraftDirty, setRoutineDraftDirty] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [todayProtocolTasks, setTodayProtocolTasks] = useState<ProtocolTask[]>([]);
  const [phaseName, setPhaseName] = useState<string>("Stabilization");
  const [nowTick, setNowTick] = useState<Date>(new Date());

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      setRefreshing(true);
      try {
        await hydrateUserData(user.id, { silent: true });
      } finally {
        setRefreshing(false);
      }
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
    if (!user || !todayRoutine) return;
    const key = `dashboard_routine_draft:${user.id}:${normalizeDateKey(todayRoutine.log_date || todayDateKey())}`;
    const stored = window.localStorage.getItem(key);

    if (stored) {
      try {
        const draft = JSON.parse(stored) as { sleep_hours?: number | null; hydration_ml?: number | null };
        setDraftSleepHours(draft.sleep_hours == null ? "" : String(draft.sleep_hours));
        setDraftHydrationMl(draft.hydration_ml == null ? "" : String(draft.hydration_ml));
        return;
      } catch {
        // Fall through to hydrated values.
      }
    }

    setDraftSleepHours(todayRoutine.sleep_hours == null ? "" : String(todayRoutine.sleep_hours));
    setDraftHydrationMl(todayRoutine.hydration_ml == null ? "" : String(todayRoutine.hydration_ml));
    setRoutineDraftDirty(false);
  }, [user?.id, todayRoutine?.id, todayRoutine?.log_date]);

  useEffect(() => {
    if (!user || !todayRoutine) return;
    const key = `dashboard_routine_draft:${user.id}:${normalizeDateKey(todayRoutine.log_date || todayDateKey())}`;
    const draft = {
      sleep_hours: draftSleepHours === "" ? null : Number(draftSleepHours),
      hydration_ml: draftHydrationMl === "" ? null : Number(draftHydrationMl),
    };
    window.localStorage.setItem(key, JSON.stringify(draft));
  }, [user?.id, todayRoutine?.log_date, draftSleepHours, draftHydrationMl]);

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
      setNowTick(new Date());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const saveTodayRoutine = async (updates: Partial<RoutineLogRow>) => {
    if (!user || !todayRoutine || savingRoutine) return;
    setSavingRoutine(true);

    const previous = { ...todayRoutine };

    const next = {
      ...todayRoutine,
      ...updates,
      user_id: user.id,
      log_date: todayRoutine.log_date || todayDateKey(),
    } as RoutineLogRow & { user_id: string };

    let persisted: RoutineLogRow | null = null;

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

      if (data) {
        persisted = data as RoutineLogRow;
        setTodayRoutine(persisted);
      }
    } else {
      const { data } = await supabase
        .from("routine_logs")
        .insert(next)
        .select("id,log_date,am_done,pm_done,sleep_hours,hydration_ml,stress_level")
        .maybeSingle();

      if (data) {
        persisted = data as RoutineLogRow;
        setTodayRoutine(persisted);
      } else {
        persisted = { ...todayRoutine, ...updates };
        setTodayRoutine(persisted);
      }
    }

    const settled = persisted || { ...previous, ...updates };
    const dayRef = normalizeDateKey(settled.log_date || todayDateKey());

    const awardJobs: Array<Promise<void>> = [];

    if (!previous.am_done && settled.am_done) {
      awardJobs.push(awardAlphaSikka("log_am_routine", `routine:${dayRef}:am`, { log_date: dayRef }));
      awardJobs.push(emitNotification("routine_completed", `routine_completed:${dayRef}:am`, { phase: "am", logDate: dayRef }));
    }

    if (!previous.pm_done && settled.pm_done) {
      awardJobs.push(awardAlphaSikka("log_pm_routine", `routine:${dayRef}:pm`, { log_date: dayRef }));
      awardJobs.push(emitNotification("routine_completed", `routine_completed:${dayRef}:pm`, { phase: "pm", logDate: dayRef }));
    }

    const prevHydrationGoal = (previous.hydration_ml || 0) >= 2500;
    const nextHydrationGoal = (settled.hydration_ml || 0) >= 2500;
    if (!prevHydrationGoal && nextHydrationGoal) {
      awardJobs.push(awardAlphaSikka("hydration_goal", `routine:${dayRef}:hydration_goal`, { hydration_ml: settled.hydration_ml || 0 }));
    }

    const prevSleepGoal = (previous.sleep_hours || 0) >= 7;
    const nextSleepGoal = (settled.sleep_hours || 0) >= 7;
    if (!prevSleepGoal && nextSleepGoal) {
      awardJobs.push(awardAlphaSikka("sleep_goal", `routine:${dayRef}:sleep_goal`, { sleep_hours: settled.sleep_hours || 0 }));
    }

    const prevFullDay = Boolean(previous.am_done) && Boolean(previous.pm_done) && prevHydrationGoal && prevSleepGoal;
    const nextFullDay = Boolean(settled.am_done) && Boolean(settled.pm_done) && nextHydrationGoal && nextSleepGoal;
    if (!prevFullDay && nextFullDay) {
      awardJobs.push(
        awardAlphaSikka("full_day_completed", `routine:${dayRef}:full_day`, {
          am_done: Boolean(settled.am_done),
          pm_done: Boolean(settled.pm_done),
          hydration_ml: settled.hydration_ml || 0,
          sleep_hours: settled.sleep_hours || 0,
        })
      );
      awardJobs.push(
        emitNotification("streak_milestone", `full_day_completed:${dayRef}`, {
          logDate: dayRef,
          consistencyScore: (Boolean(settled.am_done) ? 1 : 0) + (Boolean(settled.pm_done) ? 1 : 0),
        })
      );
    }

    if (awardJobs.length) {
      void Promise.all(awardJobs).then(() => hydrateUserData(user.id, { force: true, silent: true }));
    }

    setSavingRoutine(false);
  };

  const saveMetricDraft = async () => {
    if (!todayRoutine || savingRoutine) return;
    await saveTodayRoutine({
      sleep_hours: draftSleepHours === "" ? null : Number(draftSleepHours),
      hydration_ml: draftHydrationMl === "" ? null : Number(draftHydrationMl),
    });
    setRoutineDraftDirty(false);
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

  const unlockState = useMemo(() => getUnlockState(nowTick), [nowTick]);

  const routineStreakDays = useMemo(() => calculateRoutineStreakDays(routines, todayRoutine), [routines, todayRoutine]);

  if (loading || !user) {
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
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">Control Center</p>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-2 text-sm text-[#6B665D]">Diagnose → Improve → Track → Transform. All values are loaded from your Supabase records.</p>
        </section>

        <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A] mb-1">Daily Execution</p>
              <h2 className="text-lg font-bold">Today&apos;s Routine Loop</h2>
              <p className="mt-1 text-xs text-[#6B665D]">Complete your daily system to build streak, confidence, and visible improvement.</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#2F6F57]">Consistency {consistencyScore}%</p>
              {(refreshing || storeLoading) && <p className="text-[11px] text-[#6B665D]">Syncing latest data...</p>}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              onClick={() => saveTodayRoutine({ am_done: !todayRoutine?.am_done })}
              disabled={!unlockState.amUnlocked && !todayRoutine?.am_done}
              className={`rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${todayRoutine?.am_done ? "border-[#2F6F57] bg-[#E8F4EE]" : "border-[#E2DDD3] bg-[#F8F6F3]"}`}
            >
              <p className="text-xs text-[#6B665D]">Morning Routine</p>
              <p className="font-semibold">{todayRoutine?.am_done ? "Completed" : unlockState.amUnlocked ? "Mark as complete" : `Locked until ${formatHour(MORNING_UNLOCK_HOUR)}`}</p>
            </button>

            <button
              onClick={() => saveTodayRoutine({ pm_done: !todayRoutine?.pm_done })}
              disabled={!unlockState.pmUnlocked && !todayRoutine?.pm_done}
              className={`rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${todayRoutine?.pm_done ? "border-[#2F6F57] bg-[#E8F4EE]" : "border-[#E2DDD3] bg-[#F8F6F3]"}`}
            >
              <p className="text-xs text-[#6B665D]">Night Routine</p>
              <p className="font-semibold">{todayRoutine?.pm_done ? "Completed" : unlockState.pmUnlocked ? "Mark as complete" : `Locked until ${formatHour(NIGHT_UNLOCK_HOUR)}`}</p>
            </button>

            <label className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3">
              <p className="text-xs text-[#6B665D]">Sleep (hours)</p>
              <input
                type="number"
                min={0}
                max={12}
                step={0.5}
                value={draftSleepHours}
                onChange={(e) => {
                  setDraftSleepHours(e.target.value);
                  setRoutineDraftDirty(true);
                }}
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
                value={draftHydrationMl}
                onChange={(e) => {
                  setDraftHydrationMl(e.target.value);
                  setRoutineDraftDirty(true);
                }}
                className="mt-1 w-full bg-transparent text-sm font-semibold outline-none"
              />
            </label>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDraftSleepHours(todayRoutine?.sleep_hours == null ? "" : String(todayRoutine.sleep_hours));
                setDraftHydrationMl(todayRoutine?.hydration_ml == null ? "" : String(todayRoutine.hydration_ml));
                setRoutineDraftDirty(false);
              }}
              disabled={!routineDraftDirty || savingRoutine}
              className="rounded-lg border border-[#D7D1C6] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B665D] disabled:opacity-50"
            >
              Reset Draft
            </button>
            <button
              type="button"
              onClick={saveMetricDraft}
              disabled={!routineDraftDirty || savingRoutine}
              className="rounded-lg bg-[#1F3D2B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2F6F57] disabled:opacity-50"
            >
              {savingRoutine ? "Saving..." : "Save Metrics"}
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-[#6B665D]">
            <span>{unlockState.nextUnlockLabel || "Daily check-in feeds relapse risk and protocol recalculation."}</span>
            <span>{savingRoutine ? "Saving..." : "Saved"}</span>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E2DDD3] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A] mb-1">Live Metrics</p>
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
            <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3"><p className="text-xs text-[#6B665D]">Routine Streak</p><p className="text-xl font-bold">{routineStreakDays} days</p></div>
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
