import { z } from "zod";

export const PROTOCOL_REPORT_SCHEMA_VERSION = "protocol_report.v2.1.0";

export const protocolIssueSummarySchema = z.object({
  whatWasDetected: z.array(z.string().min(1).max(240)).min(1).max(3),
  whyItHappens: z.array(z.string().min(1).max(240)).min(1).max(3),
  whyConsistencyMatters: z.array(z.string().min(1).max(240)).min(1).max(3),
}).strict();

export const protocolMainIngredientSchema = z.object({
  ingredient: z.string().min(1).max(120),
  purpose: z.string().min(1).max(220),
  targets: z.array(z.string().min(1).max(140)).min(1).max(8),
  whyItWorks: z.string().min(1).max(280),
  expectedTimeline: z.string().min(1).max(180),
  safetyNotes: z.array(z.string().min(1).max(220)).min(1).max(10),
}).strict();

export const protocolRoutineStepSchema = z.object({
  title: z.string().min(1).max(120),
  purpose: z.string().min(1).max(220),
  why: z.string().min(1).max(280),
  steps: z.array(z.string().min(1).max(280)).min(1).max(10),
  timing: z.string().min(1).max(120),
  amount: z.string().min(1).max(120).optional(),
  frequency: z.string().min(1).max(120),
  expectedImprovement: z.string().min(1).max(220),
  mistakesToAvoid: z.array(z.string().min(1).max(220)).min(1).max(10),
  escalationCues: z.array(z.string().min(1).max(220)).min(1).max(8),
}).strict();

export const protocolMonthlyRecoveryPlanSchema = z.object({
  morning: z.array(protocolRoutineStepSchema).min(1).max(16),
  afternoon: z.array(protocolRoutineStepSchema).min(1).max(16),
  night: z.array(protocolRoutineStepSchema).min(1).max(16),
  weekly: z.array(protocolRoutineStepSchema).min(1).max(16),
}).strict();

export const protocolAvoidItemSchema = z.object({
  item: z.string().min(1).max(180),
  whyAvoid: z.string().min(1).max(240),
  effectOnRecovery: z.string().min(1).max(240),
  betterAlternative: z.string().min(1).max(220),
}).strict();

export const protocolThingsToAvoidSchema = z.object({
  food: z.array(protocolAvoidItemSchema).max(12).default([]),
  habits: z.array(protocolAvoidItemSchema).max(12).default([]),
  environment: z.array(protocolAvoidItemSchema).max(12).default([]),
  productMistakes: z.array(protocolAvoidItemSchema).max(12).default([]),
}).strict();

export const protocolProductRecommendationSchema = z.object({
  productId: z.string().min(1).max(120),
  name: z.string().min(1).max(160),
  ingredientMatch: z.string().min(1).max(140).optional(),
  whyRecommended: z.string().min(1).max(260),
  howToUse: z.string().min(1).max(260),
  applicationArea: z.string().min(1).max(140),
  amount: z.string().min(1).max(120),
  timing: z.string().min(1).max(120),
  expectedImprovement: z.string().min(1).max(220),
  compatibilityWithCurrentRoutine: z.string().min(1).max(240),
}).strict();

export const protocolDietPlanSchema = z.object({
  breakfast: z.array(z.string().min(1).max(140)).min(1).max(10),
  lunch: z.array(z.string().min(1).max(140)).min(1).max(10),
  dinner: z.array(z.string().min(1).max(140)).min(1).max(10),
  snacks: z.array(z.string().min(1).max(140)).min(1).max(10),
  hydration: z.string().min(1).max(200),
  wellnessGuidance: z.array(z.string().min(1).max(220)).min(1).max(12),
}).strict();

export const protocolExpectedTimelineWeekSchema = z.object({
  week: z.number().int().min(1).max(4),
  expectedImprovements: z.array(z.string().min(1).max(220)).min(1).max(6),
  possibleSetbacks: z.array(z.string().min(1).max(220)).min(1).max(6),
  continueDoing: z.array(z.string().min(1).max(220)).min(1).max(6),
}).strict();

export const protocolWeeklyMilestoneSchema = z.object({
  week: z.number().int().min(1).max(4),
  milestone: z.string().min(1).max(220),
  adherenceTarget: z.string().min(1).max(120),
}).strict();

export const protocolReportSchema = z.object({
  schemaVersion: z.string().default(PROTOCOL_REPORT_SCHEMA_VERSION),
  issueSummary: protocolIssueSummarySchema,
  mainResolvingIngredients: z.array(protocolMainIngredientSchema).min(1).max(12),
  monthlyRecoveryPlan: protocolMonthlyRecoveryPlanSchema,
  thingsToAvoid: protocolThingsToAvoidSchema,
  recommendedProducts: z.array(protocolProductRecommendationSchema).max(12),
  dietPlan: protocolDietPlanSchema,
  motivation: z.string().min(1).max(320),
  expectedTimeline: z.array(protocolExpectedTimelineWeekSchema).length(4),
  weeklyMilestones: z.array(protocolWeeklyMilestoneSchema).length(4),
  confidenceNotes: z.array(z.string().min(1).max(220)).min(1).max(6),
}).strict();

export type ProtocolRoutineStep = z.infer<typeof protocolRoutineStepSchema>;
export type ProtocolProductRecommendation = z.infer<typeof protocolProductRecommendationSchema>;
export type ProtocolReport = z.infer<typeof protocolReportSchema>;
