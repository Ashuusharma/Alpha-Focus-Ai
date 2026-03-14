"use client";

type InsightItem = {
  id: string;
  title: string;
  message: string;
  impact: "high" | "medium" | "low";
};

type AIInsightEngineProps = {
  insights: InsightItem[];
};

const impactStyle: Record<InsightItem["impact"], string> = {
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-green-200 bg-green-50 text-green-800",
};

export default function AIInsightEngine({ insights }: AIInsightEngineProps) {
  return (
    <section className="af-card rounded-2xl p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">AI Insight Engine</p>
          <h3 className="text-lg font-bold text-[#1F3D2B]">Behavior-Linked Recovery Insights</h3>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {insights.map((insight) => (
          <article key={insight.id} className={`rounded-lg border px-3 py-2 text-sm ${impactStyle[insight.impact]}`}>
            <p className="font-semibold">{insight.title}</p>
            <p className="mt-1 text-xs">{insight.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
