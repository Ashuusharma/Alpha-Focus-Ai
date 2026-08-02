import type { ReactNode } from "react";

type StatusVariant = "success" | "warning" | "danger" | "info";

type StatusBadgeProps = {
  variant: StatusVariant;
  children: ReactNode;
  className?: string;
};

const variantClasses: Record<StatusVariant, string> = {
  success: "bg-[var(--accent-green)]/12 text-[var(--ink)] border-[var(--accent-green)]/30",
  warning: "bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-accent)]/30",
  danger: "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30",
  info: "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-[var(--border-hairline)]",
};

export default function StatusBadge({ variant, children, className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${variantClasses[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

