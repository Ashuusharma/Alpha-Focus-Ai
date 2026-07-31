import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments/paymentService";
import { activateSubscriptionForOrder } from "@/lib/server/subscriptionRepository";

export const runtime = "nodejs";

// Called by Cashfree, not the browser — no user session exists here.
// Authenticity comes from verifying the HMAC signature below, not a bearer
// token, so this route is deliberately outside getRequestAuth/middleware's
// user-auth paths.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature") || "";
  const timestamp = request.headers.get("x-webhook-timestamp") || "";

  if (!signature || !timestamp) {
    console.warn("[billing.webhook.cashfree] missing_signature_headers");
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  const provider = getPaymentProvider();
  const isValid = provider.verifyWebhookSignature(rawBody, signature, timestamp);
  if (!isValid) {
    console.error("[billing.webhook.cashfree] signature_verification_failed");
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  try {
    const event = provider.parseWebhookEvent(rawBody);
    if (event.status !== "paid") {
      console.info("[billing.webhook.cashfree] non_paid_event_ignored", { providerOrderId: event.providerOrderId, status: event.status });
      return NextResponse.json({ ok: true });
    }

    const result = await activateSubscriptionForOrder(event.providerOrderId);
    console.info("[billing.webhook.cashfree] processed", { providerOrderId: event.providerOrderId, activated: result.activated });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[billing.webhook.cashfree] processing_error", {
      message: error instanceof Error ? error.message : "unknown_error",
    });
    // Still 200 — Cashfree retries on non-2xx, and a parse/activation error
    // here is a logged bug to fix, not something a retry storm will resolve.
    return NextResponse.json({ ok: false, error: "processing_error" });
  }
}
