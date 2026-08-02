"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BadgeCheck, Sparkles, TrendingUp } from "lucide-react";
import AuthForm from "@/components/auth/AuthForm";
import AuthCard from "@/components/auth/AuthCard";

const VALUE_PROPS = [
  { icon: Sparkles, text: "AI Vision analysis tuned to Indian skin, hair, and grooming concerns" },
  { icon: TrendingUp, text: "A 30-day recovery protocol that adapts as your scores improve" },
  { icon: BadgeCheck, text: "Every recommendation backed by a clinical confidence score" },
];

function LoginPageInner() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") || "/dashboard";

  return (
    <div className="af-page min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center gap-10 px-4 py-16 lg:justify-between lg:px-8">
        {/* Left: brand/value-prop panel — desktop only, gives the page a
            strong above-the-fold moment instead of opening straight on a
            form. */}
        <div className="hidden max-w-md lg:block">
          <span className="af-page-kicker">
            <Sparkles className="h-3.5 w-3.5" />
            Alpha Focus AI
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[var(--ink)]">
            Your recovery, mapped by clinical AI.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--ink-soft)]">
            Sign in to pick up your scans, protocol, and progress exactly where you left off.
          </p>

          <div className="mt-8 space-y-3">
            {VALUE_PROPS.map(({ icon: Icon, text }) => (
              <div key={text} className="af-surface-card flex items-start gap-3 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-sm text-[var(--ink)]">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: auth card */}
        <div className="w-full max-w-[430px]">
          <AuthCard>
            <AuthForm
              onSuccess={() => {
                // Full page navigation, not router.push(): a client-side
                // transition here raced ahead of the session cookie being
                // guaranteed available to middleware on the very next
                // request, bouncing users back to /login right after a
                // correct login (found + diagnosed during Phase 7 journey
                // recording). A full navigation always carries the current
                // cookie jar and gets a clean SSR evaluation.
                window.location.href = redirectTo;
              }}
            />
          </AuthCard>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
