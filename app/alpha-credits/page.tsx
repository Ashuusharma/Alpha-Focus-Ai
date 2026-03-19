"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Clock3,
  Coins,
  Flame,
  History,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";

import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import {
  ALPHA_DAILY_CAP,
  buildTimelineItems,
  buildTodayMissions,
  formatTimelineTime,
  getDailyDisciplineEarned,
  getIndiaDateParts,
  getMissionCompletionRate,
  toAlphaWalletStreak,
  toAlphaWalletSummary,
} from "@/lib/alphaWallet";
import { refreshAlphaWallet } from "@/lib/alphaWalletClient";
import { getRewardCatalog, getRewardProgress } from "@/lib/couponService";
import { calculateDisciplineScore, getTierProgress } from "@/lib/rewardTierService";
import { AuthContext } from "@/contexts/AuthProvider";
import { useUserStore } from "@/stores/useUserStore";

function formatAmount(amount: number) {
  return `${amount.toLocaleString()} A$`;
}

function statusCopy(status: "locked" | "available" | "completed", isExpired: boolean) {
  if (status === "completed") return { label: "Completed", tone: "text-green-700 bg-green-50 border-green-200" };
  if (isExpired) return { label: "Expired", tone: "text-amber-700 bg-amber-50 border-amber-200" };
  if (status === "available") return { label: "Available now", tone: "text-[#1F3D2B] bg-[#E8F4EE] border-[#B9D8C9]" };
  return { label: "Locked", tone: "text-[#6B665D] bg-[#F5F1EA] border-[#E2DDD3]" };
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#E7E0D4]">
      <div className="h-full rounded-full bg-gradient-to-r from-[#1F3D2B] to-[#2F6F57] transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export default function AlphaCreditsPage() {
  const { user } = useContext(AuthContext);
  const loading = useUserStore((state) => state.loading);
  const alphaSummary = useUserStore((state) => state.alphaSummary as Record<string, unknown> | null);
  const alphaTransactions = useUserStore((state) => state.alphaTransactions as Array<Record<string, unknown>>);
  const alphaStreak = useUserStore((state) => state.alphaStreak as Record<string, unknown> | null);
  const [now, setNow] = useState<Date>(new Date());
  const [message, setMessage] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (alphaSummary && alphaTransactions.length > 0) return;
    void refreshAlphaWallet(user.id).catch(() => undefined);
  }, [user?.id, alphaSummary, alphaTransactions.length]);

  const summary = useMemo(() => toAlphaWalletSummary(alphaSummary), [alphaSummary]);
  const streak = useMemo(() => toAlphaWalletStreak(alphaStreak), [alphaStreak]);
  const rewardCatalog = useMemo(() => getRewardCatalog(), []);
  const indiaClock = useMemo(() => getIndiaDateParts(now), [now]);
  const missions = useMemo(() => buildTodayMissions(alphaTransactions, now), [alphaTransactions, now]);
  const timeline = useMemo(() => buildTimelineItems(alphaSummary, alphaTransactions), [alphaSummary, alphaTransactions]);
  const rewardProgress = useMemo(() => getRewardProgress(summary.current_balance), [summary.current_balance]);
  const tierProgress = useMemo(() => getTierProgress(summary.lifetime_earned), [summary.lifetime_earned]);
  const todayDisciplineEarned = useMemo(() => getDailyDisciplineEarned(alphaTransactions, indiaClock.dateKey), [alphaTransactions, indiaClock.dateKey]);
  const completionRate = useMemo(() => getMissionCompletionRate(missions), [missions]);
  const discipline = useMemo(
    () => calculateDisciplineScore({
      completedDailyTasks: missions.filter((mission) => mission.status === "completed").length,
      totalDailyTasks: missions.length,
    }),
    [missions]
  );
  const recentRedemptions = useMemo(() => timeline.filter((item) => item.direction === "spend").slice(0, 3), [timeline]);

  const nextStreakTarget = streak.current_streak < 7 ? 7 : streak.current_streak < 30 ? 30 : null;
  const nextStreakReward = nextStreakTarget === 7 ? 15 : nextStreakTarget === 30 ? 75 : 0;

  const handleRedeem = async (reward: { id: string; cost: number; discountPercent: number }) => {
    if (!user || redeemingId) return;
    setRedeemingId(reward.id);

    try {
      const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/alpha-sikka/spend", {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount: reward.cost,
          category: "redemption",
          cartTotal: 1000,
          description: `${reward.discountPercent}% reward redeemed`,
          referenceId: `redeem:${reward.id}:${indiaClock.dateKey}`,
          metadata: {
            rewardId: reward.id,
            discountPercent: reward.discountPercent,
          },
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string; message?: string };
      setMessage(payload.ok ? `Redeemed ${reward.discountPercent}% reward.` : payload.message || payload.error || "Unable to redeem reward.");
    } catch {
      setMessage("Unable to redeem reward.");
    } finally {
      setRedeemingId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-4 text-center">
          <h1 className="text-clinical-heading text-3xl font-extrabold text-white">Sign in required</h1>
          <p className="text-zinc-400">Please sign in to view your Alpha Wallet and rewards engine.</p>
          <Link href="/" className="inline-flex rounded-full bg-green-500 px-6 py-3 font-bold text-black transition-colors hover:bg-green-400">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !alphaSummary && alphaTransactions.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2F6F57] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="af-page w-full animate-in space-y-8 pb-12 fade-in duration-700">
      {message ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          <span>{message}</span>
        </div>
      ) : null}

      <section className="af-card relative overflow-hidden rounded-[2rem] p-8 md:p-10">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/3 translate-x-1/4 rounded-full bg-[#2F6F57]/10 blur-[90px]" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/3 rounded-full bg-[#8C6A5A]/10 blur-[80px]" />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#D9D1C3] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#2F6F57]">
                Alpha Wallet
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#CFE3D7] bg-[#E8F4EE] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1F3D2B]">
                <ShieldCheck className="h-3.5 w-3.5" /> Live sync active
              </span>
              <span className="rounded-full border border-[#E2DDD3] bg-[#F7F3ED] px-3 py-1 text-[11px] font-semibold text-[#6B665D]">
                IST {indiaClock.label}
              </span>
            </div>

            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8C6A5A]">Current balance</p>
              <h1 className="text-clinical-heading mt-2 text-5xl font-extrabold tracking-tight text-[#1F3D2B] sm:text-6xl">
                {summary.current_balance.toLocaleString()} <span className="text-3xl text-[#6B665D]">A$</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6B665D]">
                Real-time Alpha Sikka balance backed by the transaction ledger. Inserts stream into the UI live, while duplicate rewards stay blocked at the database layer.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Total earned</p>
                <p className="mt-2 text-2xl font-black text-[#1F3D2B]">{formatAmount(summary.lifetime_earned)}</p>
              </div>
              <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Total spent</p>
                <p className="mt-2 text-2xl font-black text-[#1F3D2B]">{formatAmount(summary.lifetime_spent)}</p>
              </div>
              <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Tier</p>
                <p className="mt-2 text-2xl font-black text-[#1F3D2B]">{tierProgress.tier.label}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl bg-gradient-to-br from-[#1F3D2B] via-[#244735] to-[#102117] p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Tier progress</p>
                  <p className="mt-2 text-2xl font-black">{tierProgress.percentToNext}%</p>
                </div>
                <Wallet className="h-8 w-8 text-white/80" />
              </div>
              <div className="mt-4">
                <ProgressBar value={tierProgress.percentToNext} />
              </div>
              <p className="mt-3 text-sm text-white/80">
                {tierProgress.nextTier ? `${tierProgress.remainingToNext} A$ to ${tierProgress.nextTier.label}` : "Top tier unlocked"}
              </p>
            </div>

            <div className="rounded-3xl border border-[#E2DDD3] bg-[#F8F6F3] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C6A5A]">Redeem readiness</p>
                  <p className="mt-2 text-2xl font-black text-[#1F3D2B]">{rewardProgress.percent}%</p>
                </div>
                <BadgePercent className="h-8 w-8 text-[#2F6F57]" />
              </div>
              <div className="mt-4">
                <ProgressBar value={rewardProgress.percent} />
              </div>
              <p className="mt-3 text-sm text-[#6B665D]">
                {rewardProgress.next ? `Next unlock at ${formatAmount(rewardProgress.next.cost)}` : "All reward tiers unlocked"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="af-card rounded-[2rem] p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C6A5A]">2. Today’s Earnings Mission</p>
            <h2 className="text-clinical-heading mt-2 text-3xl font-extrabold text-[#1F3D2B]">Time-windowed earning engine</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#6B665D]">
              Missions run on India Standard Time. Future windows stay locked, completed windows resolve automatically, and missed windows expire without another reward write.
            </p>
          </div>
          <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Today</p>
            <p className="mt-1 text-xl font-black text-[#1F3D2B]">{formatAmount(todayDisciplineEarned)} / {formatAmount(ALPHA_DAILY_CAP)}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {missions.map((mission) => {
            const status = statusCopy(mission.status, mission.isExpired);

            return (
              <div key={mission.id} className="rounded-3xl border border-[#E2DDD3] bg-[#FBF9F5] p-5 transition-colors hover:border-[#2F6F57]/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#E8F4EE] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#1F3D2B]">
                        {mission.type}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.tone}`}>
                        {status.label}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-black text-[#1F3D2B]">{mission.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#6B665D]">{mission.description}</p>
                  </div>
                  <div className="rounded-2xl border border-[#D9D1C3] bg-white px-3 py-2 text-right">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Reward</p>
                    <p className="mt-1 text-lg font-black text-[#1F3D2B]">+{mission.reward} A$</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E9E1D6] pt-4">
                  <div className="flex items-center gap-2 text-sm text-[#6B665D]">
                    <Clock3 className="h-4 w-4 text-[#2F6F57]" />
                    {mission.timeWindow.start} - {mission.timeWindow.end} IST
                  </div>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full border border-[#D4CCBE] bg-white px-4 py-2 text-sm font-semibold text-[#1F3D2B] transition-colors hover:border-[#2F6F57] hover:text-[#2F6F57]"
                  >
                    {mission.status === "completed" ? "Verified" : mission.isExpired ? "View routine" : mission.status === "available" ? "Complete in dashboard" : "Wait for window"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="af-card rounded-[2rem] p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C6A5A]">3. Streak & Discipline Engine</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-gradient-to-br from-[#1F3D2B] to-[#2F6F57] p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Current streak</p>
                  <p className="mt-2 text-4xl font-black">{streak.current_streak}</p>
                </div>
                <Flame className="h-8 w-8 text-orange-300" />
              </div>
              <p className="mt-3 text-sm text-white/80">Live from the streak table and updated when discipline rewards land.</p>
            </div>

            <div className="rounded-3xl border border-[#E2DDD3] bg-[#F8F6F3] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Discipline score</p>
              <p className="mt-2 text-4xl font-black text-[#1F3D2B]">{discipline.score}</p>
              <p className="mt-3 text-sm text-[#6B665D]">{discipline.label} execution across today&apos;s mission windows.</p>
            </div>

            <div className="rounded-3xl border border-[#E2DDD3] bg-[#F8F6F3] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Longest streak</p>
              <p className="mt-2 text-4xl font-black text-[#1F3D2B]">{streak.longest_streak}</p>
              <p className="mt-3 text-sm text-[#6B665D]">Securely tracked server-side, not reconstructed from local storage.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-[#E2DDD3] bg-[#FBF9F5] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Next streak bonus</p>
                  <h3 className="mt-2 text-2xl font-black text-[#1F3D2B]">
                    {nextStreakTarget ? `${nextStreakTarget}-day milestone` : "All core bonuses unlocked"}
                  </h3>
                </div>
                <Target className="h-6 w-6 text-[#2F6F57]" />
              </div>
              <p className="mt-3 text-sm text-[#6B665D]">
                {nextStreakTarget
                  ? `${Math.max(0, nextStreakTarget - streak.current_streak)} days remaining for +${nextStreakReward} A$`
                  : "7-day and 30-day bonuses are already cleared."}
              </p>
            </div>

            <div className="rounded-3xl border border-[#E2DDD3] bg-[#FBF9F5] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Daily discipline cap</p>
                  <h3 className="mt-2 text-2xl font-black text-[#1F3D2B]">{formatAmount(Math.max(0, ALPHA_DAILY_CAP - todayDisciplineEarned))} left</h3>
                </div>
                <Coins className="h-6 w-6 text-[#2F6F57]" />
              </div>
              <div className="mt-4">
                <ProgressBar value={(todayDisciplineEarned / ALPHA_DAILY_CAP) * 100} />
              </div>
              <p className="mt-3 text-sm text-[#6B665D]">Mission completion rate is {completionRate}% for today.</p>
            </div>
          </div>
        </div>

        <div className="af-card rounded-[2rem] p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C6A5A]">4. Reward Unlock Ladder</p>
          <div className="mt-5 space-y-4">
            {rewardCatalog.map((reward) => {
              const unlocked = summary.current_balance >= reward.cost;
              const progress = Math.min(100, Math.round((summary.current_balance / reward.cost) * 100));

              return (
                <div key={reward.id} className="rounded-3xl border border-[#E2DDD3] bg-[#FBF9F5] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Unlock tier</p>
                      <h3 className="mt-2 text-2xl font-black text-[#1F3D2B]">{reward.discountPercent}% reward</h3>
                      <p className="mt-2 text-sm text-[#6B665D]">Redeem after reaching {formatAmount(reward.cost)} balance.</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${unlocked ? "bg-[#E8F4EE] text-[#1F3D2B]" : "bg-[#F1ECE4] text-[#8C6A5A]"}`}>
                      {unlocked ? "Unlocked" : `${reward.cost - summary.current_balance} A$ left`}
                    </span>
                  </div>
                  <div className="mt-4">
                    <ProgressBar value={progress} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="af-card rounded-[2rem] p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C6A5A]">5. Spend / Redeem Section</p>
            <h2 className="text-clinical-heading mt-2 text-3xl font-extrabold text-[#1F3D2B]">Spend controlled, redeem secure</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#6B665D]">
              Redemptions still flow through the protected spend endpoint. No client-side balance mutation happens outside the server transaction RPC.
            </p>
          </div>
          <div className="rounded-2xl border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-3 text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Available balance</p>
            <p className="mt-1 text-2xl font-black text-[#1F3D2B]">{formatAmount(summary.current_balance)}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rewardCatalog.map((reward) => {
              const canRedeem = summary.current_balance >= reward.cost;

              return (
                <div key={reward.id} className="rounded-3xl border border-[#E2DDD3] bg-[#FBF9F5] p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8C6A5A]">Redeemable</p>
                  <h3 className="mt-2 text-3xl font-black text-[#1F3D2B]">{reward.discountPercent}%</h3>
                  <p className="mt-2 text-sm text-[#6B665D]">Cost: {formatAmount(reward.cost)}</p>
                  <button
                    type="button"
                    onClick={() => void handleRedeem(reward)}
                    disabled={!canRedeem || redeemingId === reward.id}
                    className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition-colors ${canRedeem ? "bg-[#1F3D2B] text-white hover:bg-[#2F6F57]" : "cursor-not-allowed bg-[#E7E0D4] text-[#8C877D]"}`}
                  >
                    {redeemingId === reward.id ? "Redeeming..." : canRedeem ? "Redeem now" : `Need ${reward.cost - summary.current_balance} A$`}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="rounded-3xl border border-[#E2DDD3] bg-[#FBF9F5] p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#2F6F57]" />
              <h3 className="text-xl font-black text-[#1F3D2B]">Recent redemption flow</h3>
            </div>
            <div className="mt-5 space-y-3">
              {recentRedemptions.length === 0 ? (
                <p className="text-sm text-[#6B665D]">No redemption recorded yet. Once you spend A$, the transaction appears here in real time.</p>
              ) : (
                recentRedemptions.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[#E2DDD3] bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#1F3D2B]">{item.description}</p>
                        <p className="mt-1 text-xs text-[#6B665D]">{formatTimelineTime(item.created_at)} · Balance after {formatAmount(item.balance_after)}</p>
                      </div>
                      <span className="rounded-full bg-[#FBEAEA] px-3 py-1 text-sm font-bold text-[#B45309]">-{item.absoluteAmount} A$</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="af-card rounded-[2rem] p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C6A5A]">6. Activity Timeline</p>
            <h2 className="text-clinical-heading mt-2 text-3xl font-extrabold text-[#1F3D2B]">Live transaction stream</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#6B665D]">
              Timeline cards update from the wallet transaction feed. Inserts patch the store directly, while edge-case updates fall back to a wallet-only summary refresh.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-2 text-sm font-semibold text-[#1F3D2B]">
            <History className="h-4 w-4 text-[#2F6F57]" /> {timeline.length} recent events
          </div>
        </div>

        <div className="space-y-4">
          {timeline.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#D8D0C3] bg-[#FBF9F5] p-8 text-center">
              <p className="text-sm text-[#6B665D]">No wallet activity yet. Complete a mission or redeem a reward to start the timeline.</p>
            </div>
          ) : (
            timeline.slice(0, 14).map((item) => {
              const directionTone = item.direction === "earn" ? "text-green-700 bg-green-50" : "text-[#B45309] bg-[#FCEBDD]";

              return (
                <article key={item.id} className="rounded-3xl border border-[#E2DDD3] bg-[#FBF9F5] p-5 transition-colors hover:border-[#2F6F57]/30">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 rounded-2xl p-3 ${item.direction === "earn" ? "bg-[#E8F4EE]" : "bg-[#FCEBDD]"}`}>
                        {item.direction === "earn" ? <Sparkles className="h-5 w-5 text-[#1F3D2B]" /> : <LockKeyhole className="h-5 w-5 text-[#B45309]" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#1F3D2B]">{item.description}</h3>
                        <p className="mt-1 text-sm text-[#6B665D]">{item.category} · {formatTimelineTime(item.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <span className={`rounded-full px-3 py-1 text-sm font-bold ${directionTone}`}>
                        {item.direction === "earn" ? "+" : "-"}{item.absoluteAmount} A$
                      </span>
                      <span className="rounded-full border border-[#D9D1C3] bg-white px-3 py-1 text-sm font-semibold text-[#1F3D2B]">
                        Balance after {formatAmount(item.balance_after)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
