"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

type AnswerCardProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  lang?: string;
};

/**
 * One large, touch-friendly answer option — Duolingo/Typeform-scale, not a
 * compact form radio. ~64px+ tall, generous padding, a clear filled state
 * instead of a small dot, so choosing an answer reads as a deliberate tap
 * in a conversation rather than filling a form field.
 */
export default function AnswerCard({ label, selected, onClick, lang }: AnswerCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      role="radio"
      aria-checked={selected}
      whileTap={{ scale: 0.98 }}
      className={`af-card-transition group relative flex min-h-[64px] w-full items-center justify-between gap-4 rounded-[var(--radius-card)] border-2 px-5 py-4 text-left sm:px-6 ${
        selected
          ? "border-[var(--accent-blue)] bg-[var(--bg-wash-start)] shadow-[var(--shadow-raised)]"
          : "border-[var(--border-hairline)] bg-white shadow-[var(--shadow-soft)] hover:border-[var(--accent-blue)]/40 hover:bg-[var(--bg-wash-start)]/40"
      }`}
    >
      <span
        className={`af-card-transition text-base font-semibold leading-snug sm:text-lg ${selected ? "text-[var(--accent-blue)]" : "text-[var(--ink)]"}`}
        lang={lang}
      >
        {label}
      </span>
      <span
        className={`af-card-transition flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]" : "border-[var(--border-hairline)] bg-white group-hover:border-[var(--accent-blue)]/50"
        }`}
      >
        {selected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
      </span>
    </motion.button>
  );
}
