import { CreditActionCode } from "@/lib/creditService";
import { getTierForLifetime } from "@/lib/rewardTierService";

export const ALPHA_WALLET_TIMEZONE = "Asia/Kolkata";
export const ALPHA_DAILY_CAP = 20;

export type AlphaWalletMissionType = "routine" | "habit" | "milestone";

export type AlphaWalletMissionDefinition = {
  id: CreditActionCode;
  title: string;
  description: string;
  reward: number;
  type: AlphaWalletMissionType;
  timeWindow: { start: string; end: string };
};

export type AlphaWalletMission = AlphaWalletMissionDefinition & {
  status: "locked" | "available" | "completed";
  isExpired: boolean;
};

export type AlphaWalletSummary = {
  current_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  tier_level: string;
  currentBalance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  tierLevel: string;
};

export type AlphaWalletTransaction = {
  id: string;
  amount: number;
  category: string;
  description: string;
  created_at: string;
  action_code: string | null;
  activity_date: string | null;
  metadata: Record<string, unknown>;
};

export type AlphaWalletStreak = {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
};

export type AlphaWalletTimelineItem = AlphaWalletTransaction & {
  direction: "earn" | "spend";
  absoluteAmount: number;
  balance_after: number;
};

export const ALPHA_WALLET_MISSIONS: AlphaWalletMissionDefinition[] = [
  {
    id: "daily_login",
    title: "Open command center",
    description: "Sign in and activate the day before the first mission window closes.",
    reward: 1,
    type: "habit",
    timeWindow: { start: "05:30", end: "11:30" },
  },
  {
    id: "log_am_routine",
    title: "Finish AM protocol",
    description: "Complete the morning routine window with a verified routine log.",
    reward: 2,
    type: "routine",
    timeWindow: { start: "06:00", end: "11:30" },
  },
  {
    id: "hydration_goal",
    title: "Close hydration target",
    description: "Hit the hydration threshold before the evening slowdown window.",
    reward: 3,
    type: "habit",
    timeWindow: { start: "11:00", end: "18:30" },
  },
  {
    id: "log_pm_routine",
    title: "Finish PM protocol",
    description: "Complete the evening recovery routine within the active night window.",
    reward: 2,
    type: "routine",
    timeWindow: { start: "18:30", end: "22:45" },
  },
  {
    id: "sleep_goal",
    title: "Lock sleep score",
    description: "Confirm recovery sleep compliance before the day closes in IST.",
    reward: 2,
    type: "habit",
    timeWindow: { start: "21:00", end: "23:59" },
  },
  {
    id: "full_day_completed",
    title: "Seal full-day discipline",
    description: "Unlock the milestone only after the day is fully verified.",
    reward: 5,
    type: "milestone",
    timeWindow: { start: "21:15", end: "23:59" },
  },
];

