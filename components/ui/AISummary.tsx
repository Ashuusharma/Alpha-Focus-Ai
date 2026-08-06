"use client";

import { Pencil } from "lucide-react";

export type RelevanceTier = "High" | "Moderate" | "Low";

export type AISummaryItem = {
  key: string;
  emoji?: string;
  label: string;
  answer: string;
  tier: RelevanceTier;
  onClick: () => void;
  lang?: string;
};

type AISummaryProps = {
  items: AISummaryItem[];
  tierLabels: Record<RelevanceTier, string>;
  editLabel: string;
};

const TIER_ORDER: RelevanceTier[] = ["High", "Moderate", "Low"];
const TIER_DOT: Record<RelevanceTier, string> = {
  High: "bg-[var(--accent-amber)]",
  Moderate: "bg-[var(--accent-blue)]",
  Low: "bg-[var(--ink-soft)]",
};

/**
 * The review screen's content — real answers, tier-sorted (High relevance
 * first) instead of a flat chronological Q&A dump, so it reads as "here's
 * what we noticed" rather than a receipt. Every row is still the real
 * selected answer, still editable — this is presentation grouping over
 * data that already exists (relevanceTierFromWeight), not a new AI call.
 */
export default function AISummary({ items, tierLabels, editLabel }: AISummaryProps) {
  const groups = TIER_ORDER.map((tier) => ({ tier, items: items.filter((item) => item.tier === tier) })).filter(
    (group) => group.items.length > 0
  );

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.tier}>
          <p className="mb-2 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--ink-soft)]">
            <span className={`h-1.5 w-1.5 rounded-full ${TIER_DOT[group.tier]}`} />
            {tierLabels[group.tier]}
          </p>
          <div className="af-surface-card divide-y divide-[var(--border-hairline)] text-left">
            {group.items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                className="flex w-full min-h-[56px] items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--tint-warm)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs text-[var(--ink-soft)]" lang={item.lang}>
                    {item.emoji ? `${item.emoji} ` : ""}
                    {item.label}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-[var(--ink)]" lang={item.lang}>
                    {item.answer}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[var(--accent-blue)]">
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{editLabel}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
