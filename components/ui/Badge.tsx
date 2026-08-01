import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
};

/** Formalizes .af-badge-chip as a component — small uppercase pill label. */
export default function Badge({ children, className = "", icon }: BadgeProps) {
  return (
    <span className={`af-badge-chip ${className}`.trim()}>
      {icon}
      {children}
    </span>
  );
}
