import { getActiveUserName, getScopedLocalItem, setScopedLocalItem } from "@/lib/userScopedStorage";
import { RewardTier, RewardTierId, getEarningMultiplier, getTierForLifetime } from "@/lib/rewardTierService";

export type CreditActionCode =
  | "daily_login"
  | "log_am_routine"
  | "log_pm_routine"
  | "hydration_goal"
  | "sleep_goal"
  | "full_day_completed"
  | "improve_alpha_5"
  | "improve_alpha_10"
  | "severity_drop_one_level"
  | "recovery_plus_10"
  | "challenge_30_complete"
  | "challenge_60_complete"
  | "challenge_90_complete"
  | "challenge_weekly_milestone"
  | "streak_7"
  | "streak_14"
  | "streak_30"
  | "streak_60"
  | "streak_90"
  | "first_assessment_completed"
  | "first_scan_uploaded"
  | "weekly_reassessment"
  | "product_review_submitted"
  | "purchase_cashback";

export interface CreditActionRule {
  code: CreditActionCode;
  label: string;
  amount: number;
  frequency: "daily" | "weekly" | "once" | "event";
  category: "discipline" | "improvement" | "challenge" | "milestone" | "engagement" | "redemption";
  validator?: (metadata?: Record<string, unknown>) => { ok: boolean; reason?: string };
}

export interface UserCreditModel {
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
  lifetimeTier: RewardTierId;
  lastEarnedAt?: string;
  weeklyEarned: number;
  monthlyEarned: number;
}

export interface CreditTransaction {
  id: string;
  type: "earn" | "spend";
  source: string;
  label: string;
  amount: number;
  referenceId?: string;
  timestamp: string;
  balanceAfter: number;
  meta?: Record<string, unknown>;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  requiredCredits: number;
  createdAt: string;
  expiresAt: string;
  status: "issued" | "applied" | "redeemed" | "expired";
  redeemedAt?: string;
  appliedAt?: string;
  orderId?: string;
}

export interface CouponRedemption {
  couponCode: string;
  orderId?: string;
  redeemedAt: string;
  discountPercent: number;
  amountSaved?: number;
}

export interface CreditState {
  userId: string | null;
  model: UserCreditModel;
  transactions: CreditTransaction[];
  coupons: Coupon[];
  redemptions: CouponRedemption[];
  actionClaims: Record<string, string>;
  referenceClaims: Record<string, string>;
  dailyRoutineTotals: Record<string, number>;
  weeklyTotals: Record<string, number>;
  monthlyTotals: Record<string, number>;
}

export interface CreditSnapshot extends CreditState {
  tier: RewardTier;
  dayKey: string;
  weekKey: string;
  monthKey: string;
  dailyCapRemaining: number;
  weeklyCapRemaining: number;
}

const STORAGE_KEY = "alpha-credit-state";
const DAILY_ROUTINE_CAP = 20;
const WEEKLY_CAP = 9999;
const TRANSACTION_LIMIT = 120;

