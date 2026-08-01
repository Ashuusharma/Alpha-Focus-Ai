import type { ReactNode } from "react";

type StatChipProps = {
  icon?: ReactNode;
  value: ReactNode;
  label: string;
  className?: string;
};

/**
 * Floating icon + bold value + small caption chip — e.g. "22 Years / Medical
 * Excellence". Useful for protocol timeline stats, analyzer progress,
 * dashboard metrics, anywhere a compact stat needs to sit on top of other
 * content (a hero image, a card, a banner).
 */
export default function StatChip({ icon, value, label, className = "" }: StatChipProps) {
  return (
    <div className={`af-stat-tile flex items-center gap-3 ${className}`.trim()}>
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-bold leading-tight text-[var(--ink)]">{value}</p>
        <p className="text-xs text-[var(--ink-soft)]">{label}</p>
      </div>
    </div>
  );
}
