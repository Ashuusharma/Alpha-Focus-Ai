export const ALPHA_CORE_DAILY_ACTIONS = [
  "daily_login",
  "log_am_routine",
  "log_pm_routine",
  "hydration_goal",
] as const;

export const ALPHA_REWARD_SYSTEM = {
  daily: {
    daily_login: 1,
    log_am_routine: 2,
    log_pm_routine: 2,
    hydration_goal: 1,
  },
  streakBonus: {
    7: 10,
    30: 50,
  },
  penalties: {
    missed_day: 3,
    graceDays: 0,
    maxPenaltyDaysPerClaim: 3,
  },
  taskBonus: {
    threshold: 3,
    amount: 5,
    actionCode: "daily_three_completed_bonus",
  },
} as const;

export type AlphaCoreDailyAction = (typeof ALPHA_CORE_DAILY_ACTIONS)[number];
export type AlphaRewardTaskBonusAction = typeof ALPHA_REWARD_SYSTEM.taskBonus.actionCode;