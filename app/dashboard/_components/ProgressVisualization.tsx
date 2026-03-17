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
    <section className="af-card rounded-2xl p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">Progress Analytics</p>
          <h3 className="text-lg font-bold text-[#1F3D2B]">Weekly Recovery Charts</h3>
        </div>
        <p className="text-xs text-[#6B665D]">Severity trend · Adherence trend · Confidence trend</p>
      </div>
      <TrendCharts data={chartData} />
    </section>
  );
}
