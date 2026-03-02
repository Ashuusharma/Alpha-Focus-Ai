import { NextRequest, NextResponse } from "next/server";
import { appendCollection, readCollection, writeCollection } from "@/lib/server/jsonDb";
import { MoodLogRecord, UserRecord } from "@/lib/server/types";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { moodLogSchema } from "@/lib/server/validators";
import { writeAuditLog } from "@/lib/server/auditLog";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const logs = await readCollection<MoodLogRecord>("moodLogs");
  const filtered = userId ? logs.filter((item) => item.userId === userId) : logs;
  return NextResponse.json({ logs: filtered });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`logs:mood:${auth.userId}`, 60, 60_000)) {
      await writeAuditLog({ action: "logs.mood.write", userId: auth.userId, ok: false, route: "/api/logs/mood", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const raw = (await request.json()) as Partial<MoodLogRecord>;
    const parsed = moodLogSchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "logs.mood.write", userId: auth.userId, ok: false, route: "/api/logs/mood", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;
    const log: MoodLogRecord = {
      id: body.id || `mood_${Date.now()}`,
      userId: auth.userId,
      date: body.date || new Date().toISOString().slice(0, 10),
      mood: body.mood === "calm" || body.mood === "stressed" ? body.mood : "neutral",
      createdAt: new Date().toISOString(),
    };

    await appendCollection("moodLogs", log);

    const users = await readCollection<UserRecord>("users");
    const userIndex = users.findIndex((item) => item.id === log.userId);
    if (userIndex >= 0) {
      users[userIndex].moodLogs = [log.id, ...users[userIndex].moodLogs.filter((id) => id !== log.id)].slice(0, 365);
      users[userIndex].updatedAt = new Date().toISOString();
      await writeCollection("users", users);
    }

    await writeAuditLog({ action: "logs.mood.write", userId: auth.userId, ok: true, route: "/api/logs/mood" });
    return NextResponse.json({ ok: true, log });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "mood_log_failed" }, { status: 500 });
  }
}
