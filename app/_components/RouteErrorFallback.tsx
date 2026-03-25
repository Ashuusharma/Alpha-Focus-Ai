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
    <main className="min-h-screen bg-[#F8F6F0] px-4 py-10 text-[#1F3D2B] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-[#E2DDD3] bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-[#6B665D]">{description}</p>
        <p className="mt-2 text-xs text-[#8C6A5A]">{error.message}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="rounded-xl bg-[#2F6F57] px-4 py-2 text-sm font-bold text-white hover:bg-[#1F4D3B]"
          >
            Retry
          </button>
          <Link
            href={primaryHref}
            className="rounded-xl border border-[#E2DDD3] px-4 py-2 text-sm font-bold text-[#1F3D2B] hover:border-[#2F6F57]"
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}