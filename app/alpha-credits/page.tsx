"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Clock3,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { CreditActionCode } from "@/lib/creditService";
import {
  getRewardCatalog,
  getRewardProgress,
} from "@/lib/couponService";
import { calculateDisciplineScore, getTierProgress } from "@/lib/rewardTierService";
import { AuthContext } from "@/contexts/AuthProvider";
import { useUserStore } from "@/stores/useUserStore";
import { hydrateUserData } from "@/lib/hydrateUserData";
import Link from "next/link";

const DAILY_CAP = 20;

type TierLabel = "Bronze" | "Silver" | "Gold" | "Platinum" | "Elite";

type LedgerTransaction = {
  id: string;
  type: "earn" | "spend";
  source: string;
  label: string;
  amount: number;
  timestamp: string;
  balanceAfter: number;
};

type LedgerSnapshot = {
  model: {
    currentBalance: number;
    totalEarned: number;
    totalSpent: number;
  };
  tier: {
    label: TierLabel;
  };
  dailyCapRemaining: number;
  transactions: LedgerTransaction[];
};

type EarnAction = {
  code: CreditActionCode;
  label: string;
  helper: string;
  metadata?: Record<string, unknown>;
};

type ActionRuntimeState = {
  status: "idle" | "running" | "completed";
  startedAtMs?: number;
  durationSec?: number;
};

type ActionConfig = {
  mode: "instant" | "timed";
  durationSec?: number;
  allowCancel?: boolean;
};

const EARN_ACTIONS: EarnAction[] = [
  { code: "daily_login", label: "Daily login", helper: "+1 A$ / day" },
  { code: "log_am_routine", label: "AM routine completed", helper: "+2 A$ / day" },
  { code: "log_pm_routine", label: "PM routine completed", helper: "+2 A$ / day" },
  { code: "hydration_goal", label: "Hydration goal met", helper: "+3 A$ / day" },
  { code: "sleep_goal", label: "Sleep goal met", helper: "+2 A$ / day" },
  { code: "full_day_completed", label: "Full day completed", helper: "Daily cap: 20 A$" },
  {
    code: "improve_alpha_5",
    label: "Weekly adherence > 80%",
    helper: "+10 A$",
    metadata: { adherence: 80 },
  },
  {
    code: "severity_drop_one_level",
    label: "Severity drop by 10 points",
    helper: "+25 A$",
    metadata: { dropped: true, points: 10 },
  },
  { code: "challenge_30_complete", label: "30-day consistency complete", helper: "+50 A$" },
  { code: "product_review_submitted", label: "Product review", helper: "+5 A$" },
  { code: "first_scan_uploaded", label: "Photo scan upload", helper: "+5 A$" },
];

const ACTION_CONFIG: Partial<Record<CreditActionCode, ActionConfig>> = {
  daily_login: { mode: "instant" },
  log_am_routine: { mode: "timed", durationSec: 10 * 60, allowCancel: true },
  log_pm_routine: { mode: "timed", durationSec: 10 * 60, allowCancel: true },
  hydration_goal: { mode: "instant" },
  sleep_goal: { mode: "instant" },
  full_day_completed: { mode: "instant" },
  improve_alpha_5: { mode: "instant" },
  severity_drop_one_level: { mode: "instant" },
  challenge_30_complete: { mode: "instant" },
  product_review_submitted: { mode: "instant" },
  first_scan_uploaded: { mode: "instant" },
};

