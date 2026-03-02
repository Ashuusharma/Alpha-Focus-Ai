"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TrendPoint = {
  day: string;
  alpha: number;
  consistency: number;
  recovery: number;
};

type ClinicalSnapshotPanelProps = {
  alphaScore: number;
  confidence: number;
  primaryConcern: string;
  lastUpdatedLabel: string;
  recovery: number;
  consistency: number;
  environmentalStress: number;
  trendData: TrendPoint[];
  nextAction: string;
  expectedVisibleChange: string;
};

export default function ClinicalSnapshotPanel({
  alphaScore,
  confidence,
  primaryConcern,
  lastUpdatedLabel,
  recovery,
  consistency,
  environmentalStress,
  trendData,
  nextAction,
  expectedVisibleChange,
}: ClinicalSnapshotPanelProps) {
  const [range, setRange] = useState<"7d" | "30d">("7d");

  const filteredData = useMemo(() => {
    if (range === "7d") return trendData.slice(-7);
    return trendData;
  }, [range, trendData]);

  const safeTrendData = filteredData.length > 0 ? filteredData : [{ day: "D1", alpha: alphaScore, consistency, recovery }];

  return (
    <div className="grid h-full grid-rows-[auto_auto_1fr_auto] gap-4 rounded-2xl border border-[#CFC6B8] bg-[linear-gradient(180deg,#F8F5EF_0%,#F2EEE6_100%)] p-4 sm:p-5 shadow-[0_14px_32px_rgba(0,0,0,0.08)]">
      <section className="rounded-xl border border-[#DDD6CA] bg-[#F7F4EE] p-4">
        <p className="text-xs uppercase tracking-wide text-[#6E9F87]">Clinical Intelligence Panel</p>
        <p className="metric-number mt-1 text-2xl sm:text-3xl text-[#1E4D3A]">Alpha Score: {Math.round(alphaScore)}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#2F6F57]">
          <p>Confidence: <span className="font-semibold text-[#1E4D3A]">{Math.round(confidence)}%</span></p>
          <p className="text-right">Last Updated: <span className="font-semibold text-[#1E4D3A]">{lastUpdatedLabel}</span></p>
        </div>
        <p className="mt-2 text-xs text-[#2F6F57]">Primary Concern: <span className="font-semibold text-[#1E4D3A]">{primaryConcern}</span></p>
      </section>

      <section className="rounded-xl border border-[#DDD6CA] bg-[#F7F4EE] p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white p-3">
            <p className="text-[11px] text-[#6E9F87]">Recovery</p>
            <p className="mt-1 text-sm font-semibold text-[#1E4D3A]">{Math.round(recovery)}%</p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-[11px] text-[#6E9F87]">Consistency</p>
            <p className="mt-1 text-sm font-semibold text-[#1E4D3A]">{Math.round(consistency)}%</p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-[11px] text-[#6E9F87]">Env Stress</p>
            <p className="mt-1 text-sm font-semibold text-[#1E4D3A]">{Math.round(environmentalStress)}%</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#DDD6CA] bg-[#F7F4EE] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#1E4D3A]">Trend</p>
          <div className="inline-flex rounded-full border border-[#D9D2C7] bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setRange("7d")}
              className={`rounded-full px-2.5 py-1 ${range === "7d" ? "bg-[#E8EFEA] text-[#1E4D3A]" : "text-[#6E9F87]"}`}
            >
              7-day
            </button>
            <button
              type="button"
              onClick={() => setRange("30d")}
              className={`rounded-full px-2.5 py-1 ${range === "30d" ? "bg-[#E8EFEA] text-[#1E4D3A]" : "text-[#6E9F87]"}`}
            >
              30-day
            </button>
          </div>
        </div>

        <div className="h-48 sm:h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={safeTrendData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#E8E3DA" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: "#6E9F87", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={10} />
              <YAxis domain={[0, 100]} tick={{ fill: "#6E9F87", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, borderColor: "#DDD7CC", backgroundColor: "#F7F4EE" }} />
              <Line type="monotone" dataKey="alpha" stroke="#2F6F57" strokeWidth={2.2} dot={false} name="Alpha Score" />
              <Line type="monotone" dataKey="consistency" stroke="#6E9F87" strokeWidth={2.2} dot={false} name="Consistency" />
              <Line type="monotone" dataKey="recovery" stroke="#C9A227" strokeWidth={2.2} dot={false} name="Recovery" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-[#E8EFEA] p-3">
          <p className="text-[11px] uppercase tracking-wide text-[#2F6F57]">Next Recommended Action</p>
          <p className="mt-1 text-sm font-semibold text-[#1E4D3A]">{nextAction}</p>
        </div>
        <div className="rounded-xl bg-[#F7F4EE] p-3">
          <p className="text-[11px] uppercase tracking-wide text-[#6E9F87]">Expected Visible Change</p>
          <p className="mt-1 text-sm font-semibold text-[#1E4D3A]">{expectedVisibleChange}</p>
        </div>
      </section>
    </div>
  );
}
