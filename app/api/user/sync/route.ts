import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { userSyncSchema } from "@/lib/server/validators";
import { writeAuditLog } from "@/lib/server/auditLog";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

function toProfileUpdate(payload: Record<string, unknown>) {
  const profile = (payload.profile || {}) as Record<string, unknown>;
  return {
    full_name: typeof profile.name === "string" ? profile.name : undefined,
    city: typeof profile.city === "string" ? profile.city : undefined,
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const raw = (await request.json()) as Record<string, unknown>;
    const parsed = userSyncSchema.safeParse(raw);
    if (!parsed.success) {
      await writeAuditLog({ action: "user.sync", userId: auth.userId, ok: false, route: "/api/user/sync", detail: "validation_failed" });
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const profileUpdate = toProfileUpdate(parsed.data as unknown as Record<string, unknown>);

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: auth.userId,
          full_name: profileUpdate.full_name || auth.name,
          city: profileUpdate.city || null,
          updated_at: profileUpdate.updated_at,
        },
        { onConflict: "id" }
      );

    if (error) {
      await writeAuditLog({ action: "user.sync", userId: auth.userId, ok: false, route: "/api/user/sync", detail: "supabase_write_failed" });
      return NextResponse.json({ ok: false, error: "sync_failed" }, { status: 500 });
    }

    await writeAuditLog({ action: "user.sync", userId: auth.userId, ok: true, route: "/api/user/sync" });
    return NextResponse.json({ ok: true, userId: auth.userId });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "sync_failed" }, { status: 500 });
  }
}

