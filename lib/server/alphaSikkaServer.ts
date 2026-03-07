export type AlphaSikkaAction =
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
  | "referral_completed"
  | "product_review_submitted"
  | "purchase_cashback";

export type AlphaSikkaCategory =
  | "discipline"
  | "improvement"
  | "challenge"
  | "milestone"
  | "engagement"
  | "redemption";

type Rule = {
  category: AlphaSikkaCategory;
  amount: number;
  frequency: "daily" | "weekly" | "once" | "event";
  description: string;
};

export const ALPHA_SIKKA_RULES: Record<AlphaSikkaAction, Rule> = {
  daily_login: { category: "discipline", amount: 1, frequency: "daily", description: "Daily login" },
  log_am_routine: { category: "discipline", amount: 2, frequency: "daily", description: "AM routine completed" },
  log_pm_routine: { category: "discipline", amount: 2, frequency: "daily", description: "PM routine completed" },
  hydration_goal: { category: "discipline", amount: 3, frequency: "daily", description: "Hydration goal met" },
  sleep_goal: { category: "discipline", amount: 2, frequency: "daily", description: "Sleep goal met" },
  full_day_completed: { category: "discipline", amount: 5, frequency: "daily", description: "Full day completed" },

  improve_alpha_5: { category: "improvement", amount: 10, frequency: "event", description: "Weekly adherence above 80%" },
  improve_alpha_10: { category: "improvement", amount: 25, frequency: "event", description: "Alpha score improved by 10%" },
  severity_drop_one_level: { category: "improvement", amount: 25, frequency: "event", description: "Severity dropped by 10 points" },
  recovery_plus_10: { category: "improvement", amount: 15, frequency: "event", description: "Recovery probability increased by 10%" },

  challenge_30_complete: { category: "challenge", amount: 50, frequency: "once", description: "30-Day consistency completed" },
  challenge_60_complete: { category: "challenge", amount: 250, frequency: "once", description: "60-Day Transformation completed" },
  challenge_90_complete: { category: "challenge", amount: 400, frequency: "once", description: "90-Day Mastery completed" },
  challenge_weekly_milestone: { category: "challenge", amount: 20, frequency: "weekly", description: "Challenge weekly milestone" },

  streak_7: { category: "milestone", amount: 15, frequency: "once", description: "7-day streak milestone" },
  streak_14: { category: "milestone", amount: 50, frequency: "once", description: "14-day streak milestone" },
  streak_30: { category: "milestone", amount: 75, frequency: "once", description: "30-day streak milestone" },
  streak_60: { category: "milestone", amount: 250, frequency: "once", description: "60-day streak milestone" },
  streak_90: { category: "milestone", amount: 400, frequency: "once", description: "90-day streak milestone" },

  first_assessment_completed: { category: "engagement", amount: 15, frequency: "once", description: "First assessment completed" },
  first_scan_uploaded: { category: "engagement", amount: 5, frequency: "once", description: "First scan uploaded" },
  weekly_reassessment: { category: "engagement", amount: 10, frequency: "weekly", description: "Weekly reassessment completed" },
  referral_completed: { category: "engagement", amount: 10, frequency: "event", description: "Referral completed" },
  product_review_submitted: { category: "engagement", amount: 5, frequency: "event", description: "Product review submitted" },
  purchase_cashback: { category: "engagement", amount: 0, frequency: "event", description: "Purchase cashback" },
};

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function getWeekKey(date = new Date()) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function buildReferenceKey(action: AlphaSikkaAction, frequency: Rule["frequency"], referenceId?: string) {
  const dayKey = new Date().toISOString().slice(0, 10);
  const weekKey = getWeekKey(new Date());

  if (frequency === "daily") return referenceId || `${action}:${dayKey}`;
  if (frequency === "weekly") return referenceId || `${action}:${weekKey}`;
  if (frequency === "once") return referenceId || `${action}:once`;
  return referenceId || "";
}

export function computeAwardAmount(action: AlphaSikkaAction, metadata?: Record<string, unknown>) {
  if (action === "purchase_cashback") {
    const amountSpent = Number(metadata?.purchaseAmount || 0);
    if (!Number.isFinite(amountSpent) || amountSpent <= 0) return 0;
    return Math.max(0, Math.round(amountSpent * 0.05));
  }

  return ALPHA_SIKKA_RULES[action].amount;
}

export function deriveTier(lifetimeEarned: number) {
  if (lifetimeEarned >= 600) return "Champion";
  if (lifetimeEarned >= 200) return "Performer";
  return "Starter";
}
