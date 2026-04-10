"use client";

import Link from "next/link";

type RouteErrorFallbackProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
};

export default function RouteErrorFallback({
  error,
  reset,
  title,
  description,
  primaryHref,
  primaryLabel,
}: RouteErrorFallbackProps) {
  return (
    <main className="min-h-screen bg-[#F8F6F0] px-4 py-10 text-[#1d1d1f] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#d9d9de] bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-[#6e6e73]">{description}</p>
        <p className="mt-2 text-xs text-[#6e6e73]">{error.message}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="rounded-xl bg-[#0071e3] px-4 py-2 text-sm font-bold text-white hover:bg-[#005bbf]"
          >
            Retry
          </button>
          <Link
            href={primaryHref}
            className="rounded-xl border border-[#d9d9de] px-4 py-2 text-sm font-bold text-[#1d1d1f] hover:border-[#0071e3]"
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
