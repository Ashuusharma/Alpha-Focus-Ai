import { z } from "zod";

export const protocolJobStatusSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "failed",
  "retry_scheduled",
  "cancelled",
]);

export const protocolGenerationJobSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  reportId: z.string().uuid().optional(),
  status: protocolJobStatusSchema,
  attempts: z.number().int().min(0).max(20).default(0),
  maxAttempts: z.number().int().min(1).max(20).default(3),
  priority: z.number().int().min(1).max(10).default(5),
  errorMessage: z.string().max(800).optional(),
  inputPayload: z.record(z.string(), z.unknown()).default({}),
  outputPayload: z.record(z.string(), z.unknown()).default({}),
  scheduledFor: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ProtocolJobStatus = z.infer<typeof protocolJobStatusSchema>;
export type ProtocolGenerationJob = z.infer<typeof protocolGenerationJobSchema>;
