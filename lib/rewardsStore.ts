import { create } from "zustand";
import { calculateLevel, getLevelTitle } from "@/lib/gamification";

export interface DiscountTier {
  id: "bronze" | "silver" | "gold";
  label: string;
  creditsCost: number;
  discountPercent: number;
}

export interface ActiveDiscount {
  tierId: DiscountTier["id"];
  label: string;
  discountPercent: number;
  code: string;
  redeemedAt: string;
  expiresAt: string;
}

interface LedgerEntry {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface WeeklyMission {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  rewardCredits: number;
  claimed: boolean;
}

interface MissionSnapshot {
  assessmentAnswered: number;
  scansCount: number;
  streakCount: number;
  consistencyScore?: number;
}

interface RewardsState {
  credits: number;
  lifetimeCredits: number;
  level: number;
  xp: number;
  achievements: string[];
  streakCount: number;
  levelTitle: string;
  missionsWeekKey: string;
  weeklyMissions: WeeklyMission[];
  activeDiscount: ActiveDiscount | null;
  ledger: LedgerEntry[];
  tiers: DiscountTier[];

  addCredits: (amount: number, reason: string) => void;
  setStreakCount: (streakCount: number) => void;
  unlockAchievement: (achievement: string) => void;
  initializeWeeklyMissions: () => void;
  syncWeeklyMissions: (snapshot: MissionSnapshot) => void;
  claimWeeklyMission: (missionId: string) => { ok: boolean; message: string };
  redeemTier: (tierId: DiscountTier["id"]) => { ok: boolean; message: string };
  clearExpiredDiscount: () => void;
  getDiscountAmount: (subtotal: number) => number;
  getPayableTotal: (subtotal: number) => number;
}

const DISCOUNT_TIERS: DiscountTier[] = [
  { id: "bronze", label: "Bronze", creditsCost: 250, discountPercent: 5 },
  { id: "silver", label: "Silver", creditsCost: 500, discountPercent: 10 },
  { id: "gold", label: "Gold", creditsCost: 900, discountPercent: 15 },
];

function getCurrentWeekKey() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayMs = 24 * 60 * 60 * 1000;
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / dayMs) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function createWeeklyMissions(): WeeklyMission[] {
  return [
    {
      id: "wk_assessment_15",
      title: "Assessment Discipline",
      description: "Answer at least 15 assessment questions this week.",
      target: 15,
      progress: 0,
      rewardCredits: 60,
      claimed: false,
    },
    {
      id: "wk_scans_2",
      title: "Scan Consistency",
      description: "Complete 2 photo scans this week.",
      target: 2,
      progress: 0,
      rewardCredits: 80,
      claimed: false,
    },
    {
      id: "wk_streak_5",
      title: "5-Day Streak",
      description: "Maintain a streak of at least 5 days.",
      target: 5,
      progress: 0,
      rewardCredits: 70,
      claimed: false,
    },
    {
      id: "wk_consistency_75",
      title: "Consistency Score 75+",
      description: "Reach a consistency score of 75 or higher.",
      target: 75,
      progress: 0,
      rewardCredits: 90,
      claimed: false,
    },
  ];
}

