import { NextRequest, NextResponse } from "next/server";
import { appendCollection, readCollection, writeCollection } from "@/lib/server/jsonDb";
import { HydrationLogRecord, UserRecord } from "@/lib/server/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const logs = await readCollection<HydrationLogRecord>("hydrationLogs");
  const filtered = userId ? logs.filter((item) => item.userId === userId) : logs;
  return NextResponse.json({ logs: filtered });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<HydrationLogRecord>;
    const log: HydrationLogRecord = {
      id: body.id || `hydration_${Date.now()}`,
      userId: body.userId || "guest",
      date: body.date || new Date().toISOString().slice(0, 10),
      intakeMl: Number(body.intakeMl || 0),
      targetMl: Number(body.targetMl || 3000),
      createdAt: new Date().toISOString(),
    };

    await appendCollection("hydrationLogs", log);

    const users = await readCollection<UserRecord>("users");
    const userIndex = users.findIndex((item) => item.id === log.userId);
    if (userIndex >= 0) {
      users[userIndex].hydrationLogs = [log.id, ...users[userIndex].hydrationLogs.filter((id) => id !== log.id)].slice(0, 365);
      users[userIndex].updatedAt = new Date().toISOString();
      await writeCollection("users", users);
    }

    return NextResponse.json({ ok: true, log });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "hydration_log_failed" }, { status: 500 });
  }
}
