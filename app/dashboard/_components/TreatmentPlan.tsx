import type { CategoryId } from "@/lib/questions";

type TreatmentPlanProps = {
  categoryLabel: string;
  phaseName: string;
  dayNumber: number;
  category: CategoryId | null;
};

const categoryPlans: Record<string, [string, string, string]> = {
  lip_care: ["Barrier repair + hydration", "Inflammation reduction", "Barrier stabilization"],
  acne: ["Inflammation control", "Pore reset and oil balance", "Post-acne repair"],
  hair_loss: ["Shed stabilization", "Follicle stimulation", "Density reinforcement"],
  scalp_health: ["Calm inflammation", "Balance oil and barrier", "Maintenance and resilience"],
  dark_circles: ["Sleep and hydration reset", "Pigment and vascular support", "Tone stabilization"],
  beard_growth: ["Follicle activation", "Patch fill and irritation control", "Density consolidation"],
  body_acne: ["Inflammation reset", "Sweat-friction control", "Maintenance protocol"],
  anti_aging: ["Barrier and hydration support", "Elasticity and tone recovery", "Longevity maintenance"],
};

export default function TreatmentPlan({ categoryLabel, phaseName, dayNumber, category }: TreatmentPlanProps) {
  const [stage1, stage2, stage3] = categoryPlans[String(category || "")] || [
    "Foundation protocol",
    "Correction protocol",
    "Stabilization protocol",
  ];

  return (
    <section className="af-card rounded-2xl p-6">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">Category Treatment Plan</p>
      <h3 className="mt-1 text-lg font-bold text-[#1F3D2B]">Your 30 Day {categoryLabel} Recovery Plan</h3>
      <p className="mt-1 text-xs text-[#6B665D]">Current phase: {phaseName} · Day {dayNumber}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
          <p className="text-xs font-bold text-[#2F6F57]">Day 1-7</p>
          <p className="mt-1 text-sm font-medium text-[#1F3D2B]">{stage1}</p>
        </div>
        <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
          <p className="text-xs font-bold text-[#2F6F57]">Day 8-14</p>
          <p className="mt-1 text-sm font-medium text-[#1F3D2B]">{stage2}</p>
        </div>
        <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
          <p className="text-xs font-bold text-[#2F6F57]">Day 15-30</p>
          <p className="mt-1 text-sm font-medium text-[#1F3D2B]">{stage3}</p>
        </div>
      </div>
    </section>
  );
}