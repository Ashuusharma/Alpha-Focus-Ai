"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
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
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="af-page relative min-h-screen overflow-hidden">
      {/* Floating ambient orbs - large, soft, slow-drifting blur shapes that
          give the login moment a premium fintech-onboarding feel instead of
          a flat form on a plain background. Purely decorative, aria-hidden,
          and skipped under reduced-motion. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-[var(--accent-blue)]/15 blur-[100px]"
          animate={prefersReducedMotion ? undefined : { x: [0, 24, 0], y: [0, 16, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-32 top-1/3 h-[24rem] w-[24rem] rounded-full bg-[var(--clinical-cyan)]/15 blur-[110px]"
          animate={prefersReducedMotion ? undefined : { x: [0, -20, 0], y: [0, -24, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-8rem] left-1/3 h-[22rem] w-[22rem] rounded-full bg-[var(--accent-green)]/10 blur-[100px]"
          animate={prefersReducedMotion ? undefined : { x: [0, 18, 0], y: [0, -12, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center gap-10 px-4 py-16 lg:justify-between lg:px-8">
        {/* Left: brand/value-prop panel — desktop only, gives the page a
            strong above-the-fold moment instead of opening straight on a
            form. */}
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden max-w-md lg:block"
        >
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
            {VALUE_PROPS.map(({ icon: Icon, text }, index) => (
              <motion.div
                key={text}
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="glass-card flex items-start gap-3 !rounded-2xl p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue)]/12 text-[var(--accent-blue)]">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-sm text-[var(--ink)]">{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right: auth card */}
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[430px]"
        >
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
        </motion.div>
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
