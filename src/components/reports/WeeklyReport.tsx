"use client";

import { WeeklySummary } from "@/src/utils/weeklyReportEngine";

type Props = {
  summary: WeeklySummary;
};

export default function WeeklyReport({ summary }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold">Weekly AI Report</h3>
        <button className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/20 bg-white/[0.04] hover:bg-white/[0.08]">Download PDF (Soon)</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><p className="text-xs text-gray-400">Avg Sleep</p><p className="text-xl font-bold">{summary.avgSleep}h</p></div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><p className="text-xs text-gray-400">Avg Hydration</p><p className="text-xl font-bold">{summary.avgHydration}ml</p></div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><p className="text-xs text-gray-400">Compliance</p><p className="text-xl font-bold">{summary.compliance}%</p></div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3"><p className="text-xs text-gray-400">Score Trend</p><p className="text-xl font-bold">{summary.scoreDelta >= 0 ? `+${summary.scoreDelta}` : summary.scoreDelta}</p></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
          <p className="text-sm font-semibold text-emerald-200 mb-2">Strengths</p>
          <ul className="list-disc pl-5 text-sm text-emerald-100 space-y-1">{summary.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-200 mb-2">Risks</p>
          <ul className="list-disc pl-5 text-sm text-amber-100 space-y-1">{summary.risks.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
      <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 mt-4">
        <p className="text-sm font-semibold text-blue-200">Suggested Focus</p>
        <p className="text-sm text-blue-100 mt-1">{summary.suggestedFocus}</p>
      </div>
    </section>
  );
}
