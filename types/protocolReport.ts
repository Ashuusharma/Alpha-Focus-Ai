import { z } from "zod";

export const protocolSectionIssueSnapshotSchema = z.object({
  headline: z.string().min(1).max(240),
  primaryIssue: z.string().min(1).max(120),
  severityLabel: z.string().min(1).max(80),
  confidenceLabel: z.string().min(1).max(80),
  keyDrivers: z.array(z.string().min(1).max(180)).min(1).max(6),
});

export const protocolSectionIngredientsSchema = z.object({
  mustHave: z.array(z.string().min(1).max(120)).min(1).max(10),
  optional: z.array(z.string().min(1).max(120)).max(10).default([]),
  avoidMixes: z.array(z.string().min(1).max(160)).max(10).default([]),
});

export const protocolActionStepSchema = z.object({
  title: z.string().min(1).max(120),
  details: z.string().min(1).max(400),
  timeOfDay: z.enum(["morning", "evening", "lifestyle", "anytime"]),
  frequency: z.string().min(1).max(100),
});

export const protocolSectionLetsFixThisSchema = z.object({
  weekWindow: z.string().min(1).max(80),
  steps: z.array(protocolActionStepSchema).min(1).max(16),
});

export const protocolProductRecommendationSchema = z.object({
  name: z.string().min(1).max(160),
  role: z.string().min(1).max(120),
  why: z.string().min(1).max(260),
  usage: z.string().min(1).max(260),
  priority: z.enum(["core", "optional"]),
});

export const protocolSectionDietSchema = z.object({
  include: z.array(z.string().min(1).max(140)).min(1).max(10),
  reduce: z.array(z.string().min(1).max(140)).max(10).default([]),
  hydrationRule: z.string().min(1).max(160),
});

export const protocolProgressMilestoneSchema = z.object({
  week: z.number().int().min(1).max(16),
  expectedChange: z.string().min(1).max(220),
  reviewFocus: z.string().min(1).max(220),
});

export const protocolSectionProgressExpectationSchema = z.object({
  timelineSummary: z.string().min(1).max(220),
  milestones: z.array(protocolProgressMilestoneSchema).min(1).max(8),
});

export const protocolReportSchema = z.object({
  reportVersion: z.string().default("v1"),
  generatedAt: z.string().datetime(),
  model: z.string().min(1).max(80),
  source: z.enum(["ai", "fallback"]),
  issueSnapshot: protocolSectionIssueSnapshotSchema,
  ingredients: protocolSectionIngredientsSchema,
  letsFixThis: protocolSectionLetsFixThisSchema,
  avoid: z.array(z.string().min(1).max(180)).min(1).max(12),
  products: z.array(protocolProductRecommendationSchema).max(12),
  diet: protocolSectionDietSchema,
  progressExpectation: protocolSectionProgressExpectationSchema,
  disclaimers: z.array(z.string().min(1).max(220)).max(8).default([]),
});

export type ProtocolActionStep = z.infer<typeof protocolActionStepSchema>;
export type ProtocolProductRecommendation = z.infer<typeof protocolProductRecommendationSchema>;
export type ProtocolReport = z.infer<typeof protocolReportSchema>;