const ACTION_RULES: Record<CreditActionCode, CreditActionRule> = {
  daily_login: { code: "daily_login", label: "Daily login", amount: 2, frequency: "daily", category: "discipline" },
  log_am_routine: { code: "log_am_routine", label: "AM routine completed", amount: 3, frequency: "daily", category: "discipline" },
  log_pm_routine: { code: "log_pm_routine", label: "PM routine completed", amount: 3, frequency: "daily", category: "discipline" },
  hydration_goal: { code: "hydration_goal", label: "Hydration goal met", amount: 2, frequency: "daily", category: "discipline" },
  sleep_goal: { code: "sleep_goal", label: "Sleep goal met", amount: 2, frequency: "daily", category: "discipline" },
  full_day_completed: { code: "full_day_completed", label: "Full day completed", amount: 5, frequency: "daily", category: "discipline" },

  improve_alpha_5: {
    code: "improve_alpha_5",
    label: "Alpha Score improved by 5%",
    amount: 10,
    frequency: "event",
    category: "improvement",
    validator: (metadata) => {
      const percent = Number((metadata || {}).percent || 0);
      const reassessmentId = String((metadata || {}).reassessmentId || "");
      if (!reassessmentId) return { ok: false, reason: "Reassessment id required" };
      return percent >= 5 ? { ok: true } : { ok: false, reason: "Requires 5% Alpha Score improvement" };
    },
  },
  improve_alpha_10: {
    code: "improve_alpha_10",
    label: "Alpha Score improved by 10%",
    amount: 25,
    frequency: "event",
    category: "improvement",
    validator: (metadata) => {
      const percent = Number((metadata || {}).percent || 0);
      const reassessmentId = String((metadata || {}).reassessmentId || "");
      if (!reassessmentId) return { ok: false, reason: "Reassessment id required" };
      return percent >= 10 ? { ok: true } : { ok: false, reason: "Requires 10% Alpha Score improvement" };
    },
  },
  severity_drop_one_level: {
    code: "severity_drop_one_level",
    label: "Severity dropped by one level",
    amount: 20,
    frequency: "event",
    category: "improvement",
    validator: (metadata) => {
      const dropped = Boolean((metadata || {}).dropped);
      const reassessmentId = String((metadata || {}).reassessmentId || "");
      if (!reassessmentId) return { ok: false, reason: "Reassessment id required" };
      return dropped ? { ok: true } : { ok: false, reason: "Severity level must improve" };
    },
  },
  recovery_plus_10: {
    code: "recovery_plus_10",
    label: "Recovery probability +10%",
    amount: 15,
    frequency: "event",
    category: "improvement",
    validator: (metadata) => {
      const percent = Number((metadata || {}).percent || 0);
      const reassessmentId = String((metadata || {}).reassessmentId || "");
      if (!reassessmentId) return { ok: false, reason: "Reassessment id required" };
      return percent >= 10 ? { ok: true } : { ok: false, reason: "Requires +10% recovery improvement" };
    },
  },

  challenge_30_complete: { code: "challenge_30_complete", label: "30-Day Glow Up completed", amount: 120, frequency: "once", category: "challenge" },
  challenge_60_complete: { code: "challenge_60_complete", label: "60-Day Transformation completed", amount: 250, frequency: "once", category: "challenge" },
  challenge_90_complete: { code: "challenge_90_complete", label: "90-Day Mastery completed", amount: 400, frequency: "once", category: "challenge" },
  challenge_weekly_milestone: { code: "challenge_weekly_milestone", label: "Challenge weekly milestone", amount: 20, frequency: "weekly", category: "challenge" },

  streak_7: { code: "streak_7", label: "7-day streak milestone", amount: 25, frequency: "once", category: "milestone" },
  streak_14: { code: "streak_14", label: "14-day streak milestone", amount: 50, frequency: "once", category: "milestone" },
  streak_30: { code: "streak_30", label: "30-day streak milestone", amount: 120, frequency: "once", category: "milestone" },
  streak_60: { code: "streak_60", label: "60-day streak milestone", amount: 250, frequency: "once", category: "milestone" },
  streak_90: { code: "streak_90", label: "90-day streak milestone", amount: 400, frequency: "once", category: "milestone" },

  first_assessment_completed: { code: "first_assessment_completed", label: "First assessment completed", amount: 15, frequency: "once", category: "engagement" },
  first_scan_uploaded: { code: "first_scan_uploaded", label: "First scan uploaded", amount: 20, frequency: "once", category: "engagement" },
  weekly_reassessment: { code: "weekly_reassessment", label: "Weekly reassessment completed", amount: 10, frequency: "weekly", category: "engagement" },
  product_review_submitted: { code: "product_review_submitted", label: "Product review submitted", amount: 5, frequency: "event", category: "engagement" },
  purchase_cashback: {
    code: "purchase_cashback",
    label: "Purchase cashback",
    amount: 0,
    frequency: "event",
    category: "engagement",
    validator: (metadata) => {
      const amountSpent = Number((metadata || {}).purchaseAmount || 0);
      return amountSpent > 0 ? { ok: true } : { ok: false, reason: "Purchase amount required" };
    },
  },
};

