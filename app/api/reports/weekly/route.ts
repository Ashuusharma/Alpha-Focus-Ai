import { NextRequest, NextResponse } from "next/server";
import { appendCollection, readCollection, writeCollection } from "@/lib/server/jsonDb";
import { UserRecord, WeeklyReportRecord } from "@/lib/server/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const reports = await readCollection<WeeklyReportRecord>("weeklyReports");
  const filtered = userId ? reports.filter((item) => item.userId === userId) : reports;
  return NextResponse.json({ reports: filtered });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<WeeklyReportRecord>;
    const report: WeeklyReportRecord = {
      id: body.id || `weekly_${Date.now()}`,
      userId: body.userId || "guest",
      createdAt: new Date().toISOString(),
      strengths: Array.isArray(body.strengths) ? body.strengths : [],
      risks: Array.isArray(body.risks) ? body.risks : [],
      suggestedFocus: String(body.suggestedFocus || ""),
      avgSleep: Number(body.avgSleep || 0),
      avgHydration: Number(body.avgHydration || 0),
      compliance: Number(body.compliance || 0),
      scoreDelta: Number(body.scoreDelta || 0),
    };

    await appendCollection("weeklyReports", report);

    const users = await readCollection<UserRecord>("users");
    const userIndex = users.findIndex((item) => item.id === report.userId);
    if (userIndex >= 0) {
      users[userIndex].weeklyReports = [report.id, ...users[userIndex].weeklyReports.filter((id) => id !== report.id)].slice(0, 52);
      users[userIndex].updatedAt = new Date().toISOString();
      await writeCollection("users", users);
    }

    return NextResponse.json({ ok: true, report });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "weekly_report_failed" }, { status: 500 });
  }
}
