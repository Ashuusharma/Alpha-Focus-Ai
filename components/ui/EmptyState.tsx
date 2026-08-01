import type { ReactNode } from "react";
import Button from "./Button";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

/**
 * One canonical "no data yet" treatment — replaces the ~5 different
 * hand-rolled empty states found across the app (each previously used a
 * different wrapper, icon treatment, and copy style).
 */
export default function EmptyState({ icon, title, description, actionLabel, actionHref, onAction }: EmptyStateProps) {
  return (
    <div className="af-card-subtle flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[var(--ink)]">{title}</h3>
      {description && <p className="max-w-sm text-sm text-[var(--ink-soft)]">{description}</p>}
      {actionLabel && (actionHref || onAction) && (
        <div className="mt-2">
          {actionHref ? (
            <Button href={actionHref} variant="primary" size="sm">
              {actionLabel}
            </Button>
          ) : (
            <Button onClick={onAction} variant="primary" size="sm">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
