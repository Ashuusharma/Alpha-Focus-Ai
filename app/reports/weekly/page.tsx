"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import WeeklyReport from "@/src/components/reports/WeeklyReport";
import { buildWeeklySummary } from "@/src/utils/weeklyReportEngine";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

type RoutineLog = {
  hydration_ml?: number | null;
  sleep_hours?: number | null;
  stress_level?: number | null;
  am_done?: boolean;
  pm_done?: boolean;
};

export default function WeeklyReportPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [logs, setLogs] = useState<RoutineLog[]>([]);

  useEffect(() => {
    const loadLogs = async () => {
      if (!user) {
        setLogs([]);
        return;
      }

      const { data } = await supabase
        .from("routine_logs")
        .select("hydration_ml,sleep_hours,stress_level,am_done,pm_done")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(14);

      setLogs((data || []) as RoutineLog[]);
    };

    loadLogs();
  }, [user]);

  const summary = useMemo(() => {
    const sleepHours = logs.map((row) => Number(row.sleep_hours || 0)).filter((v) => v > 0);
    const hydrationMl = logs.map((row) => Number(row.hydration_ml || 0)).filter((v) => v > 0);
    const moods = logs.map((row) => {
      const stress = Number(row.stress_level || 0);
      if (stress >= 7) return "stressed" as const;
      if (stress >= 4) return "neutral" as const;
      return "calm" as const;
    });
    const routineCompliance = logs.map((row) => (Number(Boolean(row.am_done)) + Number(Boolean(row.pm_done))) * 50);
    const scoreTrend = logs.map((row) => Math.max(0, 100 - Number(row.stress_level || 5) * 8)).reverse();

    return buildWeeklySummary({ sleepHours, hydrationMl, moods, routineCompliance, scoreTrend });
  }, [logs]);

  return (
    <div className="af-page-shell report-page min-h-screen text-[#1F3D2B] px-4 py-8">
      <div className="af-page-frame mx-auto max-w-5xl space-y-6">
        <section className="af-page-hero p-6 md:p-8">
          <div className="relative z-10 space-y-4">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[#6B665D] hover:text-[#1F3D2B]">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="af-page-kicker">
              <BarChart3 className="h-3.5 w-3.5" />
              Weekly Review
            </span>
            <h1 className="text-clinical-heading text-3xl font-extrabold tracking-tight md:text-4xl">Weekly AI report built from sleep, hydration, stress, and routine consistency.</h1>
            <p className="max-w-2xl text-sm leading-7 text-[#6B665D]">This view now matches the premium app shell and frames the weekly report as a decision page instead of a standalone export.</p>
          </div>
        </section>
        <WeeklyReport summary={summary} />
      </div>
    </div>
  );
}
