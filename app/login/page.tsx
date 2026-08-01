"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthForm from "@/components/auth/AuthForm";

function LoginPageInner() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") || "/dashboard";

  return (
    <div className="af-page min-h-screen flex items-center justify-center px-4 py-24">
      <div className="relative w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-[#dbcdb9] bg-[linear-gradient(180deg,#fffdf8_0%,#efe5d8_100%)] shadow-[0_30px_90px_rgba(46,35,20,0.28)]">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(169,203,183,0.45),transparent_48%),radial-gradient(circle_at_top_left,rgba(216,181,95,0.22),transparent_45%)]" />
        <div className="relative p-7 text-[#1d1d1f]">
          <div className="af-badge-row mb-4 flex gap-2">
            <span className="af-badge-chip text-[#0071e3]">Secure access</span>
            <span className="af-badge-chip text-[#A46A2D]">Profile synced</span>
          </div>

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
