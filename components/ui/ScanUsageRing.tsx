"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

type ScanUsageRingProps = {
  /** 0-100 — how full the ring reads (usage, recovery score, reset progress, etc). */
  percent: number;
  centerValue: React.ReactNode;
  centerLabel: React.ReactNode;
  /** "dark" for use inside .af-hero-dark / .nv-section-dark; "light" for a white card context. */
  variant?: "dark" | "light";
  size?: number;
  strokeWidth?: number;
  className?: string;
};

const CIRCUMFERENCE = 2 * Math.PI * 40; // r=40 viewBox units

/**
 * Shared circular progress ring — the same technique DashboardHero already
 * used for "Recovery Score," now reusable for AI Lab's scan usage, dashboard
 * recovery ring, etc. A ring reads as a premium health metric (WHOOP/Oura);
 * a bar reads as a storage quota.
 */
export default function ScanUsageRing({
  percent,
  centerValue,
  centerLabel,
  variant = "dark",
  size = 128,
  strokeWidth = 6,
  className = "",
}: ScanUsageRingProps) {
  const gradientId = useId();
  const prefersReducedMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = CIRCUMFERENCE - (CIRCUMFERENCE * clamped) / 100;

  const trackColor = variant === "dark" ? "rgba(255,255,255,0.1)" : "var(--border-hairline)";
  const shellClasses =
    variant === "dark"
      ? "border-[var(--accent-blue)]/65 bg-black/40 shadow-[0_22px_48px_rgba(0,0,0,0.36)]"
      : "border-[var(--border-hairline)] bg-white shadow-[var(--shadow-raised)]";
  const valueClasses = variant === "dark" ? "text-white" : "text-[var(--ink)]";
  const labelClasses = variant === "dark" ? "text-[var(--text-secondary-dark)]" : "text-[var(--ink-soft)]";

  return (
    <div
      className={`relative flex shrink-0 flex-col items-center justify-center rounded-full border ${shellClasses} ${className}`}
      style={{ height: size, width: size }}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-blue)" />
            <stop offset="100%" stopColor="var(--accent-green)" />
          </linearGradient>
        </defs>
        <circle strokeWidth={strokeWidth} stroke={trackColor} fill="transparent" r="40" cx="50" cy="50" />
        <motion.circle
          strokeWidth={strokeWidth}
          strokeDasharray={CIRCUMFERENCE}
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          fill="transparent"
          r="40"
          cx="50"
          cy="50"
          initial={false}
          animate={{ strokeDashoffset: dashOffset }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="relative z-10 text-center">
        <span className={`block font-black tabular-nums ${valueClasses}`} style={{ fontSize: size * 0.22 }}>
          {centerValue}
        </span>
        <span className={`mt-1 block text-[9px] font-bold uppercase tracking-widest ${labelClasses}`}>
          {centerLabel}
        </span>
      </div>
    </div>
  );
}
