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
    <section className="rounded-[2rem] border border-[#E2DDD3] bg-white p-6 shadow-[0_10px_30px_rgba(17,17,17,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8C6A5A]">Progress Analytics</p>
          <h3 className="text-lg font-black text-[#111]">Weekly Recovery Charts</h3>
        </div>
        <p className="text-xs text-[#6B665D]">Severity trend · Adherence trend · Confidence trend</p>
      </div>
      <TrendCharts data={chartData} />
    </section>
  );
}
