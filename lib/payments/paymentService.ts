import "server-only";
import { PaymentProvider } from "@/lib/payments/PaymentProvider";
import { CashfreeProvider } from "@/lib/payments/providers/CashfreeProvider";

let cachedProvider: PaymentProvider | null = null;

/**
 * The only place that knows which concrete provider is active. Every caller
 * (billing API routes, subscriptionRepository) depends on the PaymentProvider
 * interface only — adding Razorpay/Stripe later means a new provider class
 * plus a branch here, no changes anywhere else.
 */
export function getPaymentProvider(): PaymentProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.PAYMENT_PROVIDER || "cashfree";
  switch (providerName) {
    case "cashfree":
      cachedProvider = new CashfreeProvider();
      return cachedProvider;
    default:
      throw new Error(`unknown_payment_provider: ${providerName}`);
  }
}
