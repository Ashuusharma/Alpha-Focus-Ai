import { NextRequest } from "next/server";
import { getSupabaseRequestUser } from "@/lib/server/supabaseRequestAuth";

export type RequestAuth = {
  userId: string;
  name: string;
};

export async function getRequestAuth(request: NextRequest): Promise<RequestAuth | null> {
  const supabaseUser = await getSupabaseRequestUser(request);
  if (!supabaseUser) {
    console.warn("[auth][requestAuth] auth_failed", {
      path: request.nextUrl.pathname,
    });
    return null;
  }

  return {
    userId: supabaseUser.id,
    name: supabaseUser.email || "User",
  };
}
