import type { ReactNode } from "react";

type StatusVariant = "success" | "warning" | "danger" | "info";

type StatusBadgeProps = {
  variant: StatusVariant;
  children: ReactNode;
  className?: string;
};

const variantClasses: Record<StatusVariant, string> = {
  success: "bg-[#E4EFE9] text-[#0071e3] border-[#BFD5C8]",
  warning: "bg-[#F4EED7] text-[#6e6e73] border-[#E0CE97]",
  danger: "bg-[#F1E6E1] text-[#6e6e73] border-[#D6B8AA]",
  info: "bg-[#eef5ff] text-[#0071e3] border-[#d9d9de]",
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

