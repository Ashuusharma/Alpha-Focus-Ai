import { NextRequest, NextResponse } from "next/server";
import { appendCollection, readCollection, writeCollection } from "@/lib/server/jsonDb";
import { ScanHistoryRecord, UserRecord } from "@/lib/server/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const scans = await readCollection<ScanHistoryRecord>("scanHistory");
  const filtered = userId ? scans.filter((item) => item.userId === userId) : scans;
  return NextResponse.json({ scans: filtered });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ScanHistoryRecord>;

    const scan: ScanHistoryRecord = {
      id: body.id || `scan_${Date.now()}`,
      userId: body.userId || "guest",
      scanDate: body.scanDate || new Date().toISOString(),
      skinScore: Number(body.skinScore || 0),
      hairScore: Number(body.hairScore || 0),
      imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls : [],
      analyzerType: body.analyzerType,
    };

    await appendCollection("scanHistory", scan);

    const users = await readCollection<UserRecord>("users");
    const userIndex = users.findIndex((item) => item.id === scan.userId);
    if (userIndex >= 0) {
      users[userIndex].scanHistory = [scan.id, ...users[userIndex].scanHistory.filter((id) => id !== scan.id)].slice(0, 200);
      users[userIndex].updatedAt = new Date().toISOString();
      await writeCollection("users", users);
    }

    return NextResponse.json({ ok: true, scan });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "scan_history_failed" }, { status: 500 });
  }
}
