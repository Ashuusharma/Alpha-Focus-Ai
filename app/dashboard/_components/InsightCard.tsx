import { Brain, TrendingUp } from "lucide-react";
import type { CategoryId } from "@/lib/questions";

type ProgressSummary = {
  improvement_pct: number;
  inflammation_reduction_rate: number;
  consistency_score: number;
  recovery_velocity: number;
  discipline_index: number;
  confidence_score: number;
};

type InsightCardProps = {
  category: CategoryId | null;
  metrics: ProgressSummary | null;
};

const categoryDrivers: Record<string, string> = {
  lip_care: "hydration variability and lip licking micro-trauma",
  acne: "inflammatory spikes linked to stress and congestion",
  hair_loss: "stress load and consistency gaps in routine execution",
  scalp_health: "barrier stress and inconsistent cleansing cadence",
  dark_circles: "sleep debt with dehydration and vascular strain",
  beard_growth: "patch growth pattern and irritation cycles",
  body_acne: "sweat-friction cycles and delayed post-workout care",
  anti_aging: "UV load with recovery inconsistency",
};

export default function InsightCard({ category, metrics }: InsightCardProps) {
  const key = String(category || "");
  const reason = categoryDrivers[key] || "current habit friction and consistency variance";
  const probability = Math.max(45, Math.min(95, Math.round((Number(metrics?.confidence_score || 0) + Number(metrics?.consistency_score || 0)) / 2)));

  return (
    <section className="af-card rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-[#2F6F57]" />
        <h3 className="text-lg font-bold text-[#1F3D2B]">AI Insight Panel</h3>
      </div>
      <p className="mt-3 text-sm text-[#1F3D2B]">
        Your current concern pattern is likely driven by {reason}. Prioritize hydration, barrier repair, and strict routine consistency this week.
      </p>
      <div className="mt-4 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[#1F3D2B]">Improvement Probability</span>
          <span className="font-bold text-[#2F6F57]">{probability}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7E1D7]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#8C6A5A] to-[#2F6F57]" style={{ width: `${probability}%` }} />
        </div>
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#6B665D]"><TrendingUp className="h-3.5 w-3.5" /> Focus this week: hydration + barrier stabilization</p>
      </div>
    </section>
  );
}
