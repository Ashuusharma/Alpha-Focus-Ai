function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export type RewardTierId = "bronze" | "silver" | "gold" | "platinum" | "elite";

export interface RewardTier {
  id: RewardTierId;
  label: string;
  minLifetime: number;
  maxLifetime?: number;
  multiplier: number;
  couponUnlockPercent: number;
  perks: string[];
}

const TIERS: RewardTier[] = [
  {
    id: "bronze",
    label: "Bronze",
    minLifetime: 0,
    maxLifetime: 199,
    multiplier: 1,
    couponUnlockPercent: 5,
    perks: ["5% coupon unlock"],
  },
  {
    id: "silver",
    label: "Silver",
    minLifetime: 200,
    maxLifetime: 599,
    multiplier: 1,
    couponUnlockPercent: 10,
    perks: ["10% coupon unlock"],
  },
  {
    id: "gold",
    label: "Gold",
    minLifetime: 600,
    maxLifetime: 1499,
    multiplier: 1,
    couponUnlockPercent: 20,
    perks: ["20% coupon unlock"],
  },
  {
    id: "platinum",
    label: "Platinum",
    minLifetime: 1500,
    maxLifetime: 2999,
    multiplier: 1,
    couponUnlockPercent: 40,
    perks: ["40% coupon unlock"],
  },
  {
    id: "elite",
    label: "Elite",
    minLifetime: 3000,
    multiplier: 1,
    couponUnlockPercent: 60,
    perks: ["60% coupon unlock"],
  },
];

export function getTierForLifetime(lifetimeEarned: number): RewardTier {
  const tier = TIERS.find((t) => {
    const withinMin = lifetimeEarned >= t.minLifetime;
    const withinMax = t.maxLifetime === undefined || lifetimeEarned <= t.maxLifetime;
    return withinMin && withinMax;
  });

  return tier || TIERS[0];
}

export function getTierProgress(lifetimeEarned: number) {
  const tier = getTierForLifetime(lifetimeEarned);
  const nextTier = TIERS.find((t) => t.minLifetime > tier.minLifetime);

  if (!nextTier) {
    return {
      tier,
      nextTier: null,
      remainingToNext: 0,
      percentToNext: 100,
    };
  }

  const span = nextTier.minLifetime - tier.minLifetime;
  const progressed = lifetimeEarned - tier.minLifetime;
  const percentToNext = clamp(Math.round((progressed / span) * 100), 0, 100);

  return {
    tier,
    nextTier,
    remainingToNext: Math.max(0, nextTier.minLifetime - lifetimeEarned),
    percentToNext,
  };
}

export function getEarningMultiplier(lifetimeEarned: number): number {
  return getTierForLifetime(lifetimeEarned).multiplier;
}

export function calculateDisciplineScore(input: {
  completedDailyTasks?: number;
  totalDailyTasks?: number;
}) {
  const completed = Math.max(0, Math.round(input.completedDailyTasks || 0));
  const total = Math.max(1, Math.round(input.totalDailyTasks || 1));
  const score = clamp(Math.round((completed / total) * 100), 0, 100);

  let label = "Low";
  if (score >= 85) label = "Excellent";
  else if (score >= 65) label = "Strong";
  else if (score >= 40) label = "Developing";

  return { score, label };
}

export function getRewardTiers() {
  return TIERS;
}
