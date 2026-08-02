export default function GlobalPageSkeleton({ message }: { message?: string }) {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[var(--warm-neutral)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6 animate-in fade-in duration-200">
          {message && (
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-blue)]" />
              {message}
            </div>
          )}
          <div className="skeleton-shimmer h-8 w-40 rounded-xl" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="skeleton-shimmer h-28 rounded-2xl" />
            <div className="skeleton-shimmer h-28 rounded-2xl" />
            <div className="skeleton-shimmer h-28 rounded-2xl" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4 rounded-3xl border border-[var(--border-hairline)] bg-white/70 p-5">
              <div className="skeleton-shimmer h-6 w-56 rounded-lg" />
              <div className="space-y-3">
                <div className="skeleton-shimmer h-4 w-full rounded-md" />
                <div className="skeleton-shimmer h-4 w-[92%] rounded-md" />
                <div className="skeleton-shimmer h-4 w-[84%] rounded-md" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="skeleton-shimmer h-24 rounded-xl" />
                <div className="skeleton-shimmer h-24 rounded-xl" />
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-[var(--border-hairline)] bg-white/70 p-5">
              <div className="skeleton-shimmer h-5 w-32 rounded-lg" />
              <div className="skeleton-shimmer h-20 rounded-xl" />
              <div className="skeleton-shimmer h-20 rounded-xl" />
              <div className="skeleton-shimmer h-10 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

