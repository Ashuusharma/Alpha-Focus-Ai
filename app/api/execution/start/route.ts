import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { writeAuditLog } from "@/lib/server/auditLog";
import { startExecutionSession } from "@/lib/server/executionSession";
import { CategoryId } from "@/lib/questions";

export const runtime = "nodejs";

type StartPayload = {
  referenceId?: string;
  category?: CategoryId;
  dayNumber?: number;
  taskId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`execution:start:${auth.userId}`, 80, 60_000)) {
      await writeAuditLog({ action: "execution.start", userId: auth.userId, ok: false, route: "/api/execution/start", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const raw = (await request.json()) as StartPayload;
    const referenceId = typeof raw.referenceId === "string" ? raw.referenceId.trim() : "";
    const category = raw.category;
    const dayNumber = Number(raw.dayNumber || 0);
    const taskId = typeof raw.taskId === "string" ? raw.taskId.trim() : "";

    if (!referenceId || !category || !Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 30 || !taskId) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const result = await startExecutionSession(request, {
      referenceId,
      category,
      dayNumber,
      taskId,
    });

    if (!result.ok) {
      await writeAuditLog({ action: "execution.start", userId: auth.userId, ok: false, route: "/api/execution/start", detail: result.error || "start_failed" });
      return NextResponse.json({ ok: false, error: result.error || "start_failed" }, { status: result.statusCode || 400 });
    }

    await writeAuditLog({ action: "execution.start", userId: auth.userId, ok: true, route: "/api/execution/start" });
    return NextResponse.json({ ok: true, sessionId: result.sessionId, startedAt: result.startedAt });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "execution_start_failed" }, { status: 500 });
  }
}

