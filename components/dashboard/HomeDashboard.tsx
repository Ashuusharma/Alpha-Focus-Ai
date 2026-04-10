"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RoutineTracker from "@/components/dashboard/RoutineTracker";
import HealthOverviewPanel from "@/components/dashboard/HealthOverviewPanel";
import { useLocation } from "@/app/hooks/useLocation";

type TrendPoint = {
  day: string;
  alpha: number;
  consistency: number;
  recovery: number;
};

type RoutineItem = {
  id: string;
  label: string;
  completed: boolean;
  time?: string;
  category?: "Morning" | "Evening" | "Weekly";
};

export type HomeDashboardProps = {
  greeting: string;
  confidenceScore: number;
  consistencyScore: number;
  primaryConcern: string;
  streakDays: number;

  lastUpdated?: Date;
  profileCompleteness?: number;
  trendData?: TrendPoint[];
  routineItems?: RoutineItem[];

  aiInsight?: string;
  nextAction?: string;
  expectedWindow?: string;

  activityStatus?: { completedToday: boolean; inProgress: boolean };
  recentActivityCount?: number;

  environmentMetrics?: { uv: number | null; aqi: number | null; humidity: number | null };
  environmentNote?: string;
};

export default function HomeDashboard({
  greeting,
  confidenceScore,
  consistencyScore = 78,
  primaryConcern,
  streakDays,

  lastUpdated = new Date(),
  profileCompleteness = 70,
  trendData = [
    { day: "Day 1", alpha: 60, consistency: 50, recovery: 55 },
    { day: "Day 2", alpha: 62, consistency: 55, recovery: 58 },
    { day: "Day 3", alpha: 65, consistency: 60, recovery: 62 },
    { day: "Day 4", alpha: 64, consistency: 58, recovery: 60 },
    { day: "Day 5", alpha: 68, consistency: 65, recovery: 66 },
    { day: "Day 6", alpha: 70, consistency: 72, recovery: 68 },
    { day: "Today", alpha: 72, consistency: 75, recovery: 70 },
  ],
  routineItems = [
    { id: "1", label: "Morning Cleanse", completed: true },
    { id: "2", label: "Vitamin C Serum", completed: false },
    { id: "3", label: "SPF 50+", completed: false },
  ],

  aiInsight = "Your skin barrier shows signs of improvement. Continue evening hydration to maximize recovery during sleep.",
  nextAction = "Apply Night Cream",
  expectedWindow = "3-4 Weeks",

  activityStatus = { completedToday: false, inProgress: true },
  recentActivityCount = 3,

  environmentMetrics = { uv: 5, aqi: 45, humidity: 42 },
  environmentNote = "Moderate UV levels today. Standard SPF protection is sufficient.",
}: HomeDashboardProps) {
  const [trendRange, setTrendRange] = useState<"7d" | "30d">("7d");


  const livePoint = trendData[trendData.length - 1];
  const liveAlpha = livePoint?.alpha ?? Math.round(confidenceScore);
  const liveConsistency = livePoint?.consistency ?? Math.round(consistencyScore);
  const liveRecovery = livePoint?.recovery ?? Math.round((confidenceScore + consistencyScore) / 2);
  const liveConfidence = Math.max(55, Math.min(96, Math.round(liveAlpha * 0.6 + profileCompleteness * 0.4)));

  const riskLevel = useMemo(() => {
    if (liveAlpha >= 80) return "Low";
    if (liveAlpha >= 50) return "Moderate";
    return "High";
  }, [liveAlpha]);

  const environmentalStress = useMemo(() => {
    const uvStress = environmentMetrics.uv !== null ? Math.min(40, environmentMetrics.uv * 5) : 12;
    const humidityStress = environmentMetrics.humidity !== null
      ? environmentMetrics.humidity < 40
        ? 22
        : environmentMetrics.humidity > 75
          ? 18
          : 10
      : 10;
    const pollutionStress = environmentMetrics.aqi !== null ? Math.min(40, environmentMetrics.aqi / 2.5) : 12;
    return Math.max(0, Math.min(100, Math.round(uvStress + humidityStress + pollutionStress)));
  }, [environmentMetrics.aqi, environmentMetrics.humidity, environmentMetrics.uv]);

  const visibleTrendData = useMemo(
    () => (trendRange === "7d" ? trendData.slice(-7) : trendData),
    [trendData, trendRange]
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f5f5f7] via-[#ededf2] to-[#E5E0D4] px-4 py-6 text-[#1d1d1f] sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        {/* SECTION 1: Greeting */}
        <section className="rounded-xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-md flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
             <h1 className="text-2xl font-bold text-[#1d1d1f]">{greeting}</h1>
             <div className="flex items-center gap-4 mt-2 text-sm text-[#6e6e73]">
               <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#0071e3]"></span> Streak: {streakDays} days</span>
               <span> - </span>
               <span>Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
             </div>
          </div>
          <div className="flex gap-3">
             <Link href="/image-analyzer" className="px-5 py-2.5 bg-[#0071e3] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#0071e3]/20 hover:bg-[#005bbf] transition-colors">
               New Scan
             </Link>
          </div>
        </section>

        {/* SECTION 2: Live Health Overview */}
        <HealthOverviewPanel
          lastUpdatedLabel={lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          alphaScore={liveAlpha}
          confidence={liveConfidence}
          recovery={liveRecovery}
          consistency={liveConsistency}
          primaryConcern={primaryConcern}
          riskLevel={riskLevel}
          environmentalStress={environmentalStress}
          dataCompleteness={profileCompleteness}
        />

        {/* SECTION 3: Trend Chart */}
        <section className="rounded-2xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1d1d1f]">Performance Trend</h2>
            <div className="flex bg-white/40 p-1 rounded-lg border border-white/40">
              <button
                onClick={() => setTrendRange("7d")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${trendRange === "7d" ? "bg-[#0071e3] text-white shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTrendRange("30d")}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${trendRange === "30d" ? "bg-[#0071e3] text-white shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}
              >
                30 Days
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibleTrendData}>
                <CartesianGrid stroke="#d9d9de" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6e6e73", fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6e6e73", fontSize: 10 }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="alpha" stroke="#0071e3" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#0071e3" }} />
                <Line type="monotone" dataKey="consistency" stroke="#6E9F87" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* SECTION 4: Routine & AI Insight */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Routine Tracker */}
          <section className="rounded-2xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-md h-full">
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-4">Daily Protocol</h3>
            <RoutineTracker items={routineItems} />
          </section>

          {/* AI Insight */}
          <section className="rounded-2xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-md h-full flex flex-col">
            <h3 className="text-lg font-bold text-[#1d1d1f] mb-4">Clinical Insight</h3>
            <div className="flex-1 bg-white/40 rounded-xl p-5 border border-white/40">
              <p className="text-[#1d1d1f] italic font-medium leading-relaxed">"{aiInsight}"</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
               <div className="bg-[#ededf2] p-3 rounded-xl">
                 <p className="text-xs text-[#6e6e73] uppercase tracking-wider mb-1">Status</p>
                 <p className="text-sm font-bold text-[#1d1d1f]">{activityStatus.completedToday ? "Optimized" : "Pending"}</p>
               </div>
               <div className="bg-[#ededf2] p-3 rounded-xl">
                 <p className="text-xs text-[#6e6e73] uppercase tracking-wider mb-1">Signals</p>
                 <p className="text-sm font-bold text-[#1d1d1f]">{recentActivityCount} Inputs</p>
               </div>
            </div>
          </section>
        </section>

        {/* SECTION 5: Environment */}
        <section className="rounded-2xl border border-white/60 bg-white/60 p-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-[#1d1d1f]">Environmental Impact</h3>
             <span className="text-xs font-bold text-[#C9A227] bg-[#F4EED7] px-2 py-1 rounded-md">Moderate Impact</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             {[
               { label: "UV Index", value: environmentMetrics.uv ?? "--", unit: "", desc: "Sun Exposure" },
               { label: "AQI", value: environmentMetrics.aqi ?? "--", unit: "", desc: "Pollution" },
               { label: "Humidity", value: environmentMetrics.humidity ?? "--", unit: "%", desc: "Hydration" },
             ].map((metric) => (
                <div key={metric.label} className="bg-white/40 rounded-xl p-4 border border-white/40">
                  <p className="text-xs text-[#6e6e73] uppercase tracking-wider">{metric.desc}</p>
                  <p className="text-2xl font-bold text-[#1d1d1f] mt-1">{metric.value}<span className="text-sm text-[#6e6e73] ml-1">{metric.unit}</span></p>
                </div>
             ))}
          </div>
          <p className="text-sm text-[#6e6e73] bg-[#f5f5f7] p-3 rounded-xl border border-[#d9d9de]">
            <span className="font-bold text-[#0071e3] mr-1">Recommendation:</span> {environmentNote}
          </p>
        </section>

        {/* SECTION 6: Next Action */}
        <section className="bg-[#0071e3] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
           <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.05)_50%,rgba(255,255,255,0.05)_75%,transparent_75%,transparent)] bg-[length:24px_24px]" />
           
           <div className="relative z-10 text-center md:text-left">
              <p className="text-[#99c9ff] text-sm font-bold uppercase tracking-widest mb-2">Immediate Protocol</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">{nextAction}</h3>
              <p className="text-white/80">Expected Result: Lower cortisol & better barrier repair.</p>
           </div>
           
            <div className="relative z-10 w-full rounded-xl border border-white/20 bg-white/10 p-4 text-center backdrop-blur-md md:w-auto md:min-w-[200px]">
              <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Visible Change</p>
              <p className="text-2xl font-bold text-white">{expectedWindow || "4-6 Weeks"}</p>
           </div>
        </section>

      </section>
    </main>
  );
}



