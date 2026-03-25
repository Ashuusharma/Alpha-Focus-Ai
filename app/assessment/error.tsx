"use client";

import RouteErrorFallback from "@/app/_components/RouteErrorFallback";

export default function AssessmentError({
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
      title="Unable to load assessment"
      description="The assessment could not load right now. Retry once or return to your latest scan."
      primaryHref="/image-analyzer"
      primaryLabel="Open Analyzer"
    />
  );
}