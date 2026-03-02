import { NextRequest, NextResponse } from "next/server";
import { appendCollection, readCollection, writeCollection } from "@/lib/server/jsonDb";
import { ScanHistoryRecord, UserRecord } from "@/lib/server/types";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { scanHistorySchema } from "@/lib/server/validators";
import { writeAuditLog } from "@/lib/server/auditLog";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const scans = await readCollection<ScanHistoryRecord>("scanHistory");
  const filtered = userId ? scans.filter((item) => item.userId === userId) : scans;
  return NextResponse.json({ scans: filtered });
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

    const raw = (await request.json()) as Partial<ScanHistoryRecord>;
    const parsed = scanHistorySchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "scans.history.write", userId: auth.userId, ok: false, route: "/api/scans/history", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;

    const scan: ScanHistoryRecord = {
      id: body.id || `scan_${Date.now()}`,
      userId: auth.userId,
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

    await writeAuditLog({ action: "scans.history.write", userId: auth.userId, ok: true, route: "/api/scans/history" });
    return NextResponse.json({ ok: true, scan });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "scan_history_failed" }, { status: 500 });
  }
}
