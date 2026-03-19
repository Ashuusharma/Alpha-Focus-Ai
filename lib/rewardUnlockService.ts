import { getActiveUserName, getScopedLocalItem, setScopedLocalItem } from "@/lib/userScopedStorage";
import { trackRewardEvent } from "@/lib/rewardTracking";

const STORAGE_KEY = "alpha-active-reward";
const REWARD_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ActiveRewardUnlock = {
  id: string;
  discountPercent: number;
  productId: string | null;
  rewardId: string | null;
  source: "reward_unlock" | "reward_redeem";
  status: "active" | "used" | "expired";
  unlockedAt: string;
  expiresAt: string;
  usedAt?: string;
  orderId?: string;
};

function readStoredReward(userName?: string | null): ActiveRewardUnlock | null {
  if (typeof window === "undefined") return null;
  const raw = getScopedLocalItem(STORAGE_KEY, userName, false);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ActiveRewardUnlock;
  } catch {
    return null;
  }
}

function writeStoredReward(reward: ActiveRewardUnlock | null, userName?: string | null) {
  if (typeof window === "undefined" || !reward) return;
  setScopedLocalItem(STORAGE_KEY, JSON.stringify(reward), userName);
}

function dispatchRewardUnlockEvent(type: "created" | "used" | "expired", reward: ActiveRewardUnlock) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("alpha-reward-unlock", {
      detail: {
        type,
        reward,
      },
    })
  );
}

function expireIfNeeded(reward: ActiveRewardUnlock | null, userName?: string | null) {
  if (!reward) return null;
  if (reward.status !== "active") return reward;

  const isExpired = new Date(reward.expiresAt).getTime() <= Date.now();
  if (!isExpired) return reward;

  const expiredReward: ActiveRewardUnlock = {
    ...reward,
    status: "expired",
  };
  writeStoredReward(expiredReward, userName);
  dispatchRewardUnlockEvent("expired", expiredReward);
  return expiredReward;
}

export function createRewardUnlock(input: {
  discountPercent: number;
  productId?: string | null;
  rewardId?: string | null;
  source?: ActiveRewardUnlock["source"];
}) {
  const userName = getActiveUserName();
  const unlockedAt = new Date().toISOString();
  const reward: ActiveRewardUnlock = {
    id: `reward:${input.discountPercent}:${Date.now()}`,
    discountPercent: input.discountPercent,
    productId: input.productId || null,
    rewardId: input.rewardId || null,
    source: input.source || "reward_unlock",
    status: "active",
    unlockedAt,
    expiresAt: new Date(Date.now() + REWARD_WINDOW_MS).toISOString(),
  };

  writeStoredReward(reward, userName);
  dispatchRewardUnlockEvent("created", reward);
  trackRewardEvent("reward_unlocked", {
    rewardId: reward.rewardId,
    discountPercent: reward.discountPercent,
    productId: reward.productId,
    source: reward.source,
    expiresAt: reward.expiresAt,
  });
  return reward;
}

export function getActiveRewardUnlock() {
  const userName = getActiveUserName();
  const reward = expireIfNeeded(readStoredReward(userName), userName);
  if (!reward || reward.status !== "active") return null;
  return reward;
}

export function hasActiveRewardUnlock() {
  return Boolean(getActiveRewardUnlock());
}

export function consumeActiveRewardUnlock(input?: { orderId?: string; productId?: string | null; discountApplied?: number }) {
  const userName = getActiveUserName();
  const reward = getActiveRewardUnlock();
  if (!reward) return null;

  const usedReward: ActiveRewardUnlock = {
    ...reward,
    status: "used",
    usedAt: new Date().toISOString(),
    orderId: input?.orderId,
  };
  writeStoredReward(usedReward, userName);
  dispatchRewardUnlockEvent("used", usedReward);
  trackRewardEvent("reward_used", {
    rewardId: usedReward.rewardId,
    discountPercent: usedReward.discountPercent,
    productId: input?.productId || usedReward.productId,
    orderId: usedReward.orderId,
    discountApplied: input?.discountApplied || 0,
  });
  return usedReward;
}

export function getRewardCountdownLabel(expiresAt: string) {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return "Expired";

  const totalMinutes = Math.floor(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}m left`;
  }

  return `${hours}h ${minutes}m left`;
}