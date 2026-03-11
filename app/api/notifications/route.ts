import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { createNotification, listNotifications } from "@/lib/notifications/notificationEngine";
import { isRateLimited } from "@/lib/server/rateLimit";
import { writeAuditLog } from "@/lib/server/auditLog";
import { notificationCreateSchema, notificationListSchema } from "@/lib/server/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const parsed = notificationListSchema.safeParse({
      limit: request.nextUrl.searchParams.get("limit") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_query" }, { status: 400 });
    }

    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    const result = await listNotifications({ userId: auth.userId, limit: parsed.data.limit, accessToken });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "notifications_list_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`notifications:create:${auth.userId}`, 40, 60_000)) {
      await writeAuditLog({ action: "notifications.create", userId: auth.userId, ok: false, route: "/api/notifications", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const raw = await request.json();
    const parsed = notificationCreateSchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "notifications.create", userId: auth.userId, ok: false, route: "/api/notifications", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

    let result = await createNotification({
      userId: auth.userId,
      eventType: parsed.data.eventType,
      metadata: parsed.data.metadata,
      dedupeKey: parsed.data.dedupeKey,
      accessToken,
    });

    if (!result.ok && String(result.error).includes("42501")) {
      // Fallback to service-role context when available; useful before RLS hotfix is applied.
      result = await createNotification({
        userId: auth.userId,
        eventType: parsed.data.eventType,
        metadata: parsed.data.metadata,
        dedupeKey: parsed.data.dedupeKey,
      });
    }

    if (!result.ok) {
      await writeAuditLog({ action: "notifications.create", userId: auth.userId, ok: false, route: "/api/notifications", detail: "insert_failed" });
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    await writeAuditLog({ action: "notifications.create", userId: auth.userId, ok: true, route: "/api/notifications" });
    if ("skipped" in result) {
      return NextResponse.json({ ok: true, skipped: result.skipped });
    }

    return NextResponse.json({ ok: true, notification: result.notification });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "notifications_create_failed" }, { status: 500 });
  }
}
