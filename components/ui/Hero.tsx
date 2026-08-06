"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

export type HeroStat = {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  /** Take 2 grid columns on the 2-col mobile stat grid — for a stat whose value needs more room. */
  wide?: boolean;
};

type HeroProps = {
  kicker?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Compact white stat cards under the title — same pattern DashboardHero introduced. */
  stats?: HeroStat[];
  /** A ring, illustration, or other focal visual. Stacks above the text on mobile, sits beside it on desktop. */
  visual?: ReactNode;
  cta?: ReactNode;
  /** "split" = text+visual side by side on desktop (dashboard/AI-lab-with-ring style). "center" = single centered column (AI Lab hero / marketing-style). */
  layout?: "split" | "center";
  className?: string;
};

// Staggered mount reveal (Design Language v2 — Motion Spec: kicker→heading→
// body→CTA, 50ms increments, --motion-base's duration). The visual (ring/
// illustration) shares beat 0 with the kicker rather than getting its own
// step, and stats share beat 2 with the subtitle — keeps this within the
// approved "max 3-4 simultaneous elements" budget instead of a 5th step.
const EASE = [0.22, 1, 0.36, 1] as const;
const STEP: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Generalized dark hero shell — the pattern DashboardHero pioneered
 * (gradient glow orbs + .af-hero-dark + white stat cards + optional ring),
 * now shared across every page that needs a real "what page am I on, what
 * can I do here" opening moment instead of starting cold on a card grid.
 * Mobile-first: single column, visual first, stats in a 2-col grid, CTA
 * last; the split layout only kicks in at `lg`.
 *
 * Entrance choreography (Phase 9C.2) is unconditional here — Hero's one
 * real consumer today (AI Laboratory) is a first-meaningful-screen per the
 * approved rule ("reserve full choreography for the first meaningful
 * screen"). If a repeat-visit page (e.g. Dashboard) migrates onto Hero
 * later, that's the moment to add a subtler opt-out variant — not before,
 * per the same 2+-consumer discipline the rest of this library follows.
 */
export default function Hero({ kicker, title, subtitle, stats, visual, cta, layout = "split", className = "" }: HeroProps) {
  const isSplit = layout === "split" && Boolean(visual);
  const prefersReducedMotion = useReducedMotion();
  const beat = (delay: number) => (prefersReducedMotion ? { duration: 0 } : { duration: 0.25, delay, ease: EASE });

  return (
    <section className={`af-hero-dark relative overflow-hidden p-6 sm:p-8 md:p-12 ${className}`.trim()}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[var(--accent-blue)]/18 blur-[90px] sm:h-80 sm:w-80" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[var(--accent-green)]/12 blur-[90px]" />

      <div className={`relative z-10 flex flex-col gap-8 ${isSplit ? "lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10" : "items-center text-center"}`}>
        {visual && isSplit && (
          <motion.div initial="hidden" animate="visible" variants={STEP} transition={beat(0)} className="flex justify-center lg:order-2 lg:justify-end">
            {visual}
          </motion.div>
        )}
        {visual && !isSplit && (
          <motion.div initial="hidden" animate="visible" variants={STEP} transition={beat(0)} className="flex justify-center">
            {visual}
          </motion.div>
        )}

        <div className={`flex flex-col ${isSplit ? "lg:order-1" : "items-center"}`}>
          {kicker && (
            <motion.span initial="hidden" animate="visible" variants={STEP} transition={beat(0)} className="af-page-kicker w-fit self-center lg:self-start">
              {kicker}
            </motion.span>
          )}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={STEP}
            transition={beat(0.05)}
            className={`af-heading-hero mt-4 font-black leading-[1.08] tracking-tight text-white ${isSplit ? "" : "max-w-2xl"}`}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial="hidden"
              animate="visible"
              variants={STEP}
              transition={beat(0.1)}
              className={`mt-3 text-sm leading-relaxed text-[var(--text-secondary-dark)] sm:text-base ${isSplit ? "max-w-xl" : "mx-auto max-w-xl"}`}
            >
              {subtitle}
            </motion.p>
          )}

          {stats && stats.length > 0 && (
            <motion.dl initial="hidden" animate="visible" variants={STEP} transition={beat(0.1)} className="mt-6 grid w-full grid-cols-2 gap-3 sm:gap-4">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className={`af-card-transition rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-white p-3.5 shadow-[var(--shadow-raised)] hover:-translate-y-1 sm:p-4 ${
                    stat.wide ? "col-span-2" : ""
                  }`}
                >
                  {stat.icon && <div className="mb-2 text-[var(--accent-blue)] [&>svg]:h-5 [&>svg]:w-5">{stat.icon}</div>}
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">{stat.label}</dt>
                  <dd className="mt-1 text-xl font-black text-[var(--ink)] sm:text-2xl">{stat.value}</dd>
                </div>
              ))}
            </motion.dl>
          )}

          {cta && (
            <motion.div initial="hidden" animate="visible" variants={STEP} transition={beat(0.15)} className={`mt-6 flex flex-wrap items-center gap-3 ${isSplit ? "" : "justify-center"}`}>
              {cta}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
