"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { CreditActionCode } from "@/lib/creditService";
import {
  getRewardCatalog,
  getRewardProgress,
} from "@/lib/couponService";
import { calculateDisciplineScore, getTierProgress } from "@/lib/rewardTierService";
import { supabase } from "@/lib/supabaseClient";
import { AuthContext } from "@/contexts/AuthProvider";
import { useUserStore } from "@/stores/useUserStore";

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

const EARN_ACTIONS: EarnAction[] = [
  { code: "daily_login", label: "Daily login", helper: "+2 A$ / day" },
  { code: "log_am_routine", label: "AM routine completed", helper: "+3 A$ / day" },
  { code: "log_pm_routine", label: "PM routine completed", helper: "+3 A$ / day" },
  { code: "hydration_goal", label: "Hydration goal met", helper: "+2 A$ / day" },
  { code: "sleep_goal", label: "Sleep goal met", helper: "+2 A$ / day" },
  { code: "full_day_completed", label: "Full day completed", helper: "+5 A$ bonus" },
  {
    code: "improve_alpha_5",
    label: "Reassessment: +5% Alpha Score",
    helper: "+10 A$ once per reassessment",
    metadata: { percent: 5, reassessmentId: "rea_demo_5" },
  },
  {
    code: "severity_drop_one_level",
    label: "Reassessment: Severity drop",
    helper: "+20 A$ once per reassessment",
    metadata: { dropped: true, reassessmentId: "rea_demo_severity" },
  },
  { code: "challenge_weekly_milestone", label: "Challenge weekly milestone", helper: "+20 A$" },
  { code: "challenge_30_complete", label: "30-Day Glow Up completed", helper: "+120 A$" },
  { code: "streak_30", label: "30-day streak milestone", helper: "+120 A$" },
];

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

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

