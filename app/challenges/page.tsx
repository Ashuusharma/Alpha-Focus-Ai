"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Flame, Target, ChevronLeft, ChevronRight, CheckCircle2, Circle,
  Calendar, Star, Zap, Lock, ArrowRight, TrendingUp,
} from "lucide-react";

import {
  Challenge,
  ChallengeProgress,
  getChallenges,
  getCategoryIcon,
  loadChallengeProgress,
  saveChallengeProgress,
  getActiveChallengeId,
  setActiveChallengeId,
  calculateStreak,
  clearChallengeProgress,
} from "@/lib/challengeEngine";
import { useRewardsStore } from "../../lib/rewardsStore";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";

export default function ChallengesPage() {
  const router = useRouter();
  const addCredits = useRewardsStore((s) => s.addCredits);

  const [challenges] = useState<Challenge[]>(getChallenges);
  const [activeChallengeId, setActiveId] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [activeWeek, setActiveWeek] = useState(0);
  const [view, setView] = useState<"list" | "detail">("list");

  const emitNotification = useCallback(async (eventType: string, dedupeKey: string, metadata?: Record<string, unknown>) => {
    try {
      const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
      await fetch("/api/notifications", {
        method: "POST",
        headers,
        body: JSON.stringify({ eventType, dedupeKey, metadata }),
      });
    } catch {
      // Notification writes are non-blocking.
    }
  }, []);

  useEffect(() => {
    const id = getActiveChallengeId();
    setActiveId(id);
    if (id) {
      const p = loadChallengeProgress(id);
      setProgress(p);
    }
  }, []);

  const openChallenge = useCallback(
    (challenge: Challenge) => {
      setSelectedChallenge(challenge);
      const p = loadChallengeProgress(challenge.id);
      setProgress(p);
      setActiveWeek(0);
      setView("detail");
    },
    []
  );

  const startChallenge = useCallback(
    (challenge: Challenge) => {
      const newProgress: ChallengeProgress = {
        challengeId: challenge.id,
        completedDays: [],
        streak: 0,
        longestStreak: 0,
        totalXP: 0,
        startedAt: new Date().toISOString(),
      };
      saveChallengeProgress(newProgress);
      setActiveChallengeId(challenge.id);
      setActiveId(challenge.id);
      setProgress(newProgress);
      setActiveWeek(0);
      void emitNotification("challenge_started", `challenge_started:${challenge.id}`, { challengeId: challenge.id });
    },
    [emitNotification]
  );

  const setChallengeActive = useCallback((challengeId: string) => {
    setActiveChallengeId(challengeId);
    setActiveId(challengeId);
  }, []);

  const pauseActiveChallenge = useCallback(() => {
    setActiveChallengeId(null);
    setActiveId(null);
  }, []);

  const restartChallenge = useCallback((challenge: Challenge) => {
    clearChallengeProgress(challenge.id);
    startChallenge(challenge);
  }, [startChallenge]);

  const toggleDay = useCallback(
    (day: number, xp: number) => {
      if (!progress || !selectedChallenge) return;
      
      const updated = { ...progress };
      const idx = updated.completedDays.indexOf(day);
      
      if (idx >= 0) {
        updated.completedDays.splice(idx, 1);
        updated.totalXP -= xp;
        addCredits(-xp, "challenge_rollback");
      } else {
        updated.completedDays.push(day);
        updated.totalXP += xp;
        updated.lastCompletedAt = new Date().toISOString();
        addCredits(xp, "challenge_completion");
      }

      const { streak, longestStreak } = calculateStreak(
        updated.completedDays,
        selectedChallenge.totalDays
      );
      updated.streak = streak;
      updated.longestStreak = longestStreak;

      saveChallengeProgress(updated);
      setProgress({ ...updated });

      const milestoneDay = [7, 14, 21, 28, 56, 84].find((value) => updated.completedDays.length === value);
      if (milestoneDay) {
        void emitNotification("challenge_milestone", `challenge_milestone:${selectedChallenge.id}:${milestoneDay}`, {
          challengeId: selectedChallenge.id,
          milestoneDay,
        });
      }
    },
    [progress, selectedChallenge, addCredits, emitNotification]
  );

  const getDayStatus = (day: number): boolean => {
    return progress?.completedDays.includes(day) || false;
  };

  const completionPercent = selectedChallenge && progress
    ? Math.round((progress.completedDays.length / selectedChallenge.totalDays) * 100)
    : 0;

  // ─── CHALLENGE LIST VIEW ────────────────────────────────────

if (view === "list") {
    return (
      <div className="af-page-shell flex flex-col h-full w-full min-h-screen animate-in fade-in duration-700">
        {/* Glow Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-[#A9CBB7]/20 blur-[120px] rounded-full opacity-40" />
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-[#d8b55f]/14 blur-[120px] rounded-full opacity-30" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10 w-full">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-xs font-bold text-[#2F6F57] uppercase tracking-widest flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4" /> Clinical Programs
              </p>
              <h1 className="text-clinical-heading text-4xl lg:text-5xl font-extrabold text-[#1F3D2B] tracking-tight">
                Discipline Accelerators
              </h1>
              <p className="text-[#6B665D] mt-3 max-w-xl text-sm leading-relaxed">
                Structured habit-building trajectories engineered to repair specific symptoms over defined timelines.
              </p>
            </div>
            {/* Active Challenge Summary */}
            {activeChallengeId && progress && (
               <div className="af-surface-card p-5 flex items-center gap-6 cursor-pointer hover:border-[#9ab7a2] transition-all" onClick={() => {
                 const c = challenges.find((ch) => ch.id === activeChallengeId);
                 if (c) openChallenge(c);
               }}>
                  <div className="w-12 h-12 rounded-xl bg-[#E8EFEA] border border-[#C8DACF] flex items-center justify-center text-xl shadow-sm">
                    {challenges.find((ch) => ch.id === activeChallengeId)?.icon || "🔥"}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-[#2F6F57] uppercase tracking-wider font-bold mb-1">Active Now</p>
                    <p className="text-sm font-bold text-[#1F3D2B] truncate max-w-[150px]">{challenges.find((ch) => ch.id === activeChallengeId)?.title}</p>
                  </div>
                  <div className="flex items-center gap-4 border-l border-[#e3d8c8] pl-4">
                     <div className="text-center">
                       <p className="text-lg font-bold text-orange-400 flex items-center gap-1"><Flame className="w-4 h-4"/>{progress.streak}</p>
                       <p className="text-[10px] text-[#8C6A5A]">Streak</p>
                     </div>
                     <div className="text-center">
                       <p className="text-lg font-bold text-yellow-400">{progress.totalXP}</p>
                       <p className="text-[10px] text-[#8C6A5A]">A$</p>
                     </div>
                  </div>
               </div>
            )}
          </div>

          {/* Catalog */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map((challenge, idx) => {
              const isActive = activeChallengeId === challenge.id;
              const savedProgress = loadChallengeProgress(challenge.id);
              const pct = savedProgress
                ? Math.round((savedProgress.completedDays.length / challenge.totalDays) * 100)
                : 0;

              return (
                <div
                  key={challenge.id}
                  onClick={() => openChallenge(challenge)}
                  className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer shadow-xl ${
                    isActive
                      ? "border-[#9fbea8] bg-[#e8efe9] shadow-[0_18px_36px_rgba(47,111,87,0.12)]"
                      : "bg-[rgba(255,252,246,0.86)] border-[#e3d8c8] hover:border-[#ccbda7] hover:bg-white"
                  }`}
                >
                  <div className="p-6 h-full flex flex-col justify-between">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-[#f5efe5] border border-[#e2d8ca] flex items-center justify-center text-2xl shadow-inner relative overflow-hidden group-hover:scale-110 transition-transform">
                        <span className="relative z-10">{challenge.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-bold text-[#1F3D2B] group-hover:text-[#2F6F57] transition-colors line-clamp-1">{challenge.title}</h2>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded border border-[#C8DACF] bg-[#E8EFEA] text-[#2F6F57] text-[10px] font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8C6A5A] mb-3">{challenge.subtitle}</p>
                        <p className="text-xs text-[#5F5A51] line-clamp-2 leading-relaxed mb-4">{challenge.description}</p>
                        
                        <div className="flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-wider text-[#6B665D]">
                          <span className="px-2 py-1 rounded bg-[#f6f0e5] border border-[#e2d8ca]">{challenge.duration}</span>
                          <span className="px-2 py-1 rounded bg-[#f6f0e5] border border-[#e2d8ca]">{challenge.totalDays} Days</span>
                          <span className="px-2 py-1 rounded border border-yellow-500/20 text-yellow-400 bg-yellow-500/10 flex items-center gap-1">
                             <Circle className="w-3 h-3 fill-yellow-400"/>
                             Earn {challenge.totalDays * 10} A$
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Mini */}
                    {savedProgress && (
                      <div className="mt-6 pt-4 border-t border-[#e3d8c8]">
                        <div className="flex justify-between text-xs mb-2">
                           <span className="text-[#6B665D] font-medium">Completion</span>
                           <span className="text-[#2F6F57] font-bold">{pct}%</span>
                        </div>
                        <div className="af-progress-track h-1.5 border border-[#e3d8c8]">
                          <div className="af-progress-fill rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── DETAIL VIEW ────────────────────────────────
  if (!selectedChallenge) return null;

  const isActive = activeChallengeId === selectedChallenge.id;
  const inProgress = progress?.completedDays.length ? progress.completedDays.length > 0 : false;
  
  return (
     <div className="af-page-shell min-h-screen text-[#1F3D2B] relative overflow-hidden flex flex-col">
       <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#A9CBB7]/18 blur-[120px] rounded-full opacity-40" />
       </div>

       {/* Top Nav */}
       <div className="sticky top-0 z-30 bg-[rgba(250,245,236,0.92)] backdrop-blur-xl border-b border-[#e2d8ca] shadow-[0_10px_28px_rgba(120,97,67,0.08)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
           <button onClick={() => setView("list")} className="flex items-center gap-2 text-sm text-[#6B665D] hover:text-[#1F3D2B] transition-colors">
               <ChevronLeft className="w-5 h-5"/> Back to Catalog
             </button>
             {isActive && progress && (
                <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-[#2F6F57] px-3 py-1 bg-[#E8EFEA] border border-[#C8DACF] rounded-md">
                     {progress.completedDays.length} / {selectedChallenge.totalDays} Days
                  </span>
              <div className="af-progress-track w-24 h-1.5 border border-[#e3d8c8]">
                <div className="af-progress-fill" style={{ width: `${completionPercent}%`}} />
                  </div>
                </div>
             )}
          </div>
       </div>

       <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Header Info Left Col */}
          <div className="lg:col-span-1 space-y-6">
             <div className="af-surface-card p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-green-400 opacity-50" />
               <div className="w-16 h-16 rounded-2xl bg-[#f5efe5] border border-[#e2d8ca] flex items-center justify-center text-4xl mb-6 shadow-inner">
                   {selectedChallenge.icon}
                </div>
               <h1 className="text-3xl font-bold text-[#1F3D2B] leading-tight mb-2">{selectedChallenge.title}</h1>
               <p className="text-sm font-medium text-[#2F6F57] mb-6">{selectedChallenge.subtitle}</p>
               <div className="space-y-4 text-sm text-[#6B665D]">
                   <p>{selectedChallenge.description}</p>
                 <div className="pt-4 border-t border-[#e3d8c8]">
                     <div className="flex justify-between items-center py-2">
                        <span>Category</span>
                    <span className="text-[#1F3D2B] font-medium capitalize">{selectedChallenge.duration}</span>
                     </div>
                     <div className="flex justify-between items-center py-2">
                        <span>Duration</span>
                    <span className="text-[#1F3D2B] font-medium">{selectedChallenge.totalDays} Days</span>
                     </div>
                     <div className="flex justify-between items-center py-2">
                        <span>Max Rewards</span>
                        <span className="text-yellow-400 font-bold">{selectedChallenge.totalDays * 10} A$</span>
                     </div>
                   </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                   {!inProgress ? (
                     <button onClick={() => startChallenge(selectedChallenge)} className="w-full bg-[#2F6F57] hover:bg-[#275c48] text-white py-4 rounded-xl font-bold shadow-[0_16px_30px_rgba(47,111,87,0.24)] transition-all">
                       Start Protocol
                     </button>
                   ) : !isActive ? (
                     <button onClick={() => setChallengeActive(selectedChallenge.id)} className="w-full bg-[#f5efe5] hover:bg-[#ece2d4] text-[#1F3D2B] border border-[#e2d8ca] py-4 rounded-xl font-bold transition-all">
                       Resume Program
                     </button>
                   ) : (
                     <button onClick={pauseActiveChallenge} className="w-full bg-[#f3ecdf] hover:bg-[#ebe1d2] text-[#6B665D] border border-[#e2d8ca] py-4 rounded-xl font-semibold transition-all">
                       Pause Protocol
                     </button>
                   )}

                   {inProgress && (
                      <button onClick={() => restartChallenge(selectedChallenge)} className="w-full text-xs text-red-400/50 hover:text-red-400 py-2 transition-colors">
                        Hard Reset Progress
                      </button>
                   )}
                </div>
             </div>
          </div>

          {/* Ladder / Roadmap Right Col */}
          <div className="lg:col-span-2 space-y-6">
             <div className="af-surface-card p-6 flex flex-col h-full">
               <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#e3d8c8] overflow-x-auto gap-4 hide-scrollbar">
                   {selectedChallenge.weeks.map((week, wIdx) => (
                      <button
                        key={wIdx}
                        onClick={() => setActiveWeek(wIdx)}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                           activeWeek === wIdx 
                          ? "bg-[#E8EFEA] border-[#C8DACF] text-[#2F6F57] shadow-[0_12px_24px_rgba(47,111,87,0.12)]"
                          : "bg-[#f5efe5] border-[#e2d8ca] text-[#6B665D] hover:text-[#1F3D2B]"
                        }`}
                      >
                         Phase {week.week}
                      </button>
                   ))}
                </div>

                <div className="flex-1 space-y-4">
                   <div className="mb-6">
                      <h3 className="text-xl font-bold text-[#1F3D2B]">{selectedChallenge.weeks[activeWeek].theme}</h3>
                     <p className="text-xs text-[#6B665D] mt-1 uppercase tracking-widest">Tasks to complete this phase</p>
                   </div>
                   
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedChallenge.weeks[activeWeek].tasks.map((task, tIdx) => {
                         const isDone = getDayStatus(task.day);
                         const isLocked = !isActive && !isDone;

                         return (
                            <button
                              key={task.day}
                              disabled={isLocked}
                              onClick={() => isActive && toggleDay(task.day, 10)}
                              className={`relative text-left p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
                                 isDone 
                                   ? "bg-[#e8efe9] border-[#c8dacf] shadow-[0_12px_24px_rgba(47,111,87,0.08)]"
                                   : isLocked
                                   ? "bg-[#eee4d7] border-[#e2d8ca] opacity-60 cursor-not-allowed"
                                   : "bg-[rgba(255,252,246,0.88)] border-[#e2d8ca] hover:border-[#ccbda7] hover:bg-white"
                              }`}
                            >
                               <div className="flex items-start gap-4">
                                  <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center border ${
                                     isDone ? "bg-[#2F6F57] border-[#2F6F57] text-white" : "border-[#baa891] text-transparent"
                                  }`}>
                                     {isDone && <CheckCircle2 className="w-4 h-4"/>}
                                  </div>
                                  <div className="flex-1">
                                     <div className="flex justify-between items-center mb-1">
                                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isDone? "text-[#2F6F57]" : "text-[#8C6A5A]"}`}>Day {task.day}</span>
                                        <span className="text-[10px] font-mono text-yellow-500 bg-yellow-500/10 px-1.5 rounded opacity-70">+10 A$</span>
                                     </div>
                                     <p className={`text-sm font-medium ${isDone ? "text-[#1F3D2B]" : "text-[#5F5A51]"}`}>{task.title}</p>
                                  </div>
                               </div>
                            </button>
                         );
                      })}
                   </div>
                </div>

                {/* Next/Prev Week Controls */}
                <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#e3d8c8]">
                   <button
                     disabled={activeWeek === 0}
                     onClick={() => setActiveWeek(prev => prev - 1)}
                     className="flex items-center gap-2 text-xs font-bold text-[#6B665D] hover:text-[#1F3D2B] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                   >
                      <ChevronLeft className="w-4 h-4"/> Prev Phase
                   </button>
                   <button
                     disabled={activeWeek >= selectedChallenge.weeks.length - 1}
                     onClick={() => setActiveWeek(prev => prev + 1)}
                     className="flex items-center gap-2 text-xs font-bold text-[#6B665D] hover:text-[#1F3D2B] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                   >
                      Next Phase <ChevronRight className="w-4 h-4"/>
                   </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
