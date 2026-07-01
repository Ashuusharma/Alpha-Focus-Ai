import { NextRequest, NextResponse } from "next/server";
import { runNotificationScheduler } from "@/lib/notifications/notificationScheduler";
import { secureCompare } from "@/lib/server/secureCompare";
import { writeAuditLog } from "@/lib/server/auditLog";

export const runtime = "nodejs";

function isAuthorizedCron(request: NextRequest) {
  const routeSecret = process.env.NOTIFICATION_SCHEDULER_SECRET;
  const cronSecret = process.env.CRON_SECRET;

  const allowedSecrets = [routeSecret, cronSecret].filter((value): value is string => Boolean(value));
  if (allowedSecrets.length === 0) return false;

  const schedulerHeader = request.headers.get("x-scheduler-secret") || "";
  if (schedulerHeader && allowedSecrets.some((secret) => secureCompare(schedulerHeader, secret))) return true;

  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  return bearerToken.length > 0 && allowedSecrets.some((secret) => secureCompare(bearerToken, secret));
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorizedCron(request)) {
      await writeAuditLog({ action: "notifications.scheduler.auth", userId: "scheduler", ok: false, route: "/api/notifications/scheduler", detail: "unauthorized" });
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { userId?: string };
    const result = await runNotificationScheduler({ userId: body.userId });
    if (!result.ok) {
      await writeAuditLog({ action: "notifications.scheduler.run", userId: body.userId || "scheduler", ok: false, route: "/api/notifications/scheduler", detail: result.error || "scheduler_failed" });
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    await writeAuditLog({ action: "notifications.scheduler.run", userId: body.userId || "scheduler", ok: true, route: "/api/notifications/scheduler" });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: "notifications_scheduler_failed" }, { status: 500 });
  }
}