export const useRewardsStore = create<RewardsState>()((set, get) => ({
  credits: 0,
  lifetimeCredits: 0,
  level: 1,
  xp: 0,
  achievements: [],
  streakCount: 0,
  levelTitle: getLevelTitle(1),
  missionsWeekKey: getCurrentWeekKey(),
  weeklyMissions: createWeeklyMissions(),
  activeDiscount: null,
  ledger: [],
  tiers: DISCOUNT_TIERS,

  addCredits: (amount, reason) => {
    if (!Number.isFinite(amount) || amount === 0) return;

    set((state) => {
      const roundedAmount = Math.round(amount);
      const nextCredits = Math.max(0, state.credits + roundedAmount);
      const nextLifetime = amount > 0 ? state.lifetimeCredits + roundedAmount : state.lifetimeCredits;
      const nextXp = amount > 0 ? state.xp + roundedAmount : state.xp;
      const nextLevel = calculateLevel(nextXp);
      const nextLevelTitle = getLevelTitle(nextLevel);
      const unlocked: string[] = [];

      if (nextLevel > state.level) {
        for (let level = state.level + 1; level <= nextLevel; level++) {
          unlocked.push(`Level ${level} • ${getLevelTitle(level)}`);
        }
      }

      const entry: LedgerEntry = {
        id: `rw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        amount: roundedAmount,
        reason,
        createdAt: new Date().toISOString(),
      };

      return {
        credits: nextCredits,
        lifetimeCredits: nextLifetime,
        xp: nextXp,
        level: nextLevel,
        levelTitle: nextLevelTitle,
        achievements: Array.from(new Set([...state.achievements, ...unlocked])).slice(-20),
        ledger: [entry, ...state.ledger].slice(0, 60),
      };
    });
  },

  setStreakCount: (streakCount) => {
    set(() => ({ streakCount: Math.max(0, Math.round(streakCount)) }));
  },

  unlockAchievement: (achievement) => {
    if (!achievement?.trim()) return;
    set((state) => ({
      achievements: Array.from(new Set([...state.achievements, achievement.trim()])).slice(-20),
    }));
  },

  initializeWeeklyMissions: () => {
    const state = get();
    const weekKey = getCurrentWeekKey();
    if (state.missionsWeekKey === weekKey && state.weeklyMissions.length > 0) return;

    set({
      missionsWeekKey: weekKey,
      weeklyMissions: createWeeklyMissions(),
    });
  },

  syncWeeklyMissions: (snapshot) => {
    const state = get();
    const weekKey = getCurrentWeekKey();
    const missions = state.missionsWeekKey === weekKey && state.weeklyMissions.length > 0
      ? state.weeklyMissions
      : createWeeklyMissions();

    const synced = missions.map((mission) => {
      let progress = mission.progress;

      if (mission.id === "wk_assessment_15") progress = Math.min(mission.target, snapshot.assessmentAnswered || 0);
      if (mission.id === "wk_scans_2") progress = Math.min(mission.target, snapshot.scansCount || 0);
      if (mission.id === "wk_streak_5") progress = Math.min(mission.target, snapshot.streakCount || 0);
      if (mission.id === "wk_consistency_75") progress = Math.min(mission.target, snapshot.consistencyScore || 0);

      return { ...mission, progress };
    });

    set({
      missionsWeekKey: weekKey,
      weeklyMissions: synced,
    });
  },

  claimWeeklyMission: (missionId) => {
    const state = get();
    const mission = state.weeklyMissions.find((item) => item.id === missionId);
    if (!mission) return { ok: false, message: "Mission not found" };
    if (mission.claimed) return { ok: false, message: "Mission already claimed" };
    if (mission.progress < mission.target) return { ok: false, message: "Mission not completed yet" };

    set((prev) => ({
      weeklyMissions: prev.weeklyMissions.map((item) =>
        item.id === missionId ? { ...item, claimed: true } : item
      ),
    }));

    get().addCredits(mission.rewardCredits, `weekly_mission_${missionId}`);

    const allClaimed = get().weeklyMissions.every((item) => item.claimed);
    if (allClaimed) {
      get().unlockAchievement("Weekly Commander");
    }

    return { ok: true, message: `Mission claimed · +${mission.rewardCredits} credits` };
  },

  redeemTier: (tierId) => {
    const state = get();
    const tier = state.tiers.find((item) => item.id === tierId);
    if (!tier) return { ok: false, message: "Invalid tier" };

    if (state.credits < tier.creditsCost) {
      return { ok: false, message: `Need ${tier.creditsCost - state.credits} more credits` };
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const code = `ALPHAFOCUS-${tier.discountPercent}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    set((prev) => ({
      credits: prev.credits - tier.creditsCost,
      activeDiscount: {
        tierId: tier.id,
        label: tier.label,
        discountPercent: tier.discountPercent,
        code,
        redeemedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      ledger: [
        {
          id: `rw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          amount: -tier.creditsCost,
          reason: `redeem_${tier.id}`,
          createdAt: now.toISOString(),
        },
        ...prev.ledger,
      ].slice(0, 60),
    }));

    return { ok: true, message: `${tier.discountPercent}% discount redeemed` };
  },

  clearExpiredDiscount: () => {
    const active = get().activeDiscount;
    if (!active) return;
    if (new Date(active.expiresAt).getTime() > Date.now()) return;
    set({ activeDiscount: null });
  },

  getDiscountAmount: (subtotal) => {
    const active = get().activeDiscount;
    if (!active || subtotal <= 0) return 0;
    return Math.round((subtotal * active.discountPercent) / 100);
  },

  getPayableTotal: (subtotal) => {
    const discount = get().getDiscountAmount(subtotal);
    return Math.max(0, subtotal - discount);
  },
}));
