"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/AuthProvider";
import { useUserStore } from "@/stores/useUserStore";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { supabase } from "@/lib/supabaseClient";
import { calculateProgressMetricsForCategory } from "@/lib/calculateProgressMetrics";
import { useToast } from "@/app/toast/ToastContext";
import { getRewardCatalog } from "@/lib/couponService";
import { getRewardFeaturedProduct } from "@/lib/alphaRewardCommerce";
import { createRewardUnlock } from "@/lib/rewardUnlockService";
import {
  generateDailyProtocolMeta,
  generateDailyProtocolTasks,
  getCurrentProtocolPhase,
  getProtocolTemplate,
  type ProtocolTask,
} from "@/lib/protocolTemplates";
import { maybeSendRoutineReminder } from "@/lib/routineReminderSystem";
import { categories, CategoryId } from "@/lib/questions";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import {
  AIInsightEngine,
  BeforeAfterTimeline,
  DashboardHero,
  ProgressVisualization,
  RecoveryProgramNavigator,
  RewardProgress,
  TreatmentPlan,
} from "./_components";

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

type WeeklyProgressPoint = {
  week: string;
  severity: number;
  adherence: number;
  confidence: number;
};

type TimelinePhoto = {
  label: "Day 1" | "Day 14" | "Day 30";
  date: string | null;
  imageUrl: string | null;
};

type AIInsight = {
  id: string;
  title: string;
  message: string;
  actions?: string[];
  expectedOutcome?: string;
  impact: "high" | "medium" | "low";
};

