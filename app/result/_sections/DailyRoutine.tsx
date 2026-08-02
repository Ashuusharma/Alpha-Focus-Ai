"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CloudSun, Moon, Sun, CalendarClock } from "lucide-react";
import type { ProtocolReport, ProtocolRoutineStep } from "@/types/protocolReport";

const BUCKETS = [
  { id: "morning", label: "Morning", icon: Sun },
  { id: "afternoon", label: "Afternoon", icon: CloudSun },
  { id: "night", label: "Night", icon: Moon },
  { id: "weekly", label: "Weekly", icon: CalendarClock },
] as const;

type BucketId = (typeof BUCKETS)[number]["id"];

function RoutineStepCard({ step }: { step: ProtocolRoutineStep }) {
  return (
    <div className="af-surface-soft p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-[var(--ink)]">{step.title}</h3>
        <p className="text-xs text-[var(--ink-soft)]">
          {step.timing}
          {step.amount ? ` · ${step.amount}` : ""}
          {` · ${step.frequency}`}
        </p>
      </div>
      <p className="mt-1.5 text-sm text-[var(--ink-soft)]">{step.purpose}</p>

      <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-[var(--ink)]">
        {step.steps.map((line) => <li key={line}>{line}</li>)}
      </ol>

      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-semibold text-[var(--accent-blue)]">
          Why this step, mistakes to avoid &amp; when to escalate
        </summary>
        <div className="mt-2 space-y-2 text-sm text-[var(--ink-soft)]">
          <p><span className="font-semibold text-[var(--ink)]">Why:</span> {step.why}</p>
          <p><span className="font-semibold text-[var(--ink)]">Expected improvement:</span> {step.expectedImprovement}</p>
          <p><span className="font-semibold text-[var(--warning-accent)]">Mistakes to avoid:</span> {step.mistakesToAvoid.join(", ")}</p>
          <p><span className="font-semibold text-[var(--ink)]">Escalation cues:</span> {step.escalationCues.join(", ")}</p>
        </div>
      </details>
    </div>
  );
}

export default function DailyRoutine({ monthlyRecoveryPlan }: { monthlyRecoveryPlan: ProtocolReport["monthlyRecoveryPlan"] }) {
  const [active, setActive] = useState<BucketId>("morning");

  return (
    <section id="routine" className="nv-section-white scroll-mt-24">
      <h2 className="text-xl font-black text-[var(--ink)]">Daily Routine</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">Your protocol broken down by time of day.</p>

      <div role="tablist" aria-label="Routine time of day" className="mt-5 flex flex-wrap gap-2">
        {BUCKETS.map((bucket) => {
          const Icon = bucket.icon;
          const isActive = active === bucket.id;
          return (
            <button
              key={bucket.id}
              role="tab"
              id={`routine-tab-${bucket.id}`}
              aria-selected={isActive}
              aria-controls={`routine-panel-${bucket.id}`}
              onClick={() => setActive(bucket.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isActive ? "bg-[var(--ink)] text-white" : "af-surface-soft text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {bucket.label}
              <span className="text-xs opacity-70">({monthlyRecoveryPlan[bucket.id].length})</span>
            </button>
          );
        })}
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          const currentIndex = BUCKETS.findIndex((bucket) => bucket.id === active);
          if (info.offset.x < -60 && currentIndex < BUCKETS.length - 1) {
            setActive(BUCKETS[currentIndex + 1].id);
          } else if (info.offset.x > 60 && currentIndex > 0) {
            setActive(BUCKETS[currentIndex - 1].id);
          }
        }}
      >
        {BUCKETS.map((bucket) => (
          <div
            key={bucket.id}
            role="tabpanel"
            id={`routine-panel-${bucket.id}`}
            aria-labelledby={`routine-tab-${bucket.id}`}
            hidden={active !== bucket.id}
            className="mt-4 space-y-3"
          >
            {monthlyRecoveryPlan[bucket.id].map((step) => (
              <RoutineStepCard key={`${bucket.id}-${step.title}`} step={step} />
            ))}
          </div>
        ))}
      </motion.div>
    </section>
  );
}
