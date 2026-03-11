import { NextRequest, NextResponse } from "next/server";
import { runNotificationScheduler } from "@/lib/notifications/notificationScheduler";

export const runtime = "nodejs";

function isAuthorizedCron(request: NextRequest) {
  const routeSecret = process.env.NOTIFICATION_SCHEDULER_SECRET;
  const cronSecret = process.env.CRON_SECRET;

  const allowedSecrets = [routeSecret, cronSecret].filter((value): value is string => Boolean(value));
  if (allowedSecrets.length === 0) return false;

  const schedulerHeader = request.headers.get("x-scheduler-secret") || "";
  if (allowedSecrets.includes(schedulerHeader)) return true;

  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  return allowedSecrets.includes(bearerToken);
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCron(request)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { userId?: string };
    const result = await runNotificationScheduler({ userId: body.userId });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "notifications_scheduler_failed" }, { status: 500 });
  }
}
