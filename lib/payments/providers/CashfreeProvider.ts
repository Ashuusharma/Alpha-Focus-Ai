import "server-only";
import { createHmac } from "crypto";
import { secureCompare } from "@/lib/server/secureCompare";
import {
  PaymentProvider,
  CreateOrderParams,
  CreateOrderResult,
  OrderStatusResult,
  WebhookEvent,
} from "@/lib/payments/PaymentProvider";

// Sandbox only, per Phase 6 scope — production requires a registered domain
// and live credentials, deliberately not wired up yet.
const CASHFREE_BASE_URL = "https://sandbox.cashfree.com/pg";

function getCredentials() {
  const appId = process.env.CASHFREE_APP_ID;
  const secretKey = process.env.CASHFREE_SECRET_KEY;
  const apiVersion = process.env.CASHFREE_API_VERSION || "2023-08-01";
  if (!appId || !secretKey) {
    throw new Error("cashfree_credentials_missing");
  }
  return { appId, secretKey, apiVersion };
}

function authHeaders() {
  const { appId, secretKey, apiVersion } = getCredentials();
  return {
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": apiVersion,
    "Content-Type": "application/json",
  };
}

type CashfreeOrderResponse = {
  order_id: string;
  payment_session_id?: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED";
};

function mapOrderStatus(status: string): OrderStatusResult["status"] {
  switch (status) {
    case "PAID":
      return "paid";
    case "EXPIRED":
    case "TERMINATED":
      return "failed";
    default:
      return "pending";
  }
}

export class CashfreeProvider implements PaymentProvider {
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        order_id: params.orderId,
        order_amount: params.amountInr,
        order_currency: "INR",
        customer_details: {
          customer_id: params.customerId,
          customer_email: params.customerEmail,
          // Cashfree requires a 10-digit phone; this app doesn't collect one
          // today. Sandbox-only placeholder — production needs a real
          // number collected at checkout before this can go live.
          customer_phone: "9999999999",
        },
        order_meta: {
          return_url: params.returnUrl,
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[payments.cashfree] create_order_failed", { status: response.status, bodyPreview: body.slice(0, 400) });
      throw new Error("cashfree_create_order_failed");
    }

    const data = (await response.json()) as CashfreeOrderResponse;
    if (!data.payment_session_id) {
      console.error("[payments.cashfree] create_order_missing_session_id", { orderId: data.order_id });
      throw new Error("cashfree_create_order_missing_session_id");
    }
    return { providerOrderId: data.order_id, paymentSessionId: data.payment_session_id };
  }

  async getOrderStatus(providerOrderId: string): Promise<OrderStatusResult> {
    const response = await fetch(`${CASHFREE_BASE_URL}/orders/${encodeURIComponent(providerOrderId)}`, {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[payments.cashfree] get_order_status_failed", { status: response.status, bodyPreview: body.slice(0, 400) });
      throw new Error("cashfree_get_order_status_failed");
    }

    const data = (await response.json()) as CashfreeOrderResponse;
    return { status: mapOrderStatus(data.order_status), paymentSessionId: data.payment_session_id };
  }

  // Spec (docs.cashfree.com/payments/online/webhooks/signature-verification):
  // signature = Base64Encode(HMAC-SHA256(x-webhook-timestamp + rawBody, secretKey))
  // secretKey is the same CASHFREE_SECRET_KEY used for API auth.
  verifyWebhookSignature(rawBody: string, signature: string, timestamp: string): boolean {
    const { secretKey } = getCredentials();
    const expected = createHmac("sha256", secretKey).update(timestamp + rawBody).digest("base64");
    return secureCompare(signature, expected);
  }

  parseWebhookEvent(rawBody: string): WebhookEvent {
    const payload = JSON.parse(rawBody) as {
      type?: string;
      data?: { order?: { order_id?: string }; payment?: { payment_status?: string } };
    };

    const providerOrderId = payload.data?.order?.order_id;
    if (!providerOrderId) {
      throw new Error("cashfree_webhook_missing_order_id");
    }

    const isPaid = payload.type === "PAYMENT_SUCCESS_WEBHOOK" || payload.data?.payment?.payment_status === "SUCCESS";
    return { providerOrderId, status: isPaid ? "paid" : "failed" };
  }
}
