"use client";

import { create } from "zustand";

import { getActiveRewardUnlock, type ActiveRewardUnlock } from "@/lib/rewardUnlockService";
import { useUserStore } from "@/stores/useUserStore";

const EXPIRING_SOON_MS = 2 * 60 * 60 * 1000;
const TICK_INTERVAL_MS = 60 * 1000;

type RewardSnapshot = {
  activeReward: ActiveRewardUnlock | null;
  timeRemaining: number;
  isExpiringSoon: boolean;
};

type RewardStore = RewardSnapshot & {
  initialize: () => () => void;
  syncReward: () => void;
};

let consumerCount = 0;
let tickHandle: number | null = null;
let listenersAttached = false;

function getRewardSnapshot(): RewardSnapshot {
  const activeReward = getActiveRewardUnlock();
  const timeRemaining = activeReward
    ? Math.max(0, new Date(activeReward.expiresAt).getTime() - Date.now())
    : 0;

  return {
    activeReward,
    timeRemaining,
    isExpiringSoon: Boolean(activeReward && timeRemaining > 0 && timeRemaining < EXPIRING_SOON_MS),
  };
}

function syncRewardStore() {
  useRewardStore.setState(getRewardSnapshot());
}

function attachRewardEngine() {
  if (typeof window === "undefined") return;
  if (!listenersAttached) {
    window.addEventListener("focus", syncRewardStore);
    window.addEventListener("alpha-reward-unlock", syncRewardStore as EventListener);
    listenersAttached = true;
  }

  if (tickHandle === null) {
    tickHandle = window.setInterval(syncRewardStore, TICK_INTERVAL_MS);
  }
}

function detachRewardEngine() {
  if (typeof window === "undefined") return;
  if (tickHandle !== null) {
    window.clearInterval(tickHandle);
    tickHandle = null;
  }
  if (listenersAttached) {
    window.removeEventListener("focus", syncRewardStore);
    window.removeEventListener("alpha-reward-unlock", syncRewardStore as EventListener);
    listenersAttached = false;
  }
}

export const useRewardStore = create<RewardStore>((set) => ({
  ...getRewardSnapshot(),
  initialize: () => {
    consumerCount += 1;
    syncRewardStore();
    attachRewardEngine();

    return () => {
      consumerCount = Math.max(0, consumerCount - 1);
      if (consumerCount === 0) {
        detachRewardEngine();
      }
    };
  },
  syncReward: () => set(getRewardSnapshot()),
}));

useUserStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) {
    syncRewardStore();
  }
});