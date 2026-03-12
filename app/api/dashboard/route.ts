import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRequestUser } from "@/lib/server/supabaseRequestAuth";
import { getDashboardDataForViewer } from "@/services/dashboardService";
import { getOrSetRequestCache } from "@/lib/server/requestCache";

export const runtime = "nodejs";

async function fetchProfileName(userId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !serviceKey) return null;

  const url = new URL(`${baseUrl.replace(/\/$/, "")}/rest/v1/profiles`);
  url.searchParams.set("select", "full_name");
  url.searchParams.set("id", `eq.${userId}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ full_name?: string | null }>;
  return rows[0]?.full_name || null;
}

export async function GET(request: NextRequest) {
  const authUser = await getSupabaseRequestUser(request);
  if (!authUser) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const payload = await getOrSetRequestCache(`dashboard:${authUser.id}`, 12_000, async () => {
    const fullName = await fetchProfileName(authUser.id);
    const name = (fullName || authUser.email?.split("@")[0] || "User").trim();

    const data = await getDashboardDataForViewer({
      userId: authUser.id,
      name,
    });

    return { ok: true, data };
  });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "private, max-age=12, stale-while-revalidate=30",
    },
  });
}