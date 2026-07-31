export type SubscriptionPlanId = "premium_monthly" | "premium_yearly";

export type CreateOrderParams = {
  orderId: string;
  amountInr: number;
  customerId: string;
  customerEmail: string;
  returnUrl: string;
};

export type CreateOrderResult = {
  providerOrderId: string;
  paymentSessionId: string;
};

export type OrderStatus = "paid" | "pending" | "failed" | "expired";

export type OrderStatusResult = {
  status: OrderStatus;
  /** Present while the order is still open — lets a caller resume checkout
   *  on an existing order without creating a new one (Cashfree rejects
   *  duplicate order_ids, so reuse is the only option, not re-creation). */
  paymentSessionId?: string;
};

export type WebhookEvent = {
  providerOrderId: string;
  status: "paid" | "failed";
};

/**
 * Business logic (billing API routes, subscription activation) depends only
 * on this interface, never on a specific provider — swapping Cashfree for
 * Razorpay/Stripe later means writing a new implementation of this
 * interface, not touching any calling code.
 */
export interface PaymentProvider {
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  getOrderStatus(providerOrderId: string): Promise<OrderStatusResult>;
  verifyWebhookSignature(rawBody: string, signature: string, timestamp: string): boolean;
  parseWebhookEvent(rawBody: string): WebhookEvent;
}