function buildSnapshotFromApi(payload: {
  summary?: {
    currentBalance?: number;
    lifetimeEarned?: number;
    lifetimeSpent?: number;
    tierLevel?: string;
  };
  transactions?: Array<{
    id: string;
    amount: number;
    category: string;
    description?: string;
    created_at: string;
  }>;
}): LedgerSnapshot {
  const summary = payload.summary;
  const transactions = (payload.transactions || []).map((tx) => {
    const amount = Number(tx.amount || 0);
    return {
      id: tx.id,
      type: amount >= 0 ? "earn" : "spend",
      source: tx.category,
      label: tx.description || tx.category,
      amount: Math.abs(amount),
      timestamp: tx.created_at,
      balanceAfter: 0,
    } as LedgerTransaction;
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayDisciplineEarned = transactions
    .filter((tx) => tx.type === "earn" && tx.source === "discipline" && tx.timestamp.slice(0, 10) === today)
    .reduce((sum, tx) => sum + tx.amount, 0);

  return {
    model: {
      currentBalance: Number(summary?.currentBalance || 0),
      totalEarned: Number(summary?.lifetimeEarned || 0),
      totalSpent: Number(summary?.lifetimeSpent || 0),
    },
    tier: {
      label: toTierLabel(summary?.tierLevel),
    },
    dailyCapRemaining: Math.max(0, DAILY_CAP - todayDisciplineEarned),
    transactions,
  };
}

export default function AlphaCreditsPage() {
  const { user } = useContext(AuthContext);
  const setStoreAlphaSummary = useUserStore((state) => state.setAlphaSummary);
  const [snapshot, setSnapshot] = useState<LedgerSnapshot>(EMPTY_SNAPSHOT);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      if (!user) {
        setSnapshot(EMPTY_SNAPSHOT);
        setLoading(false);
        return;
      }

      const accessToken = await getAccessToken();
      if (!accessToken) {
        setMessage("Missing session token. Please sign in again.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/alpha-sikka/summary", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMessage(data?.error || "Unable to load Alpha Sikka summary.");
        setLoading(false);
        return;
      }

      setSnapshot(buildSnapshotFromApi(data));
      setStoreAlphaSummary(data.summary || null);
      setLoading(false);
    };

    loadSummary();
  }, [user, setStoreAlphaSummary]);

  const refreshSummary = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setMessage("Missing session token. Please sign in again.");
      return;
    }

    const res = await fetch("/api/alpha-sikka/summary", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok || !data?.ok) {
      setMessage(data?.error || "Unable to refresh Alpha Sikka summary.");
      return;
    }

    setSnapshot(buildSnapshotFromApi(data));
    setStoreAlphaSummary(data.summary || null);
  };

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

  const handleEarn = async (action: EarnAction) => {
    const dynamicMetadata = {
      ...(action.metadata || {}),
      referenceId: String(action.metadata?.referenceId || `${action.code}_${Date.now()}`),
    };

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setMessage("Missing session token. Please sign in again.");
      return;
    }

    const response = await fetch("/api/alpha-sikka/earn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        action: action.code,
        metadata: dynamicMetadata,
        referenceId: (dynamicMetadata as { referenceId?: string })?.referenceId,
      }),
    });

    const result = await response.json();
    setMessage(result?.ok ? `+${result.awarded} A$ added` : result?.error || "No credits added");
    await refreshSummary();
  };

  const handleRedeem = async (discountPercent: number, cost: number) => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setMessage("Missing session token. Please sign in again.");
      return;
    }

    const response = await fetch("/api/alpha-sikka/spend", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
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
    await refreshSummary();
  };

  const dailyEarned = DAILY_CAP - snapshot.dailyCapRemaining;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] text-[#1F3D2B] pb-20">
        <div className="mx-auto max-w-7xl px-6 pt-16">
          <p className="text-sm text-[#6B665D]">Loading Alpha Sikka ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#1F3D2B] pb-20">
      <div className="mx-auto max-w-7xl px-6 pt-16 space-y-10">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#6B665D]">Alpha Sikka</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">Clinical Discipline Ledger</h1>
            <p className="text-[#6B665D] mt-2 max-w-2xl">
              Earn and redeem Alpha Sikka (A$) based on consistent routines, verified progress,
              and program completion. No noise, just measured effort translating into meaningful value.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-[#6B665D]">
            <ShieldCheck className="h-5 w-5 text-[#2F6F57]" />
            <span>Fairness controls active · Caps enforced</span>
          </div>
        </header>

        {message && (
          <div className="rounded-xl border border-[#C8DACF] bg-white px-4 py-3 text-sm text-[#1F3D2B] flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-[#2F6F57]" />
            <span>{message}</span>
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-[#E2DDD4] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div>
                <p className="text-sm text-[#6B665D]">Current Balance</p>
                <p className="text-4xl font-bold">{formatAmount(snapshot.model.currentBalance)}</p>
                <p className="text-sm text-[#6B665D]">Lifetime earned {formatAmount(snapshot.model.totalEarned)} · Spent {formatAmount(snapshot.model.totalSpent)}</p>
              </div>
              <div className="rounded-xl bg-[#1F3D2B] text-white px-4 py-3 text-sm">
                <p className="opacity-80">Tier</p>
                <p className="text-lg font-semibold">{snapshot.tier.label}</p>
                <p className="text-[11px] opacity-80">
                  {tierProgress.nextTier
                    ? `${tierProgress.remainingToNext} A$ to ${tierProgress.nextTier.label}`
                    : "Top tier reached"}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div>
                <div className="flex items-center justify-between text-sm text-[#6B665D]">
                  <span>Daily routine completion</span>
                  <span>{dailyEarned}/{DAILY_CAP} A$</span>
                </div>
                <ProgressBar value={dailyEarned} max={DAILY_CAP} />
                <p className="text-xs text-[#6B665D] mt-1">Daily cap enforced to prevent routine spam.</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm text-[#6B665D]">
                  <span>Challenge progress</span>
                  <span>{programProgress.completedCount}/3 completed</span>
                </div>
                <ProgressBar value={programProgress.percent} max={100} />
                <p className="text-xs text-[#6B665D] mt-1">Challenge milestones drive major A$ boosts.</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm text-[#6B665D]">
                  <span>Program progress</span>
                  <span>{programProgress.percent}%</span>
                </div>
                <ProgressBar value={programProgress.percent} max={100} />
                <p className="text-xs text-[#6B665D] mt-1">
                  {programProgress.nextLabel
                    ? `Next: ${programProgress.nextLabel}`
                    : "All mastery programs completed."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2DDD4] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B665D]">Progress to next reward</p>
                <p className="text-xl font-bold">{rewardProgress.next ? `${rewardProgress.remaining} A$ remaining` : "Highest reward unlocked"}</p>
              </div>
              <BadgePercent className="h-10 w-10 text-[#2F6F57]" />
            </div>
            <ProgressBar value={rewardProgress.percent} max={100} />
            <p className="text-sm text-[#6B665D]">
              {rewardProgress.next
                ? `Next: ${rewardProgress.next.discountPercent}% off at ${rewardProgress.next.cost} A$`
                : "You have unlocked the rare 60% tier. Redeem before expiration windows."}
            </p>
            <div className="rounded-xl bg-[#F4EFE6] border border-[#E2DDD4] p-4 text-sm text-[#1F3D2B] space-y-2">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                <span>Coupons expire 7 days after issuance.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>One coupon per checkout. No stacking.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-[#E2DDD4] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#6B665D]">Earn more A$</p>
                <h2 className="text-2xl font-bold">Discipline-backed earning</h2>
                <p className="text-sm text-[#6B665D]">Progressive actions with caps and validation. No random rewards.</p>
              </div>
              <Sparkles className="h-6 w-6 text-[#2F6F57]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {EARN_ACTIONS.map((action) => (
                <button
                  key={action.code}
                  onClick={() => handleEarn(action)}
                  className="group rounded-xl border border-[#E2DDD4] bg-white px-4 py-3 text-left shadow-sm hover:border-[#1F3D2B] hover:-translate-y-[2px] transition-all"
                >
                  <p className="text-sm font-semibold text-[#1F3D2B]">{action.label}</p>
                  <p className="text-xs text-[#6B665D]">{action.helper}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#2F6F57]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Validated before issuing</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2DDD4] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B665D]">Recent redemptions</p>
                <p className="text-lg font-bold">{recentRedemptions.length} entries</p>
              </div>
              <TrendingUp className="h-5 w-5 text-[#2F6F57]" />
            </div>
            <div className="space-y-2 text-sm text-[#6B665D]">
              {recentRedemptions.length === 0 && <p>No recent redemptions yet.</p>}
              {recentRedemptions.map((tx) => (
                <div key={tx.id} className="rounded-lg border border-[#E2DDD4] px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1F3D2B]">Spend {tx.amount} A$</span>
                    <span className="text-xs text-[#6B665D]">{new Date(tx.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-[#6B665D]">{tx.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E2DDD4] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#6B665D]">Available rewards</p>
              <h2 className="text-2xl font-bold">Redeem clinically meaningful discounts</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rewardCatalog.map((reward) => {
              const canRedeem = snapshot.model.currentBalance >= reward.cost;
              return (
                <div key={reward.id} className="rounded-xl border border-[#E2DDD4] bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#6B665D]">Costs {formatAmount(reward.cost)}</p>
                      <p className="text-xl font-bold">{reward.discountPercent}% off</p>
                    </div>
                    <BadgePercent className="h-8 w-8 text-[#2F6F57]" />
                  </div>
                  <p className="text-xs text-[#6B665D] mt-2">Coupon expires in 7 days. One-time use per checkout.</p>
                  <button
                    onClick={() => handleRedeem(reward.discountPercent, reward.cost)}
                    disabled={!canRedeem}
                    className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                      canRedeem
                        ? "bg-[#1F3D2B] text-white hover:bg-[#2A5239]"
                        : "bg-[#E2DDD4] text-[#6B665D] cursor-not-allowed"
                    }`}
                  >
                    {canRedeem ? "Redeem" : `Need ${reward.cost - snapshot.model.currentBalance} A$`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-[#E2DDD4] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#6B665D]">Credit history</p>
                <h2 className="text-2xl font-bold">Audit-ready ledger</h2>
              </div>
              <ArrowRight className="h-5 w-5 text-[#2F6F57]" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[#6B665D] border-b border-[#E2DDD4]">
                  <tr>
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Activity</th>
                    <th className="py-2 pr-3 text-right">Earned</th>
                    <th className="py-2 pr-3 text-right">Spent</th>
                    <th className="py-2 pr-3 text-right">Balance after</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-[#6B665D]">
                        No transactions yet. Complete routines to start earning.
                      </td>
                    </tr>
                  )}
                  {history.map((tx) => (
                    <tr key={tx.id} className="border-b border-[#E2DDD4]/60">
                      <td className="py-2 pr-3 text-[#6B665D]">{new Date(tx.timestamp).toLocaleDateString()}</td>
                      <td className="py-2 pr-3 text-[#1F3D2B] font-medium">{tx.label}</td>
                      <td className="py-2 pr-3 text-right text-[#2F6F57]">{tx.type === "earn" ? `+${tx.amount}` : ""}</td>
                      <td className="py-2 pr-3 text-right text-[#C94F3D]">{tx.type === "spend" ? tx.amount : ""}</td>
                      <td className="py-2 pr-3 text-right font-semibold text-[#1F3D2B]">{tx.balanceAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2DDD4] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B665D]">Discipline score</p>
                <p className="text-3xl font-bold">{discipline.score}</p>
                <p className="text-sm text-[#6B665D]">{discipline.label}</p>
              </div>
              <Sparkles className="h-6 w-6 text-[#2F6F57]" />
            </div>
            <p className="text-sm text-[#6B665D]">
              Discipline Score is derived as: (Completed Daily Tasks / Total Daily Tasks) × 100.
            </p>
            <div className="space-y-2 text-sm text-[#1F3D2B]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2F6F57]" />
                <span>Fairness controls: daily discipline cap = {DAILY_CAP} A$</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2F6F57]" />
                <span>Tier based on lifetime earned A$: {snapshot.tier.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2F6F57]" />
                <span>Coupons expire in 7 days; no stacking.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
