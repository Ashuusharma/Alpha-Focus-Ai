import { NotificationRow } from "@/lib/notifications/types";

const PUSH_STATE_KEY = "push_subscriptions";
const MAX_SUBSCRIPTIONS_PER_USER = 5;

export type StoredPushSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
};

function getSupabaseConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey || !serviceKey) return null;
  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    anonKey,
    serviceKey,
  };
}

function buildAuthHeaders(input: { serviceKey: string; anonKey: string; accessToken?: string }) {
  const token = input.accessToken || input.serviceKey;
  const apikey = input.accessToken ? input.anonKey : input.serviceKey;
  return {
    apikey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function isStoredPushSubscription(value: unknown): value is StoredPushSubscription {
  if (!value || typeof value !== "object") return false;
  const candidate = value as StoredPushSubscription;
  return Boolean(candidate.endpoint && candidate.keys?.p256dh && candidate.keys?.auth);
}

function normalizeSubscriptions(value: unknown) {
  if (!Array.isArray(value)) return [] as StoredPushSubscription[];
  return value.filter(isStoredPushSubscription).slice(0, MAX_SUBSCRIPTIONS_PER_USER);
}

async function readState(userId: string, accessToken?: string) {
  const config = getSupabaseConfig();
  if (!config) return { ok: false as const, error: "supabase_not_configured" };

  const url = new URL(`${config.baseUrl}/rest/v1/user_app_state`);
  url.searchParams.set("select", "state_blob");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("state_key", `eq.${PUSH_STATE_KEY}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders({ serviceKey: config.serviceKey, anonKey: config.anonKey, accessToken }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false as const, error: await response.text() || "push_state_read_failed" };
  }

  const rows = (await response.json()) as Array<{ state_blob?: string | null }>;
  const raw = rows[0]?.state_blob;
  if (!raw) return { ok: true as const, subscriptions: [] as StoredPushSubscription[] };

  try {
    return { ok: true as const, subscriptions: normalizeSubscriptions(JSON.parse(raw)) };
  } catch {
    return { ok: true as const, subscriptions: [] as StoredPushSubscription[] };
  }
}

async function writeState(userId: string, subscriptions: StoredPushSubscription[], accessToken?: string) {
  const config = getSupabaseConfig();
  if (!config) return { ok: false as const, error: "supabase_not_configured" };

  const payload = {
    user_id: userId,
    state_key: PUSH_STATE_KEY,
    state_blob: JSON.stringify(subscriptions.slice(0, MAX_SUBSCRIPTIONS_PER_USER)),
  };

  const response = await fetch(`${config.baseUrl}/rest/v1/user_app_state`, {
    method: "POST",
    headers: {
      ...buildAuthHeaders({ serviceKey: config.serviceKey, anonKey: config.anonKey, accessToken }),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false as const, error: await response.text() || "push_state_write_failed" };
  }

  return { ok: true as const };
}

export function getWebPushPublicKey() {
  return process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY || "";
}

export function hasSupabaseServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function isWebPushConfigured() {
  return Boolean(getWebPushPublicKey() && process.env.WEB_PUSH_VAPID_PRIVATE_KEY);
}

export function getPushConfigurationStatus() {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim()) {
    missing.push("NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY");
  }

  if (!process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim()) {
    missing.push("WEB_PUSH_VAPID_PRIVATE_KEY");
  }

  if (!process.env.WEB_PUSH_VAPID_SUBJECT?.trim()) {
    missing.push("WEB_PUSH_VAPID_SUBJECT");
  }

  if (!hasSupabaseServiceRoleKey()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    vapidReady: isWebPushConfigured(),
    deliveryReady: missing.length === 0,
    serviceRoleReady: hasSupabaseServiceRoleKey(),
    missing,
  };
}

export async function listPushSubscriptions(userId: string, accessToken?: string) {
  return readState(userId, accessToken);
}

export async function savePushSubscription(input: {
  userId: string;
  subscription: PushSubscriptionJSON;
  userAgent?: string;
  accessToken?: string;
}) {
  if (!input.subscription.endpoint || !input.subscription.keys?.p256dh || !input.subscription.keys?.auth) {
    return { ok: false as const, error: "invalid_subscription" };
  }

  const current = await readState(input.userId, input.accessToken);
  if (!current.ok) return current;

  const now = new Date().toISOString();
  const nextSubscription: StoredPushSubscription = {
    endpoint: input.subscription.endpoint,
    expirationTime: input.subscription.expirationTime ?? null,
    keys: {
      p256dh: input.subscription.keys.p256dh,
      auth: input.subscription.keys.auth,
    },
    userAgent: input.userAgent,
    createdAt: current.subscriptions.find((entry) => entry.endpoint === input.subscription.endpoint)?.createdAt || now,
    updatedAt: now,
  };

  const merged = [
    nextSubscription,
    ...current.subscriptions.filter((entry) => entry.endpoint !== input.subscription.endpoint),
  ].slice(0, MAX_SUBSCRIPTIONS_PER_USER);

  const write = await writeState(input.userId, merged, input.accessToken);
  if (!write.ok) return write;

  return { ok: true as const, subscriptions: merged };
}

export async function removePushSubscription(input: {
  userId: string;
  endpoint?: string;
  accessToken?: string;
}) {
  const current = await readState(input.userId, input.accessToken);
  if (!current.ok) return current;

  const remaining = input.endpoint
    ? current.subscriptions.filter((entry) => entry.endpoint !== input.endpoint)
    : [];

  const write = await writeState(input.userId, remaining, input.accessToken);
  if (!write.ok) return write;

  return { ok: true as const, subscriptions: remaining };
}

export function toPushPayload(notification: NotificationRow) {
  const urgentEvent = notification.event_type === "routine_missed" || notification.event_type === "streak_at_risk";
  const rewardEvent = notification.event_type === "reward_unlocked";

  return {
    title: notification.title,
    body: notification.message,
    url: notification.action_url || "/dashboard",
    tag: notification.event_type,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    requireInteraction: urgentEvent,
    renotify: urgentEvent || rewardEvent,
    vibrate: urgentEvent ? [180, 90, 180] : rewardEvent ? [120, 60, 120] : [90],
    metadata: notification.metadata || {},
  };
}