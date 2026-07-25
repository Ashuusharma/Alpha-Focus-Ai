import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRequestUser } from "@/lib/server/supabaseRequestAuth";

const protectedApiPrefixes = [
  "/api/logs/",
  "/api/reports/weekly",
  "/api/scans/history",
  "/api/user/sync",
];

function isProtectedApi(pathname: string) {
  return protectedApiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

// Page-level redirects were previously gated on a custom demo JWT that
// required no real credential (see git history) and have been removed.
// Client-side gating for pages lives in components/auth/ProtectedRoute.tsx,
// which checks the real Supabase session. The actual security boundary is
// here and in each API route's own getRequestAuth() call, both of which
// verify a real Supabase bearer token.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedApi(pathname)) {
    return NextResponse.next();
  }

  const user = await getSupabaseRequestUser(request);
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/logs/:path*", "/api/reports/weekly", "/api/scans/history", "/api/user/sync"],
};
