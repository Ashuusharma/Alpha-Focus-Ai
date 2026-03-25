import { buildTemplate } from "@/lib/notifications/notificationTemplates";
import { deliverPushNotification } from "@/lib/notifications/pushDelivery";
import { NotificationEventType, NotificationPreferenceRow, NotificationRow } from "@/lib/notifications/types";

const MAX_NOTIFICATIONS_PER_DAY = 3;

function getSupabaseConfig() {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !serviceKey || !anonKey) return null;
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

async function fetchPreference(baseUrl: string, serviceKey: string, anonKey: string, userId: string, accessToken?: string) {
  const url = new URL(`${baseUrl}/rest/v1/notification_preferences`);
  url.searchParams.set("select", "*");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders({ serviceKey, anonKey, accessToken }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as NotificationPreferenceRow[];
  return rows[0] || null;
}

async function fetchCountToday(baseUrl: string, serviceKey: string, anonKey: string, userId: string, accessToken?: string) {
  const day = new Date().toISOString().slice(0, 10);
  const start = `${day}T00:00:00.000Z`;
  const end = `${day}T23:59:59.999Z`;

  const url = new URL(`${baseUrl}/rest/v1/notifications`);
  url.searchParams.set("select", "id");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("created_at", `gte.${start}`);
  url.searchParams.append("created_at", `lte.${end}`);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders({ serviceKey, anonKey, accessToken }),
    cache: "no-store",
  });

  if (!response.ok) return 0;
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows.length;
}

