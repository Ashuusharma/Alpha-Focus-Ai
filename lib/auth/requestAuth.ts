import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/jwt";
import { getSupabaseRequestUser } from "@/lib/server/supabaseRequestAuth";

export type RequestAuth = {
  userId: string;
  name: string;
};

export async function getRequestAuth(request: NextRequest): Promise<RequestAuth | null> {
  const cookieNames = request.cookies.getAll().map((cookie) => cookie.name);
  const hasSupabaseSessionCookie = cookieNames.some((name) => /^sb-.*-auth-token(\.\d+)?$/.test(name));
  const hasAuthorizationHeader = Boolean(request.headers.get("authorization")?.trim());
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  console.info("[auth][requestAuth] start", {
    path: request.nextUrl.pathname,
    hasAuthCookie: Boolean(token),
    hasAuthorizationHeader,
    hasSupabaseSessionCookie,
    cookieCount: cookieNames.length,
  });

  if (token) {
    try {
      const payload = await verifyAuthToken(token);
      console.info("[auth][requestAuth] jwt_verified", {
        userId: payload.sub,
      });
      return {
        userId: payload.sub,
        name: payload.name,
      };
    } catch (error) {
      console.warn("[auth][requestAuth] jwt_verify_failed", {
        error: error instanceof Error ? error.message : "unknown_error",
      });
      // Fallback to Supabase bearer token auth if custom cookie is stale/invalid.
    }
  }

  const supabaseUser = await getSupabaseRequestUser(request);
  if (!supabaseUser) {
    console.warn("[auth][requestAuth] auth_failed", {
      reason: "no_valid_custom_jwt_or_supabase_bearer",
      hasAuthCookie: Boolean(token),
      hasAuthorizationHeader,
      hasSupabaseSessionCookie,
    });
    return null;
  }

  console.info("[auth][requestAuth] supabase_bearer_verified", {
    userId: supabaseUser.id,
  });

  return {
    userId: supabaseUser.id,
    name: supabaseUser.email || "User",
  };
}
