// Habit score calculator for low-cost adaptive nudges (web + mobile-friendly)
// All logic is synchronous and works in SSR-safe contexts.

export type HabitTier = "low" | "medium" | "high";

export interface HabitSignals {
  routineCompletions7d: number; // 0-14
  scansLast14d: number; // photo scans
  remindersOpened7d: number;
  remindersDismissed7d: number;
  cartInteractions7d: number; // add-to-cart or view
  streakDays: number;
  lastActiveAt?: string; // ISO string
}

export interface HabitScoreResult {
  score: number; // 0-100
  tier: HabitTier;
  lastUpdated: string;
}

export function calculateHabitScore(signals: HabitSignals): HabitScoreResult {
  const now = new Date();
  const hoursSinceActive = signals.lastActiveAt
    ? Math.min(240, (now.getTime() - new Date(signals.lastActiveAt).getTime()) / 36e5)
    : 240;

  const adherence = clamp(signals.routineCompletions7d * 4, 0, 40);
  const scanning = clamp(signals.scansLast14d * 6, 0, 24);
  const reminders = clamp(signals.remindersOpened7d * 2, 0, 12) - clamp(signals.remindersDismissed7d, 0, 8);
  const commerce = clamp(signals.cartInteractions7d * 2, 0, 10);
  const streak = clamp(signals.streakDays * 1.2, 0, 18);
  const inactivityPenalty = -clamp(hoursSinceActive / 4, 0, 20);

  const raw = adherence + scanning + reminders + commerce + streak + inactivityPenalty;
  const score = clamp(Math.round(raw), 0, 100);
  const tier: HabitTier = score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  return { score, tier, lastUpdated: now.toISOString() };
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}
