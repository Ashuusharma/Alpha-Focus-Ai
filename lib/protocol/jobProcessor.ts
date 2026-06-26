import { generateProtocolWithOrchestrator } from "@/lib/ai/ProtocolOrchestrator";
import {
  fetchNextQueuedProtocolJob,
  markProtocolJobCompleted,
  markProtocolJobFailed,
  markProtocolJobProcessing,
  updateProtocolReport,
} from "@/lib/server/protocolRepository";
import { ProtocolInput } from "@/lib/protocol/contract";
import { writeAuditLog } from "@/lib/server/auditLog";

export async function processNextProtocolJob(): Promise<{ ok: boolean; processed: boolean; jobId?: string; error?: string }> {
  const job = await fetchNextQueuedProtocolJob();
  if (!job) return { ok: true, processed: false };

  const jobId = job.id;

  try {
    await markProtocolJobProcessing(job.id, Number(job.attempts || 0));

    if (job.report_id) {
      await updateProtocolReport(job.report_id, {
        status: "processing",
        modelName: "pending",
        fallbackUsed: false,
      });
    }

    const input = (job.input_payload?.protocolInput || job.input_payload?.input || null) as ProtocolInput | null;
    if (!input) throw new Error("protocol_input_missing");

    const generated = await generateProtocolWithOrchestrator(input);

    if (job.report_id) {
      await updateProtocolReport(job.report_id, {
        status: "ready",
        modelName: generated.model,
        fallbackUsed: generated.status !== "ok",
        reportPayload: generated.report,
        promptVersion: generated.promptVersion,
        cacheKey: generated.cacheKey,
        tokenUsage: generated.tokenUsage,
        costEstimate: generated.costEstimateUsd,
      });
    }

    await markProtocolJobCompleted(job.id, generated.report);

    await writeAuditLog({
      action: "protocol.job.process",
      userId: job.user_id,
      ok: true,
      route: "/api/protocol/worker",
      detail: generated.status !== "ok" ? "fallback" : "ai",
    });

    return { ok: true, processed: true, jobId };
  } catch (error) {
    const attempts = Number(job.attempts || 0) + 1;
    const maxAttempts = Number(job.max_attempts || 3);
    const message = error instanceof Error ? error.message : "protocol_job_failed";

    await markProtocolJobFailed(job.id, message, attempts, maxAttempts);

    if (job.report_id) {
      await updateProtocolReport(job.report_id, {
        status: "failed",
        modelName: "failed",
        fallbackUsed: true,
      });
    }

    await writeAuditLog({
      action: "protocol.job.process",
      userId: job.user_id,
      ok: false,
      route: "/api/protocol/worker",
      detail: message,
    });

    return { ok: false, processed: true, jobId, error: message };
  }
}
