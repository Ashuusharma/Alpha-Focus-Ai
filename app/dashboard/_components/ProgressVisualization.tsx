"use client";

import TrendCharts from "@/components/dashboard/TrendCharts";

type WeeklyPoint = {
  week: string;
  severity: number;
  adherence: number;
  confidence: number;
};

type ProgressVisualizationProps = {
  data: WeeklyPoint[];
};

export default function ProgressVisualization({ data }: ProgressVisualizationProps) {
  const chartData = data.map((row) => ({
    label: row.week,
    severity: row.severity,
    adherence: row.adherence,
    confidence: row.confidence,
  }));

  return (
    <section className="nv-section-white">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#5e5e5e]">Progress Analytics</p>
          <h3 className="text-lg font-black text-[#111]">Weekly Recovery Charts</h3>
        </div>
        <p className="text-xs text-[#5e5e5e]">Severity trend · Adherence trend · Confidence trend</p>
      </div>
      <TrendCharts data={chartData} />
    </section>
  );
}
