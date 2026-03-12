"use client";

import { useUserStore } from "@/stores/useUserStore";

const CACHE_PREFIX = "af_user_data_cache:";
const CACHE_TTL_MS = 20 * 1000;

export type HydratedPayload = {
  profile: Record<string, unknown> | null;
  alphaSummary: Record<string, unknown> | null;
  alphaTransactions: Array<Record<string, unknown>>;
  assessments: Array<Record<string, unknown>>;
  reports: Array<Record<string, unknown>>;
  routines: Array<Record<string, unknown>>;
  scans: Array<Record<string, unknown>>;
  clinicalScores: Record<string, unknown> | null;
  challenges: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
};

type CacheShape = {
  ts: number;
  data: HydratedPayload;
};

function keyForUser(userId: string) {
  return `${CACHE_PREFIX}${userId}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readUserDataCache(userId: string): CacheShape | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(keyForUser(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed?.ts || !parsed?.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeUserDataCache(userId: string, data: HydratedPayload) {
  if (!canUseStorage()) return;
  try {
    const payload: CacheShape = { ts: Date.now(), data };
    window.localStorage.setItem(keyForUser(userId), JSON.stringify(payload));
  } catch {
    // Storage failures should not interrupt UX.
  }
}

export function applyCachedUserData(userId: string): boolean {
  const cache = readUserDataCache(userId);
  if (!cache) return false;

  useUserStore.getState().setUserData({
    ...cache.data,
    loading: false,
  });

  return true;
}

export function isUserCacheFresh(userId: string, maxAgeMs = CACHE_TTL_MS): boolean {
  const cache = readUserDataCache(userId);
  if (!cache) return false;
  return Date.now() - cache.ts <= maxAgeMs;
}

export function clearUserDataCache(userId: string) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(keyForUser(userId));
  } catch {
    // ignore
  }
}
