import { Droplets, Utensils } from "lucide-react";
import type { ProtocolReport } from "@/types/protocolReport";

const MEALS = ["breakfast", "lunch", "dinner", "snacks"] as const;

export default function LifestyleGuidance({ dietPlan }: { dietPlan: ProtocolReport["dietPlan"] }) {
  return (
    <section id="lifestyle" className="nv-section-white scroll-mt-24">
      <h2 className="af-heading-section font-black text-[var(--ink)]">Lifestyle Guidance</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">Diet and daily habits that support your recovery.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {MEALS.map((meal) => (
          <div key={meal} className="af-surface-soft p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold capitalize text-[var(--ink)]">
              <Utensils className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
              {meal}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
              {dietPlan[meal].map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="af-card-subtle mt-4 flex items-start gap-3 p-4">
        <Droplets className="h-5 w-5 shrink-0 text-[var(--accent-blue)]" />
        <p className="text-sm text-[var(--ink)]"><span className="font-semibold">Hydration:</span> {dietPlan.hydration}</p>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-bold text-[var(--ink)]">Wellness Guidance</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink-soft)]">
          {dietPlan.wellnessGuidance.map((goal) => <li key={goal}>{goal}</li>)}
        </ul>
      </div>
    </section>
  );
}
