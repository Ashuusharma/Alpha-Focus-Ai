"use client";

import { AlertTriangle } from "lucide-react";
import Button from "./Button";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

/**
 * One canonical in-page error treatment. Distinct from RouteErrorFallback
 * (app/_components/RouteErrorFallback.tsx), which handles full route-level
 * errors via Next's error.tsx boundary — this is for a single failed
 * section/fetch within an otherwise-working page.
 */
export default function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  onRetry,
  retryLabel = "Retry",
}: ErrorStateProps) {
  return (
    <div className="af-card-subtle flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-[var(--ink)]">{title}</h3>
      <p className="max-w-sm text-sm text-[var(--ink-soft)]">{description}</p>
      {onRetry && (
        <div className="mt-2">
          <Button onClick={onRetry} variant="soft" size="sm">
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
