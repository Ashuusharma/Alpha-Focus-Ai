"use client";

import { motion, useReducedMotion, type TargetAndTransition, type Transition } from "framer-motion";
import { Star } from "lucide-react";
import type { AnalyzerMeta } from "@/lib/analyzerCatalog";
import { pickLang, type Language } from "@/lib/languageContext";

const ANIMATION_PROPS: Record<AnalyzerMeta["animation"], { animate: TargetAndTransition; transition: Transition }> = {
  pulse: { animate: { scale: [1, 1.06, 1] }, transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } },
  float: { animate: { y: [0, -4, 0] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  glow: { animate: { opacity: [0.85, 1, 0.85] }, transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } },
  shimmer: { animate: { backgroundPositionX: ["0%", "100%"] }, transition: { duration: 3, repeat: Infinity, ease: "linear" } },
};

type AnalyzerCardProps = {
  meta: AnalyzerMeta;
  language: Language;
  onClick: () => void;
  index?: number;
  /** "browse" (AI Laboratory grid — always shows gradient icon, detects, time estimate) vs
   *  "select" (image-analyzer picker — neutral until selected, shows a selection indicator). */
  variant?: "browse" | "select";
  selected?: boolean;
  disabled?: boolean;
  /** Real confidence (0-100) from this user's most recent scan in this category, if any —
   *  never fabricated; omit entirely when there's no scan to derive it from. */
  confidence?: number;
};

/**
 * One shared card for every "pick/see an analyzer" surface — the AI
 * Laboratory grid and the image-analyzer type picker previously had two
 * separate hand-duplicated implementations of the same idea. Per-category
 * distinctiveness comes from lib/analyzerCatalog.ts's real gradient/icon/
 * animation/detects data, not from bespoke per-card builds.
 */
export default function AnalyzerCard({
  meta,
  language,
  onClick,
  index = 0,
  variant = "browse",
  selected = false,
  disabled = false,
  confidence,
}: AnalyzerCardProps) {
  const Icon = meta.icon;
  const isHi = language === "hi";
  const prefersReducedMotion = useReducedMotion();
  const animationProps = ANIMATION_PROPS[meta.animation];
  const showActiveGradient = variant === "browse" || selected;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.035 }}
      whileHover={disabled ? undefined : { y: -4 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`af-card-transition group relative flex min-h-[120px] flex-col items-start gap-2 rounded-[var(--radius-card)] border p-4 text-left disabled:cursor-not-allowed disabled:opacity-50 ${
        variant === "browse"
          ? "glass-card"
          : selected
            ? "border-[var(--accent-blue)] bg-white/80 shadow-[var(--shadow-raised)] backdrop-blur-md"
            : "border-white/40 bg-white/40 shadow-[var(--shadow-soft)] backdrop-blur-md hover:border-[var(--accent-blue)]/40 hover:bg-white/60"
      }`}
    >
      {variant === "select" && selected && (
        <div className="absolute right-3 top-3 h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent-blue)]" />
      )}

      <motion.div
        {...(showActiveGradient && !prefersReducedMotion ? animationProps : {})}
        style={{ transition: "all var(--motion-base)" }}
        className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-btn)] shadow-[var(--shadow-button)] ${
          showActiveGradient ? `bg-gradient-to-br ${meta.gradient} text-white` : "bg-white/40 text-[var(--ink-soft)] group-hover:bg-white/80"
        }`}
      >
        <Icon className="h-5 w-5" />
      </motion.div>

      <p className="text-sm font-bold leading-tight text-[var(--ink)]">{pickLang(meta.label, meta.labelHi, language)}</p>

      <p className="line-clamp-2 text-[11px] leading-snug text-[var(--ink-soft)]">
        {pickLang(meta.detects.join(", "), meta.detectsHi.join(", "), language)}
      </p>

      {variant === "browse" && (
        <div className="mt-1 flex w-full flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-blue)]">
            {isHi ? `स्कैन ~${meta.scanTimeSec}सेकंड · सवाल ~${meta.assessmentTimeMin}मिनट` : `Scan ~${meta.scanTimeSec}s · Questions ~${meta.assessmentTimeMin}min`}
          </p>
          {typeof confidence === "number" && (
            <span className="inline-flex items-center gap-0.5" aria-label={`${Math.round(confidence)}% confidence`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={`h-2.5 w-2.5 ${n <= Math.round(confidence / 20) ? "fill-[var(--accent-amber)] text-[var(--accent-amber)]" : "text-[var(--border-hairline)]"}`}
                />
              ))}
            </span>
          )}
        </div>
      )}

      {/* Gradient glow — reads as the category's own light, not decoration on every card equally. */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-[var(--radius-card)] bg-gradient-to-br transition-opacity duration-500 ${meta.gradient} ${
          selected ? "opacity-10" : "opacity-0 group-hover:opacity-[0.06]"
        }`}
      />
    </motion.button>
  );
}
