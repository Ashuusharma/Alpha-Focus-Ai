"use client";

import { WeeklySummary } from "@/src/utils/weeklyReportEngine";

type Props = {
  summary: WeeklySummary;
};

export default function WeeklyReport({ summary }: Props) {
  return (
    <section className="af-surface-card p-5 text-[#1d1d1f]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold">Weekly AI Report</h3>
        <button className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#e2d8ca] bg-[#f6f0e5] hover:bg-white">Download PDF (Soon)</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="af-surface-soft p-3"><p className="text-xs text-[#6e6e73]">Avg Sleep</p><p className="text-xl font-bold">{summary.avgSleep}h</p></div>
        <div className="af-surface-soft p-3"><p className="text-xs text-[#6e6e73]">Avg Hydration</p><p className="text-xl font-bold">{summary.avgHydration}ml</p></div>
        <div className="af-surface-soft p-3"><p className="text-xs text-[#6e6e73]">Compliance</p><p className="text-xl font-bold">{summary.compliance}%</p></div>
        <div className="af-surface-soft p-3"><p className="text-xs text-[#6e6e73]">Score Trend</p><p className="text-xl font-bold">{summary.scoreDelta >= 0 ? `+${summary.scoreDelta}` : summary.scoreDelta}</p></div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#d9d9de] bg-[#eef5ff] p-4">
          <p className="text-sm font-semibold text-[#0071e3] mb-2">Strengths</p>
          <ul className="list-disc pl-5 text-sm text-[#345847] space-y-1">{summary.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="rounded-xl border border-[#ead8b1] bg-[#f8efda] p-4">
          <p className="text-sm font-semibold text-[#8a5c1b] mb-2">Risks</p>
          <ul className="list-disc pl-5 text-sm text-[#7a633e] space-y-1">{summary.risks.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
      <div className="rounded-xl border border-[#d8ccb9] bg-[#f7f1e7] p-4 mt-4">
        <p className="text-sm font-semibold text-[#1d1d1f]">Suggested Focus</p>
        <p className="text-sm text-[#5F5A51] mt-1">{summary.suggestedFocus}</p>
      </div>
    </section>
  );
}

