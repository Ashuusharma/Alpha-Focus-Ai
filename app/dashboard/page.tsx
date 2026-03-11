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
        await hydrateUserData(user.id);
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
      void Promise.all(awardJobs).then(() => hydrateUserData(user.id));
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

  const unlockState = useMemo(() => getUnlockState(nowTick), [nowTick]);

  const routineStreakDays = useMemo(() => calculateRoutineStreakDays(routines, todayRoutine), [routines, todayRoutine]);

  if (loading || storeLoading || refreshing || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 w-full animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Your daily performance intelligence</p>
        </div>
      </div>

      {/* HERO PANEL (TOP) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-gradient-to-br from-[#0a1a1f] to-[#0d2a33] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-zinc-400 text-sm font-semibold tracking-widest uppercase mb-2">Primary Index</h2>
                <div className="flex items-end gap-4">
                  <span className="text-6xl font-bold text-white font-playfair">{alphaScore || 74}</span>
                  <span className="text-green-400 text-lg font-semibold mb-2 flex items-center">↑ 12%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-zinc-400 text-sm font-semibold mb-1">Next Milestone</p>
                <div className="inline-block bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-orange-500/5">
                  7 Day Streak Reward
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
              <div>
                <p className="text-zinc-500 text-sm font-medium mb-1">Recovery Progress</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#071318] rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 w-[72%] shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                  </div>
                  <span className="text-white font-bold">72%</span>
                </div>
              </div>
              <div>
                <p className="text-zinc-500 text-sm font-medium mb-1">Confidence Level</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#071318] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 w-[81%] shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
                  </div>
                  <span className="text-white font-bold">81%</span>
                </div>
              </div>
              <div>
                <p className="text-zinc-500 text-sm font-medium mb-1">Consistency</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#071318] rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 w-[95%]" style={{ width: `${consistencyScore}%`}}></div>
                  </div>
                  <span className="text-white font-bold">{consistencyScore}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-center items-center text-center">
          <div className="w-32 h-32 relative mb-4">
            <svg height="128" width="128" className="transform -rotate-90">
              <circle stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth="8" r="56" cx="64" cy="64" />
              <circle stroke="#4ade80" fill="transparent" strokeWidth="8" strokeDasharray="351" style={{ strokeDashoffset: 351 - (17/100)*351 }} strokeLinecap="round" r="56" cx="64" cy="64" className="drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">{balance || 17}</span>
              <span className="text-xs text-zinc-400 mt-1">A$</span>
            </div>
          </div>
          <p className="text-white font-bold text-lg">Next Reward: 100 A$</p>
          <button className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors">
            View Ladder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TODAY'S PROTOCOL (Checklist UI) */}
        <div className="lg:col-span-1 bg-white/5 backdrop-blur-sm border border-white/5 rounded-3xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Today's Protocol</h3>
            <span className="text-xs font-semibold px-3 py-1 bg-green-500/20 text-green-400 rounded-full border border-green-500/20">Phase: {phaseName}</span>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center justify-between">
                Morning Routine 
                {unlockState.amUnlocked ? '' : <span className="text-xs normal-case text-zinc-600 bg-black/50 px-2 py-0.5 rounded">Locks till 5AM</span>}
              </p>
              <div className="space-y-2">
                <button 
                  onClick={() => saveTodayRoutine({ am_done: !todayRoutine?.am_done })}
                  disabled={!unlockState.amUnlocked && !todayRoutine?.am_done}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${todayRoutine?.am_done ? 'bg-green-500/10 border-green-500/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${todayRoutine?.am_done ? 'bg-green-500 border-green-500 text-black' : 'border-zinc-500'}`}>
                    {todayRoutine?.am_done && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`font-semibold ${todayRoutine?.am_done ? 'text-green-400' : 'text-zinc-300'}`}>Morning Skincare</span>
                  {todayRoutine?.am_done && <span className="ml-auto text-xs text-green-400 font-bold animate-pulse">+3 A$</span>}
                </button>
              </div>
            </div>

            <div>
              <p className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-3">Lifestyle Targets</p>
              <div className="space-y-2">
                <div className="flex bg-black/20 border border-white/5 rounded-xl p-4 gap-4 items-center">
                  <div className={`w-6 h-6 rounded flex items-center justify-center border ${(todayRoutine?.hydration_ml || 0) >= 2500 ? 'bg-blue-500 border-blue-500' : 'border-zinc-500'}`}>
                    {(todayRoutine?.hydration_ml || 0) >= 2500 && <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className="flex-1">
                    <span className="text-zinc-300 font-medium block">Drink 2.5L Water</span>
                    <div className="flex items-center gap-2 mt-2">
                      <input type="range" min="0" max="4000" step="250" value={todayRoutine?.hydration_ml || 0} onChange={(e) => saveTodayRoutine({ hydration_ml: Number(e.target.value) })} className="w-full accent-blue-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                      <span className="text-xs text-zinc-500 w-12 text-right">{todayRoutine?.hydration_ml || 0}ml</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex bg-black/20 border border-white/5 rounded-xl p-4 gap-4 items-center">
                  <div className={`w-6 h-6 rounded flex items-center justify-center border ${(todayRoutine?.sleep_hours || 0) >= 7 ? 'bg-purple-500 border-purple-500' : 'border-zinc-500'}`}>
                    {(todayRoutine?.sleep_hours || 0) >= 7 && <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div className="flex-1">
                    <span className="text-zinc-300 font-medium block">Sleep 7+ Hours</span>
                    <input type="number" min="0" max="14" step="0.5" value={todayRoutine?.sleep_hours || ''} onChange={(e) => saveTodayRoutine({ sleep_hours: Number(e.target.value) })} placeholder="Hours..." className="mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-3">Night Routine</p>
              <div className="space-y-2">
                <button 
                  onClick={() => saveTodayRoutine({ pm_done: !todayRoutine?.pm_done })}
                  disabled={!unlockState.pmUnlocked && !todayRoutine?.pm_done}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${todayRoutine?.pm_done ? 'bg-blue-500/10 border-blue-500/30' : 'bg-black/20 border-white/5 hover:border-white/20'}`}
                >
                   <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${todayRoutine?.pm_done ? 'bg-blue-500 border-blue-500 text-black' : 'border-zinc-500'}`}>
                    {todayRoutine?.pm_done && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`font-semibold ${todayRoutine?.pm_done ? 'text-blue-400' : 'text-zinc-300'}`}>Night Skincare</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* METRICS & CATEGORY PROTOCOL */}
        <div className="lg:col-span-2 space-y-8">
          
          <div>
            <h3 className="text-xl font-bold text-white mb-6">Performance Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <p className="text-zinc-400 text-xs font-semibold mb-2">Severity Change</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-white">{progressSummary?.improvement_pct ?? 0}%</span>
                  <span className="text-green-400 text-sm mb-1">↓</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <p className="text-zinc-400 text-xs font-semibold mb-2">Recovery Speed</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-white">{progressSummary?.recovery_velocity ?? 0}%</span>
                  <span className="text-green-400 text-sm mb-1">↑</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <p className="text-zinc-400 text-xs font-semibold mb-2">Consistency</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-white">{consistencyScore}</span>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <p className="text-zinc-400 text-xs font-semibold mb-2">Confidence</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-white">{progressSummary?.confidence_score ?? 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                Category Protocol
                <span className="text-sm font-normal text-zinc-400 cursor-pointer hover:text-white transition-colors">View full map →</span>
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {todayProtocolTasks.length > 0 ? todayProtocolTasks.map((task) => (
                  <div key={task.id} className="bg-black/20 border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                    <div>
                      <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">{task.slot} Protocol</p>
                      <p className="text-white font-medium text-lg leading-tight mb-2">{task.label}</p>
                    </div>
                    <p className="text-zinc-500 text-xs mt-4 capitalize">Freq: {task.frequency.replace(/_/g, " ")}</p>
                  </div>
               )) : (
                  <div className="col-span-2 bg-black/20 border border-white/5 rounded-2xl p-8 text-center border-dashed">
                    <p className="text-zinc-400">Complete analyzer to generate your personalized category protocol today.</p>
                    <button className="mt-4 bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-green-400 transition-colors">Analyze Skin</button>
                  </div>
               )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
