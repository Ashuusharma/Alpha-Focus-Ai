import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** A short trailing note, e.g. "vs last week" — real derived context, not decoration. */
  trend?: string;
  /** "light" for a white/glass section; "dark" for use inside .af-hero-dark / .nv-section-dark. */
  variant?: "light" | "dark";
  className?: string;
};

/**
 * One shared stat tile — formalizes the KPI-grid tiles that used to be
 * hand-duplicated inline (dashboard's "Clinical Signal Summary") and the
 * now-removed page-local MetricCard (built, never actually used anywhere).
 */
export default function StatCard({ label, value, icon, trend, variant = "light", className = "" }: StatCardProps) {
  const isDark = variant === "dark";
  return (
    <div
      className={`rounded-[var(--radius-card)] border p-4 ${
        isDark ? "border-white/10 bg-black/25" : "border-[var(--border-hairline)] bg-white/70 shadow-[var(--shadow-soft)]"
      } ${className}`.trim()}
    >
      {icon && (
        <div className={`mb-2 [&>svg]:h-5 [&>svg]:w-5 ${isDark ? "text-[var(--accent-blue-soft)]" : "text-[var(--accent-blue)]"}`}>{icon}</div>
      )}
      <p className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? "text-[#b7c4d7]" : "text-[var(--ink-soft)]"}`}>
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black ${isDark ? "text-white" : "text-[var(--ink)]"}`}>{value}</p>
      {trend && (
        <p className={`mt-1 text-xs ${isDark ? "text-[#8290a8]" : "text-[var(--ink-soft)]"}`}>{trend}</p>
      )}
    </div>
  );
}
