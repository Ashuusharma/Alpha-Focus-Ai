import { NextRequest, NextResponse } from "next/server";
import { appendCollection, readCollection, writeCollection } from "@/lib/server/jsonDb";
import { SleepLogRecord, UserRecord } from "@/lib/server/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const logs = await readCollection<SleepLogRecord>("sleepLogs");
  const filtered = userId ? logs.filter((item) => item.userId === userId) : logs;
  return NextResponse.json({ logs: filtered });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SleepLogRecord>;
    const log: SleepLogRecord = {
      id: body.id || `sleep_${Date.now()}`,
      userId: body.userId || "guest",
      date: body.date || new Date().toISOString().slice(0, 10),
      hours: Number(body.hours || 0),
      quality: Number(body.quality || 0),
      createdAt: new Date().toISOString(),
    };

    await appendCollection("sleepLogs", log);

    const users = await readCollection<UserRecord>("users");
    const userIndex = users.findIndex((item) => item.id === log.userId);
    if (userIndex >= 0) {
      users[userIndex].sleepLogs = [log.id, ...users[userIndex].sleepLogs.filter((id) => id !== log.id)].slice(0, 365);
      users[userIndex].updatedAt = new Date().toISOString();
      await writeCollection("users", users);
    }

    return NextResponse.json({ ok: true, log });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "sleep_log_failed" }, { status: 500 });
  }
}
