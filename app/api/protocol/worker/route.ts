import { NextRequest, NextResponse } from "next/server";
import { processNextProtocolJob } from "@/lib/protocol/jobProcessor";

export const runtime = "nodejs";

function isAuthorizedWorker(request: NextRequest): boolean {
  const expected = process.env.PROTOCOL_WORKER_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("x-worker-secret") || "";
  return provided.length > 0 && provided === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedWorker(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized_worker" }, { status: 401 });
  }

  try {
    const result = await processNextProtocolJob();
    return NextResponse.json({ ok: result.ok, processed: result.processed, jobId: result.jobId, error: result.error });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "worker_failed" }, { status: 500 });
  }
}
