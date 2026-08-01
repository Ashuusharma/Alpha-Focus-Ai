type SkeletonProps = {
  className?: string;
};

/** Base shimmer block — same .skeleton-shimmer animation GlobalPageSkeleton
 *  already uses consistently for route-level loading (24 loading.tsx files).
 *  These primitives extend that one visual language to in-page loading
 *  states too (Phase 7H replaces the raw spinner-div / Loader2 / bare-text
 *  variance found across the app with these). */
export function SkeletonBlock({ className = "h-24 rounded-2xl" }: SkeletonProps) {
  return <div className={`skeleton-shimmer ${className}`} />;
}

export function SkeletonLine({ className = "h-4 w-full rounded-md" }: SkeletonProps) {
  return <div className={`skeleton-shimmer ${className}`} />;
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`af-card space-y-3 p-5 ${className}`.trim()}>
      <SkeletonLine className="h-5 w-2/3 rounded-lg" />
      <SkeletonLine />
      <SkeletonLine className="w-5/6" />
    </div>
  );
}
