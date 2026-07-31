import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRequestUser } from "@/lib/server/supabaseRequestAuth";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middlewareClient";

const protectedApiPrefixes = [
  "/api/logs/",
  "/api/reports/weekly",
  "/api/scans/history",
  "/api/user/sync",
];

function isProtectedApi(pathname: string) {
  return protectedApiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

// Phase 6: the real page-route security boundary. Previously page protection
// was client-side only (components/auth/ProtectedRoute.tsx), which can be
// bypassed by disabling JS or requesting the page directly — this closes
// that gap using @supabase/ssr's cookie-based session, checked with
// getUser() (revalidates against the Supabase Auth server) rather than
// getSession() (would only decode a possibly-stale local cookie).
//
// NOTE: this file must live at src/middleware.ts, not the repo root, even
// though the actual App Router lives in app/ at the repo root (not
// src/app/). A stray legacy src/pages/ directory makes Next.js treat src/
// as the project's srcDir, and Next silently no-ops any middleware.ts that
// isn't inside that srcDir (confirmed via .next/server/middleware-manifest.json
// showing an empty middleware map when this file lived at the repo root —
// true both for this rewritten version and for the original pre-Phase-6
// file, so this was a pre-existing, previously-undetected bug, not a
// regression). If src/pages/ is ever deleted, move this file back to the
// repo root at the same time.
const protectedPagePrefixes = [
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

function isProtectedPage(pathname: string) {
  return protectedPagePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isProtectedApi(pathname)) {
    const user = await getSupabaseRequestUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (isProtectedPage(pathname)) {
    const { supabase, getResponse } = createSupabaseMiddlewareClient(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return getResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/logs/:path*",
    "/api/reports/weekly",
    "/api/scans/history",
    "/api/user/sync",
    "/dashboard/:path*",
    "/assessment/:path*",
    "/result/:path*",
    "/alpha-credits/:path*",
    "/challenges/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/saved-scans/:path*",
    "/image-analyzer/:path*",
    "/compare-results/:path*",
    "/upgrade/:path*",
    "/checkout/:path*",
  ],
};
