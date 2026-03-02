import type { ReactNode } from "react";

type StatusVariant = "success" | "warning" | "danger" | "info";

type StatusBadgeProps = {
  variant: StatusVariant;
  children: ReactNode;
  className?: string;
};

const variantClasses: Record<StatusVariant, string> = {
  success: "bg-[#E4EFE9] text-[#2F6F57] border-[#BFD5C8]",
  warning: "bg-[#F4EED7] text-[#8C6A5A] border-[#E0CE97]",
  danger: "bg-[#F1E6E1] text-[#8C6A5A] border-[#D6B8AA]",
  info: "bg-[#E8EFEA] text-[#2F6F57] border-[#C8DACF]",
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