async function fetchByDedupe(baseUrl: string, serviceKey: string, anonKey: string, userId: string, dedupeKey: string, accessToken?: string) {
  const url = new URL(`${baseUrl}/rest/v1/notifications`);
  url.searchParams.set("select", "id,user_id,dedupe_key");
  url.searchParams.set("user_id", `eq.${userId}`);
  url.searchParams.set("dedupe_key", `eq.${dedupeKey}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders({ serviceKey, anonKey, accessToken }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows[0] || null;
}

function isCategoryEnabled(preference: NotificationPreferenceRow | null, category: string) {
  if (!preference) return true;
  if (category === "routine") return Boolean(preference.routine_enabled);
  if (category === "challenge") return Boolean(preference.challenge_enabled);
  if (category === "progress") return Boolean(preference.progress_enabled);
  if (category === "tips") return Boolean(preference.tips_enabled);
  return true;
}

export async function createNotification(input: {
  userId: string;
  eventType: NotificationEventType;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
  bypassDailyCap?: boolean;
  accessToken?: string;
}) {
  const config = getSupabaseConfig();
  if (!config) return { ok: false as const, error: "supabase_not_configured" };

  const metadata = input.metadata || {};
  const template = buildTemplate(input.eventType, metadata);
  const day = new Date().toISOString().slice(0, 10);
  const dedupeKey = input.dedupeKey || `${input.eventType}:${day}`;

  const [preference, existing] = await Promise.all([
    fetchPreference(config.baseUrl, config.serviceKey, config.anonKey, input.userId, input.accessToken),
    fetchByDedupe(config.baseUrl, config.serviceKey, config.anonKey, input.userId, dedupeKey, input.accessToken),
  ]);

  if (existing?.id) {
    return { ok: true as const, skipped: "duplicate" as const };
  }

  if (!isCategoryEnabled(preference, template.category)) {
    return { ok: true as const, skipped: "disabled_by_preference" as const };
  }

  if (!input.bypassDailyCap) {
    const countToday = await fetchCountToday(config.baseUrl, config.serviceKey, config.anonKey, input.userId, input.accessToken);
    if (countToday >= MAX_NOTIFICATIONS_PER_DAY) {
      return { ok: true as const, skipped: "daily_cap_reached" as const };
    }
  }

  const response = await fetch(`${config.baseUrl}/rest/v1/notifications`, {
    method: "POST",
    headers: buildAuthHeaders({ serviceKey: config.serviceKey, anonKey: config.anonKey, accessToken: input.accessToken }),
    body: JSON.stringify({
      user_id: input.userId,
      category: template.category,
      event_type: input.eventType,
      title: template.title,
      message: template.message,
      action_url: template.actionUrl || null,
      metadata,
      dedupe_key: dedupeKey,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    const isDuplicate = detail.includes("duplicate") || detail.includes("unique");
    if (isDuplicate) return { ok: true as const, skipped: "duplicate" as const };
    return { ok: false as const, error: detail || "insert_failed" };
  }

  const rows = (await response.json()) as NotificationRow[];
  const notification = rows[0] || null;

  if (notification) {
    void deliverPushNotification(input.userId, notification, input.accessToken);
  }

  return { ok: true as const, notification };
}

export async function listNotifications(input: { userId: string; limit?: number; accessToken?: string }) {
  const config = getSupabaseConfig();
  if (!config) return { ok: false as const, error: "supabase_not_configured", notifications: [], unreadCount: 0 };

  const limit = Math.max(1, Math.min(Number(input.limit || 20), 50));
  const url = new URL(`${config.baseUrl}/rest/v1/notifications`);
  url.searchParams.set("select", "id,user_id,category,event_type,title,message,action_url,metadata,dedupe_key,is_read,read_at,created_at");
  url.searchParams.set("user_id", `eq.${input.userId}`);
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildAuthHeaders({ serviceKey: config.serviceKey, anonKey: config.anonKey, accessToken: input.accessToken }),
    cache: "no-store",
  });

  if (!response.ok) return { ok: false as const, error: "fetch_failed", notifications: [], unreadCount: 0 };

  const notifications = (await response.json()) as NotificationRow[];

  const unreadUrl = new URL(`${config.baseUrl}/rest/v1/notifications`);
  unreadUrl.searchParams.set("select", "id");
  unreadUrl.searchParams.set("user_id", `eq.${input.userId}`);
  unreadUrl.searchParams.set("is_read", "eq.false");
  const unreadResponse = await fetch(unreadUrl.toString(), {
    method: "GET",
    headers: buildAuthHeaders({ serviceKey: config.serviceKey, anonKey: config.anonKey, accessToken: input.accessToken }),
    cache: "no-store",
  });

  const unreadRows = unreadResponse.ok ? ((await unreadResponse.json()) as Array<{ id: string }>) : [];
  const unreadCount = unreadRows.length;
  return { ok: true as const, notifications, unreadCount };
}

export async function markNotificationsRead(input: { userId: string; ids?: string[]; all?: boolean; accessToken?: string }) {
  const config = getSupabaseConfig();
  if (!config) return { ok: false as const, error: "supabase_not_configured" };

  const url = new URL(`${config.baseUrl}/rest/v1/notifications`);
  url.searchParams.set("user_id", `eq.${input.userId}`);
  url.searchParams.set("is_read", "eq.false");

  if (!input.all && input.ids?.length) {
    url.searchParams.set("id", `in.(${input.ids.map((id) => `"${id}"`).join(",")})`);
  }

  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: buildAuthHeaders({ serviceKey: config.serviceKey, anonKey: config.anonKey, accessToken: input.accessToken }),
    body: JSON.stringify({
      is_read: true,
      read_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false as const, error: "update_failed" };
  }

  return { ok: true as const };
}

export async function getNotificationPreferences(userId: string, accessToken?: string) {
  const config = getSupabaseConfig();
  if (!config) return { ok: false as const, error: "supabase_not_configured" };

  const preference = await fetchPreference(config.baseUrl, config.serviceKey, config.anonKey, userId, accessToken);
  if (!preference) {
    return {
      ok: true as const,
      preferences: {
        routineEnabled: true,
        challengeEnabled: true,
        progressEnabled: true,
        tipsEnabled: true,
      },
    };
  }

  return {
    ok: true as const,
    preferences: {
      routineEnabled: Boolean(preference.routine_enabled),
      challengeEnabled: Boolean(preference.challenge_enabled),
      progressEnabled: Boolean(preference.progress_enabled),
      tipsEnabled: Boolean(preference.tips_enabled),
    },
  };
}

export async function updateNotificationPreferences(input: {
  userId: string;
  routineEnabled?: boolean;
  challengeEnabled?: boolean;
  progressEnabled?: boolean;
  tipsEnabled?: boolean;
  accessToken?: string;
}) {
  const config = getSupabaseConfig();
  if (!config) return { ok: false as const, error: "supabase_not_configured" };

  const current = await fetchPreference(config.baseUrl, config.serviceKey, config.anonKey, input.userId, input.accessToken);

  const payload = {
    user_id: input.userId,
    routine_enabled: input.routineEnabled ?? current?.routine_enabled ?? true,
    challenge_enabled: input.challengeEnabled ?? current?.challenge_enabled ?? true,
    progress_enabled: input.progressEnabled ?? current?.progress_enabled ?? true,
    tips_enabled: input.tipsEnabled ?? current?.tips_enabled ?? true,
    updated_at: new Date().toISOString(),
  };

  const response = await fetch(`${config.baseUrl}/rest/v1/notification_preferences`, {
    method: "POST",
    headers: {
      ...buildAuthHeaders({ serviceKey: config.serviceKey, anonKey: config.anonKey, accessToken: input.accessToken }),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    return { ok: false as const, error: detail || "update_failed" };
  }
  return {
    ok: true as const,
    preferences: {
      routineEnabled: payload.routine_enabled,
      challengeEnabled: payload.challenge_enabled,
      progressEnabled: payload.progress_enabled,
      tipsEnabled: payload.tips_enabled,
    },
  };
}
