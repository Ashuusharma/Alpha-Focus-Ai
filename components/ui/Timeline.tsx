"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

export type TimelineStepStatus = "done" | "current" | "upcoming";

export type TimelineStep = {
  label: string;
  status: TimelineStepStatus;
  /** Only meaningful on the "current" step — a fractional fill (0-100) inside that one node's connecting line, e.g. how far through the Questions stage the user is. */
  progressWithinStep?: number;
};

type TimelineProps = {
  steps: TimelineStep[];
  className?: string;
};

/**
 * The big-picture journey — Scan → Questions → AI Reasoning → Recovery Plan
 * — replacing three separate progress signals (a ring, an "N answered"
 * chip, and a raw percent bar) with one coherent story of where the user
 * is. Mobile-first: labels sit under compact nodes, connecting lines fill
 * left-to-right; there's no horizontal scroll at 4 steps even at 360px.
 */
export default function Timeline({ steps, className = "" }: TimelineProps) {
  return (
    <div className={`flex w-full items-start ${className}`.trim()} role="list" aria-label="Progress">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <div key={step.label} className={`flex items-center ${isLast ? "" : "flex-1"}`} role="listitem">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors duration-300 sm:h-8 sm:w-8 ${
                  step.status === "done"
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
                    : step.status === "current"
                      ? "border-[var(--accent-blue)] bg-white text-[var(--accent-blue)]"
                      : "border-[var(--border-hairline)] bg-white text-[var(--ink-soft)]"
                }`}
              >
                {step.status === "done" ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <motion.span
                    animate={step.status === "current" ? { scale: [1, 1.15, 1] } : {}}
                    transition={{ duration: 1.6, repeat: step.status === "current" ? Infinity : 0, ease: "easeInOut" }}
                    className={step.status === "current" ? "h-2 w-2 rounded-full bg-[var(--accent-blue)]" : "h-1.5 w-1.5 rounded-full bg-[var(--border-hairline)]"}
                  />
                )}
              </div>
              <span
                className={`max-w-[70px] text-center text-[9px] font-bold uppercase leading-tight tracking-wide sm:max-w-none sm:text-[10px] ${
                  step.status === "upcoming" ? "text-[var(--ink-soft)]" : "text-[var(--ink)]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className="mx-1 mt-3.5 h-0.5 flex-1 overflow-hidden rounded-full bg-[var(--border-hairline)] sm:mt-4">
                <motion.div
                  className="h-full rounded-full bg-[var(--accent-blue)]"
                  initial={false}
                  animate={{
                    width: step.status === "done" ? "100%" : step.status === "current" ? `${step.progressWithinStep ?? 0}%` : "0%",
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
