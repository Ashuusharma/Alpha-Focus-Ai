"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles, Check } from "lucide-react";
import ScanUsageRing from "@/components/ui/ScanUsageRing";

export type LoadingExperienceProps = {
  /** Real stage labels only, in order — every entry must correspond to an
   *  actual backend/client checkpoint. Never pad this list to look busier. */
  stages: string[];
  /** 0-based index of the currently active stage. Ignored once `isComplete`. */
  currentIndex: number;
  isComplete?: boolean;
  completeLabel: string;
  helperText: string;
  completeHelperText: string;
  className?: string;
};

const PARTICLE_OFFSETS = [
  { top: "6%", left: "12%", delay: 0 },
  { top: "14%", left: "82%", delay: 0.6 },
  { top: "78%", left: "18%", delay: 1.1 },
  { top: "84%", left: "78%", delay: 0.3 },
];

/**
 * The shared "AI is working" moment — one premium visual (glowing core +
 * a few ambient particles + a real-stage progress ring) reused everywhere
 * the app waits on real AI/backend work, instead of a different bespoke
 * spinner per screen. Particles freeze to a gentle opacity pulse under
 * prefers-reduced-motion rather than orbiting.
 */
export default function LoadingExperience({
  stages,
  currentIndex,
  isComplete = false,
  completeLabel,
  helperText,
  completeHelperText,
  className = "",
}: LoadingExperienceProps) {
  const prefersReducedMotion = useReducedMotion();
  const clampedIndex = Math.max(0, Math.min(currentIndex, stages.length - 1));
  const ringPercent = isComplete ? 100 : Math.round(((clampedIndex + 0.5) / stages.length) * 100);
  const activeLabel = isComplete ? completeLabel : stages[clampedIndex];

  return (
    <div className={`flex flex-col items-center text-center ${className}`.trim()}>
      <div className="relative flex h-32 w-32 items-center justify-center">
        {!prefersReducedMotion &&
          PARTICLE_OFFSETS.map((particle, i) => (
            <motion.span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-[var(--accent-blue-soft)]"
              style={{ top: particle.top, left: particle.left }}
              animate={
                isComplete
                  ? { opacity: 0 }
                  : { opacity: [0.2, 0.9, 0.2], y: [0, -6, 0] }
              }
              transition={{ duration: 2.4, repeat: isComplete ? 0 : Infinity, delay: particle.delay, ease: "easeInOut" }}
            />
          ))}

        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="complete"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent-green)]/15"
            >
              <Check className="h-11 w-11 text-[var(--accent-green)]" strokeWidth={3} />
              {!prefersReducedMotion &&
                [0, 1, 2, 3, 4, 5].map((i) => {
                  const angle = (i / 6) * Math.PI * 2;
                  return (
                    <motion.span
                      key={i}
                      className="absolute h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]"
                      style={{ top: "50%", left: "50%" }}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{ x: Math.cos(angle) * 56, y: Math.sin(angle) * 56, opacity: 0, scale: 0.4 }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    />
                  );
                })}
            </motion.div>
          ) : (
            <motion.div key="working" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <ScanUsageRing
                percent={ringPercent}
                variant="light"
                size={104}
                strokeWidth={5}
                centerValue={
                  <motion.span
                    className="flex items-center justify-center text-[var(--accent-blue)]"
                    animate={prefersReducedMotion ? {} : { opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="h-8 w-8" />
                  </motion.span>
                }
                centerLabel=""
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-6 max-w-xl space-y-2" role="status" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.h2
            key={activeLabel}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-xl font-bold text-[var(--ink)] sm:text-2xl"
          >
            {activeLabel}
          </motion.h2>
        </AnimatePresence>
        <p className="text-sm text-[var(--ink-soft)]">{isComplete ? completeHelperText : helperText}</p>
      </div>

      <div className="mt-6 w-full max-w-md">
        <div className="flex items-center gap-1.5">
          {stages.map((stage, index) => (
            <div key={stage} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border-hairline)]">
              <motion.div
                className="h-full rounded-full bg-[var(--accent-blue)]"
                initial={false}
                animate={{ width: isComplete || index < clampedIndex ? "100%" : index === clampedIndex ? "60%" : "0%" }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
          {isComplete ? stages.length : clampedIndex + 1} of {stages.length}
        </p>
      </div>
    </div>
  );
}
