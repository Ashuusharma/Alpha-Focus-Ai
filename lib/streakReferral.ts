// Streak and referral utilities (client-side friendly)
import { getActiveUserName, getScopedLocalItem, setScopedLocalItem } from "@/lib/userScopedStorage";

export interface StreakState {
  streak: number;
  longest: number;
  lastCompletion?: string;
  graceUsed?: boolean;
}

export interface ReferralState {
  code: string;
  issuedAt: string;
  claims: string[]; // userIds who claimed
}

const STREAK_KEY = "oneman_streak";
const REFERRAL_KEY = "oneman_referral";

export function updateStreak(completedToday: boolean): StreakState {
  const now = new Date();
  const today = now.toDateString();
  const prev = loadStreak();

  if (!completedToday) return prev;

  const lastDate = prev.lastCompletion ? new Date(prev.lastCompletion).toDateString() : null;
  const isConsecutive = lastDate && isNextDay(lastDate, today);

  const streak = isConsecutive ? prev.streak + 1 : 1;
  const longest = Math.max(prev.longest, streak);
  const state: StreakState = {
    streak,
    longest,
    lastCompletion: now.toISOString(),
    graceUsed: false,
  };

  saveStreak(state);
  return state;
}

export function useGraceDay(): StreakState {
  const prev = loadStreak();
  const state: StreakState = { ...prev, graceUsed: true };
  saveStreak(state);
  return state;
}

export function getReferral(): ReferralState {
  const existing = loadReferral();
  if (existing) return existing;
  const code = `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const state: ReferralState = { code, issuedAt: new Date().toISOString(), claims: [] };
  saveReferral(state);
  return state;
}

export function claimReferral(claimingUserId: string): ReferralState {
  const state = getReferral();
  if (!state.claims.includes(claimingUserId)) {
    state.claims.push(claimingUserId);
    saveReferral(state);
  }
  return state;
}

function isNextDay(prev: string, today: string) {
  const prevDate = new Date(prev);
  const next = new Date(prevDate.getTime() + 24 * 60 * 60 * 1000).toDateString();
  return next === today;
}

function loadStreak(): StreakState {
  if (typeof window === "undefined") return { streak: 0, longest: 0 };
  try {
    const raw = getScopedLocalItem(STREAK_KEY, getActiveUserName(), true);
    return raw ? (JSON.parse(raw) as StreakState) : { streak: 0, longest: 0 };
  } catch {
    return { streak: 0, longest: 0 };
  }
}

function saveStreak(state: StreakState) {
  if (typeof window === "undefined") return;
  setScopedLocalItem(STREAK_KEY, JSON.stringify(state), getActiveUserName(), false);
}

function loadReferral(): ReferralState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = getScopedLocalItem(REFERRAL_KEY, getActiveUserName(), true);
    return raw ? (JSON.parse(raw) as ReferralState) : null;
  } catch {
    return null;
  }
}

function saveReferral(state: ReferralState) {
  if (typeof window === "undefined") return;
  setScopedLocalItem(REFERRAL_KEY, JSON.stringify(state), getActiveUserName(), false);
}
