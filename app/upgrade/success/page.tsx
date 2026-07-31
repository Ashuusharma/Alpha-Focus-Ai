"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";

type VerifyState = "checking" | "paid" | "pending" | "failed" | "error";

function UpgradeSuccessInner() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("order_id");
  const [state, setState] = useState<VerifyState>("checking");

  useEffect(() => {
    if (!orderId) {
      setState("error");
      return;
    }

    (async () => {
      try {
        const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
        const response = await fetch("/api/billing/verify-payment", {
          method: "POST",
          headers,
          body: JSON.stringify({ orderId }),
        });
        const data = await response.json();

        if (!response.ok || !data.ok) {
          setState("error");
          return;
        }

        setState(data.status === "paid" ? "paid" : data.status === "failed" || data.status === "expired" ? "failed" : "pending");
      } catch {
        setState("error");
      }
    })();
  }, [orderId]);

  return (
    <div className="af-page min-h-screen flex items-center justify-center px-4">
      <div className="af-card p-8 max-w-md w-full text-center space-y-4">
        {state === "checking" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-[#0071e3]" />
            <h1 className="text-xl font-semibold">Confirming your payment...</h1>
          </>
        )}
        {state === "paid" && (
          <>
            <CheckCircle2 className="w-10 h-10 mx-auto text-[#0071e3]" />
            <h1 className="text-xl font-semibold">Subscription activated</h1>
            <p className="af-muted text-sm">Your premium plan is now active.</p>
            <a href="/dashboard" className="af-btn-primary inline-block px-5 py-2.5 text-sm mt-2">Go to dashboard</a>
          </>
        )}
        {(state === "pending" || state === "failed" || state === "error") && (
          <>
            <XCircle className="w-10 h-10 mx-auto text-red-500" />
            <h1 className="text-xl font-semibold">
              {state === "pending" ? "Payment still processing" : "Payment not completed"}
            </h1>
            <p className="af-muted text-sm">No charge was activated. You can try again from the upgrade page.</p>
            <a href="/upgrade" className="af-btn-soft inline-block px-5 py-2.5 text-sm mt-2">Back to plans</a>
          </>
        )}
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={null}>
      <UpgradeSuccessInner />
    </Suspense>
  );
}
