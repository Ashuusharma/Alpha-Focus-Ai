"use client";

import { useContext, useMemo } from "react";
import { usePathname } from "next/navigation";
import { AuthContext } from "@/contexts/AuthProvider";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/assessment",
  "/result",
  "/alpha-credits",
  "/challenges",
  "/profile",
  "/settings",
  "/saved-scans",
  "/image-analyzer",
  "/compare-results",
  "/upgrade",
  "/checkout",
];

// The actual security boundary for these prefixes is middleware.ts (SSR,
// checked via @supabase/ssr's getUser() before the page ever renders) — an
// unauthenticated request never reaches this component. This just covers
// the brief window where the request is authenticated (cookie verified by
// middleware) but AuthProvider's client-side context hasn't hydrated yet.
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useContext(AuthContext);

  const isProtected = useMemo(() => {
    if (!pathname) return false;
    return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  }, [pathname]);

  if (isProtected && loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#6e6e73] text-sm">
        Verifying secure session...
      </div>
    );
  }

  return <>{children}</>;
}
