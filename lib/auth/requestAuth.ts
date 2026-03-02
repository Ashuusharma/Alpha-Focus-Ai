import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/jwt";
import { getSupabaseRequestUser } from "@/lib/server/supabaseRequestAuth";

export type RequestAuth = {
  userId: string;
  name: string;
};

export async function getRequestAuth(request: NextRequest): Promise<RequestAuth | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    try {
      const payload = await verifyAuthToken(token);
      return {
        userId: payload.sub,
        name: payload.name,
      };
    } catch {
      return null;
    }
  }

  const supabaseUser = await getSupabaseRequestUser(request);
  if (!supabaseUser) return null;

  return {
    userId: supabaseUser.id,
    name: supabaseUser.email || "User",
  };
}
