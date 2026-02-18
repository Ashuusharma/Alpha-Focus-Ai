import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/server/jsonDb";
import { UserRecord } from "@/lib/server/types";

export const runtime = "nodejs";

function toUserRecord(payload: Record<string, unknown>): UserRecord {
  const profile = (payload.profile || {}) as Record<string, unknown>;
  const permissions = (payload.permissions || {}) as Record<string, unknown>;

  return {
    id: String(profile.id || "guest"),
    name: String(profile.name || "Guest"),
    city: typeof profile.city === "string" ? profile.city : undefined,
    location: {
      city: typeof profile.city === "string" ? profile.city : undefined,
      climateEnabled: Boolean(permissions.location),
    },
    xp: Number((payload as { xp?: number }).xp || 0),
    level: Number((payload as { level?: number }).level || 1),
    permissions: {
      location: Boolean(permissions.location),
      notifications: Boolean(permissions.notifications),
      sleepTracking: Boolean(permissions.sleepTracking),
      hydrationTracking: Boolean(permissions.hydrationTracking),
      moodTracking: Boolean(permissions.moodTracking),
      consent: Boolean(permissions.consent),
    },
    sleepLogs: [],
    hydrationLogs: [],
    moodLogs: [],
    scanHistory: [],
    weeklyReports: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const nextRecord = toUserRecord(body);

    const users = await readCollection<UserRecord>("users");
    const existingIndex = users.findIndex((item) => item.id === nextRecord.id);

    if (existingIndex >= 0) {
      users[existingIndex] = {
        ...users[existingIndex],
        ...nextRecord,
        sleepLogs: users[existingIndex].sleepLogs,
        hydrationLogs: users[existingIndex].hydrationLogs,
        moodLogs: users[existingIndex].moodLogs,
        scanHistory: users[existingIndex].scanHistory,
        weeklyReports: users[existingIndex].weeklyReports,
        updatedAt: new Date().toISOString(),
      };
    } else {
      users.push(nextRecord);
    }

    await writeCollection("users", users);

    return NextResponse.json({ ok: true, userId: nextRecord.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "sync_failed" }, { status: 500 });
  }
}
