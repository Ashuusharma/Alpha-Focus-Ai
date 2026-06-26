import { z } from "zod";

const toleranceModeSchema = z.enum(["beginner", "intermediate", "advanced"]);

export const clinicalConcernSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  severity: z.number().int().min(0).max(100),
  confidence: z.number().int().min(0).max(100),
  source: z.enum(["assessment", "analysis", "combined"]),
  evidence: z.array(z.string().min(1)).max(12).default([]),
});

export const clinicalSignalSchema = z.object({
  sleepScore: z.number().int().min(0).max(100).optional(),
  hydrationScore: z.number().int().min(0).max(100).optional(),
  stressScore: z.number().int().min(0).max(100).optional(),
  uvIndex: z.number().min(0).max(20).optional(),
  humidity: z.number().min(0).max(100).optional(),
  aqi: z.number().min(0).max(1000).optional(),
});

export const clinicalDemographicsSchema = z.object({
  ageRange: z.string().max(40).optional(),
  gender: z.string().max(40).optional(),
  skinType: z.string().max(40).optional(),
}).default({});

export const clinicalEnvironmentSchema = z.object({
  uvIndex: z.number().min(0).max(20).optional(),
  humidity: z.number().min(0).max(100).optional(),
  aqi: z.number().min(0).max(1000).optional(),
  climateZone: z.string().max(60).optional(),
}).default({});

export const clinicalScoresSchema = z.object({
  overallSeverity: z.number().int().min(0).max(100),
  confidenceScore: z.number().int().min(0).max(100),
  adherenceScore: z.number().int().min(0).max(100).default(0),
  relapseRiskScore: z.number().int().min(0).max(100).default(0),
});

export const protocolDecisionContextSchema = z.object({
  category: z.string().optional(),
  toleranceMode: toleranceModeSchema.default("intermediate"),
  currentPhase: z.enum(["Reset", "Repair", "Stabilize"]).optional(),
  sourceVersion: z.string().default("v2"),
  ownedProductIds: z.array(z.string().min(1)).max(80).default([]),
});

export const lifestyleContextSchema = z.object({
  sleepScore: z.number().int().min(0).max(100).optional(),
  hydrationScore: z.number().int().min(0).max(100).optional(),
  stressScore: z.number().int().min(0).max(100).optional(),
  workMode: z.string().max(80).optional(),
  workoutFrequency: z.string().max(80).optional(),
}).default({});

export const rewardContextSchema = z.object({
  alphaBalance: z.number().int().min(0).optional(),
  streakCount: z.number().int().min(0).optional(),
  rewardTier: z.string().max(80).optional(),
  loyaltyLevel: z.number().int().min(0).optional(),
}).default({});

export const photoSignalSchema = z.object({
  analyzerType: z.string().min(1),
  severity: z.enum(["low", "moderate", "high"]),
  confidence: z.number().int().min(0).max(100),
  detectedIssueCount: z.number().int().min(0),
  detectedIssues: z.array(
    z.object({
      name: z.string().min(1),
      confidence: z.number().int().min(0).max(100),
      impact: z.enum(["minor", "moderate", "significant"]),
      affectedArea: z.string().min(1),
      description: z.string().min(1),
    })
  ).max(20),
  capturedPhotos: z.array(z.string()).max(6).default([]),
});

export const clinicalProfileSchema = z.object({
  userId: z.string().min(1),
  locale: z.string().default("en-IN"),
  generatedAt: z.string().datetime(),
  category: z.string().optional(),
  assessment: z.object({
    answerCount: z.number().int().min(0),
    answers: z.record(z.string(), z.string()),
    completionPct: z.number().int().min(0).max(100),
  }),
  concerns: z.array(clinicalConcernSchema).max(20),
  overallSeverity: z.number().int().min(0).max(100),
  confidenceScore: z.number().int().min(0).max(100),
  signals: clinicalSignalSchema.default({}),
  demographics: clinicalDemographicsSchema,
  environment: clinicalEnvironmentSchema,
  clinicalScores: clinicalScoresSchema,
  protocolDecisions: protocolDecisionContextSchema,
  lifestyleContext: lifestyleContextSchema,
  rewardContext: rewardContextSchema,
  photo: photoSignalSchema.optional(),
  metadata: z.object({
    sourceVersion: z.string().default("v2"),
    appBuild: z.string().optional(),
  }).default({ sourceVersion: "v2" }),
});

export type ClinicalConcern = z.infer<typeof clinicalConcernSchema>;
export type ClinicalSignalSet = z.infer<typeof clinicalSignalSchema>;
export type PhotoSignal = z.infer<typeof photoSignalSchema>;
export type ClinicalProfile = z.infer<typeof clinicalProfileSchema>;
