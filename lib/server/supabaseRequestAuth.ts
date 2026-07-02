import { NextRequest } from "next/server";

type SupabaseRequestUser = {
  id: string;
  email?: string;
};

export async function getSupabaseRequestUser(request: NextRequest): Promise<SupabaseRequestUser | null> {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    console.warn("[auth][supabaseRequestAuth] missing_bearer_header", {
      path: request.nextUrl.pathname,
      hasAuthorizationHeader: Boolean(authHeader),
    });
    return null;
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) {
    console.warn("[auth][supabaseRequestAuth] empty_bearer_token", {
      path: request.nextUrl.pathname,
    });
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    console.error("[auth][supabaseRequestAuth] supabase_client_env_missing", {
      hasSupabaseUrl: Boolean(baseUrl),
      hasSupabaseAnonKey: Boolean(anonKey),
    });
    return null;
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.warn("[auth][supabaseRequestAuth] auth_v1_user_failed", {
      status: response.status,
      detail: detail.slice(0, 400),
    });
    return null;
  }

  const user = (await response.json()) as { id?: string; email?: string };
  if (!user?.id) {
    console.warn("[auth][supabaseRequestAuth] auth_v1_user_missing_id");
    return null;
  }

  console.info("[auth][supabaseRequestAuth] auth_v1_user_ok", {
    userId: user.id,
  });

  return { id: user.id, email: user.email };
}