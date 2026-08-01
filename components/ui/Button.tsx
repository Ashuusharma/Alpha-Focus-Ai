import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "accent" | "soft" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "af-btn-primary",
  accent: "af-btn-accent",
  soft: "af-btn-soft",
  outline: "af-btn-outline",
  ghost: "bg-transparent text-[var(--ink)] hover:bg-black/[0.03]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const circleSizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Circular icon-only button — matches the reference's arrow/action button pattern. */
  circle?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps & {
  href: string;
};

export default function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = "primary", size = "md", circle = false, children, className = "" } = props;

  const classes = [
    "inline-flex items-center justify-center gap-2 font-semibold transition-transform",
    variantClasses[variant],
    circle ? `rounded-full ${circleSizeClasses[size]} p-0` : `${sizeClasses[size]} rounded-[var(--radius-btn)]`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, circle: _c, className: _cn, href: _h, ...rest } = props as ButtonAsButton;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
