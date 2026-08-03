import { NextRequest, NextResponse } from "next/server";
import { processNextProtocolJob } from "@/lib/protocol/jobProcessor";
import { secureCompare } from "@/lib/server/secureCompare";
import { writeAuditLog } from "@/lib/server/auditLog";

export const runtime = "nodejs";
// Processes one queued job per invocation, including the real AI call
// (up to PROTOCOL_AI_TIMEOUT_MS, 20s default, plus retries). Requires a paid
// Vercel plan; Hobby caps maxDuration at 10s regardless.
export const maxDuration = 60;

function isAuthorizedWorker(request: NextRequest): boolean {
  const workerSecret = process.env.PROTOCOL_WORKER_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const allowedSecrets = [workerSecret, cronSecret].filter((value): value is string => Boolean(value));
  if (allowedSecrets.length === 0) return false;

  const workerHeader = request.headers.get("x-worker-secret") || "";
  if (workerHeader && allowedSecrets.some((secret) => secureCompare(workerHeader, secret))) return true;

  // Vercel Cron's own auto-injected auth uses this header + CRON_SECRET,
  // not x-worker-secret — must be accepted too or the cron trigger 401s.
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  return bearerToken.length > 0 && allowedSecrets.some((secret) => secureCompare(bearerToken, secret));
}

async function handleWorkerRun(request: NextRequest) {
  if (!isAuthorizedWorker(request)) {
    await writeAuditLog({ action: "protocol.worker.auth", userId: "worker", ok: false, route: "/api/protocol/worker", detail: "unauthorized_worker" });
    return NextResponse.json({ ok: false, error: "unauthorized_worker" }, { status: 401 });
  }

  try {
    const result = await processNextProtocolJob();
    return NextResponse.json({ ok: result.ok, processed: result.processed, jobId: result.jobId, error: result.error || null });
  } catch (error) {
    console.error("[api/protocol/worker] unhandled_error", error);
    return NextResponse.json({ ok: false, error: "worker_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleWorkerRun(request);
}

// Vercel Cron Jobs always issue a GET request (see vercel.json, scheduled
// every 2 minutes) — without this, the cron trigger 405s and queued
// protocol-generation jobs are never processed in production.
export async function GET(request: NextRequest) {
  return handleWorkerRun(request);
}
