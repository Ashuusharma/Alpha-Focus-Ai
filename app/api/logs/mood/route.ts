import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { isRateLimited } from "@/lib/server/rateLimit";
import { moodLogSchema } from "@/lib/server/validators";
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
    .select("id,user_id,log_date,stress_level,created_at")
    .eq("user_id", auth.userId)
    .order("log_date", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: "mood_log_fetch_failed" }, { status: 500 });
  }

  const logs = (data || []).map((row) => {
    const stress = Number(row.stress_level || 0);
    const mood = stress >= 70 ? "stressed" : stress <= 35 ? "calm" : "neutral";
    return {
      id: String(row.id),
      userId: String(row.user_id),
      date: String(row.log_date),
      mood,
      createdAt: row.created_at || new Date().toISOString(),
    };
  });

  return NextResponse.json({ logs });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (isRateLimited(`logs:mood:${auth.userId}`, 60, 60_000)) {
      await writeAuditLog({ action: "logs.mood.write", userId: auth.userId, ok: false, route: "/api/logs/mood", detail: "rate_limited" });
      return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
    }

    const raw = (await request.json()) as Record<string, unknown>;
    const parsed = moodLogSchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "logs.mood.write", userId: auth.userId, ok: false, route: "/api/logs/mood", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;
    const log = {
      id: body.id || `mood_${Date.now()}`,
      userId: auth.userId,
      date: body.date || new Date().toISOString().slice(0, 10),
      mood: body.mood === "calm" || body.mood === "stressed" ? body.mood : "neutral",
      createdAt: new Date().toISOString(),
    };

    const stressLevel = log.mood === "stressed" ? 80 : log.mood === "calm" ? 30 : 55;

    const { error } = await supabase
      .from("routine_logs")
      .upsert(
        {
          user_id: auth.userId,
          log_date: log.date,
          stress_level: stressLevel,
        },
        { onConflict: "user_id,log_date" }
      );

    if (error) {
      await writeAuditLog({ action: "logs.mood.write", userId: auth.userId, ok: false, route: "/api/logs/mood", detail: "supabase_write_failed" });
      return NextResponse.json({ ok: false, error: "mood_log_failed" }, { status: 500 });
    }

    await writeAuditLog({ action: "logs.mood.write", userId: auth.userId, ok: true, route: "/api/logs/mood" });
    return NextResponse.json({ ok: true, log });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "mood_log_failed" }, { status: 500 });
  }
}
