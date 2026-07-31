import { NextRequest, NextResponse } from "next/server";
import { getRequestAuth } from "@/lib/auth/requestAuth";
import { writeAuditLog } from "@/lib/server/auditLog";
import { getPaymentProvider } from "@/lib/payments/paymentService";
import { activateSubscriptionForOrder } from "@/lib/server/subscriptionRepository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await getRequestAuth(request);
    if (!auth) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const orderId = typeof body?.orderId === "string" ? body.orderId : null;
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "invalid_order_id" }, { status: 400 });
    }

    const provider = getPaymentProvider();
    const status = await provider.getOrderStatus(orderId);

    if (status.status !== "paid") {
      return NextResponse.json({ ok: true, status: status.status });
    }

    // Idempotent — if the webhook already activated this order, this is a
    // no-op read confirming the same outcome, not a double-activation.
    const result = await activateSubscriptionForOrder(orderId);
    await writeAuditLog({
      action: "billing.verify_payment",
      userId: auth.userId,
      ok: true,
      route: "/api/billing/verify-payment",
      detail: result.activated ? "activated" : "already_activated",
    });

    return NextResponse.json({ ok: true, status: "paid" });
  } catch (error) {
    console.error("[billing.verify_payment] unhandled_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json({ ok: false, error: "verify_payment_failed" }, { status: 500 });
  }
}
