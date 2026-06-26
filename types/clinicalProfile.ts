import { z } from "zod";

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
  photo: photoSignalSchema.optional(),
  metadata: z.object({
    sourceVersion: z.string().default("v1"),
    appBuild: z.string().optional(),
  }).default({ sourceVersion: "v1" }),
});

export type ClinicalConcern = z.infer<typeof clinicalConcernSchema>;
export type ClinicalSignalSet = z.infer<typeof clinicalSignalSchema>;
export type PhotoSignal = z.infer<typeof photoSignalSchema>;
export type ClinicalProfile = z.infer<typeof clinicalProfileSchema>;
