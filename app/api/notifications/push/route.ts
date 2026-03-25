import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { writeAuditLog } from "@/lib/server/auditLog";
import { getPushConfigurationStatus, getWebPushPublicKey, listPushSubscriptions, removePushSubscription, savePushSubscription } from "@/lib/notifications/pushSubscriptions";

export const runtime = "nodejs";

function getAccessToken(request: NextRequest) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
}

function isPushSubscriptionJson(value: unknown): value is PushSubscriptionJSON {
  if (!value || typeof value !== "object") return false;
  const candidate = value as PushSubscriptionJSON;
  return Boolean(candidate.endpoint && candidate.keys?.auth && candidate.keys?.p256dh);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const accessToken = getAccessToken(request);
    const subscriptions = await listPushSubscriptions(auth.userId, accessToken);
    if (!subscriptions.ok) {
      return NextResponse.json({ ok: false, error: subscriptions.error }, { status: 500 });
    }

    const config = getPushConfigurationStatus();

    return NextResponse.json({
      ok: true,
      publicKey: getWebPushPublicKey(),
      configured: config.vapidReady,
      deliveryReady: config.deliveryReady,
      serviceRoleReady: config.serviceRoleReady,
      missing: config.missing,
      subscribed: subscriptions.subscriptions.length > 0,
      subscriptionCount: subscriptions.subscriptions.length,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "push_status_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`notifications:push:subscribe:${auth.userId}`, 20, 60_000)) {
      await writeAuditLog({ action: "notifications.push.subscribe", userId: auth.userId, ok: false, route: "/api/notifications/push", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const body = (await request.json().catch(() => ({}))) as { subscription?: unknown };
    if (!isPushSubscriptionJson(body.subscription)) {
      return NextResponse.json({ ok: false, error: "invalid_subscription" }, { status: 400 });
    }

    const accessToken = getAccessToken(request);
    const result = await savePushSubscription({
      userId: auth.userId,
      subscription: body.subscription,
      userAgent: request.headers.get("user-agent") || undefined,
      accessToken,
    });

    if (!result.ok) {
      await writeAuditLog({ action: "notifications.push.subscribe", userId: auth.userId, ok: false, route: "/api/notifications/push", detail: "save_failed" });
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    await writeAuditLog({ action: "notifications.push.subscribe", userId: auth.userId, ok: true, route: "/api/notifications/push" });
    return NextResponse.json({ ok: true, subscriptionCount: result.subscriptions.length });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "push_subscribe_failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { endpoint?: string };
    const accessToken = getAccessToken(request);
    const result = await removePushSubscription({
      userId: auth.userId,
      endpoint: typeof body.endpoint === "string" ? body.endpoint : undefined,
      accessToken,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    await writeAuditLog({ action: "notifications.push.unsubscribe", userId: auth.userId, ok: true, route: "/api/notifications/push" });
    return NextResponse.json({ ok: true, subscriptionCount: result.subscriptions.length });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "push_unsubscribe_failed" }, { status: 500 });
  }
}