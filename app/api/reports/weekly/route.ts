import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { weeklyReportSchema } from "@/lib/server/validators";
import { writeAuditLog } from "@/lib/server/auditLog";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (!auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("clinical_reports")
    .select("id,user_id,created_at,report_payload")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: "weekly_report_fetch_failed" }, { status: 500 });
  }

  const reports = (data || []).map((row) => {
    const payload = (row.report_payload || {}) as Record<string, unknown>;
    return {
      id: String(row.id),
      userId: String(row.user_id),
      createdAt: row.created_at || new Date().toISOString(),
      strengths: Array.isArray(payload.strengths) ? payload.strengths : [],
      risks: Array.isArray(payload.risks) ? payload.risks : [],
      suggestedFocus: typeof payload.suggestedFocus === "string" ? payload.suggestedFocus : "",
      avgSleep: Number(payload.avgSleep || 0),
      avgHydration: Number(payload.avgHydration || 0),
      compliance: Number(payload.compliance || 0),
      scoreDelta: Number(payload.scoreDelta || 0),
    };
  });

  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`reports:weekly:${auth.userId}`, 30, 60_000)) {
      await writeAuditLog({ action: "reports.weekly.write", userId: auth.userId, ok: false, route: "/api/reports/weekly", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const raw = (await request.json()) as Record<string, unknown>;
    const parsed = weeklyReportSchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "reports.weekly.write", userId: auth.userId, ok: false, route: "/api/reports/weekly", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;
    const report = {
      id: body.id || `weekly_${Date.now()}`,
      userId: auth.userId,
      createdAt: new Date().toISOString(),
      strengths: Array.isArray(body.strengths) ? body.strengths : [],
      risks: Array.isArray(body.risks) ? body.risks : [],
      suggestedFocus: String(body.suggestedFocus || ""),
      avgSleep: Number(body.avgSleep || 0),
      avgHydration: Number(body.avgHydration || 0),
      compliance: Number(body.compliance || 0),
      scoreDelta: Number(body.scoreDelta || 0),
    };

    const { data, error } = await supabase
      .from("clinical_reports")
      .insert({
        user_id: auth.userId,
        category: "weekly",
        report_payload: {
          strengths: report.strengths,
          risks: report.risks,
          suggestedFocus: report.suggestedFocus,
          avgSleep: report.avgSleep,
          avgHydration: report.avgHydration,
          compliance: report.compliance,
          scoreDelta: report.scoreDelta,
        },
      })
      .select("id,created_at")
      .single();

    if (error) {
      await writeAuditLog({ action: "reports.weekly.write", userId: auth.userId, ok: false, route: "/api/reports/weekly", detail: "supabase_write_failed" });
      return NextResponse.json({ ok: false, error: "weekly_report_failed" }, { status: 500 });
    }

    const responseReport = {
      ...report,
      id: data?.id || report.id,
      createdAt: data?.created_at || report.createdAt,
    };

    await writeAuditLog({ action: "reports.weekly.write", userId: auth.userId, ok: true, route: "/api/reports/weekly" });
    return NextResponse.json({ ok: true, report: responseReport });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "weekly_report_failed" }, { status: 500 });
  }
}