function getEmptyState(): CreditState {
  return {
    userId: getActiveUserName(),
    model: {
      totalEarned: 0,
      totalSpent: 0,
      currentBalance: 0,
      lifetimeTier: "bronze",
      weeklyEarned: 0,
      monthlyEarned: 0,
    },
    transactions: [],
    coupons: [],
    redemptions: [],
    actionClaims: {},
    referenceClaims: {},
    dailyRoutineTotals: {},
    weeklyTotals: {},
    monthlyTotals: {},
  };
}

function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getWeekKey(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function getMonthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function readState(): CreditState {
  if (typeof window === "undefined") return getEmptyState();

  try {
    const raw = getScopedLocalItem(STORAGE_KEY, getActiveUserName(), true);
    if (!raw) return getEmptyState();
    const parsed = JSON.parse(raw) as Partial<CreditState>;
    const base = getEmptyState();

    return {
      ...base,
      ...parsed,
      model: { ...base.model, ...(parsed.model || {}) },
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
      redemptions: Array.isArray(parsed.redemptions) ? parsed.redemptions : [],
      actionClaims: parsed.actionClaims || {},
      referenceClaims: parsed.referenceClaims || {},
      dailyRoutineTotals: parsed.dailyRoutineTotals || {},
      weeklyTotals: parsed.weeklyTotals || {},
      monthlyTotals: parsed.monthlyTotals || {},
    };
  } catch {
    return getEmptyState();
  }
}

function persist(state: CreditState) {
  if (typeof window === "undefined") return;
  setScopedLocalItem(STORAGE_KEY, JSON.stringify(state), getActiveUserName(), true);
}

function buildSnapshot(state: CreditState): CreditSnapshot {
  const now = new Date();
  const dayKey = getDayKey(now);
  const weekKey = getWeekKey(now);
  const monthKey = getMonthKey(now);

  const tier = getTierForLifetime(state.model.totalEarned);

  const dailyEarned = state.dailyRoutineTotals[dayKey] || 0;
  const weeklyEarned = state.weeklyTotals[weekKey] || 0;
  const monthlyEarned = state.monthlyTotals[monthKey] || 0;

  return {
    ...state,
    tier,
    dayKey,
    weekKey,
    monthKey,
    dailyCapRemaining: Math.max(0, DAILY_ROUTINE_CAP - dailyEarned),
    weeklyCapRemaining: Math.max(0, WEEKLY_CAP - weeklyEarned),
    model: {
      ...state.model,
      lifetimeTier: tier.id,
      weeklyEarned,
      monthlyEarned,
    },
  };
}

export function getCreditSnapshot(): CreditSnapshot {
  return buildSnapshot(readState());
}

export function earnCredits(action: CreditActionCode, options?: {
  referenceId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: number;
}) {
  const state = readState();
  const rule = ACTION_RULES[action];
  if (!rule) return { ok: false, reason: "Unknown action", state: buildSnapshot(state) } as const;

  const now = new Date(options?.timestamp || Date.now());
  const dayKey = getDayKey(now);
  const weekKey = getWeekKey(now);
  const monthKey = getMonthKey(now);

  const eventRef = options?.referenceId || String(options?.metadata?.referenceId || "");
  const periodKey = rule.frequency === "daily"
    ? dayKey
    : rule.frequency === "weekly"
      ? weekKey
      : rule.frequency === "event"
        ? eventRef || "event"
        : "once";
  const claimKey = `${action}:${periodKey}`;

  if (state.actionClaims[claimKey]) {
    return { ok: false, reason: "Already rewarded for this period", state: buildSnapshot(state) } as const;
  }

  if (options?.referenceId && state.referenceClaims[options.referenceId]) {
    return { ok: false, reason: "Reference already rewarded", state: buildSnapshot(state) } as const;
  }

  if (rule.validator) {
    const validation = rule.validator(options?.metadata);
    if (!validation.ok) {
      return { ok: false, reason: validation.reason || "Validation failed", state: buildSnapshot(state) } as const;
    }
  }

  const multiplier = getEarningMultiplier(state.model.totalEarned);
  const proposedAmount = action === "purchase_cashback"
    ? Math.max(0, Math.round(Number(options?.metadata?.purchaseAmount || 0) * 0.05))
    : Math.round(rule.amount * multiplier);

  let award = proposedAmount;
  const appliesWeeklyCap = false;

  if (rule.category === "discipline") {
    const todayTotal = state.dailyRoutineTotals[dayKey] || 0;
    const remainingDaily = Math.max(0, DAILY_ROUTINE_CAP - todayTotal);
    award = Math.min(award, remainingDaily);
  }

  if (appliesWeeklyCap) {
    const weeklyTotal = state.weeklyTotals[weekKey] || 0;
    const remainingWeekly = Math.max(0, WEEKLY_CAP - weeklyTotal);
    award = Math.min(award, remainingWeekly);
  }

  if (award <= 0) {
    return { ok: false, reason: "Cap reached", capHit: true, state: buildSnapshot(state) } as const;
  }

  const balanceAfter = state.model.currentBalance + award;
  const tx: CreditTransaction = {
    id: `tx_${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`,
    type: "earn",
    source: action,
    label: rule.label,
    amount: award,
    referenceId: options?.referenceId,
    timestamp: now.toISOString(),
    balanceAfter,
    meta: options?.metadata,
  };

  state.transactions = [tx, ...state.transactions].slice(0, TRANSACTION_LIMIT);
  state.model.totalEarned += award;
  state.model.currentBalance = balanceAfter;
  state.model.lastEarnedAt = now.toISOString();

  if (rule.category === "discipline") {
    state.dailyRoutineTotals[dayKey] = (state.dailyRoutineTotals[dayKey] || 0) + award;
  }
  if (appliesWeeklyCap) {
    state.weeklyTotals[weekKey] = (state.weeklyTotals[weekKey] || 0) + award;
    state.model.weeklyEarned = state.weeklyTotals[weekKey];
  }
  state.monthlyTotals[monthKey] = (state.monthlyTotals[monthKey] || 0) + award;
  state.model.monthlyEarned = state.monthlyTotals[monthKey];
  state.model.lifetimeTier = getTierForLifetime(state.model.totalEarned).id;

  state.actionClaims[claimKey] = now.toISOString();
  if (options?.referenceId) state.referenceClaims[options.referenceId] = action;
  if (!options?.referenceId && eventRef) state.referenceClaims[eventRef] = action;

  persist(state);

  return { ok: true, awarded: award, state: buildSnapshot(state), capHit: award < proposedAmount } as const;
}

export function spendCredits(amount: number, options?: { reason?: string; referenceId?: string }) {
  const state = readState();
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: "Invalid amount", state: buildSnapshot(state) } as const;
  }

  if (state.model.currentBalance < amount) {
    return { ok: false, reason: "Insufficient balance", state: buildSnapshot(state) } as const;
  }

  const now = new Date();
  const spendAmount = Math.round(Math.abs(amount));
  const balanceAfter = state.model.currentBalance - spendAmount;

  const tx: CreditTransaction = {
    id: `tx_${now.getTime()}_${Math.random().toString(36).slice(2, 6)}`,
    type: "spend",
    source: options?.reason || "credit_spend",
    label: options?.reason || "A$ redeemed",
    amount: -spendAmount,
    referenceId: options?.referenceId,
    timestamp: now.toISOString(),
    balanceAfter,
  };

  state.transactions = [tx, ...state.transactions].slice(0, TRANSACTION_LIMIT);
  state.model.currentBalance = balanceAfter;
  state.model.totalSpent += spendAmount;
  state.model.lastEarnedAt = now.toISOString();

  persist(state);

  return { ok: true, state: buildSnapshot(state) } as const;
}

export function mutateCreditState(mutator: (draft: CreditState) => void) {
  const state = readState();
  mutator(state);
  persist(state);
  return buildSnapshot(state);
}

export function getActionRules() {
  return ACTION_RULES;
}

export function clearCreditState() {
  persist(getEmptyState());
}
