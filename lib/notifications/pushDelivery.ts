import webpush from "web-push";
import { NotificationRow } from "@/lib/notifications/types";
import { listPushSubscriptions, removePushSubscription, StoredPushSubscription, toPushPayload, isWebPushConfigured } from "@/lib/notifications/pushSubscriptions";

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT || "mailto:support@onemanai.app";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

function toWebPushSubscription(subscription: StoredPushSubscription) {
  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: subscription.keys,
  };
}

export async function deliverPushNotification(userId: string, notification: NotificationRow, accessToken?: string) {
  if (!isWebPushConfigured() || !configureVapid()) {
    return { ok: true as const, delivered: 0, skipped: "push_not_configured" as const };
  }

  const subscriptionsResult = await listPushSubscriptions(userId, accessToken);
  if (!subscriptionsResult.ok) {
    return { ok: false as const, error: subscriptionsResult.error };
  }

  if (subscriptionsResult.subscriptions.length === 0) {
    return { ok: true as const, delivered: 0, skipped: "no_subscriptions" as const };
  }

  const payload = JSON.stringify(toPushPayload(notification));
  let delivered = 0;

  await Promise.all(
    subscriptionsResult.subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(toWebPushSubscription(subscription), payload, {
          TTL: 60 * 60,
          urgency: notification.category === "routine" ? "high" : "normal",
          topic: notification.event_type,
        });
        delivered += 1;
      } catch (error) {
        const statusCode = typeof error === "object" && error !== null && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode || 0)
          : 0;

        if (statusCode === 404 || statusCode === 410) {
          await removePushSubscription({ userId, endpoint: subscription.endpoint, accessToken });
        }
      }
    })
  );

  return { ok: true as const, delivered };
}