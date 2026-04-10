"use client";

import { useContext, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Flame,
  LockKeyhole,
  Play,
  Radio,
  CheckCircle,
  ShieldAlert,
  Sparkles,
  Tag,
} from "lucide-react";

import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import {
  buildTimelineItems,
  buildTodayMissions,
  formatTimelineTime,
  getCompletedCoreMissionCount,
  getIndiaDateParts,
  toAlphaWalletStreak,
  toAlphaWalletSummary,
} from "@/lib/alphaWallet";
import { refreshAlphaWallet } from "@/lib/alphaWalletClient";
import { buildRewardProductHref, getRewardFeaturedProduct } from "@/lib/alphaRewardCommerce";
import { ALPHA_REWARD_SYSTEM } from "@/lib/alphaRewardSystem";
import { getRewardCatalog, getRewardProgress } from "@/lib/couponService";
import { createRewardUnlock } from "@/lib/rewardUnlockService";
import { trackRewardEvent } from "@/lib/rewardTracking";
import { AuthContext } from "@/contexts/AuthProvider";
import { useUserStore } from "@/stores/useUserStore";

import { AlphaCoin } from "./_components/AlphaCoin";
import { RewardUnlockModal, type RewardUnlockModalData } from "./_components/RewardUnlockModal";

function ProgressBar({ value, color = "bg-[#22C55E]", trackColor = "bg-[#d9d9de]/50", height = "h-2" }: { value: number; color?: string; trackColor?: string; height?: string }) {
  return (
    <div className={`w-full overflow-hidden rounded-full ${trackColor} ${height}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`}
      />
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

  // Modal State for Unlocks
  const [showUnlockModal, setShowUnlockModal] = useState<RewardUnlockModalData | null>(null);

  // Micro-interactions states
  const previousBalanceRef = useRef(alphaSummary ? Number(alphaSummary.current_balance || 0) : 0);
  const [recentEarn, setRecentEarn] = useState<number | null>(null);

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
  const rewardCatalog = useMemo(() => getRewardCatalog(), []);
  
  useEffect(() => {
    const previousBalance = previousBalanceRef.current;

    if (summary.current_balance > previousBalance) {
      const diff = summary.current_balance - previousBalance;
      setRecentEarn(diff);
      const t = setTimeout(() => setRecentEarn(null), 3000);
      const newlyUnlocked = [...rewardCatalog]
        .filter((reward) => previousBalance < reward.cost && summary.current_balance >= reward.cost)
        .sort((left, right) => right.cost - left.cost)[0];

      if (newlyUnlocked && typeof window !== "undefined" && user?.id) {
        const seenKey = `alpha-unlock:${user.id}:${newlyUnlocked.id}`;
        if (!window.sessionStorage.getItem(seenKey)) {
          const featuredProduct = getRewardFeaturedProduct(newlyUnlocked.discountPercent);
          const activeReward = createRewardUnlock({
            discountPercent: newlyUnlocked.discountPercent,
            productId: featuredProduct?.sku || null,
            rewardId: newlyUnlocked.id,
            source: "reward_unlock",
          });
          window.sessionStorage.setItem(seenKey, "1");
          setShowUnlockModal({
            discountPercent: newlyUnlocked.discountPercent,
            title: `You unlocked ${newlyUnlocked.discountPercent}% OFF`,
            body: featuredProduct
              ? `Your balance hit ${summary.current_balance} A$. ${featuredProduct.name} is the fastest path to convert this unlock.`
              : `Your balance hit ${summary.current_balance} A$. The next step is simple: shop while the momentum is high.`,
            ctaLabel: "Shop Now",
            href: buildRewardProductHref(newlyUnlocked.discountPercent),
            expiresAt: activeReward.expiresAt,
            productName: featuredProduct?.name || null,
          });
        }
      }

      previousBalanceRef.current = summary.current_balance;
      return () => clearTimeout(t);
    }
    if (summary.current_balance < previousBalance) {
      previousBalanceRef.current = summary.current_balance;
    }
  }, [rewardCatalog, summary.current_balance, user?.id]);

  const streak = useMemo(() => toAlphaWalletStreak(alphaStreak), [alphaStreak]);
  const indiaClock = useMemo(() => getIndiaDateParts(now), [now]);
  const missions = useMemo(() => buildTodayMissions(alphaTransactions, now), [alphaTransactions, now]);
  const timeline = useMemo(() => buildTimelineItems(alphaSummary, alphaTransactions), [alphaSummary, alphaTransactions]);
  const rewardProgress = useMemo(() => getRewardProgress(summary.current_balance), [summary.current_balance]);
  const completedMissionsCount = missions.filter(m => m.status === "completed").length;
  const completedCoreMissionCount = getCompletedCoreMissionCount(missions);
  const bonusProgress = Math.min(100, Math.round((completedCoreMissionCount / ALPHA_REWARD_SYSTEM.taskBonus.threshold) * 100));
  const missedMissionCount = missions.filter((mission) => mission.status === "missed").length;
  const nextMission = missions.find((mission) => mission.status === "available") || missions.find((mission) => mission.status === "locked") || null;
  const liveSyncLabel = timeline[0]?.created_at ? `Live sync  -  ${formatTimelineTime(timeline[0].created_at)}` : "Live sync active";
  
  const nextStreakTarget = streak.current_streak < 7 ? 7 : streak.current_streak < 30 ? 30 : null;
  const nextStreakReward = nextStreakTarget === 7 ? ALPHA_REWARD_SYSTEM.streakBonus[7] : nextStreakTarget === 30 ? ALPHA_REWARD_SYSTEM.streakBonus[30] : 0;
  const todayMissions = missions.slice(0, 3);

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
      if (payload.ok) {
        const featuredProduct = getRewardFeaturedProduct(reward.discountPercent);
        const activeReward = createRewardUnlock({
          discountPercent: reward.discountPercent,
          productId: featuredProduct?.sku || null,
          rewardId: reward.id,
          source: "reward_redeem",
        });
        setShowUnlockModal({
          discountPercent: reward.discountPercent,
          title: `You redeemed ${reward.discountPercent}% OFF`,
          body: featuredProduct
            ? `Successfully spent ${reward.cost} A$. ${featuredProduct.name} is queued as your recommended conversion target.`
            : `Successfully spent ${reward.cost} A$. The discount is now ready in your cart.`,
          ctaLabel: "Use it now",
          href: buildRewardProductHref(reward.discountPercent),
          expiresAt: activeReward.expiresAt,
          productName: featuredProduct?.name || null,
        });
      } else {
        setMessage(payload.message || payload.error || "Unable to redeem reward.");
        setTimeout(() => setMessage(null), 5000);
      }
    } catch {
      setMessage("Unable to redeem reward.");
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setRedeemingId(null);
    }
  };
  if (!user) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-extrabold text-[#111]">Sign in required</h1>
          <p className="text-[#666]">Please sign in to view your Alpha Wallet.</p>
          <Link href="/" className="inline-flex rounded-full bg-[#0071e3] px-8 py-4 font-bold text-white transition-opacity hover:opacity-90 shadow-xl">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !alphaSummary && alphaTransactions.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0071e3] border-t-transparent" />
      </div>
    );
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const rewardRingOffset = circumference - (rewardProgress.percent / 100) * circumference;

  return (
    <div className="af-page-shell w-full max-w-6xl mx-auto animate-in space-y-12 pb-24 fade-in duration-700 px-4 md:px-8 font-sans">
      
      {/* Toast Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-[#111] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#EEE]"
          >
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <RewardUnlockModal
        data={showUnlockModal}
        onClose={() => setShowUnlockModal(null)}
        onPrimaryClick={() => {
          if (!showUnlockModal) return;
          trackRewardEvent("product_clicked_from_reward", {
            discountPercent: showUnlockModal.discountPercent,
            href: showUnlockModal.href,
            productName: showUnlockModal.productName || null,
            source: "alpha_wallet_modal",
          });
        }}
      />

      {/* SECTION 1: WALLET HERO */}
      <section className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(26,54,38,0.4)] mt-4 md:mt-8 group">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F1F15] via-[#0071e3] to-[#122419]" />
        
        {/* Soft Ambient Glows */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-b from-[#22C55E]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-gradient-to-t from-[#FFD700]/5 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-12">
          
          {/* Left: Balance */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="mb-5 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
                <Radio className="h-3.5 w-3.5 text-[#57D38C]" />
                {liveSyncLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#F4D675]/20 bg-[#F4D675]/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#FFE7A1]">
                <Sparkles className="h-3.5 w-3.5" />
                {completedCoreMissionCount}/{ALPHA_REWARD_SYSTEM.taskBonus.threshold} for +{ALPHA_REWARD_SYSTEM.taskBonus.amount} bonus
              </span>
            </div>
            <div className="flex items-center gap-6 mb-2">
              <AlphaCoin size="hero" className="shadow-[0_0_40px_rgba(255,215,0,0.3)] transition-transform duration-500 group-hover:scale-105" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#A3BFA5] mb-1">Alpha Sikka Balance</p>
                <div className="flex items-baseline gap-2 relative">
                  <h1 className="text-6xl sm:text-[5rem] leading-none font-black tracking-tight text-white drop-shadow-md">
                    {summary.current_balance}
                  </h1>
                  <span className="text-3xl font-bold text-white/50 mb-1">A$</span>
                  
                  {/* Floating earn animation */}
                  <AnimatePresence>
                    {recentEarn && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.5 }}
                        animate={{ opacity: 1, y: -40, scale: 1.1 }}
                        exit={{ opacity: 0, y: -60, scale: 1 }}
                        className="absolute -top-4 left-full ml-4 text-3xl font-black text-[#FFD700] drop-shadow-lg whitespace-nowrap"
                      >
                        +{recentEarn} A$
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <p className="text-sm font-medium text-[#7A9984] mt-2 ml-[104px] hidden md:block">Earned through discipline & recovery</p>
            {rewardProgress.next && (
              <div className="mt-5 md:ml-[104px] inline-flex items-center gap-2 rounded-full border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-2.5 text-sm font-bold shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                <span className="text-white">Only <span className="text-[#57D38C] font-black">{rewardProgress.remaining} A$</span> more to unlock <span className="text-[#F4D675]">{rewardProgress.next.discountPercent}% OFF</span></span>
              </div>
            )}
          </div>

          {/* Right: Next Reward Unlock Ring */}
          <div className="flex items-center gap-6 bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-md w-full md:w-auto shadow-inner hover:bg-white/10 transition-colors">
             <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
               <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                  <motion.circle 
                     cx="50" cy="50" r={radius} 
                     stroke="url(#heroRingGradient)" 
                     strokeWidth="6" 
                     fill="none" 
                     strokeLinecap="round"
                     initial={{ strokeDasharray: `0 ${circumference}` }}
                     animate={{ strokeDasharray: `${circumference - rewardRingOffset} ${circumference}` }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="heroRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFD700" />
                      <stop offset="100%" stopColor="#FFFFFF" />
                    </linearGradient>
                  </defs>
               </svg>
               <span className="text-2xl font-black text-white">{rewardProgress.percent}%</span>
             </div>
             
             <div className="pr-4">
               <p className="text-2xl font-black text-white tracking-tight">
                  {rewardProgress.next ? `Next reward at ${rewardProgress.next.cost} A$` : 'All Rewards Unlocked!'}
               </p>
               <p className="text-[#A3BFA5] text-sm mt-1 font-medium">Keep completing protocols</p>
               {rewardProgress.next && (
                 <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-[#FFE7A1]">{rewardProgress.remaining} A$ away from {rewardProgress.next.discountPercent}% OFF</p>
               )}
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: TODAY'S MISSIONS */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-3xl font-black text-[#111] tracking-tight">Earn Today</h2>
           <span className="hidden md:inline-flex rounded-full bg-[#F4F0E8] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#6B6256]">Swipe on mobile</span>
        </div>

        <div className="rounded-[2rem] bg-[#FFF8EE] p-5 shadow-[0_8px_24px_rgba(17,17,17,0.05)] border border-[#F1E4C8]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B47B00]">Reward Psychology Loop</p>
              <h3 className="mt-1 text-xl font-black text-[#111]">Complete {ALPHA_REWARD_SYSTEM.taskBonus.threshold} core missions today and trigger +{ALPHA_REWARD_SYSTEM.taskBonus.amount} A$.</h3>
            </div>
            <div className="min-w-[220px] rounded-[1.5rem] bg-white px-4 py-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#7A6D5A]">Today's bonus</span>
                <span className="text-sm font-black text-[#111]">{completedCoreMissionCount}/{ALPHA_REWARD_SYSTEM.taskBonus.threshold}</span>
              </div>
              <ProgressBar value={bonusProgress} color="bg-gradient-to-r from-[#F2B637] to-[#D88A15]" trackColor="bg-[#F6E8C6]" height="h-3" />
            </div>
          </div>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-2 snap-x md:grid md:grid-cols-2 md:overflow-visible">
          {todayMissions.map((mission) => {
            const isCompleted = mission.status === "completed";
            const isAvailable = mission.status === "available";
            const isMissed = mission.status === "missed";

            return (
              <motion.div 
                key={mission.id} 
                whileHover={!isCompleted ? { y: -4, scale: 1.01 } : {}}
                className={`relative w-[85vw] shrink-0 snap-start rounded-[2rem] p-6 transition-all duration-300 flex flex-col justify-between shadow-sm md:w-auto ${
                  isCompleted ? "bg-[#F4F9F6] border border-green-100" :
                  isMissed ? "bg-[#FFF4F1] border border-[#FFD5CB]" :
                  isAvailable ? "bg-white border border-[#d9d9de] shadow-[0_8px_30px_rgb(0,0,0,0.04)]" :
                  "bg-[#F9F9F9] border border-[#EEE]"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                         isCompleted ? 'bg-green-100 text-green-600' : 
                         isMissed ? 'bg-[#FFE0D8] text-[#D14C1F]' :
                         isAvailable ? 'bg-[#0071e3]/5 text-[#0071e3]' : 'bg-[#EAEAEA] text-[#999]'
                       }`}>
                          {isCompleted ? <CheckCircle className="w-6 h-6" /> : isMissed ? <ShieldAlert className="w-6 h-6" /> : <Clock3 className="w-6 h-6" />}
                       </div>
                       <div>
                         <h3 className="text-lg font-bold text-[#111] leading-tight">{mission.title}</h3>
                         <p className="text-sm font-semibold text-[#666] mt-1">{mission.timeWindow.start} - {mission.timeWindow.end}</p>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-[#FFF9E6] border border-[#FFE899] rounded-xl px-3 py-1.5 text-sm font-black text-[#B47B00]">
                      +{mission.reward} <AlphaCoin size="sm" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-black/5">
                  {isCompleted ? (
                    <div className="w-full py-3.5 rounded-xl bg-green-50 text-green-700 text-center text-sm font-bold flex items-center justify-center gap-2">
                       <CheckCircle2 className="w-4 h-4" /> Completed
                    </div>
                  ) : isMissed ? (
                    <div className="w-full rounded-xl bg-[#FFF1ED] px-4 py-3 text-left text-sm font-bold text-[#B63E17]">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" /> Window closed
                      </div>
                      <p className="mt-1 text-xs font-semibold text-[#B66A52]">Missed days trigger a {ALPHA_REWARD_SYSTEM.penalties.missed_day} A$ deduction when momentum breaks.</p>
                    </div>
                  ) : isAvailable ? (
                    <Link href="/dashboard" className="block w-full">
                      <motion.button 
                        whileTap={{ scale: 0.97 }}
                        className="w-full relative min-h-12 py-3.5 rounded-xl bg-[#0071e3] text-white text-center text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 overflow-hidden"
                      >
                         <Play className="w-4 h-4 fill-current" /> Complete Task
                      </motion.button>
                    </Link>
                  ) : (
                    <div className="w-full min-h-12 py-3.5 rounded-xl bg-[#F0F0F0] text-[#999] text-center text-sm font-bold flex items-center justify-center gap-2">
                       <LockKeyhole className="w-4 h-4" /> Locked
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: STREAK ENGINE */}
      <section>
        <div className="rounded-[2rem] bg-white border border-[#d9d9de] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], filter: ["hue-rotate(0deg)", "hue-rotate(20deg)", "hue-rotate(0deg)"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100"
              >
                <Flame className="w-10 h-10 text-orange-500 fill-orange-500" />
              </motion.div>
              <div>
                <h3 className="text-3xl font-black text-[#111]">{streak.current_streak} Day Streak</h3>
                <p className="text-[#666] font-medium mt-1">Complete today to keep streak</p>
              </div>
           </div>

           <div className="w-full md:w-[400px]">
              <div className="flex justify-between items-end mb-3">
                <span className="text-sm font-bold text-[#111]">{nextStreakTarget ? `${nextStreakTarget}-day bonus` : 'Bonus'}</span>
                {nextStreakTarget && (
                  <span className="text-sm font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">+{nextStreakReward} A$</span>
                )}
              </div>
              <ProgressBar 
                 value={nextStreakTarget ? (streak.current_streak / nextStreakTarget) * 100 : 100} 
                 color="bg-gradient-to-r from-orange-400 to-orange-500"
                 trackColor="bg-orange-100"
                 height="h-3"
              />
           </div>
        </div>
      </section>

      <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-12">
          {/* SECTION 4: REWARD LADDER (Horizontal Scroll) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
               <h2 className="text-2xl font-black text-[#111] tracking-tight">Reward Ladder</h2>
            </div>
            
            <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-6 pt-2 snap-x scrollbar-hide md:mx-0 md:px-0">
              {rewardCatalog.map((reward) => {
                const isUnlocked = summary.current_balance >= reward.cost;
                const isNext = reward.id === rewardProgress.next?.id;
                const progressVal = Math.min(100, Math.max(0, (summary.current_balance / reward.cost) * 100));
                
                return (
                  <div 
                    key={reward.id} 
                    className={`relative shrink-0 w-[280px] rounded-[2rem] p-6 snap-start flex flex-col transition-transform ${
                      isUnlocked ? "bg-white border-2 border-green-500 shadow-[0_8px_20px_rgb(34,197,94,0.15)]" :
                      isNext ? "bg-white border-2 border-[#0071e3] shadow-[0_12px_30px_rgb(0,0,0,0.08)] scale-[1.02] z-10" :
                      "bg-[#F9F9F9] border border-[#d9d9de] shadow-sm opacity-80"
                    }`}
                  >
                     <div className="flex justify-between items-start mb-6">
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-green-100 text-green-600' : isNext ? 'bg-[#0071e3] text-white' : 'bg-[#EAEAEA] text-[#999]'}`}>
                          {isUnlocked ? <UnlockIcon /> : <LockKeyhole className="w-5 h-5" />}
                       </div>
                       {isNext && <span className="text-[10px] font-black uppercase tracking-wider bg-black text-white px-3 py-1.5 rounded-full">Next Reward</span>}
                     </div>

                     <h3 className={`text-3xl font-black mb-1 ${isUnlocked ? 'text-green-600' : isNext ? 'text-[#0071e3]' : 'text-[#666]'}`}>
                       {reward.discountPercent}% OFF
                     </h3>
                     <p className="text-sm font-bold text-[#999] mb-8">Required: {reward.cost} A$</p>

                     <div className="mt-auto">
                        {!isUnlocked && (
                          <ProgressBar 
                            value={progressVal} 
                            color={isNext ? "bg-[#0071e3]" : "bg-[#CCC]"} 
                            trackColor="bg-[#F0F0F0]"
                          />
                        )}
                        {isUnlocked && (
                           <div className="text-sm font-bold text-green-600 flex items-center gap-2">
                             <CheckCircle2 className="w-4 h-4" /> Unlocked & Ready
                           </div>
                        )}
                     </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 5: SPEND COINS */}
          <section className="space-y-6">
             <h2 className="text-2xl font-black text-[#111] tracking-tight">Spend Coins</h2>
             <div className="grid gap-4 sm:grid-cols-2">
                {rewardCatalog.map((reward) => {
                  const canRedeem = summary.current_balance >= reward.cost;
                  
                  return (
                    <div key={`spend-${reward.id}`} className="bg-white border border-[#d9d9de] rounded-[2rem] p-6 shadow-sm flex justify-between items-center gap-4 hover:shadow-md transition-shadow">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shrink-0">
                            <Tag className="w-6 h-6 text-amber-600" />
                         </div>
                         <div>
                           <p className="font-bold text-[#111]">Use {reward.cost} A$</p>
                           <p className="text-sm font-semibold text-[#666] mt-0.5">-&gt; Get {reward.discountPercent}% off</p>
                         </div>
                       </div>
                       <motion.button
                         whileTap={canRedeem ? { scale: 0.95 } : {}}
                         onClick={() => void handleRedeem(reward)}
                         disabled={!canRedeem || redeemingId === reward.id}
                         className={`shrink-0 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${
                           canRedeem ? "bg-[#0071e3] text-white hover:bg-[#005bbf] shadow-md" : "bg-[#F0F0F0] text-[#999] cursor-not-allowed"
                         }`}
                       >
                         {redeemingId === reward.id ? "..." : "Redeem"}
                       </motion.button>
                    </div>
                  );
                })}
             </div>
          </section>
        </div>

        {/* SECTION 6: ACTIVITY TIMELINE */}
        <div>
          <div className="sticky top-8">
            <h2 className="text-2xl font-black text-[#111] tracking-tight mb-6">Activity</h2>
            <div className="bg-white border border-[#d9d9de] rounded-[2.5rem] p-8 shadow-sm">
                <div className="mb-6 rounded-[1.5rem] bg-[#F5FAF7] px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#4E7E63]">Realtime sync</p>
                      <p className="mt-1 text-sm font-semibold text-[#365341]">{liveSyncLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7E6A3D]">Missed today</p>
                      <p className="mt-1 text-lg font-black text-[#111]">{missedMissionCount}</p>
                    </div>
                  </div>
                </div>
              {timeline.length === 0 ? (
                 <p className="text-center text-[#999] py-10 font-medium">No activity yet. Earn Sikka today!</p>
              ) : (
                <div className="relative border-l-2 border-[#F0F0F0] ml-3 pl-6 space-y-8 py-2">
                  {timeline.slice(0, 10).map((item, idx) => (
                    <div key={item.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-white border-2 border-[#0071e3] shadow-[0_0_0_4px_white]" />
                      
                      <p className="text-sm font-bold text-[#111] leading-tight mb-1">{item.description}</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-black ${item.direction === 'earn' ? 'text-green-600' : 'text-[#B45309]'}`}>
                          {item.direction === 'earn' ? '+' : '-'}{item.absoluteAmount} A$
                        </span>
                        <span className="text-xs font-semibold text-[#999]"> -  {formatTimelineTime(item.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EADFD0] bg-[rgba(255,250,242,0.96)] px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1 rounded-[1.4rem] bg-white px-4 py-3 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7A6D5A]">Start next task</p>
            <p className="mt-1 truncate text-sm font-bold text-[#111]">{nextMission ? nextMission.title : "Everything completed for now"}</p>
          </div>
          <Link href="/dashboard" className="shrink-0">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="flex min-h-12 items-center gap-2 rounded-[1.4rem] bg-[#0071e3] px-5 py-4 text-sm font-black text-white shadow-lg"
            >
              <span>Start Next Task</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function UnlockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  );
}


