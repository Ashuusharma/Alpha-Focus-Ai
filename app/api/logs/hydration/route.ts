import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { hydrationLogSchema } from "@/lib/server/validators";
import { writeAuditLog } from "@/lib/server/auditLog";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (!auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("routine_logs")
    .select("id,user_id,log_date,hydration_ml,created_at")
    .eq("user_id", auth.userId)
    .order("log_date", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: "hydration_log_fetch_failed" }, { status: 500 });
  }

  const logs = (data || []).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    date: String(row.log_date),
    intakeMl: Number(row.hydration_ml || 0),
    targetMl: 3000,
    createdAt: row.created_at || new Date().toISOString(),
  }));

  return NextResponse.json({ logs });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`logs:hydration:${auth.userId}`, 60, 60_000)) {
      await writeAuditLog({ action: "logs.hydration.write", userId: auth.userId, ok: false, route: "/api/logs/hydration", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const raw = (await request.json()) as Record<string, unknown>;
    const parsed = hydrationLogSchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "logs.hydration.write", userId: auth.userId, ok: false, route: "/api/logs/hydration", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;
    const log = {
      id: body.id || `hydration_${Date.now()}`,
      userId: auth.userId,
      date: body.date || new Date().toISOString().slice(0, 10),
      intakeMl: Number(body.intakeMl || 0),
      targetMl: Number(body.targetMl || 3000),
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("routine_logs")
      .upsert(
        {
          user_id: auth.userId,
          log_date: log.date,
          hydration_ml: log.intakeMl,
        },
        { onConflict: "user_id,log_date" }
      );

    if (error) {
      await writeAuditLog({ action: "logs.hydration.write", userId: auth.userId, ok: false, route: "/api/logs/hydration", detail: "supabase_write_failed" });
      return NextResponse.json({ ok: false, error: "hydration_log_failed" }, { status: 500 });
    }

    await writeAuditLog({ action: "logs.hydration.write", userId: auth.userId, ok: true, route: "/api/logs/hydration" });
    return NextResponse.json({ ok: true, log });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "hydration_log_failed" }, { status: 500 });
  }
}

