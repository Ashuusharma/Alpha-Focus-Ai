"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { Activity, ChevronDown, Flame, Sparkles, Target } from "lucide-react";
import { AuthContext } from "@/contexts/AuthProvider";
import { useUserStore } from "@/stores/useUserStore";
import { hydrateUserData } from "@/lib/hydrateUserData";
import PullToRefresh from "@/components/ui/PullToRefresh";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import StatCard from "@/components/ui/StatCard";
import Hero from "@/components/ui/Hero";
import ScanUsageRing from "@/components/ui/ScanUsageRing";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { calculateProgressMetricsForCategory } from "@/lib/calculateProgressMetrics";
import {
  generateDailyProtocolMeta,
  generateDailyProtocolTasks,
  getCurrentProtocolPhase,
  getProtocolTemplate,
} from "@/lib/protocolTemplates";
import { maybeSendRoutineReminder } from "@/lib/routineReminderSystem";
import { categories, CategoryId } from "@/lib/questions";
import {
  AIInsightEngine,
  BeforeAfterTimeline,
  ProgressVisualization,
  RecoveryProgramNavigator,
  RewardProgress,
  TreatmentPlan,
} from "./_components";
import EntitlementSummary from "./_components/EntitlementSummary";
import QuickActions from "./_components/QuickActions";
import ActivityTimeline from "./_components/ActivityTimeline";
import { SkeletonBlock, SkeletonCard } from "@/components/ui/Skeleton";

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
  const clinicalScores = useUserStore((state) => state.clinicalScores as Record<string, unknown> | null);
  const [refreshing, setRefreshing] = useState(false);
  const [todayRoutine, setTodayRoutine] = useState<RoutineLogRow | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId | null>(null);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [phaseName, setPhaseName] = useState<string>("Stabilization");
  const [programDay, setProgramDay] = useState<number>(1);
  // Tracked but not currently rendered anywhere on this page.
  const [_dailyGoal, setDailyGoal] = useState<string>("Daily recovery objective");
  const [_expectedResult, setExpectedResult] = useState<string>("Improved symptom control with consistency.");

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

  const balance = Number(alphaSummary?.current_balance ?? 0);
  const alphaScore = Number((reports[0]?.alpha_score as number | undefined) ?? 0);
  const consistencyScore = useMemo(() => {
    const am = todayRoutine?.am_done ? 25 : 0;
    const pm = todayRoutine?.pm_done ? 25 : 0;
    const hydration = (todayRoutine?.hydration_ml || 0) >= 2500 ? 25 : 0;
    const sleep = (todayRoutine?.sleep_hours || 0) >= 7 ? 25 : 0;
    return am + pm + hydration + sleep;
  }, [todayRoutine]);

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

    // Dashboard "AI Guidance" shows exactly one focused recommendation, not
    // competing cards (Phase 9C.5 IA rule) — the push order above already
    // ranks real problems (hydration/sleep/adherence) ahead of the generic
    // scan-cadence nudge and the positive-momentum fallback, so taking the
    // first item is taking the single highest-priority one, not an
    // arbitrary truncation.
    return items.slice(0, 1);
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

  // Recent Activity: pure UI-layer derivation from data already loaded into
  // the store (scans/reports/routines) — no new queries, no new business
  // logic, just presenting existing state as a timeline.
  const activityItems = useMemo(() => {
    type Item = { id: string; label: string; timestamp: string };
    const items: Item[] = [];

    for (const row of scans) {
      const ts = typeof row.scan_date === "string" ? row.scan_date : typeof row.created_at === "string" ? row.created_at : null;
      if (!ts) continue;
      items.push({ id: `scan-${String(row.id || ts)}`, label: "Photo scan uploaded", timestamp: ts });
    }

    for (const row of reports) {
      const ts = typeof row.created_at === "string" ? row.created_at : typeof row.generated_at === "string" ? row.generated_at : null;
      if (!ts) continue;
      items.push({ id: `report-${String(row.id || ts)}`, label: "Recovery protocol generated", timestamp: ts });
    }

    for (const row of routines) {
      const ts = typeof row.log_date === "string" ? row.log_date : typeof row.created_at === "string" ? row.created_at : null;
      if (!ts) continue;
      if (row.am_done) items.push({ id: `routine-am-${ts}`, label: "Morning routine completed", timestamp: ts });
      if (row.pm_done) items.push({ id: `routine-pm-${ts}`, label: "Evening routine completed", timestamp: ts });
    }

    return items
      .filter((item) => safeDate(item.timestamp))
      .sort((a, b) => safeDate(b.timestamp)!.getTime() - safeDate(a.timestamp)!.getTime())
      .slice(0, 6);
  }, [scans, reports, routines]);

  if (loading || !user) {
    return (
      <div className="af-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <SkeletonBlock className="h-48 rounded-[2rem] md:h-64" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SkeletonBlock className="h-24 rounded-2xl" />
            <SkeletonBlock className="h-24 rounded-2xl" />
            <SkeletonBlock className="h-24 rounded-2xl" />
          </div>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={() => hydrateUserData(user.id, { force: true, silent: true })}>
    <div className="af-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8 md:space-y-10">
        {/* 1. HERO — identity, recovery score, one primary + one secondary
            CTA. Migrated from the bespoke DashboardHero.tsx onto the shared
            Hero primitive (Phase 9C.5) — the original had no CTA at all
            despite being the hero, a real gap this migration closes. */}
        <section className="animate-in fade-in duration-500">
          <Hero
            layout="split"
            kicker={
              <>
                <Sparkles className="h-3.5 w-3.5" /> Today&apos;s Recovery
              </>
            }
            title={
              <>
                Welcome back,<br /><span className="text-[var(--accent-green)]">{userName}</span>
              </>
            }
            subtitle={`${categoryLabel} · Day ${programDay} / 30 · ${recoveryTrend} trajectory.`}
            visual={
              <ScanUsageRing
                percent={transformationProgress}
                variant="dark"
                size={200}
                strokeWidth={6}
                centerValue={`${transformationProgress}%`}
                centerLabel="Recovery Score"
              />
            }
            stats={[
              { icon: <Flame className="h-4 w-4" />, label: "Streak", value: `${routineStreakDays}d` },
              { icon: <Target className="h-4 w-4" />, label: "Phase", value: phaseName },
              { icon: <Activity className="h-4 w-4" />, label: "Confidence", value: `${confidenceScore}/100` },
              { icon: <Sparkles className="h-4 w-4" />, label: "Alpha Sikka", value: balance },
              { label: "Next Milestone", value: nextMilestone, wide: true },
            ]}
            cta={
              <>
                <Button
                  variant="primary"
                  onClick={() => document.getElementById("daily-execution-engine")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Continue Today&apos;s Protocol
                </Button>
                <Button href="/recovery-program" variant="outline">
                  View Full Program
                </Button>
              </>
            }
          />
        </section>

        {/* 2. RECOVERY SNAPSHOT — exactly 4 key metrics, no more (IA rule).
            Already compliant at 4; kept as-is. */}
        <section className="nv-section-tint-warm animate-in fade-in duration-500 delay-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink-soft)]">Recovery Intelligence</p>
              <h2 className="af-heading-section text-[var(--ink)]">Clinical Signal Summary</h2>
            </div>
            <p className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--accent-blue)] border border-[var(--accent-blue)]">
              {activeCategory ? `Category: ${categoryLabel}` : "No active category"}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Severity Change"
              value={<>down <AnimatedCounter value={progressSummary?.improvement_pct ?? 0} suffix="%" /></>}
            />
            <StatCard
              label="Consistency"
              value={<AnimatedCounter value={progressSummary?.consistency_score ?? consistencyScore} suffix="%" />}
            />
            <StatCard label="Recovery Speed" value={recoveryVelocityLabel} />
            <StatCard label="Confidence" value={<AnimatedCounter value={confidenceScore} />} />
          </div>
          <p className="mt-4 text-xs font-semibold text-[var(--ink-soft)]">{refreshing || storeLoading ? "Syncing latest data..." : "Realtime sync is active for routine, rewards, and progress signals."}</p>
        </section>

        {/* 3. AI GUIDANCE — exactly one focused recommendation (IA rule);
            aiInsights is already sliced to 1 highest-priority item above. */}
        <section className="nv-section-dark animate-in fade-in duration-500 delay-150">
          <AIInsightEngine insights={aiInsights} behaviorInsights={behaviorInsights} />
        </section>

        {/* 4. RECOVERY JOURNEY — today's plan, trend evidence, and visual
            evidence grouped under one heading instead of reading as three
            disconnected bands. Each answers a genuinely different question
            (what's my phase / are my numbers improving / what does visible
            change look like) so none were removed, only grouped. */}
        <div className="px-1">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink-soft)]">Your Progress</p>
          <h2 className="af-heading-section text-[var(--ink)]">Recovery Journey</h2>
        </div>

        <section className="nv-section-tint-cool space-y-4 animate-in fade-in duration-500 delay-200" id="recovery-roadmap">
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

        <section className="nv-section-dark animate-in fade-in duration-500 delay-300">
          <ProgressVisualization data={weeklyProgressData} />
        </section>

        <section className="nv-section-white animate-in fade-in duration-500 delay-500">
          <BeforeAfterTimeline categoryLabel={categoryLabel} photos={beforeAfterPhotos} />
        </section>

        {/* 5. ACTIVITY — recent scans/reports/routine check-ins, useful for
            confirming things are tracking, not itself a decision point. */}
        <section className="animate-in fade-in duration-500 delay-700">
          <ActivityTimeline items={activityItems} />
        </section>

        {/* 6. QUICK ACTIONS — checked against the Hero's new primary CTA;
            none of these 4 duplicate it (that CTA scrolls to today's real
            tasks, these are secondary shortcuts to other flows). */}
        <section className="animate-in fade-in duration-500 delay-700">
          <QuickActions />
        </section>

        {/* 7. OPTIONAL MODULES — billing status and reward-motivation don't
            answer "what should I do today," so they're collapsed by default
            (native <details>, zero custom JS) instead of competing for
            attention with the decision-making sections above. */}
        <details className="nv-section-tint-warm animate-in fade-in duration-500 delay-700 group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink-soft)]">Optional</p>
              <h2 className="af-heading-section text-[var(--ink)]">Account &amp; Rewards</h2>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-[var(--ink-soft)] transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-6">
            <EntitlementSummary />
            <RewardProgress balance={balance} streakDays={routineStreakDays} />
          </div>
        </details>

        {!profile && (
          <section className="nv-section-white text-sm text-[var(--ink-soft)]">
            Complete your profile to improve recommendation precision.
          </section>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}

