import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/server/auditLog";

const rewardEventSchema = z.object({
  event: z.enum(["reward_unlocked", "reward_used", "product_clicked_from_reward"]),
  payload: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().optional(),
  userName: z.string().optional(),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = rewardEventSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
    }

    const body = parsed.data;
    await writeAuditLog({
      action: `analytics.${body.event}`,
      userId: body.userName || "anonymous",
      ok: true,
      route: "/api/analytics/reward-events",
      detail: JSON.stringify(body.payload || {}),
      at: body.createdAt,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "reward_event_failed" }, { status: 500 });
  }
}