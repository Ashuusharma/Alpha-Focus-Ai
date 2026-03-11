import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { markNotificationsRead } from "@/lib/notifications/notificationEngine";
import { isRateLimited } from "@/lib/server/rateLimit";
import { writeAuditLog } from "@/lib/server/auditLog";
import { notificationReadSchema } from "@/lib/server/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`notifications:read:${auth.userId}`, 60, 60_000)) {
      await writeAuditLog({ action: "notifications.read", userId: auth.userId, ok: false, route: "/api/notifications/read", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = notificationReadSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

    const result = await markNotificationsRead({
      userId: auth.userId,
      ids: parsed.data.ids,
      all: parsed.data.all,
      accessToken,
    });

    if (!result.ok) {
      await writeAuditLog({ action: "notifications.read", userId: auth.userId, ok: false, route: "/api/notifications/read", detail: "update_failed" });
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    await writeAuditLog({ action: "notifications.read", userId: auth.userId, ok: true, route: "/api/notifications/read" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "notifications_read_failed" }, { status: 500 });
  }
}