export function getIndiaDateParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: ALPHA_WALLET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const dateKey = `${values.year}-${values.month}-${values.day}`;
  const hour = Number(values.hour || 0);
  const minute = Number(values.minute || 0);

  return {
    dateKey,
    hour,
    minute,
    totalMinutes: hour * 60 + minute,
    label: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

export function toAlphaWalletSummary(input?: Record<string, unknown> | null): AlphaWalletSummary {
  const currentBalance = Number(input?.current_balance ?? input?.currentBalance ?? 0);
  const lifetimeEarned = Number(input?.lifetime_earned ?? input?.lifetimeEarned ?? 0);
  const lifetimeSpent = Number(input?.lifetime_spent ?? input?.lifetimeSpent ?? 0);
  const tierLevel = String(input?.tier_level ?? input?.tierLevel ?? getTierForLifetime(lifetimeEarned).label);

  return {
    current_balance: currentBalance,
    lifetime_earned: lifetimeEarned,
    lifetime_spent: lifetimeSpent,
    tier_level: tierLevel,
    currentBalance,
    lifetimeEarned,
    lifetimeSpent,
    tierLevel,
  };
}

export function toAlphaWalletTransaction(input: Record<string, unknown>): AlphaWalletTransaction {
  return {
    id: String(input.id || `${Date.now()}`),
    amount: Number(input.amount || 0),
    category: String(input.category || "discipline"),
    description: String(input.description || input.category || "Transaction"),
    created_at: String(input.created_at || new Date().toISOString()),
    action_code: input.action_code ? String(input.action_code) : null,
    activity_date: input.activity_date ? String(input.activity_date) : null,
    metadata: (input.metadata as Record<string, unknown> | undefined) || {},
  };
}

export function toAlphaWalletStreak(input?: Record<string, unknown> | null): AlphaWalletStreak {
  return {
    current_streak: Number(input?.current_streak || 0),
    longest_streak: Number(input?.longest_streak || 0),
    last_activity_date: input?.last_activity_date ? String(input.last_activity_date) : null,
  };
}

export function mergeAlphaWalletTransactions(
  current: Array<Record<string, unknown>>,
  incoming: Record<string, unknown>
) {
  const normalized = toAlphaWalletTransaction(incoming);
  const deduped = current.filter((item) => String(item.id || "") !== normalized.id);
  const merged = [normalized as unknown as Record<string, unknown>, ...deduped].sort((left, right) => {
    return new Date(String(right.created_at || 0)).getTime() - new Date(String(left.created_at || 0)).getTime();
  });

  return merged.slice(0, 60);
}

export function applyAlphaTransactionToSummary(
  summary: Record<string, unknown> | null,
  transaction: Record<string, unknown>
) {
  const base = toAlphaWalletSummary(summary);
  const amount = Number(transaction.amount || 0);
  const nextCurrent = base.current_balance + amount;
  const nextEarned = base.lifetime_earned + (amount > 0 ? amount : 0);
  const nextSpent = base.lifetime_spent + (amount < 0 ? Math.abs(amount) : 0);

  return toAlphaWalletSummary({
    current_balance: nextCurrent,
    lifetime_earned: nextEarned,
    lifetime_spent: nextSpent,
  }) as unknown as Record<string, unknown>;
}

export function buildTimelineItems(
  summary: Record<string, unknown> | null,
  transactions: Array<Record<string, unknown>>
): AlphaWalletTimelineItem[] {
  const normalizedSummary = toAlphaWalletSummary(summary);
  const sorted = [...transactions]
    .map((item) => toAlphaWalletTransaction(item))
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());

  let runningBalance = normalizedSummary.current_balance;

  return sorted.map((item) => {
    const direction = item.amount >= 0 ? "earn" : "spend";
    const balanceAfter = runningBalance;
    runningBalance -= item.amount;

    return {
      ...item,
      direction,
      absoluteAmount: Math.abs(item.amount),
      balance_after: balanceAfter,
    };
  });
}

export function getCompletedMissionIds(
  transactions: Array<Record<string, unknown>>,
  activityDate: string
) {
  return new Set(
    transactions
      .map((item) => toAlphaWalletTransaction(item))
      .filter((item) => item.activity_date === activityDate && item.amount > 0 && item.action_code)
      .map((item) => item.action_code as CreditActionCode)
  );
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part || 0));
  return hours * 60 + minutes;
}

export function buildTodayMissions(
  transactions: Array<Record<string, unknown>>,
  now = new Date()
): AlphaWalletMission[] {
  const { dateKey, totalMinutes } = getIndiaDateParts(now);
  const completed = getCompletedMissionIds(transactions, dateKey);

  return ALPHA_WALLET_MISSIONS.map((mission) => {
    const startMinutes = toMinutes(mission.timeWindow.start);
    const endMinutes = toMinutes(mission.timeWindow.end);
    const isCompleted = completed.has(mission.id);
    const isExpired = !isCompleted && totalMinutes > endMinutes;

    let status: AlphaWalletMission["status"] = "locked";
    if (isCompleted) status = "completed";
    else if (totalMinutes >= startMinutes && totalMinutes <= endMinutes) status = "available";

    return {
      ...mission,
      status,
      isExpired,
    };
  });
}

export function getDailyDisciplineEarned(
  transactions: Array<Record<string, unknown>>,
  activityDate: string
) {
  return transactions
    .map((item) => toAlphaWalletTransaction(item))
    .filter((item) => item.category === "discipline" && item.activity_date === activityDate && item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);
}

export function getMissionCompletionRate(missions: AlphaWalletMission[]) {
  if (missions.length === 0) return 0;
  const completed = missions.filter((mission) => mission.status === "completed").length;
  return Math.round((completed / missions.length) * 100);
}

export function formatTimelineTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: ALPHA_WALLET_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function buildWalletReferenceId(action: CreditActionCode, activityDate: string) {
  return `${action}:${activityDate}`;
}
