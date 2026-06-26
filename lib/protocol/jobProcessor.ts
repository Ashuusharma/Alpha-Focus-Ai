import { generateProtocolReportFromAI } from "@/lib/protocol/generationEngine";
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

    const input = (job.input_payload?.protocolInput || job.input_payload?.input || null) as ProtocolInput | null;
    if (!input) throw new Error("protocol_input_missing");

    const generated = await generateProtocolReportFromAI(input);

    if (job.report_id) {
      await updateProtocolReport(job.report_id, {
        status: "ready",
        modelName: generated.model,
        fallbackUsed: generated.usedFallback,
        reportPayload: generated.report,
      });
    }

    await markProtocolJobCompleted(job.id, generated.report);

    await writeAuditLog({
      action: "protocol.job.process",
      userId: job.user_id,
      ok: true,
      route: "/api/protocol/worker",
      detail: generated.usedFallback ? "fallback" : "ai",
    });

    return { ok: true, processed: true, jobId };
  } catch (error) {
    const attempts = Number(job.attempts || 0) + 1;
    const maxAttempts = Number(job.max_attempts || 3);
    const message = error instanceof Error ? error.message : "protocol_job_failed";

    await markProtocolJobFailed(job.id, message, attempts, maxAttempts);

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
