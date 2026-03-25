"use client";

import RouteErrorFallback from "@/app/_components/RouteErrorFallback";

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorFallback
      error={error}
      reset={reset}
      title="Unable to load checkout"
      description="Checkout is temporarily unavailable. Retry now or return to the shop without losing your cart."
      primaryHref="/shop"
      primaryLabel="Back to Shop"
    />
  );
}