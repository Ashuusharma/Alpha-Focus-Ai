"use client";

import RouteErrorFallback from "@/app/_components/RouteErrorFallback";

export default function ResultError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorFallback
      error={error}
      reset={reset}
      title="Unable to generate result"
      description="Your clinical report could not be rendered right now. Retry once or restart the analyzer flow."
      primaryHref="/image-analyzer"
      primaryLabel="Restart Analyzer"
    />
  );
}