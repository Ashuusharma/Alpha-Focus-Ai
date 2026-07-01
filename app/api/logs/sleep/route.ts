import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { sleepLogSchema } from "@/lib/server/validators";
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
    .select("id,user_id,log_date,sleep_hours,created_at")
    .eq("user_id", auth.userId)
    .order("log_date", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: "sleep_log_fetch_failed" }, { status: 500 });
  }

  const logs = (data || []).map((row) => ({
    id: String(row.id),
    userId: String(row.user_id),
    date: String(row.log_date),
    hours: Number(row.sleep_hours || 0),
    quality: 0,
    bedtime: undefined,
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

    if (isRateLimited(`logs:sleep:${auth.userId}`, 60, 60_000)) {
      await writeAuditLog({ action: "logs.sleep.write", userId: auth.userId, ok: false, route: "/api/logs/sleep", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const raw = (await request.json()) as Record<string, unknown>;
    const parsed = sleepLogSchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "logs.sleep.write", userId: auth.userId, ok: false, route: "/api/logs/sleep", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;
    const log = {
      id: body.id || `sleep_${Date.now()}`,
      userId: auth.userId,
      date: body.date || new Date().toISOString().slice(0, 10),
      hours: Number(body.hours || 0),
      quality: Number(body.quality || 0),
      bedtime: body.bedtime,
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("routine_logs")
      .upsert(
        {
          user_id: auth.userId,
          log_date: log.date,
          sleep_hours: log.hours,
        },
        { onConflict: "user_id,log_date" }
      );

    if (error) {
      await writeAuditLog({ action: "logs.sleep.write", userId: auth.userId, ok: false, route: "/api/logs/sleep", detail: "supabase_write_failed" });
      return NextResponse.json({ ok: false, error: "sleep_log_failed" }, { status: 500 });
    }

    await writeAuditLog({ action: "logs.sleep.write", userId: auth.userId, ok: true, route: "/api/logs/sleep" });
    return NextResponse.json({ ok: true, log });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "sleep_log_failed" }, { status: 500 });
  }
}

