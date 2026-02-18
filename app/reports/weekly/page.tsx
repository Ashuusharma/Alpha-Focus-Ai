"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import WeeklyReport from "@/src/components/reports/WeeklyReport";
import { buildWeeklySummary } from "@/src/utils/weeklyReportEngine";
import { postWeeklyReport } from "@/src/services/lifestyleApi";
import { getActiveUserName } from "@/lib/userScopedStorage";

function getNumberSeries(storageKey: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.values(parsed)
      .map((entry) => {
        if (typeof entry === "number") return entry;
        if (typeof entry === "object" && entry && "hours" in entry) return Number((entry as { hours: number }).hours);
        if (typeof entry === "object" && entry && "intake" in entry) return Number((entry as { intake: number }).intake);
        return 0;
      })
      .filter((value) => Number.isFinite(value));
  } catch {
    return [];
  }
}

function getMoodSeries(): Array<"calm" | "neutral" | "stressed"> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("oneman_mood_logs_v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, "calm" | "neutral" | "stressed">;
    return Object.values(parsed);
  } catch {
    return [];
  }
}

export default function WeeklyReportPage() {
  const router = useRouter();

  const summary = useMemo(() => {
    const sleepHours = getNumberSeries("oneman_sleep_logs_v1");
    const hydrationMl = getNumberSeries("oneman_hydration_logs_v1");
    const moods = getMoodSeries();
    const routineCompliance = [65, 72, 78, 80, 84, 88, 90];
    const scoreTrend = [62, 66, 68, 71, 73, 76, 78];

    return buildWeeklySummary({ sleepHours, hydrationMl, moods, routineCompliance, scoreTrend });
  }, []);

  useEffect(() => {
    void postWeeklyReport({
      userId: getActiveUserName() || "guest",
      strengths: summary.strengths,
      risks: summary.risks,
      suggestedFocus: summary.suggestedFocus,
      avgSleep: summary.avgSleep,
      avgHydration: summary.avgHydration,
      compliance: summary.compliance,
      scoreDelta: summary.scoreDelta,
    });
  }, [summary]);

  return (
    <div className="min-h-screen bg-[#030917] text-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-gray-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-bold mb-2">Weekly AI Report</h1>
        <p className="text-gray-400 mb-6">Generated from your current lifestyle logs and consistency trend.</p>
        <WeeklyReport summary={summary} />
      </div>
    </div>
  );
}
