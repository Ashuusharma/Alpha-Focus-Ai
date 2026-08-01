import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { getUserPlan, canRunAnalyzer } from "@/lib/server/entitlements";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const auth = await getRequestAuth(request);
  if (!auth) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // scans: additive (Phase 7D) — surfaces the same canRunAnalyzer() result
  // /api/galaxy/analyze already computes to enforce the cap; no new rule.
  const [entitlement, scans] = await Promise.all([getUserPlan(auth.userId), canRunAnalyzer(auth.userId)]);
  return NextResponse.json({
    ok: true,
    ...entitlement,
    scans: { used: scans.used, cap: Number.isFinite(scans.cap) ? scans.cap : null, allowed: scans.allowed },
  });
}
