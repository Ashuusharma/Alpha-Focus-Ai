import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/notifications/notificationEngine";
import { isRateLimited } from "@/lib/server/rateLimit";
import { writeAuditLog } from "@/lib/server/auditLog";
import { notificationPreferenceUpdateSchema } from "@/lib/server/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    const result = await getNotificationPreferences(auth.userId, accessToken);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, preferences: result.preferences });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "preferences_read_failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`notifications:preferences:${auth.userId}`, 30, 60_000)) {
      await writeAuditLog({ action: "notifications.preferences", userId: auth.userId, ok: false, route: "/api/notifications/preferences", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = notificationPreferenceUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

    const result = await updateNotificationPreferences({
      userId: auth.userId,
      routineEnabled: parsed.data.routineEnabled,
      challengeEnabled: parsed.data.challengeEnabled,
      progressEnabled: parsed.data.progressEnabled,
      tipsEnabled: parsed.data.tipsEnabled,
      accessToken,
    });

    if (!result.ok) {
      await writeAuditLog({ action: "notifications.preferences", userId: auth.userId, ok: false, route: "/api/notifications/preferences", detail: "update_failed" });
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    await writeAuditLog({ action: "notifications.preferences", userId: auth.userId, ok: true, route: "/api/notifications/preferences" });
    return NextResponse.json({ ok: true, preferences: result.preferences });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "preferences_update_failed" }, { status: 500 });
  }
}
