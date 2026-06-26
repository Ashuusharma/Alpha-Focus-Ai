import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { scanHistorySchema } from "@/lib/server/validators";
import { writeAuditLog } from "@/lib/server/auditLog";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (!auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("photo_scans")
    .select("id,user_id,scan_date,image_url,captured_image_urls,analyzer_category,density_score,inflammation_score")
    .eq("user_id", auth.userId)
    .order("scan_date", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: "scan_history_fetch_failed" }, { status: 500 });
  }

  const scans = (data || []).map((row) => {
    const captured = Array.isArray(row.captured_image_urls)
      ? row.captured_image_urls.filter((item): item is string => typeof item === "string")
      : [];
    const fallbackUrl = typeof row.image_url === "string" && row.image_url ? [row.image_url] : [];

    return {
      id: String(row.id),
      userId: String(row.user_id),
      scanDate: row.scan_date || new Date().toISOString(),
      skinScore: Number(row.inflammation_score || 0),
      hairScore: Number(row.density_score || 0),
      imageUrls: captured.length > 0 ? captured : fallbackUrl,
      analyzerType: row.analyzer_category || undefined,
    };
  });

  return NextResponse.json({ scans });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`scans:history:${auth.userId}`, 30, 60_000)) {
      await writeAuditLog({ action: "scans.history.write", userId: auth.userId, ok: false, route: "/api/scans/history", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const raw = (await request.json()) as Record<string, unknown>;
    const parsed = scanHistorySchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "scans.history.write", userId: auth.userId, ok: false, route: "/api/scans/history", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;

    const scan = {
      id: body.id || `scan_${Date.now()}`,
      userId: auth.userId,
      scanDate: body.scanDate || new Date().toISOString(),
      skinScore: Number(body.skinScore || 0),
      hairScore: Number(body.hairScore || 0),
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
      analyzerType: body.analyzerType,
    };

    const { data, error } = await supabase
      .from("photo_scans")
      .insert({
        user_id: auth.userId,
        scan_date: scan.scanDate,
        image_url: scan.imageUrls[0] || null,
        captured_image_urls: scan.imageUrls,
        analyzer_category: scan.analyzerType || null,
        density_score: scan.hairScore,
        inflammation_score: scan.skinScore,
      })
      .select("id,scan_date")
      .single();

    if (error) {
      await writeAuditLog({ action: "scans.history.write", userId: auth.userId, ok: false, route: "/api/scans/history", detail: "supabase_write_failed" });
      return NextResponse.json({ ok: false, error: "scan_history_failed" }, { status: 500 });
    }

    const responseScan = {
      ...scan,
      id: data?.id || scan.id,
      scanDate: data?.scan_date || scan.scanDate,
    };

    await writeAuditLog({ action: "scans.history.write", userId: auth.userId, ok: true, route: "/api/scans/history" });
    return NextResponse.json({ ok: true, scan: responseScan });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "scan_history_failed" }, { status: 500 });
  }
}
