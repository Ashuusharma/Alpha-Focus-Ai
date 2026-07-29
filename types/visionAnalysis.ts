import { z } from "zod";

export const VISION_ANALYSIS_SCHEMA_VERSION = "vision_analysis.v1.0.0";

export const visionIssueSchema = z.object({
  name: z.string().min(1).max(120),
  confidence: z.number().min(0).max(100),
  impact: z.enum(["minor", "moderate", "significant"]),
  description: z.string().min(1).max(600),
  affectedArea: z.string().min(1).max(120),
}).strict();

export const visionHotspotSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  label: z.string().min(1).max(80),
  severity: z.enum(["low", "medium", "high"]).optional(),
}).strict();

export const visionAnalysisResultSchema = z.object({
  issues: z.array(visionIssueSchema).max(6),
  hotspots: z.array(visionHotspotSchema).max(8),
  confidence: z.number().min(0).max(100),
  summary: z.string().max(400),
}).strict();

export type VisionIssue = z.infer<typeof visionIssueSchema>;
export type VisionHotspot = z.infer<typeof visionHotspotSchema>;
export type VisionAnalysisResult = z.infer<typeof visionAnalysisResultSchema>;
