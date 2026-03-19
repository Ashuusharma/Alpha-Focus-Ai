"use client";

import { useContext, useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  Clock3,
  Flame,
  History,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
  Play,
  CheckCircle,
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

import { AlphaCoin } from "./_components/AlphaCoin";

function formatAmount(amount: number) {
  return `${amount.toLocaleString()} A$`;
}

function ProgressBar({ value, color = "bg-[#2F6F57]" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#E7E0D4]/50">
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

  // Micro-interactions states
  const prevBalance = useRef(alphaSummary ? Number(alphaSummary.current_balance || 0) : 0);
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
  
  useEffect(() => {
    if (summary.current_balance > prevBalance.current) {
      const diff = summary.current_balance - prevBalance.current;
      setRecentEarn(diff);
      const t = setTimeout(() => setRecentEarn(null), 4000);
      prevBalance.current = summary.current_balance;
      return () => clearTimeout(t);
    } else if (summary.current_balance < prevBalance.current) {
      prevBalance.current = summary.current_balance;
    }
  }, [summary.current_balance]);

  const streak = useMemo(() => toAlphaWalletStreak(alphaStreak), [alphaStreak]);
  const rewardCatalog = useMemo(() => getRewardCatalog(), []);
  const indiaClock = useMemo(() => getIndiaDateParts(now), [now]);
  const missions = useMemo(() => buildTodayMissions(alphaTransactions, now), [alphaTransactions, now]);
  const timeline = useMemo(() => buildTimelineItems(alphaSummary, alphaTransactions), [alphaSummary, alphaTransactions]);
  const rewardProgress = useMemo(() => getRewardProgress(summary.current_balance), [summary.current_balance]);
  const tierProgress = useMemo(() => getTierProgress(summary.lifetime_earned), [summary.lifetime_earned]);
  const todayDisciplineEarned = useMemo(() => getDailyDisciplineEarned(alphaTransactions, indiaClock.dateKey), [alphaTransactions, indiaClock.dateKey]);
  const completedMissionsCount = missions.filter(m => m.status === "completed").length;
  
  const discipline = useMemo(
    () => calculateDisciplineScore({
      completedDailyTasks: completedMissionsCount,
      totalDailyTasks: missions.length,
    }),
    [completedMissionsCount, missions.length]
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
      if (payload.ok) {
        setTimeout(() => setMessage(null), 5000);
      }
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
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2F6F57] border-t-transparent" />
      </div>
    );
  }

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const rewardRingOffset = circumference - (rewardProgress.percent / 100) * circumference;

  return (
    <div className="af-page w-full animate-in space-y-10 pb-16 fade-in duration-700">
      
      {/* Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-green-500/20 bg-[#1F3D2B] px-6 py-4 text-sm font-bold text-green-300 shadow-2xl"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO WALLET REDESIGN */}
      <section className="relative overflow-hidden rounded-[2rem] p-8 md:p-12 shadow-2xl text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1F3D2B] via-[#0F2016] to-[#0A140E]" />
        
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          
          {/* Left: Balance */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#B9D8C9] mb-2 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4" /> Live sync active
            </div>
            
            <div className="flex flex-row items-center gap-5">
              <AlphaCoin size="hero" className="shadow-2xl" />
              <div className="relative">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">Alpha Sikka Balance</p>
                <div className="flex items-baseline gap-2 mt-1 relative">
                  <h1 className="text-6xl sm:text-7xl font-black tracking-tight text-white drop-shadow-lg">
                    {summary.current_balance}
                  </h1>
                  <span className="text-3xl font-bold text-white/40 mb-1">A$</span>
                  
                  {/* +A$ Popup Micro-interaction */}
                  <AnimatePresence>
                    {recentEarn && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.5 }}
                        animate={{ opacity: 1, y: -40, scale: 1.1 }}
                        exit={{ opacity: 0, y: -60, scale: 1 }}
                        className="absolute -top-2 left-1/2 text-2xl font-black text-[#FFD700] drop-shadow-md whitespace-nowrap"
                      >
                        +{recentEarn} A$
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Next Reward Unlock Ring */}
          <div className="flex items-center gap-6 bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl w-full md:w-auto shadow-inner">
             <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
               <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                  <motion.circle 
                     cx="50" cy="50" r={radius} 
                     stroke="url(#goldRingGradient)" 
                     strokeWidth="8" 
                     fill="none" 
                     strokeLinecap="round"
                     initial={{ strokeDasharray: `0 ${circumference}` }}
                     animate={{ strokeDasharray: `${circumference - rewardRingOffset} ${circumference}` }}
                     transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                  <defs>
                    <linearGradient id="goldRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFD700" />
                      <stop offset="100%" stopColor="#FFC107" />
                    </linearGradient>
                  </defs>
               </svg>
               <span className="text-xl font-black text-white">{rewardProgress.percent}%</span>
             </div>
             
             <div>
               <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FFD700]">Next Reward Unlock</p>
               <p className="text-2xl font-black text-white mt-1">
                  {rewardProgress.next ? `${formatAmount(rewardProgress.remaining)} to go` : 'All Unlocked!'}
               </p>
               <p className="text-sm text-white/50 mt-1">
                  {rewardProgress.next ? `For ${rewardProgress.next.discountPercent}% discount tier` : 'Redeem discounts below'}
               </p>
             </div>
          </div>

        </div>
      </section>

      {/* 2. TODAY'S MISSIONS */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
           <div>
             <h2 className="text-3xl font-extrabold text-[#1F3D2B]">Today’s Missions</h2>
             <p className="mt-2 text-[#6B665D]">Earn Alpha Sikka by maintaining your protocol windows.</p>
           </div>
           
           <div className="rounded-2xl border border-[#E2DDD3] bg-gradient-to-br from-[#F8F6F3] to-white px-5 py-4 flex items-center gap-6 shadow-sm">
             <div>
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6A5A]">Daily Progress</p>
               <div className="mt-2 flex items-center gap-2">
                 <div className="flex gap-1">
                   {[1,2,3].map(i => (
                     <div key={i} className={`w-8 h-2 rounded-full ${i <= Math.min(3, completedMissionsCount) ? 'bg-[#FFC107] shadow-[0_0_8px_rgba(255,193,7,0.5)]' : 'bg-[#E7E0D4]'}`} />
                   ))}
                 </div>
                 <span className="text-sm font-bold text-[#1F3D2B] ml-2">{completedMissionsCount}/3</span>
               </div>
             </div>
             <div className="w-px h-10 bg-[#E2DDD3]" />
             <div className="text-right">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C6A5A]">Bonus Status</p>
               <p className={`text-sm font-bold mt-1 ${completedMissionsCount >= 3 ? 'text-green-600' : 'text-[#1F3D2B]'}`}>
                 {completedMissionsCount >= 3 ? 'Bonus unlocked!' : 'Complete 3 tasks → +5 A$'}
               </p>
             </div>
           </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {missions.map((mission) => {
            const isCompleted = mission.status === "completed";
            const isAvailable = mission.status === "available";
            const isExpired = mission.isExpired;

            return (
              <motion.div 
                key={mission.id} 
                whileHover={{ y: -4 }}
                className={`relative rounded-3xl border p-6 transition-all duration-300 flex flex-col ${
                  isCompleted ? "border-green-200 bg-[#F4F9F6] shadow-sm" :
                  isAvailable ? "border-[#B9D8C9] bg-white shadow-md ring-1 ring-[#B9D8C9]/30" :
                  "border-[#E2DDD3] bg-[#FCFAF8] opacity-70"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-xl ${isCompleted ? 'bg-green-100 text-green-700' : isAvailable ? 'bg-[#E8F4EE] text-[#2F6F57]' : 'bg-[#E7E0D4] text-[#8C877D]'}`}>
                     {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/5 rounded-full px-3 py-1 text-sm font-black text-[#1F3D2B]">
                    +{mission.reward} <AlphaCoin size="sm" />
                  </div>
                </div>
                
                <h3 className="text-lg font-black text-[#1F3D2B]">{mission.title}</h3>
                
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B665D]">
                  <Clock3 className="h-3.5 w-3.5" />
                  {mission.timeWindow.start} - {mission.timeWindow.end}
                </div>

                <div className="mt-auto pt-6">
                  {isCompleted ? (
                    <div className="w-full py-3 px-4 rounded-xl bg-green-600/10 text-green-700 text-center text-sm font-bold flex items-center justify-center gap-2">
                       <CheckCircle2 className="w-4 h-4" /> Verified
                    </div>
                  ) : isAvailable ? (
                    <Link href="/dashboard" className="block w-full">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-3 px-4 rounded-xl bg-[#1F3D2B] text-white text-center text-sm font-bold shadow hover:bg-[#2F6F57] transition-colors flex items-center justify-center gap-2"
                      >
                         <Play className="w-4 h-4 fill-current" /> Action Required
                      </motion.button>
                    </Link>
                  ) : (
                    <div className="w-full py-3 px-4 rounded-xl bg-[#E7E0D4]/50 text-[#8C877D] text-center text-sm font-bold flex items-center justify-center gap-2">
                       <LockKeyhole className="w-4 h-4" /> {isExpired ? "Missed" : "Locked"}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. REWARD LADDER REDESIGN */}
      <section className="space-y-6">
        <div>
           <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C6A5A]">Progression</p>
           <h2 className="mt-2 text-3xl font-extrabold text-[#1F3D2B]">Reward Store Ladder</h2>
        </div>
        
        <div className="flex flex-col gap-4 relative">
          {/* Connecting line behind cards */}
          <div className="absolute left-[39px] top-8 bottom-8 w-[2px] bg-[#E2DDD3] hidden md:block" />

          {rewardCatalog.map((reward, i) => {
            const isUnlocked = summary.current_balance >= reward.cost;
            const isNext = reward.id === rewardProgress.next?.id;
            const progressVal = Math.min(100, Math.max(0, (summary.current_balance / reward.cost) * 100));
            
            return (
              <motion.div 
                key={reward.id} 
                className={`relative z-10 w-full flex flex-col md:flex-row items-stretch md:items-center gap-6 p-6 rounded-[2rem] border transition-all ${
                  isUnlocked ? "border-green-200 bg-white shadow-sm ring-1 ring-green-100" :
                  isNext ? "border-[#FFC107]/50 bg-gradient-to-r from-[#FFFBE6] to-white shadow-md ring-1 ring-[#FFC107]/30" :
                  "border-[#E2DDD3] bg-[#FCFAF8] opacity-80 filter grayscale-[0.3]"
                }`}
              >
                 {/* Visual node */}
                 <div className="hidden md:flex shrink-0 w-16 h-16 rounded-full bg-white border-[3px] items-center justify-center shadow-sm z-20"
                      style={{ borderColor: isUnlocked ? '#22C55E' : isNext ? '#FFC107' : '#E2DDD3' }}>
                    {isUnlocked ? <LockKeyhole className="w-6 h-6 text-green-500" /> : 
                     isNext ? <LockKeyhole className="w-6 h-6 text-[#FFC107]" /> :
                     <LockKeyhole className="w-6 h-6 text-[#A39E93]" />}
                 </div>

                 <div className="flex-1">
                   <div className="flex flex-wrap justify-between items-start gap-4">
                     <div>
                       <div className="flex items-center gap-2">
                         <h3 className="text-2xl font-black text-[#1F3D2B]">{reward.discountPercent}% Discount</h3>
                         {isNext && <span className="px-2 py-1 rounded bg-[#FFC107]/20 text-[#B45309] text-[10px] font-black uppercase tracking-wider">Next Target</span>}
                       </div>
                       <p className="mt-1 text-sm font-semibold text-[#6B665D]">Cost: {reward.cost} A$</p>
                     </div>
                     
                     <div className="w-full md:w-auto text-right">
                       {!isUnlocked ? (
                         <div className="space-y-2">
                           <div className="flex justify-between text-xs font-bold text-[#8C877D] mb-1">
                             <span>Progress</span>
                             <span>{Math.round(progressVal)}%</span>
                           </div>
                           <div className="w-full md:w-32">
                             <ProgressBar value={progressVal} color={isNext ? "bg-[#FFC107]" : "bg-[#A39E93]"} />
                           </div>
                         </div>
                       ) : (
                         <motion.button
                           whileTap={{ scale: 0.95 }}
                           onClick={() => void handleRedeem(reward)}
                           disabled={redeemingId === reward.id}
                           className="w-full md:w-auto px-6 py-3 rounded-full bg-[#1F3D2B] text-white font-bold shadow hover:bg-[#2F6F57] transition-colors disabled:opacity-50"
                         >
                           {redeemingId === reward.id ? "Processing..." : "Redeem Reward"}
                         </motion.button>
                       )}
                     </div>
                   </div>
                 </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 4. ACTIVITY TIMELINE & STREAK */}
      <section className="grid gap-8 lg:grid-cols-[1fr_350px]">
        {/* Timeline */}
        <div className="af-card rounded-[2rem] p-8">
           <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-extrabold text-[#1F3D2B]">Activity Ledger</h2>
             <div className="inline-flex items-center gap-2 rounded-full border border-[#E2DDD3] bg-[#F8F6F3] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#6B665D]">
                <History className="h-4 w-4" /> {timeline.length} entries
             </div>
           </div>

           {timeline.length === 0 ? (
              <div className="py-12 text-center text-[#8C877D] text-sm font-medium border-2 border-dashed border-[#E2DDD3] rounded-2xl">
                Start completing daily routines to earn Sikka.
              </div>
           ) : (
             <div className="relative border-l-2 border-[#E2DDD3] ml-4 space-y-8 mt-4">
               {timeline.slice(0, 15).map((item, idx) => (
                 <motion.div 
                   key={item.id} 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   className="relative pl-8"
                 >
                   <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 bg-white ${item.direction === 'earn' ? 'border-green-500' : 'border-[#B45309]'}`} />
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-[#E2DDD3] shadow-sm hover:shadow-md transition-shadow">
                     <div>
                       <p className="font-bold text-[#1F3D2B]">{item.description}</p>
                       <p className="text-xs text-[#8C877D] mt-1 font-medium">{formatTimelineTime(item.created_at)}</p>
                     </div>
                     <div className="flex items-center gap-3">
                       <span className={`font-black text-lg ${item.direction === 'earn' ? 'text-green-600' : 'text-[#B45309]'}`}>
                         {item.direction === 'earn' ? '+' : '-'}{item.absoluteAmount} A$
                       </span>
                     </div>
                   </div>
                 </motion.div>
               ))}
             </div>
           )}
        </div>

        {/* Streak Block */}
        <div className="space-y-6">
          <div className="rounded-[2rem] bg-gradient-to-b from-[#1F3D2B] to-[#102117] p-8 text-white shadow-xl text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
             
             <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B9D8C9] mb-4">Discipline Fire</p>
             
             <motion.div 
               animate={{ scale: [1, 1.05, 1], filter: ["hue-rotate(0deg)", "hue-rotate(15deg)", "hue-rotate(0deg)"] }}
               transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-orange-500/20 mb-4"
             >
               <Flame className="w-12 h-12 text-[#FF9800]" fill="currentColor" />
             </motion.div>

             <h3 className="text-6xl font-black text-white">{streak.current_streak}</h3>
             <p className="text-sm text-white/50 font-medium uppercase tracking-widest mt-2 mb-6">Days Streak</p>

             <div className="bg-black/30 rounded-2xl p-4 border border-white/10">
               <p className="text-sm font-bold text-white mb-2">
                 {nextStreakTarget ? `Next Bonus: ${nextStreakTarget} Days` : "All Core Bonuses Claimed!"}
               </p>
               {nextStreakTarget && (
                 <>
                   <ProgressBar value={(streak.current_streak / nextStreakTarget) * 100} color="bg-[#FF9800]" />
                   <p className="text-xs text-white/50 mt-2 font-medium">Reward: +{nextStreakReward} A$</p>
                 </>
               )}
             </div>
          </div>
          
          <div className="rounded-[2rem] border border-[#E2DDD3] bg-white p-6 shadow-sm">
             <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C6A5A] mb-2">Daily Cap</p>
             <div className="flex items-end gap-2 mb-4">
               <span className="text-3xl font-black text-[#1F3D2B]">{formatAmount(todayDisciplineEarned)}</span>
               <span className="text-sm font-bold text-[#8C877D] mb-1">/ {formatAmount(ALPHA_DAILY_CAP)}</span>
             </div>
             <ProgressBar value={(todayDisciplineEarned / ALPHA_DAILY_CAP) * 100} />
             <p className="text-xs text-[#8C877D] mt-3 font-medium">Earn more by completing daily disciplines.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
