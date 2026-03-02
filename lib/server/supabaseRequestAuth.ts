import { NextRequest } from "next/server";

type SupabaseRequestUser = {
  id: string;
  email?: string;
};

export async function getSupabaseRequestUser(request: NextRequest): Promise<SupabaseRequestUser | null> {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const accessToken = authHeader.slice("Bearer ".length).trim();
  if (!accessToken) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) return null;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const user = (await response.json()) as { id?: string; email?: string };
  if (!user?.id) return null;

  return { id: user.id, email: user.email };
}