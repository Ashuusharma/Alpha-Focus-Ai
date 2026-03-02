import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/jwt";

const protectedPagePrefixes = [
  "/profile",
  "/dashboard",
  "/saved-scans",
  "/settings",
  "/tracking",
  "/reports/weekly",
  "/data-settings",
  "/challenges",
  "/result",
];

const protectedApiPrefixes = [
  "/api/logs/",
  "/api/reports/weekly",
  "/api/scans/history",
  "/api/user/sync",
];

function isProtectedPath(pathname: string) {
  return protectedPagePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isProtectedApi(pathname: string) {
  return protectedApiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

async function hasValidToken(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    await verifyAuthToken(token);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname) && !isProtectedApi(pathname)) {
    return NextResponse.next();
  }

  const authenticated = await hasValidToken(request);
  if (authenticated) return NextResponse.next();

  if (isProtectedApi(pathname)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.searchParams.set("auth", "required");
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|images).*)"],
};