type AlphaSikkaAwardResponse = {
  ok?: boolean;
  awarded?: number;
  taskBonus?: number;
  streakBonus?: number;
  penaltyApplied?: number;
  toast?: string;
  summary?: {
    currentBalance?: number;
  };
  error?: string;
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
    const response = await fetch("/api/alpha-sikka/earn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, referenceId, metadata }),
    });

    return (await response.json().catch(() => null)) as AlphaSikkaAwardResponse | null;
  } catch {
    // Reward write is best-effort and should never block routine save UX.
    return null;
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

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function safeDate(value: unknown) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function numericFromRow(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function toCategoryId(value: unknown): CategoryId | null {
  if (typeof value !== "string") return null;
  const match = categories.find((item) => item.id === value);
  if (!match) return null;
  return getProtocolTemplate(match.id as CategoryId) ? (match.id as CategoryId) : null;
}

function pickCategoryFromRecord(row: Record<string, unknown>): CategoryId | null {
  return (
    toCategoryId(row.selected_category) ||
    toCategoryId(row.analyzer_category) ||
    toCategoryId(row.category) ||
    toCategoryId(row.target_category) ||
    null
  );
}

export default function DashboardPage() {
  const { user, loading } = useContext(AuthContext);
  const { showToast } = useToast();
  const storeLoading = useUserStore((state) => state.loading);
  const profile = useUserStore((state) => state.profile);
  const alphaSummary = useUserStore((state) => state.alphaSummary as Record<string, unknown> | null);
  const reports = useUserStore((state) => state.reports as Array<Record<string, unknown>>);
  const assessments = useUserStore((state) => state.assessments as Array<Record<string, unknown>>);
  const routines = useUserStore((state) => state.routines as Array<Record<string, unknown>>);
  const scans = useUserStore((state) => state.scans as Array<Record<string, unknown>>);
  const clinicalScores = useUserStore((state) => state.clinicalScores as Record<string, unknown> | null);
  const [refreshing, setRefreshing] = useState(false);
  const [todayRoutine, setTodayRoutine] = useState<RoutineLogRow | null>(null);
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [draftSleepHours, setDraftSleepHours] = useState<string>("");
  const [draftHydrationMl, setDraftHydrationMl] = useState<string>("");
  const [routineDraftDirty, setRoutineDraftDirty] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [phaseName, setPhaseName] = useState<string>("Stabilization");
  const [programDay, setProgramDay] = useState<number>(1);
  const [dailyGoal, setDailyGoal] = useState<string>("Daily recovery objective");
  const [expectedResult, setExpectedResult] = useState<string>("Improved symptom control with consistency.");
  const [nowTick, setNowTick] = useState<Date>(new Date());
  const rewardCatalog = useMemo(() => getRewardCatalog(), []);

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
  }, [user?.id, routines]);

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

    const loadSelectedCategory = async () => {
      const { data: activeAnalysis } = await supabase
        .from("user_active_analysis")
        .select("selected_category")
        .eq("user_id", user.id)
        .maybeSingle();

      const selectedCategory = toCategoryId(activeAnalysis?.selected_category || null);
      if (!selectedCategory) return;
      setActiveCategory((prev) => prev || selectedCategory);
    };

    void loadSelectedCategory();
  }, [user?.id]);

  useEffect(() => {
    if (!user || !activeCategory) return;

    const loadClinicalPanel = async () => {
      const selectedCategory = activeCategory;

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
      setProgramDay(dayNumber);

      const template = getProtocolTemplate(selectedCategory);
      if (template) {
        setPhaseName(getCurrentProtocolPhase(template, dayNumber).name);
      }

      const dailyMeta = generateDailyProtocolMeta(selectedCategory, dayNumber);
      if (dailyMeta) {
        setDailyGoal(dailyMeta.dailyGoal);
        setExpectedResult(dailyMeta.expectedResult);
      }

      generateDailyProtocolTasks(selectedCategory, dayNumber);
    };

    void loadClinicalPanel();
  }, [user?.id, activeCategory, routines.length, scans.length, assessments.length, reports.length, clinicalScores]);

  useEffect(() => {
    const interval = setInterval(() => {
      maybeSendRoutineReminder();
      setNowTick(new Date());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        void hydrateUserData(user.id, { force: true, silent: true });
      }, 300);
    };

    const channel = supabase
      .channel(`dashboard-realtime-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "routine_logs", filter: `user_id=eq.${user.id}` },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_clinical_scores", filter: `user_id=eq.${user.id}` },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_progress_metrics", filter: `user_id=eq.${user.id}` },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "photo_scans", filter: `user_id=eq.${user.id}` },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

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

    const rewardJobs: Array<Promise<AlphaSikkaAwardResponse | null>> = [];
    const notificationJobs: Array<Promise<void>> = [];
    const startingBalance = Number(alphaSummary?.current_balance ?? 0);

    if (!previous.am_done && settled.am_done) {
      rewardJobs.push(awardAlphaSikka("log_am_routine", `routine:${dayRef}:am`, { log_date: dayRef }));
      notificationJobs.push(emitNotification("routine_completed", `routine_completed:${dayRef}:am`, { phase: "am", logDate: dayRef }));
    }

    if (!previous.pm_done && settled.pm_done) {
      rewardJobs.push(awardAlphaSikka("log_pm_routine", `routine:${dayRef}:pm`, { log_date: dayRef }));
      notificationJobs.push(emitNotification("routine_completed", `routine_completed:${dayRef}:pm`, { phase: "pm", logDate: dayRef }));
    }

    const prevHydrationGoal = (previous.hydration_ml || 0) >= 2500;
    const nextHydrationGoal = (settled.hydration_ml || 0) >= 2500;
    if (!prevHydrationGoal && nextHydrationGoal) {
      rewardJobs.push(awardAlphaSikka("hydration_goal", `routine:${dayRef}:hydration_goal`, { hydration_ml: settled.hydration_ml || 0 }));
    }

    const prevSleepGoal = (previous.sleep_hours || 0) >= 7;
    const nextSleepGoal = (settled.sleep_hours || 0) >= 7;
    if (!prevSleepGoal && nextSleepGoal) {
      rewardJobs.push(awardAlphaSikka("sleep_goal", `routine:${dayRef}:sleep_goal`, { sleep_hours: settled.sleep_hours || 0 }));
    }

    const prevFullDay = Boolean(previous.am_done) && Boolean(previous.pm_done) && prevHydrationGoal && prevSleepGoal;
    const nextFullDay = Boolean(settled.am_done) && Boolean(settled.pm_done) && nextHydrationGoal && nextSleepGoal;
    if (!prevFullDay && nextFullDay) {
      rewardJobs.push(
        awardAlphaSikka("full_day_completed", `routine:${dayRef}:full_day`, {
          am_done: Boolean(settled.am_done),
          pm_done: Boolean(settled.pm_done),
          hydration_ml: settled.hydration_ml || 0,
          sleep_hours: settled.sleep_hours || 0,
        })
      );
      notificationJobs.push(
        emitNotification("streak_milestone", `full_day_completed:${dayRef}`, {
          logDate: dayRef,
          consistencyScore: (Boolean(settled.am_done) ? 1 : 0) + (Boolean(settled.pm_done) ? 1 : 0),
        })
      );
    }

    if (notificationJobs.length) {
      void Promise.all(notificationJobs);
    }

    if (rewardJobs.length) {
      void Promise.allSettled(rewardJobs).then((results) => {
        const payloads = results
          .filter((result): result is PromiseFulfilledResult<AlphaSikkaAwardResponse | null> => result.status === "fulfilled")
          .map((result) => result.value)
          .filter((payload): payload is AlphaSikkaAwardResponse => Boolean(payload?.ok));

        const totalAwarded = payloads.reduce((sum, payload) => sum + Number(payload.awarded || 0) + Number(payload.taskBonus || 0) + Number(payload.streakBonus || 0), 0);
        const totalPenalty = payloads.reduce((sum, payload) => sum + Number(payload.penaltyApplied || 0), 0);
        const latestBalance = payloads.reduce((current, payload) => {
          const nextBalance = Number(payload.summary?.currentBalance || 0);
          return nextBalance > 0 ? nextBalance : current;
        }, startingBalance);
        const unlockedReward = [...rewardCatalog]
          .filter((reward) => startingBalance < reward.cost && latestBalance >= reward.cost)
          .sort((left, right) => right.cost - left.cost)[0];

        if (unlockedReward) {
          const featuredProduct = getRewardFeaturedProduct(unlockedReward.discountPercent);
          createRewardUnlock({
            discountPercent: unlockedReward.discountPercent,
            productId: featuredProduct?.sku || null,
            rewardId: unlockedReward.id,
            source: "reward_unlock",
          });
          showToast(
            featuredProduct
              ? `Unlocked ${unlockedReward.discountPercent}% OFF. ${featuredProduct.name} is now your best conversion move.`
              : `Unlocked ${unlockedReward.discountPercent}% OFF. Your next product reward is ready.`,
            "success",
            6500
          );
        } else if (totalAwarded > 0 || totalPenalty > 0) {
          const net = totalAwarded - totalPenalty;
          const rewardMessage = net >= 0
            ? `+${net} A$ synced${totalPenalty > 0 ? ` after ${totalPenalty} A$ penalty` : ""}`
            : `${Math.abs(net)} A$ deducted after missed-day penalty`;
          showToast(rewardMessage, net >= 0 ? "success" : "info", 5000);
        }

        void hydrateUserData(user.id, { force: true, silent: true });
      });
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
  const consistencyScore = useMemo(() => {
    const am = todayRoutine?.am_done ? 25 : 0;
    const pm = todayRoutine?.pm_done ? 25 : 0;
    const hydration = (todayRoutine?.hydration_ml || 0) >= 2500 ? 25 : 0;
    const sleep = (todayRoutine?.sleep_hours || 0) >= 7 ? 25 : 0;
    return am + pm + hydration + sleep;
  }, [todayRoutine]);

  const unlockState = useMemo(() => getUnlockState(nowTick), [nowTick]);

  const routineStreakDays = useMemo(() => calculateRoutineStreakDays(routines, todayRoutine), [routines, todayRoutine]);
  const treatmentCategories = useMemo(() => {
    const derived = [
      ...scans.map((row) => pickCategoryFromRecord(row)).filter(Boolean),
      ...assessments.map((row) => pickCategoryFromRecord(row)).filter(Boolean),
      ...reports.map((row) => pickCategoryFromRecord(row)).filter(Boolean),
    ] as CategoryId[];

    const ordered = [activeCategory, ...derived].filter(Boolean) as CategoryId[];
    return ordered.filter((cat, idx) => ordered.indexOf(cat) === idx);
  }, [activeCategory, scans, assessments, reports]);

  useEffect(() => {
    if (activeCategory || treatmentCategories.length === 0) return;
    setActiveCategory(treatmentCategories[0]);
  }, [activeCategory, treatmentCategories]);

  const categoryLabel = activeCategory ? categories.find((c) => c.id === activeCategory)?.label || "Recovery" : "Recovery";
  const userName = String(profile?.full_name || user?.email?.split("@")[0] || "User");
  const transformationProgress = Math.max(0, Math.min(100, Math.round((Number(progressSummary?.improvement_pct || 0) + Number(consistencyScore)) / 2)));
  const confidenceScore = Number(progressSummary?.confidence_score || alphaScore || 0);
  const focusScore = Number(progressSummary?.discipline_index || consistencyScore || 0);
  const recoveryVelocityLabel = Number(progressSummary?.recovery_velocity || 0) >= 70 ? "Fast" : Number(progressSummary?.recovery_velocity || 0) >= 40 ? "Moderate" : "Stabilizing";

  const weeklyProgressData = useMemo(() => {
    const now = new Date();
    const weekBoundaries = [28, 21, 14, 7, 0].map((offset) => {
      const d = new Date(now);
      d.setDate(now.getDate() - offset);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const categoryScans = scans
      .filter((row) => {
        if (!activeCategory) return true;
        const mapped = pickCategoryFromRecord(row) || toCategoryId(row.analyzer_category) || toCategoryId(row.category);
        return mapped === activeCategory;
      })
      .map((row) => ({ ...row, scanDate: safeDate(row.scan_date || row.created_at) }))
      .filter((row) => Boolean(row.scanDate))
      .sort((a, b) => (a.scanDate!.getTime() - b.scanDate!.getTime()));

    const firstSeverity = categoryScans.length > 0
      ? numericFromRow(categoryScans[0], ["severity_score", "clinical_severity", "score", "alpha_score"]) ?? 70
      : Math.max(35, Math.round(80 - Number(progressSummary?.improvement_pct || 0) * 0.6));

    const finalSeverity = Math.max(5, Math.round(firstSeverity - Number(progressSummary?.improvement_pct || 0) * 0.6));

    const rows: WeeklyProgressPoint[] = [];

    for (let i = 0; i < 4; i += 1) {
      const start = weekBoundaries[i];
      const end = weekBoundaries[i + 1];

      const weekRoutines = routines.filter((row) => {
        const d = safeDate(row.log_date || row.created_at);
        return Boolean(d && d >= start && d < end);
      });

      const adherence = weekRoutines.length
        ? Math.round(
            (weekRoutines.reduce((sum, row) => {
              const completion = (Boolean(row.am_done) ? 0.5 : 0) + (Boolean(row.pm_done) ? 0.5 : 0);
              return sum + completion;
            }, 0) /
              weekRoutines.length) *
              100
          )
        : 0;

      const scanInWeek = categoryScans
        .filter((row) => Boolean(row.scanDate && row.scanDate >= start && row.scanDate < end))
        .map((row) => numericFromRow(row, ["severity_score", "clinical_severity", "score", "alpha_score"]))
        .find((value) => value != null);

      const interpolatedSeverity = Math.round(firstSeverity - ((firstSeverity - finalSeverity) * (i + 1)) / 4);
      const severity = Math.max(0, Math.min(100, Math.round(scanInWeek ?? interpolatedSeverity)));

      const confidenceBase = Number(progressSummary?.confidence_score || 0);
      const confidence = Math.max(10, Math.min(100, Math.round(confidenceBase * 0.7 + adherence * 0.3)));

      rows.push({
        week: `W${i + 1}`,
        severity,
        adherence,
        confidence,
      });
    }

    return rows;
  }, [scans, routines, activeCategory, progressSummary]);

  const beforeAfterPhotos = useMemo(() => {
    const categoryScans = scans
      .filter((row) => {
        if (!activeCategory) return true;
        const mapped = pickCategoryFromRecord(row) || toCategoryId(row.analyzer_category) || toCategoryId(row.category);
        return mapped === activeCategory;
      })
      .map((row) => ({
        id: String(row.id || ""),
        scanDate: safeDate(row.scan_date || row.created_at),
        scanDateRaw: typeof row.scan_date === "string" ? row.scan_date : typeof row.created_at === "string" ? row.created_at : null,
        imageUrl: typeof row.image_url === "string" ? row.image_url : null,
      }))
      .filter((row) => Boolean(row.scanDate))
      .sort((a, b) => a.scanDate!.getTime() - b.scanDate!.getTime());

    if (categoryScans.length === 0) {
      return [
        { label: "Day 1", date: null, imageUrl: null },
        { label: "Day 14", date: null, imageUrl: null },
        { label: "Day 30", date: null, imageUrl: null },
      ] as TimelinePhoto[];
    }

    const first = categoryScans[0];
    const last = categoryScans[categoryScans.length - 1];
    const targetMidTs = first.scanDate!.getTime() + Math.floor((last.scanDate!.getTime() - first.scanDate!.getTime()) / 2);

    let mid = categoryScans[0];
    let midDiff = Math.abs(categoryScans[0].scanDate!.getTime() - targetMidTs);
    for (const row of categoryScans) {
      const diff = Math.abs(row.scanDate!.getTime() - targetMidTs);
      if (diff < midDiff) {
        midDiff = diff;
        mid = row;
      }
    }

    return [
      { label: "Day 1", date: first.scanDateRaw, imageUrl: first.imageUrl },
      { label: "Day 14", date: mid.scanDateRaw, imageUrl: mid.imageUrl },
      { label: "Day 30", date: last.scanDateRaw, imageUrl: last.imageUrl },
    ] as TimelinePhoto[];
  }, [scans, activeCategory]);

  const aiInsights = useMemo(() => {
    const items: AIInsight[] = [];

    const last7 = routines.filter((row) => {
      const d = safeDate(row.log_date || row.created_at);
      return Boolean(d && d >= daysAgo(7));
    });
    const prev7 = routines.filter((row) => {
      const d = safeDate(row.log_date || row.created_at);
      return Boolean(d && d >= daysAgo(14) && d < daysAgo(7));
    });

    const avgHydrationLast7 = last7.length ? Math.round(last7.reduce((sum, row) => sum + Number(row.hydration_ml || 0), 0) / last7.length) : 0;
    const avgHydrationPrev7 = prev7.length ? Math.round(prev7.reduce((sum, row) => sum + Number(row.hydration_ml || 0), 0) / prev7.length) : 0;
    const avgSleepLast7 = last7.length ? Number((last7.reduce((sum, row) => sum + Number(row.sleep_hours || 0), 0) / last7.length).toFixed(1)) : 0;
    const avgSleepPrev7 = prev7.length ? Number((prev7.reduce((sum, row) => sum + Number(row.sleep_hours || 0), 0) / prev7.length).toFixed(1)) : 0;

    const w3 = weeklyProgressData[2]?.adherence ?? 0;
    const w4 = weeklyProgressData[3]?.adherence ?? 0;
    if (avgHydrationPrev7 > 0 && avgHydrationLast7 < avgHydrationPrev7 - 250) {
      items.push({
        id: "hydration-drop",
        title: "Hydration drop detected",
        message: `Your hydration dropped from ~${avgHydrationPrev7}ml to ~${avgHydrationLast7}ml this week, which can slow visible recovery. Target +400ml daily for next 5 days.`,
        actions: ["Add one 500ml bottle before lunch", "Set hydration reminder at 11:30 AM", "Track evening hydration in checkpoint"],
        expectedOutcome: "Hydration consistency rebounds within 3-5 days and supports visible recovery pace.",
        impact: "high",
      });
    }

    if (avgSleepPrev7 > 0 && avgSleepLast7 < avgSleepPrev7 - 0.7) {
      items.push({
        id: "sleep-regression",
        title: "Sleep consistency regressed",
        message: `Average sleep reduced from ${avgSleepPrev7}h to ${avgSleepLast7}h. Move bedtime 30 minutes earlier to improve repair window.`,
        actions: ["Set a fixed lights-off alarm", "Avoid caffeine after 4 PM"],
        expectedOutcome: "Night recovery quality improves and inflammation markers stabilize.",
        impact: "medium",
      });
    }

    if (w4 < w3 - 15) {
      items.push({
        id: "adherence-dip",
        title: "Routine adherence dipped",
        message: `Weekly adherence dropped from ${w3}% to ${w4}%. Use Beginner mode for 3 days and complete all morning slots before re-scaling.`,
        actions: ["Focus only on morning block for next 3 days", "Restart full routine after adherence recovers"],
        expectedOutcome: "Adherence trend recovers next week and confidence score increases.",
        impact: "high",
      });
    }

    const latestScanDate = scans
      .map((row) => safeDate(row.scan_date || row.created_at))
      .filter((d): d is Date => Boolean(d))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (!latestScanDate || latestScanDate < daysAgo(14)) {
      items.push({
        id: "scan-cadence",
        title: "Progress scan overdue",
        message: "No recent scan in the last 14 days. Upload a fresh scan to improve trend accuracy and AI recommendations.",
        actions: ["Upload one scan in consistent lighting", "Repeat weekly scan every 7 days"],
        expectedOutcome: "AI trend confidence improves with better longitudinal comparison.",
        impact: "medium",
      });
    }

    if (items.length === 0) {
      items.push({
        id: "positive-momentum",
        title: "Momentum is stable",
        message: "Your routine pattern is stable this week. Keep the same timing window for next 7 days to maximize compounding results.",
        actions: ["Keep current schedule unchanged", "Upload a weekly photo to validate trend"],
        expectedOutcome: "Stable routine rhythm compounds into stronger monthly gains.",
        impact: "low",
      });
    }

    return items.slice(0, 3);
  }, [routines, weeklyProgressData, scans]);

  const behaviorInsights = useMemo(() => {
    const insights: string[] = [];
    const adherenceNow = weeklyProgressData[3]?.adherence ?? 0;
    const adherencePrev = weeklyProgressData[2]?.adherence ?? 0;

    if (adherenceNow >= adherencePrev + 10) {
      insights.push("Adherence improved week-over-week, indicating better routine lock-in.");
    } else if (adherenceNow + 10 <= adherencePrev) {
      insights.push("Adherence declined this week; simplify mission load to recover momentum.");
    }

    if ((todayRoutine?.hydration_ml || 0) >= 2500 && (todayRoutine?.sleep_hours || 0) >= 7) {
      insights.push("Hydration and sleep goals are both met, which supports faster overnight recovery.");
    }

    if (!todayRoutine?.am_done || !todayRoutine?.pm_done) {
      insights.push("Completing both AM and PM check-ins today will improve confidence and streak stability.");
    }

    return insights.slice(0, 3);
  }, [weeklyProgressData, todayRoutine]);

  const recoveryTrend = useMemo(() => {
    const w3 = weeklyProgressData[2]?.adherence ?? 0;
    const w4 = weeklyProgressData[3]?.adherence ?? 0;
    if (w4 >= w3 + 8) return "Improving";
    if (w4 + 8 <= w3) return "Needs attention";
    return "Stable";
  }, [weeklyProgressData]);

  const nextMilestone = useMemo(() => {
    if (programDay < 8) return "Complete Reset phase with full AM consistency";
    if (programDay < 15) return "Finish Repair phase and maintain hydration targets";
    return "Close Stabilize phase with 80%+ adherence";
  }, [programDay]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] px-4 py-6 text-[#1d1d1f] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-[#6e6e73]">Loading personalized dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(0,113,227,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(41,151,255,0.1),transparent_30%),linear-gradient(180deg,#05070c_0%,#0a0f1a_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8 md:space-y-10">
        <section className="animate-in fade-in duration-500">
          <DashboardHero
            userName={userName}
            categoryLabel={categoryLabel}
            transformationProgress={transformationProgress}
            phaseLabel={phaseName}
            recoveryTrend={recoveryTrend}
            confidenceScore={confidenceScore}
            streakDays={routineStreakDays}
            alphaBalance={balance}
            dayLabel={`Day ${programDay} / 30`}
            nextMilestone={nextMilestone}
          />
        </section>

        <section className="nv-section-white space-y-4 animate-in fade-in duration-500 delay-100" id="recovery-roadmap">
          <RecoveryProgramNavigator
            dayNumber={programDay}
            totalDays={30}
            activePhase={programDay <= 7 ? "Reset" : programDay <= 14 ? "Repair" : "Stabilize"}
            onViewFullProgram={() => {
              window.location.href = "/recovery-program";
            }}
          />
          <TreatmentPlan
            categoryLabel={categoryLabel}
            phaseName={phaseName}
            dayNumber={programDay}
            category={activeCategory}
            availableCategories={treatmentCategories}
            userId={user.id}
            onCategoryChange={setActiveCategory}
            mode="mission"
          />
        </section>

        <section className="nv-section-white animate-in fade-in duration-500 delay-150">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6e6e73]">Recovery Intelligence</p>
              <h2 className="text-xl font-black text-[#111]">Clinical Signal Summary</h2>
            </div>
            <p className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#0071e3] border border-[#0071e3]">
              {activeCategory ? `Category: ${categoryLabel}` : "No active category"}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.4rem] border border-[#d9d9de] bg-[#FFF8EE] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7A6D5A]">Severity Change</p>
              <p className="mt-2 text-2xl font-black text-[#111]">down {progressSummary?.improvement_pct ?? 0}%</p>
            </div>
            <div className="rounded-[1.4rem] border border-[#d9d9de] bg-[#FFF8EE] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7A6D5A]">Consistency</p>
              <p className="mt-2 text-2xl font-black text-[#111]">{progressSummary?.consistency_score ?? consistencyScore}%</p>
            </div>
            <div className="rounded-[1.4rem] border border-[#d9d9de] bg-[#FFF8EE] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7A6D5A]">Recovery Speed</p>
              <p className="mt-2 text-2xl font-black text-[#111]">{recoveryVelocityLabel}</p>
            </div>
            <div className="rounded-[1.4rem] border border-[#d9d9de] bg-[#FFF8EE] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7A6D5A]">Confidence</p>
              <p className="mt-2 text-2xl font-black text-[#111]">{confidenceScore}</p>
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-[#6e6e73]">{refreshing || storeLoading ? "Syncing latest data..." : "Realtime sync is active for routine, rewards, and progress signals."}</p>
        </section>

        <section className="nv-section-dark animate-in fade-in duration-500 delay-200">
          <ProgressVisualization data={weeklyProgressData} />
        </section>

        <section className="nv-section-white animate-in fade-in duration-500 delay-300">
          <BeforeAfterTimeline categoryLabel={categoryLabel} photos={beforeAfterPhotos} />
        </section>

        <section className="nv-section-white animate-in fade-in duration-500 delay-500">
          <RewardProgress balance={balance} streakDays={routineStreakDays} />
        </section>

        <section className="nv-section-white animate-in fade-in duration-500 delay-700">
          <AIInsightEngine insights={aiInsights} behaviorInsights={behaviorInsights} />
        </section>

        {!profile && (
          <section className="nv-section-white text-sm text-[#6e6e73]">
            Complete your profile to improve recommendation precision.
          </section>
        )}
      </div>
    </main>
  );
}

