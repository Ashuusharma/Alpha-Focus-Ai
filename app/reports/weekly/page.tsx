"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
