import type { HTMLAttributes, ReactNode } from "react";

type MedicalCardProps = {
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export default function MedicalCard({ children, className = "", ...props }: MedicalCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-[#2F6F57]/50 hover:shadow-md ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
