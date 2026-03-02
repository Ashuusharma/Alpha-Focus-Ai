import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/server/jsonDb";
import { UserRecord } from "@/lib/server/types";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { userSyncSchema } from "@/lib/server/validators";
import { writeAuditLog } from "@/lib/server/auditLog";

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
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const raw = (await request.json()) as Record<string, unknown>;
    const parsed = userSyncSchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "user.sync", userId: auth.userId, ok: false, route: "/api/user/sync", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const nextRecord = toUserRecord(parsed.data as unknown as Record<string, unknown>);
    nextRecord.id = auth.userId;
    nextRecord.name = auth.name;

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

    await writeAuditLog({ action: "user.sync", userId: auth.userId, ok: true, route: "/api/user/sync" });
    return NextResponse.json({ ok: true, userId: nextRecord.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "sync_failed" }, { status: 500 });
  }
}
