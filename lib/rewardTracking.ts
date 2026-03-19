import { getActiveUserName, getScopedLocalItem, setScopedLocalItem } from "@/lib/userScopedStorage";

const STORAGE_KEY = "alpha-reward-events";

export type RewardEventName = "reward_unlocked" | "reward_used" | "product_clicked_from_reward";

type RewardEventRecord = {
  id: string;
  event: RewardEventName;
  createdAt: string;
  payload: Record<string, unknown>;
};

export function trackRewardEvent(event: RewardEventName, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const userName = getActiveUserName();
  const previousRaw = getScopedLocalItem(STORAGE_KEY, userName, false);
  const previous = previousRaw ? ((JSON.parse(previousRaw) as RewardEventRecord[]) || []) : [];
  const record: RewardEventRecord = {
    id: `${event}:${Date.now()}`,
    event,
    createdAt: new Date().toISOString(),
    payload,
  };

  setScopedLocalItem(STORAGE_KEY, JSON.stringify([record, ...previous].slice(0, 100)), userName);

  const windowWithAnalytics = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  };

  window.dispatchEvent(new CustomEvent("alpha-reward-event", { detail: record }));
  windowWithAnalytics.dataLayer?.push({ event, ...payload });
  if (typeof windowWithAnalytics.gtag === "function") {
    windowWithAnalytics.gtag("event", event, payload);
  }

  const body = JSON.stringify({
    event,
    payload,
    createdAt: record.createdAt,
    userName,
  });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/reward-events", blob);
    return;
  }

  void fetch("/api/analytics/reward-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}