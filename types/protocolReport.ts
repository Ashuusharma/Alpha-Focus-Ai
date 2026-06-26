import { z } from "zod";

export const protocolIssueSummarySchema = z.object({
  whatWasDetected: z.array(z.string().min(1).max(240)).min(1).max(3),
  whyItHappens: z.array(z.string().min(1).max(240)).min(1).max(3),
  whyConsistencyMatters: z.array(z.string().min(1).max(240)).min(1).max(3),
}).strict();

export const protocolMainIngredientSchema = z.object({
  ingredient: z.string().min(1).max(120),
  purpose: z.string().min(1).max(220),
  howItHelps: z.string().min(1).max(220),
  expectedRecoveryBenefit: z.string().min(1).max(220),
}).strict();

export const protocolActionStepSchema = z.object({
  stepTitle: z.string().min(1).max(120),
  reason: z.string().min(1).max(240),
  exactlyHowToPerform: z.string().min(1).max(500),
  time: z.string().min(1).max(80),
  quantity: z.string().min(1).max(80),
  applicationArea: z.string().min(1).max(120),
  commonMistakes: z.array(z.string().min(1).max(180)).min(1).max(8),
  expectedBenefit: z.string().min(1).max(220),
}).strict();

export const protocolMonthlyRecoveryPlanSchema = z.object({
  morning: z.array(protocolActionStepSchema).min(1).max(16),
  afternoon: z.array(protocolActionStepSchema).min(1).max(16),
  night: z.array(protocolActionStepSchema).min(1).max(16),
  weekly: z.array(protocolActionStepSchema).min(1).max(16),
}).strict();

export const protocolAvoidItemSchema = z.object({
  item: z.string().min(1).max(180),
  whyItDelaysRecovery: z.string().min(1).max(220),
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
  ingredientMatch: z.string().min(1).max(140),
  whyRecommended: z.string().min(1).max(260),
  howToUse: z.string().min(1).max(260),
  howMuch: z.string().min(1).max(80),
  whenToUse: z.string().min(1).max(80),
  expectedTimeline: z.string().min(1).max(180),
  commonMistakes: z.array(z.string().min(1).max(180)).max(8).default([]),
}).strict();

export const protocolDietPlanSchema = z.object({
  breakfast: z.array(z.string().min(1).max(140)).min(1).max(10),
  lunch: z.array(z.string().min(1).max(140)).min(1).max(10),
  dinner: z.array(z.string().min(1).max(140)).min(1).max(10),
  snacks: z.array(z.string().min(1).max(140)).min(1).max(10),
  hydration: z.string().min(1).max(200),
  weeklyNutritionGoals: z.array(z.string().min(1).max(180)).min(1).max(10),
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

export type ProtocolActionStep = z.infer<typeof protocolActionStepSchema>;
export type ProtocolProductRecommendation = z.infer<typeof protocolProductRecommendationSchema>;
export type ProtocolReport = z.infer<typeof protocolReportSchema>;
