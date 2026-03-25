import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { createNotification } from "@/lib/notifications/notificationEngine";
import { NotificationEventType } from "@/lib/notifications/types";
import { isRateLimited } from "@/lib/server/rateLimit";

export const runtime = "nodejs";

const ALLOWED_TEST_EVENTS: NotificationEventType[] = [
  "routine_reminder",
  "routine_missed",
  "progress_improved",
  "streak_at_risk",
  "reward_unlocked",
  "daily_tip",
];

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`notifications:test:${auth.userId}`, 6, 60_000)) {
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      eventType?: NotificationEventType;
      metadata?: Record<string, unknown>;
    };

    const eventType = ALLOWED_TEST_EVENTS.includes(body.eventType as NotificationEventType)
      ? (body.eventType as NotificationEventType)
      : "progress_improved";

    const metadata = body.metadata && typeof body.metadata === "object"
      ? body.metadata
      : {};

    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    const result = await createNotification({
      userId: auth.userId,
      eventType,
      metadata: {
        improvementPct: 12,
        rewardLabel: "Alpha Sikka bonus",
        ...metadata,
      },
      dedupeKey: `test:${eventType}:${Date.now()}`,
      bypassDailyCap: true,
      accessToken,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, skipped: "skipped" in result ? result.skipped : null });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "notifications_test_failed" }, { status: 500 });
  }
}