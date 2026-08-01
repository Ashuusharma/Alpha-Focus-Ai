"use client";

import { useEffect, useState } from "react";
import { Crown, ScanLine, Sparkles } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { SkeletonBlock } from "@/components/ui/Skeleton";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";

type PlanId = "free" | "premium_monthly" | "premium_yearly";

type StatusResponse = {
  ok: boolean;
  plan: PlanId;
  active: boolean;
  scans: { used: number; cap: number | null; allowed: boolean };
};

const PLAN_LABEL: Record<PlanId, string> = {
  free: "Free",
  premium_monthly: "Premium Monthly",
  premium_yearly: "Premium Yearly",
};

/** Reads GET /api/billing/status (existing entitlement endpoint from Phase
 *  6, extended additively in Phase 7D to also surface scan usage) — no new
 *  business logic, just presenting what canRunAnalyzer() already computes
 *  server-side for enforcement. */
export default function EntitlementSummary() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const headers = await getSupabaseAuthHeaders();
        const response = await fetch("/api/billing/status", { headers, cache: "no-store" });
        if (!response.ok) throw new Error("status_fetch_failed");
        const data = (await response.json()) as StatusResponse;
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadFailed) return null;

  if (!status) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-24 rounded-2xl" />
        <SkeletonBlock className="h-24 rounded-2xl" />
      </div>
    );
  }

  const isFree = status.plan === "free";
  const scansLabel = status.scans.cap == null ? "Unlimited" : `${Math.max(0, status.scans.cap - status.scans.used)} of ${status.scans.cap} left`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
          <Crown className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Current Plan</p>
          <p className="truncate text-base font-bold text-[var(--ink)]">{PLAN_LABEL[status.plan]}</p>
        </div>
      </Card>

      <Card className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-green)]/15 text-[var(--ink)]">
          <ScanLine className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Analyzer Scans</p>
          <p className="truncate text-base font-bold text-[var(--ink)]">{scansLabel}</p>
        </div>
      </Card>

      {isFree ? (
        <Card variant="spotlight" className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Badge icon={<Sparkles className="h-3 w-3" />} className="!bg-white/10 !text-white !border-white/20">
              Upgrade
            </Badge>
            <p className="mt-2 text-sm font-semibold text-white">Unlock unlimited scans</p>
          </div>
          <Button href="/upgrade" variant="accent" size="sm" className="shrink-0">
            Upgrade
          </Button>
        </Card>
      ) : (
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-green)]/15 text-[var(--ink)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">Status</p>
            <p className="truncate text-base font-bold text-[var(--ink)]">{status.active ? "Active" : "Inactive"}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
