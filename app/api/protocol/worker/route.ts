import { NextRequest, NextResponse } from "next/server";
import { processNextProtocolJob } from "@/lib/protocol/jobProcessor";
import { secureCompare } from "@/lib/server/secureCompare";
import { writeAuditLog } from "@/lib/server/auditLog";

export const runtime = "nodejs";

function isAuthorizedWorker(request: NextRequest): boolean {
  const expected = process.env.PROTOCOL_WORKER_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("x-worker-secret") || "";
  return provided.length > 0 && secureCompare(provided, expected);
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedWorker(request)) {
    await writeAuditLog({ action: "protocol.worker.auth", userId: "worker", ok: false, route: "/api/protocol/worker", detail: "unauthorized_worker" });
    return NextResponse.json({ ok: false, error: "unauthorized_worker" }, { status: 401 });
  }

  try {
    const result = await processNextProtocolJob();
    return NextResponse.json({ ok: result.ok, processed: result.processed, jobId: result.jobId, error: result.error || null });
  } catch {
    return NextResponse.json({ ok: false, error: "worker_failed" }, { status: 500 });
  }
}