function formatRemainingTime(totalSec: number) {
  const clamped = Math.max(0, totalSec);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-[#E2DDD4] overflow-hidden">
      <div
        className="h-full rounded-full bg-[#1F3D2B]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function formatAmount(amount: number) {
  return `${amount.toLocaleString()} A$`;
}

function toTierLabel(value?: string): TierLabel {
  if (value === "Silver" || value === "Gold" || value === "Platinum" || value === "Elite") return value;
  return "Bronze";
}

const EMPTY_SNAPSHOT: LedgerSnapshot = {
  model: {
    currentBalance: 0,
    totalEarned: 0,
    totalSpent: 0,
  },
  tier: {
    label: "Bronze",
  },
  dailyCapRemaining: DAILY_CAP,
  transactions: [],
};

function buildSnapshotFromStore(input: {
  summary: Record<string, unknown> | null;
  transactions: Array<Record<string, unknown>>;
}): LedgerSnapshot {
  const summary = input.summary;
  const transactions = (input.transactions || []).map((tx) => {
    const amount = Number(tx.amount || 0);
    return {
      id: String(tx.id || `${Date.now()}`),
      type: amount >= 0 ? "earn" : "spend",
      source: String(tx.category || "discipline"),
      label: String(tx.description || tx.category || "transaction"),
      amount: Math.abs(amount),
      timestamp: String(tx.created_at || new Date().toISOString()),
      balanceAfter: 0,
    } as LedgerTransaction;
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayDisciplineEarned = transactions
    .filter((tx) => tx.type === "earn" && tx.source === "discipline" && tx.timestamp.slice(0, 10) === today)
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    model: {
      currentBalance: Number(summary?.current_balance || 0),
      totalEarned: Number(summary?.lifetime_earned || 0),
      totalSpent: Number(summary?.lifetime_spent || 0),
    },
    tier: {
      label: toTierLabel(String(summary?.tier_level || "Bronze")),
    },
    dailyCapRemaining: Math.max(0, DAILY_CAP - todayDisciplineEarned),
    transactions,
  };
}

export default function AlphaCreditsPage() {
  const { user } = useContext(AuthContext);
  const loading = useUserStore((state) => state.loading);
  const alphaSummary = useUserStore((state) => state.alphaSummary as Record<string, unknown> | null);
  const alphaTransactions = useUserStore((state) => state.alphaTransactions as Array<Record<string, unknown>>);
  const [message, setMessage] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [actionRuntime, setActionRuntime] = useState<Record<string, ActionRuntimeState>>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [, setTimerTick] = useState(0);
  const snapshot = useMemo(
    () => (user ? buildSnapshotFromStore({ summary: alphaSummary, transactions: alphaTransactions }) : EMPTY_SNAPSHOT),
    [user?.id, alphaSummary, alphaTransactions]
  );

  useEffect(() => {
    if (!user) return;
    if (alphaSummary) return;
    void hydrateUserData(user.id, { silent: true });
  }, [user?.id, alphaSummary]);

  useEffect(() => {
    if (!user) return;
    const key = `alpha_actions:${user.id}:${new Date().toISOString().slice(0, 10)}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      setCompletedActions({});
      return;
    }
    try {
      setCompletedActions(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      setCompletedActions({});
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const key = `alpha_actions:${user.id}:${new Date().toISOString().slice(0, 10)}`;
    window.localStorage.setItem(key, JSON.stringify(completedActions));
  }, [user?.id, completedActions]);

  useEffect(() => {
    if (!user) return;
    const key = `alpha_runtime:${user.id}:${new Date().toISOString().slice(0, 10)}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      setActionRuntime({});
      return;
    }
    try {
      setActionRuntime(JSON.parse(raw) as Record<string, ActionRuntimeState>);
    } catch {
      setActionRuntime({});
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const key = `alpha_runtime:${user.id}:${new Date().toISOString().slice(0, 10)}`;
    window.localStorage.setItem(key, JSON.stringify(actionRuntime));
  }, [user?.id, actionRuntime]);

  useEffect(() => {
    const interval = setInterval(() => setTimerTick((v) => v + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const rewardCatalog = useMemo(() => getRewardCatalog(), []);
  const rewardProgress = useMemo(
    () => getRewardProgress(snapshot.model.currentBalance),
    [snapshot.model.currentBalance]
  );
  const tierProgress = useMemo(
    () => getTierProgress(snapshot.model.totalEarned),
    [snapshot.model.totalEarned]
  );
  const programProgress = useMemo(() => {
    const programSources = new Set(
      snapshot.transactions
        .filter((tx) => tx.type === "earn" && /challenge|30-Day|60-Day|90-Day/i.test(tx.label))
        .map((tx) => tx.label)
    );
    const completedCount = ["30-Day", "60-Day", "90-Day"].filter((id) =>
      Array.from(programSources).some((label) => label.includes(id))
    ).length;
    const percent = Math.min(100, Math.round((completedCount / 3) * 100));
    const nextLabel = completedCount === 0
      ? "30-Day Glow Up · 120 A$"
      : completedCount === 1
        ? "60-Day Transformation · 250 A$"
        : completedCount === 2
          ? "90-Day Mastery · 400 A$"
          : null;

    return { completedCount, percent, nextLabel };
  }, [snapshot.transactions]);

  const discipline = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const todaySources = new Set(
      snapshot.transactions
        .filter((tx) => tx.type === "earn" && tx.timestamp.slice(0, 10) === todayKey && tx.source === "discipline")
        .map((tx) => tx.source)
    );
    const completedDailyTasks = ["daily_login", "log_am_routine", "log_pm_routine", "hydration_goal", "sleep_goal"].filter((source) =>
      todaySources.has(source)
    ).length;

    return calculateDisciplineScore({
      completedDailyTasks,
      totalDailyTasks: 5,
    });
  }, [snapshot]);

  const recentRedemptions = useMemo(() => snapshot.transactions.filter((tx) => tx.type === "spend").slice(0, 4), [snapshot.transactions]);

  const history: LedgerTransaction[] = snapshot.transactions.slice(0, 8);

  const getRuntimeState = (code: CreditActionCode): ActionRuntimeState => {
    const base = actionRuntime[code] || { status: "idle" as const };
    if (base.status !== "running") return base;

    const startedAtMs = Number(base.startedAtMs || 0);
    const durationSec = Number(base.durationSec || 0);
    if (!startedAtMs || !durationSec) return { status: "idle" };

    const elapsedSec = Math.floor((Date.now() - startedAtMs) / 1000);
    if (elapsedSec >= durationSec) {
      return { status: "running", startedAtMs, durationSec };
    }

    return { status: "running", startedAtMs, durationSec };
  };

  const getRemainingSec = (code: CreditActionCode) => {
    const runtime = getRuntimeState(code);
    if (runtime.status !== "running" || !runtime.startedAtMs || !runtime.durationSec) return 0;
    const elapsedSec = Math.floor((Date.now() - runtime.startedAtMs) / 1000);
    return Math.max(0, runtime.durationSec - elapsedSec);
  };

  const startTimedAction = (code: CreditActionCode) => {
    const config: ActionConfig = ACTION_CONFIG[code] || { mode: "instant" };
    if (config.mode !== "timed") return;
    setActionRuntime((prev) => ({
      ...prev,
      [code]: {
        status: "running",
        startedAtMs: Date.now(),
        durationSec: config.durationSec,
      },
    }));
    setMessage("Action timer started. You can resume this any time today.");
  };

  const cancelTimedAction = (code: CreditActionCode) => {
    setActionRuntime((prev) => ({
      ...prev,
      [code]: { status: "idle" },
    }));
    setMessage("Action reset. You can start again when ready.");
  };

  const handleEarn = async (action: EarnAction) => {
    if (pendingAction || completedActions[action.code]) return;
    setPendingAction(action.code);
    const dynamicMetadata = {
      ...(action.metadata || {}),
      referenceId: String(action.metadata?.referenceId || `${action.code}_${new Date().toISOString().slice(0, 10)}`),
    };

    try {
      const response = await fetch("/api/alpha-sikka/earn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: action.code,
          metadata: dynamicMetadata,
          referenceId: (dynamicMetadata as { referenceId?: string })?.referenceId,
        }),
      });

      const result = await response.json();
      setMessage(result?.ok ? `+${result.awarded} A$ added` : result?.error || "No credits added");
      if (result?.ok) {
        setCompletedActions((prev) => ({ ...prev, [action.code]: true }));
        setActionRuntime((prev) => ({
          ...prev,
          [action.code]: { status: "completed" },
        }));
      }
      if (result?.ok && user) {
        await hydrateUserData(user.id, { force: true, silent: true });
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleRedeem = async (discountPercent: number, cost: number) => {
    const response = await fetch("/api/alpha-sikka/spend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: cost,
        category: "redemption",
        description: `${discountPercent}% reward redeemed`,
        referenceId: `redeem_${discountPercent}_${Date.now()}`,
      }),
    });

    const result = await response.json();
    setMessage(result?.ok ? `Redeemed ${discountPercent}% reward` : result?.error || "Unable to redeem");
    if (result?.ok && user) {
      await hydrateUserData(user.id, { force: true, silent: true });
    }
  };

  const dailyEarned = DAILY_CAP - snapshot.dailyCapRemaining;

  if (loading && !alphaSummary && alphaTransactions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
        <h1 className="text-3xl font-bold text-white">Sign in required</h1>
        <p className="text-zinc-400">Please sign in to view your Alpha Sikka dashboard and rewards.</p>
        <Link href="/" className="px-6 py-2 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition-colors">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="af-page space-y-8 pb-12 w-full animate-in fade-in duration-700">
      
      {/* 1. BALANCE PROGRESS HERO */}
      <div className="af-card rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2F6F57]/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex-1 space-y-4">
           <p className="text-xs font-semibold uppercase tracking-widest text-[#2F6F57]">Alpha Sikka Dashboard</p>
          <div className="flex items-baseline gap-4">
             <h1 className="text-clinical-heading text-6xl font-extrabold tracking-tight text-[#1F3D2B]">{formatAmount(snapshot.model.currentBalance)} <span className="text-3xl text-[#6B665D]">A$</span></h1>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-sm text-[#6B665D]">Tier: <strong className="text-[#1F3D2B]">{snapshot.tier.label}</strong></span>
             <span className="w-1 h-1 rounded-full bg-[#BEB7AC]" />
             <span className="text-sm text-[#6B665D]">Lifetime: {formatAmount(snapshot.model.totalEarned)} A$</span>
          </div>
           <p className="text-sm text-[#6B665D] max-w-xl">Earn and redeem A$ based on consistent routines, verified progress, and program completion. No noise, just measured effort translating into meaningful value.</p>
        </div>

        <div className="relative z-10 w-full md:w-auto flex flex-col items-center">
           <div className="w-40 h-40 relative">
            <svg height="160" width="160" className="transform -rotate-90">
              <circle stroke="#E2DDD4" fill="transparent" strokeWidth="8" r="72" cx="80" cy="80" />
              <circle stroke="#2F6F57" fill="transparent" strokeWidth="8" strokeDasharray="452" style={{ strokeDashoffset: 452 - (rewardProgress.percent / 100) * 452 }} strokeLinecap="round" r="72" cx="80" cy="80" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-[#1F3D2B]">{rewardProgress.percent}%</span>
              <span className="text-[10px] uppercase tracking-wider text-[#2F6F57] mt-1">Progress</span>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-[#6B665D]">
            {rewardProgress.next ? `Next Reward: ${rewardProgress.next.cost} A$` : 'Highest Tier Unlocked'}
          </p>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400 flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      {/* 2. DAILY EARNINGS & GROWTH ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Earnings Progress */}
        <div className="af-card rounded-3xl p-6 flex flex-col">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-bold text-[#1F3D2B] flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#2F6F57]" /> Daily Earnings</h3>
             <span className="text-xs text-[#6B665D] uppercase tracking-widest">{dailyEarned}/{DAILY_CAP} A$ Today</span>
           </div>
           
           <div className="space-y-6 flex-1 flex flex-col justify-center">
             <div>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-[#6B665D] font-medium">Daily Routine Cap</span>
                 <span className="text-[#1F3D2B] font-bold">{Math.round((dailyEarned/DAILY_CAP)*100)}%</span>
               </div>
               <div className="h-3 bg-[#F1EDE5] rounded-full overflow-hidden border border-[#E2DDD3]">
                 <div className="h-full bg-gradient-to-r from-[#8C6A5A] to-[#2F6F57] rounded-full transition-all" style={{ width: `${(dailyEarned/DAILY_CAP)*100}%`}}></div>
               </div>
             </div>
             
             <div>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-[#6B665D] font-medium">Challenge Milestones</span>
                 <span className="text-[#1F3D2B] font-bold">{programProgress.completedCount}/3</span>
               </div>
               <div className="h-3 bg-[#F1EDE5] rounded-full overflow-hidden border border-[#E2DDD3]">
                 <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all" style={{ width: `${(programProgress.completedCount/3)*100}%`}}></div>
               </div>
             </div>

              <div>
               <div className="flex justify-between text-sm mb-2">
                 <span className="text-[#6B665D] font-medium">Program Progress</span>
                 <span className="text-[#1F3D2B] font-bold">{programProgress.percent}%</span>
               </div>
               <div className="h-3 bg-[#F1EDE5] rounded-full overflow-hidden border border-[#E2DDD3]">
                 <div className="h-full bg-gradient-to-r from-[#2F6F57] to-[#8C6A5A] rounded-full transition-all" style={{ width: `${programProgress.percent}%`}}></div>
               </div>
             </div>
           </div>
        </div>

        {/* Growth Actions */}
        <div className="af-card rounded-3xl p-6">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-bold text-[#1F3D2B] flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#2F6F57]" /> Growth Actions</h3>
           </div>
           
           <div className="space-y-3">
             {EARN_ACTIONS.slice(0, 4).map((action) => (
                <div
                  key={action.code}
                  className="w-full bg-[#F8F6F3] border border-[#E2DDD3] hover:border-[#2F6F57]/40 transition-all rounded-2xl p-4"
                >
                  {(() => {
                    const config: ActionConfig = ACTION_CONFIG[action.code] || { mode: "instant" };
                    const runtime = getRuntimeState(action.code);
                    const completed = Boolean(completedActions[action.code]) || runtime.status === "completed";
                    const running = runtime.status === "running";
                    const remaining = getRemainingSec(action.code);
                    const canCompleteTimed = config.mode !== "timed" || remaining === 0;

                    return (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-left">
                            <p className="text-[#1F3D2B] font-medium">{action.label}</p>
                            <p className="text-xs text-[#6B665D]">
                              {completed
                                ? "Completed today"
                                : running
                                  ? remaining > 0
                                    ? `In progress · ${formatRemainingTime(remaining)} remaining`
                                    : "Ready to complete"
                                  : action.helper}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#E8F4EE] flex items-center justify-center">
                            <ArrowRight className="w-4 h-4 text-[#2F6F57]" />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {completed ? (
                            <span className="inline-flex items-center rounded-full border border-green-300 bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                              Completed
                            </span>
                          ) : config.mode === "timed" ? (
                            <>
                              {!running ? (
                                <button
                                  type="button"
                                  onClick={() => startTimedAction(action.code)}
                                  className="af-btn-soft px-3 py-1.5 text-xs"
                                >
                                  Start
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleEarn(action)}
                                  disabled={pendingAction === action.code || !canCompleteTimed}
                                  className="af-btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
                                >
                                  {pendingAction === action.code ? "Submitting..." : canCompleteTimed ? "Complete" : "Wait Timer"}
                                </button>
                              )}

                              {running && config.allowCancel && (
                                <button
                                  type="button"
                                  onClick={() => cancelTimedAction(action.code)}
                                  className="af-btn-soft px-3 py-1.5 text-xs"
                                >
                                  Cancel
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleEarn(action)}
                              disabled={pendingAction === action.code}
                              className="af-btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
                            >
                              {pendingAction === action.code ? "Submitting..." : "Complete"}
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
             ))}
           </div>
        </div>
      </div>

      {/* 3. REWARD LADDER */}
      <div className="af-card rounded-3xl p-6 lg:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F3D2B] flex items-center gap-2">
            <BadgePercent className="w-6 h-6 text-[#2F6F57]" /> Reward Ladder
          </h2>
          <p className="text-[#6B665D] mt-2 text-sm">Redeem your discipline for clinically meaningful clinical store discounts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {rewardCatalog.map((reward) => {
             const canRedeem = snapshot.model.currentBalance >= reward.cost;
             return (
              <div key={reward.id} className="relative bg-[#F8F6F3] border border-[#E2DDD3] rounded-2xl p-6 flex flex-col justify-between overflow-hidden group hover:border-[#2F6F57]/40 transition-colors">
                {canRedeem && <div className="absolute top-0 right-0 w-32 h-32 bg-[#2F6F57]/10 blur-[40px] pointer-events-none rounded-full" />}
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-3 py-1 rounded-full border border-[#E2DDD3] bg-white text-xs text-[#1F3D2B] font-semibold">{formatAmount(reward.cost)} A$</div>
                      {canRedeem && <div className="w-2 h-2 rounded-full bg-[#2F6F57] animate-pulse" />}
                    </div>
                    <p className="text-4xl font-bold text-[#1F3D2B] mb-2">{reward.discountPercent}% OFF</p>
                    <p className="text-xs text-[#6B665D]">Max 20% cart discount. Valid 30 days.</p>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward.discountPercent, reward.cost)}
                    disabled={!canRedeem}
                    className={`mt-8 w-full py-3 rounded-xl font-bold text-sm transition-all ${
                      canRedeem 
                      ? 'bg-[#1F3D2B] hover:bg-[#2F6F57] text-white' 
                      : 'bg-[#E8E2D8] text-[#8C877D] cursor-not-allowed'
                    }`}
                  >
                    {canRedeem ? 'Redeem Reward' : `Need ${reward.cost - snapshot.model.currentBalance} A$`}
                  </button>
               </div>
             );
          })}
        </div>
      </div>

      {/* 4. CLINICAL LEDGER */}
      <div className="af-card rounded-3xl p-6 lg:p-8">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-[#1F3D2B] flex items-center gap-2">
              <Clock3 className="w-6 h-6 text-[#6B665D]" /> Audit Ledger
            </h2>
            <p className="text-[#6B665D] mt-2 text-sm">Transparent history of all Alpha Sikka transactions.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[#6B665D] border-b border-[#E2DDD3]">
              <tr>
                <th className="pb-4 font-medium pr-4">Date</th>
                <th className="pb-4 font-medium pr-4 w-full">Activity</th>
                <th className="pb-4 font-medium text-right pr-4">Earned</th>
                <th className="pb-4 font-medium text-right pr-4">Spent</th>
                <th className="pb-4 text-right font-bold">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE7DC]">
              {history.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-[#8C877D]">No transactions recorded. Complete your protocol to start earning.</td></tr>
              ) : (
                history.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F8F6F3] transition-colors">
                    <td className="py-4 text-[#6B665D] pr-4">{new Date(tx.timestamp).toLocaleDateString()}</td>
                    <td className="py-4 text-[#1F3D2B] font-medium pr-4">{tx.label}</td>
                    <td className="py-4 text-green-400 text-right pr-4">{tx.type === 'earn' ? `+${tx.amount}` : '-'}</td>
                    <td className="py-4 text-red-400 text-right pr-4">{tx.type === 'spend' ? `-${tx.amount}` : '-'}</td>
                    <td className="py-4 text-[#1F3D2B] font-bold text-right">{tx.balanceAfter}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
