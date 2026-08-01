import type { HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "spotlight" | "subtle";

const variantClasses: Record<CardVariant, string> = {
  default: "af-card",
  // Navy color-block — matches the reference's "one accent card in a row"
  // pattern (e.g. the Kidney Health Scan card). Use sparingly, for the one
  // card in a group that should stand out (a recommended plan, a featured step).
  spotlight: "af-hero-dark",
  subtle: "af-card-subtle",
};

type CardProps = {
  variant?: CardVariant;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export default function Card({ variant = "default", children, className = "", ...props }: CardProps) {
  return (
    <div className={`${variantClasses[variant]} p-5 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
