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
import {
  ActivityTimeline,
  AIInsightEngine,
  BeforeAfterTimeline,
  DashboardHero,
  InsightCard,
  MetricCard,
  ProtocolChecklist,
  ProgressVisualization,
  QuickActions,
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
  impact: "high" | "medium" | "low";
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
  const storeLoading = useUserStore((state) => state.loading);
  const profile = useUserStore((state) => state.profile);
  const alphaSummary = useUserStore((state) => state.alphaSummary as Record<string, unknown> | null);
  const reports = useUserStore((state) => state.reports as Array<Record<string, unknown>>);
  const assessments = useUserStore((state) => state.assessments as Array<Record<string, unknown>>);
  const routines = useUserStore((state) => state.routines as Array<Record<string, unknown>>);
  const scans = useUserStore((state) => state.scans as Array<Record<string, unknown>>);
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
  const [programDay, setProgramDay] = useState<number>(1);
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
      setTodayProtocolTasks(generateDailyProtocolTasks(selectedCategory, dayNumber));
    };

    void loadClinicalPanel();
  }, [user?.id, activeCategory]);

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

  const timelineItems = useMemo(() => {
    const routineEvents = routines.slice(0, 4).map((row, idx) => ({
      id: `routine-${idx}-${String(row.id || row.log_date || idx)}`,
      label: Boolean(row.am_done) || Boolean(row.pm_done) ? "Completed Routine Check-in" : "Routine Updated",
      timestamp: String(row.log_date || new Date().toISOString()),
    }));

    const scanEvents = scans.slice(0, 3).map((row, idx) => ({
      id: `scan-${idx}-${String(row.id || idx)}`,
      label: "Photo Scan Uploaded",
      timestamp: String(row.scan_date || row.created_at || new Date().toISOString()),
    }));

    const assessmentEvents = assessments.slice(0, 3).map((row, idx) => ({
      id: `assessment-${idx}-${String(row.id || idx)}`,
      label: "Assessment Completed",
      timestamp: String(row.completed_at || row.created_at || new Date().toISOString()),
    }));

    return [...routineEvents, ...scanEvents, ...assessmentEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [routines, scans, assessments]);

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
        impact: "high",
      });
    }

    if (avgSleepPrev7 > 0 && avgSleepLast7 < avgSleepPrev7 - 0.7) {
      items.push({
        id: "sleep-regression",
        title: "Sleep consistency regressed",
        message: `Average sleep reduced from ${avgSleepPrev7}h to ${avgSleepLast7}h. Move bedtime 30 minutes earlier to improve repair window.`,
        impact: "medium",
      });
    }

    if (w4 < w3 - 15) {
      items.push({
        id: "adherence-dip",
        title: "Routine adherence dipped",
        message: `Weekly adherence dropped from ${w3}% to ${w4}%. Use Beginner mode for 3 days and complete all morning slots before re-scaling.`,
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
        impact: "medium",
      });
    }

    if (items.length === 0) {
      items.push({
        id: "positive-momentum",
        title: "Momentum is stable",
        message: "Your routine pattern is stable this week. Keep the same timing window for next 7 days to maximize compounding results.",
        impact: "low",
      });
    }

    return items.slice(0, 3);
  }, [routines, weeklyProgressData, scans]);

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
    <main className="af-page px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <DashboardHero
          userName={userName}
          categoryLabel={categoryLabel}
          transformationProgress={transformationProgress}
          focusScore={focusScore}
          recoveryVelocityLabel={recoveryVelocityLabel}
          confidenceScore={confidenceScore}
          streakDays={routineStreakDays}
          alphaBalance={balance}
          dayLabel={`Day ${programDay} / 30`}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ProtocolChecklist
            tasks={todayProtocolTasks}
            routine={todayRoutine}
            amDisabled={!unlockState.amUnlocked && !todayRoutine?.am_done}
            pmDisabled={!unlockState.pmUnlocked && !todayRoutine?.pm_done}
            amHint={todayRoutine?.am_done ? "" : unlockState.amUnlocked ? "+3 A$ on completion" : `Locked until ${formatHour(MORNING_UNLOCK_HOUR)}`}
            pmHint={todayRoutine?.pm_done ? "" : unlockState.pmUnlocked ? "+3 A$ on completion" : `Locked until ${formatHour(NIGHT_UNLOCK_HOUR)}`}
            hydrationDraft={draftHydrationMl}
            sleepDraft={draftSleepHours}
            onToggleAm={() => saveTodayRoutine({ am_done: !todayRoutine?.am_done })}
            onTogglePm={() => saveTodayRoutine({ pm_done: !todayRoutine?.pm_done })}
            onHydrationDraftChange={(value) => {
              setDraftHydrationMl(value);
              setRoutineDraftDirty(true);
            }}
            onSleepDraftChange={(value) => {
              setDraftSleepHours(value);
              setRoutineDraftDirty(true);
            }}
            onSaveMetrics={saveMetricDraft}
            onResetDraft={() => {
              setDraftSleepHours(todayRoutine?.sleep_hours == null ? "" : String(todayRoutine.sleep_hours));
              setDraftHydrationMl(todayRoutine?.hydration_ml == null ? "" : String(todayRoutine.hydration_ml));
              setRoutineDraftDirty(false);
            }}
            canSaveDraft={routineDraftDirty}
            saving={savingRoutine}
          />

          <section className="af-card rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">Progress & Recovery Metrics</p>
                <h2 className="text-lg font-bold text-[#1F3D2B]">Your Recovery Metrics</h2>
              </div>
              <p className="text-xs font-semibold text-[#2F6F57]">
                {activeCategory ? `Category: ${categoryLabel}` : "No active category"}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricCard title="Severity Change" value={`${progressSummary?.improvement_pct ?? 0}%`} trend="Downward severity trend" tone="green" />
              <MetricCard title="Consistency Score" value={`${progressSummary?.consistency_score ?? consistencyScore}%`} trend="Routine adherence" tone="green" />
              <MetricCard title="Recovery Velocity" value={recoveryVelocityLabel} trend={`${progressSummary?.recovery_velocity ?? 0} index`} tone="amber" />
              <MetricCard title="Confidence Score" value={`${progressSummary?.confidence_score ?? 0}`} trend="Behavioral confidence" tone="green" />
            </div>

            <p className="mt-4 text-xs text-[#6B665D]">{refreshing || storeLoading ? "Syncing latest data..." : "Realtime sync is active for routine, rewards, and progress signals."}</p>
          </section>
        </div>

        <InsightCard category={activeCategory} metrics={progressSummary} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ProgressVisualization data={weeklyProgressData} />
          <AIInsightEngine insights={aiInsights} />
        </div>

        <BeforeAfterTimeline categoryLabel={categoryLabel} photos={beforeAfterPhotos} />

        <TreatmentPlan
          categoryLabel={categoryLabel}
          phaseName={phaseName}
          dayNumber={programDay}
          category={activeCategory}
          availableCategories={treatmentCategories}
          userId={user.id}
          onCategoryChange={setActiveCategory}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RewardProgress balance={balance} />
          <ActivityTimeline items={timelineItems} />
        </div>

        <QuickActions />

        {!profile && (
          <section className="af-card rounded-2xl p-6 text-sm text-[#6B665D]">
            Complete your profile to improve recommendation precision.
          </section>
        )}
      </div>
    </main>
  );
}
