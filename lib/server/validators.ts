import { z } from "zod";

export const sleepLogSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(8).optional(),
  hours: z.number().min(0).max(24),
  quality: z.number().min(0).max(100),
  bedtime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
});

export const hydrationLogSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(8).optional(),
  intakeMl: z.number().min(0).max(10000),
  targetMl: z.number().min(500).max(10000),
});

export const moodLogSchema = z.object({
  id: z.string().optional(),
  date: z.string().min(8).optional(),
  mood: z.enum(["calm", "neutral", "stressed"]),
});

export const weeklyReportSchema = z.object({
  id: z.string().optional(),
  strengths: z.array(z.string()).max(20),
  risks: z.array(z.string()).max(20),
  suggestedFocus: z.string().max(500),
  avgSleep: z.number().min(0).max(24),
  avgHydration: z.number().min(0).max(10000),
  compliance: z.number().min(0).max(100),
  scoreDelta: z.number().min(-100).max(100),
});

export const scanHistorySchema = z.object({
  id: z.string().optional(),
  scanDate: z.string().optional(),
  skinScore: z.number().min(0).max(100),
  hairScore: z.number().min(0).max(100),
  imageUrls: z.array(z.string()).min(1).max(10),
  analyzerType: z.string().max(50).optional(),
});

export const userSyncSchema = z.object({
  profile: z.object({
    id: z.string().min(1).optional(),
    name: z.string().min(1).max(80),
    city: z.string().max(100).optional(),
  }),
  permissions: z.object({
    location: z.boolean().optional(),
    notifications: z.boolean().optional(),
    sleepTracking: z.boolean().optional(),
    hydrationTracking: z.boolean().optional(),
    moodTracking: z.boolean().optional(),
    consent: z.boolean().optional(),
  }).optional(),
  lifestyle: z.object({
    sleepHours: z.number().min(0).max(24).optional(),
    hydrationMl: z.number().min(0).max(10000).optional(),
    mood: z.enum(["calm", "neutral", "stressed"]).optional(),
  }).optional(),
  xp: z.number().min(0).max(100000).optional(),
  level: z.number().min(1).max(100).optional(),
  recoveryProgramLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

export const loginSchema = z.object({
  name: z.string().min(1).max(80),
  consent: z.literal(true),
  passcode: z.string().max(100).optional(),
});

export const aiAdviceSchema = z.object({
  issues: z.array(z.string().min(1)).min(1).max(20),
  answers: z.record(z.string(), z.string()).optional(),
  locale: z.string().max(20).optional(),
  category: z.string().max(60).optional(),
  severity: z.enum(["mild", "moderate", "high"]).optional(),
  environment: z.object({
    climate: z.string().max(80).optional(),
    humidity: z.number().min(0).max(100).optional(),
    uv: z.number().min(0).max(20).optional(),
    aqi: z.number().min(0).max(1000).optional(),
  }).optional(),
  lifestyle: z.object({
    workMode: z.string().max(60).optional(),
    sleepHours: z.number().min(0).max(24).optional(),
    stressLevel: z.string().max(40).optional(),
    workoutFrequency: z.string().max(40).optional(),
  }).optional(),
});

export const galaxyAnalyzeSchema = z.object({
  images: z.array(z.string().min(50)).min(1).max(3),
  analyzerType: z.string().min(1).max(50),
  categories: z.array(z.string()).max(20).optional(),
  answers: z.record(z.string(), z.string()).optional(),
});

export const alphaSikkaEarnSchema = z.object({
  action: z.enum([
    "daily_login",
    "log_am_routine",
    "log_pm_routine",
    "hydration_goal",
    "sleep_goal",
    "full_day_completed",
    "daily_three_completed_bonus",
    "missed_day_penalty",
    "treatment_task_completed",
    "treatment_day_completed",
    "improve_alpha_5",
    "improve_alpha_10",
    "severity_drop_one_level",
    "recovery_plus_10",
    "challenge_30_complete",
    "challenge_60_complete",
    "challenge_90_complete",
    "challenge_weekly_milestone",
    "streak_7",
    "streak_14",
    "streak_30",
    "streak_60",
    "streak_90",
    "first_assessment_completed",
    "first_scan_uploaded",
    "weekly_reassessment",
    "referral_completed",
    "product_review_submitted",
    "purchase_cashback",
  ]),
  supabaseUserId: z.string().uuid().optional(),
  referenceId: z.string().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const alphaSikkaSummarySchema = z.object({
  supabaseUserId: z.string().uuid().optional(),
});

export const alphaSikkaSpendSchema = z.object({
  amount: z.number().positive(),
  cartTotal: z.number().int().positive().optional(),
  category: z.enum(["redemption", "engagement", "challenge", "discipline", "improvement", "milestone", "penalty"]).optional(),
  description: z.string().min(2).max(140),
  referenceId: z.string().min(1).max(120).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const notificationCreateSchema = z.object({
  eventType: z.enum([
    "routine_reminder",
    "routine_completed",
    "routine_missed",
    "challenge_started",
    "challenge_milestone",
    "progress_improved",
    "streak_milestone",
    "streak_at_risk",
    "reward_unlocked",
    "daily_tip",
    "system_alert",
  ]),
  dedupeKey: z.string().min(1).max(180).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const notificationReadSchema = z.object({
  all: z.boolean().optional(),
  ids: z.array(z.string().uuid()).max(50).optional(),
}).refine((value) => Boolean(value.all) || (Array.isArray(value.ids) && value.ids.length > 0), {
  message: "Either all=true or ids[] is required",
});

export const notificationListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const notificationPreferenceUpdateSchema = z.object({
  routineEnabled: z.boolean().optional(),
  challengeEnabled: z.boolean().optional(),
  progressEnabled: z.boolean().optional(),
  tipsEnabled: z.boolean().optional(),
});
