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

  // Challenge list view

if (view === "list") {
    return (
  <div className="af-page-shell flex h-full w-full min-h-screen flex-col animate-in fade-in duration-700">
        {/* Glow Effects */}
        <div className="fixed inset-0 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10 w-full af-section-grid">
          <section className="nv-section-white">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="af-badge-row mb-3">
                  <span className="af-badge-chip text-[var(--accent-blue)]"><Trophy className="w-3.5 h-3.5" /> Clinical programs</span>
                  <span className="af-badge-chip text-[var(--accent-blue)]">Reward-linked consistency</span>
                </div>
                <h1 className="text-clinical-heading text-4xl lg:text-5xl font-extrabold text-[var(--ink)] tracking-tight">
                  Discipline accelerators for real adherence.
                </h1>
                <p className="text-[var(--ink-soft)] mt-3 max-w-xl text-sm leading-relaxed">
                  Use challenge programs to turn routines into repeatable wins, build streaks, and earn Alpha rewards without losing clinical structure.
                </p>
              </div>
            {/* Active Challenge Summary */}
            {activeChallengeId && progress && (
               <div className="af-card-secondary flex cursor-pointer items-center gap-6 p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--accent-blue-soft)] hover:shadow-[0_18px_34px_rgba(11,18,32,0.14)]" onClick={() => {
                 const c = challenges.find((ch) => ch.id === activeChallengeId);
                 if (c) openChallenge(c);
               }}>
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-wash-start)] border border-[var(--border-hairline)] flex items-center justify-center text-xl shadow-sm">
                    {challenges.find((ch) => ch.id === activeChallengeId)?.icon || ""}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-[var(--accent-blue)] uppercase tracking-wider font-bold mb-1">Active Now</p>
                    <p className="text-sm font-bold text-[var(--ink)] truncate max-w-[150px]">{challenges.find((ch) => ch.id === activeChallengeId)?.title}</p>
                  </div>
                  <div className="flex items-center gap-4 border-l border-[var(--border-hairline)] pl-4">
                     <div className="text-center">
                       <p className="text-lg font-bold text-orange-400 flex items-center gap-1"><Flame className="w-4 h-4"/>{progress.streak}</p>
                       <p className="text-[10px] text-[var(--ink-soft)]">Streak</p>
                     </div>
                     <div className="text-center">
                       <p className="text-lg font-bold text-yellow-400">{progress.totalXP}</p>
                       <p className="text-[10px] text-[var(--ink-soft)]">A$</p>
                     </div>
                  </div>
               </div>
            )}
            </div>
          </section>

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
                      ? "border-[var(--accent-blue)] bg-[var(--bg-wash-start)]"
                      : "bg-white border-[var(--border-hairline)] hover:border-[var(--border-hairline)] hover:bg-white"
                  }`}
                >
                  <div className="p-6 h-full flex flex-col justify-between">
                     <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-[var(--tint-warm)] border border-[var(--border-hairline)] flex items-center justify-center text-2xl shadow-inner relative overflow-hidden group-hover:scale-110 transition-transform">
                        <span className="relative z-10">{challenge.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-bold text-[var(--ink)] group-hover:text-[var(--accent-blue)] transition-colors line-clamp-1">{challenge.title}</h2>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded border border-[var(--accent-blue)] bg-white text-[var(--accent-blue)] text-[10px] font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--ink-soft)] mb-3">{challenge.subtitle}</p>
                        <p className="text-xs text-[var(--ink-soft)] line-clamp-2 leading-relaxed mb-4">{challenge.description}</p>
                        
                        <div className="flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-wider text-[var(--ink-soft)]">
                          <span className="px-2 py-1 rounded bg-[var(--tint-warm)] border border-[var(--border-hairline)]">{challenge.duration}</span>
                          <span className="px-2 py-1 rounded bg-[var(--tint-warm)] border border-[var(--border-hairline)]">{challenge.totalDays} Days</span>
                          <span className="px-2 py-1 rounded border border-yellow-500/20 text-yellow-400 bg-yellow-500/10 flex items-center gap-1">
                             <Circle className="w-3 h-3 fill-yellow-400"/>
                             Earn {challenge.totalDays * 10} A$
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Mini */}
                    {savedProgress && (
                      <div className="mt-6 pt-4 border-t border-[var(--border-hairline)]">
                        <div className="flex justify-between text-xs mb-2">
                           <span className="text-[var(--ink-soft)] font-medium">Completion</span>
                        <span className="text-[var(--accent-blue)] font-bold">{pct}%</span>
                        </div>
                        <div className="af-progress-track h-1.5 border border-[var(--border-hairline)]">
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

  // Challenge detail view
  if (!selectedChallenge) return null;

  const isActive = activeChallengeId === selectedChallenge.id;
  const inProgress = progress?.completedDays.length ? progress.completedDays.length > 0 : false;
  
    return (
      <div className="af-page-shell relative flex min-h-screen flex-col overflow-hidden">
       <div className="fixed inset-0 pointer-events-none" />

       {/* Top Nav */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,12,18,0.92)_0%,rgba(8,12,18,0.76)_100%)] backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
           <button onClick={() => setView("list")} className="flex items-center gap-2 text-sm text-[var(--text-secondary-dark)] hover:text-white transition-colors">
               <ChevronLeft className="w-5 h-5"/> Back to Catalog
             </button>
             {isActive && progress && (
                <div className="flex items-center gap-4">
                 <span className="text-xs font-bold text-[var(--accent-blue)] px-3 py-1 bg-transparent border border-[var(--accent-blue)] rounded-md">
                     {progress.completedDays.length} / {selectedChallenge.totalDays} Days
                  </span>
              <div className="af-progress-track w-24 h-1.5 border border-[var(--border-hairline)]">
                <div className="af-progress-fill" style={{ width: `${completionPercent}%`}} />
                  </div>
                </div>
             )}
          </div>
       </div>

       <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Header Info Left Col */}
           <div className="lg:col-span-1 space-y-6">
             <div className="af-card-primary p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[var(--accent-blue)] opacity-50" />
               <div className="w-16 h-16 rounded-2xl bg-[var(--tint-warm)] border border-[var(--border-hairline)] flex items-center justify-center text-4xl mb-6 shadow-inner">
                   {selectedChallenge.icon}
                </div>
               <h1 className="text-3xl font-bold text-[var(--ink)] leading-tight mb-2">{selectedChallenge.title}</h1>
               <p className="text-sm font-medium text-[var(--accent-blue)] mb-6">{selectedChallenge.subtitle}</p>
               <div className="space-y-4 text-sm text-[var(--ink-soft)]">
                   <p>{selectedChallenge.description}</p>
                 <div className="pt-4 border-t border-[var(--border-hairline)]">
                     <div className="flex justify-between items-center py-2">
                        <span>Category</span>
                    <span className="text-[var(--ink)] font-medium capitalize">{selectedChallenge.duration}</span>
                     </div>
                     <div className="flex justify-between items-center py-2">
                        <span>Duration</span>
                    <span className="text-[var(--ink)] font-medium">{selectedChallenge.totalDays} Days</span>
                     </div>
                     <div className="flex justify-between items-center py-2">
                        <span>Max Rewards</span>
                        <span className="text-yellow-400 font-bold">{selectedChallenge.totalDays * 10} A$</span>
                     </div>
                   </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                   {!inProgress ? (
                     <button onClick={() => startChallenge(selectedChallenge)} className="w-full bg-[var(--accent-blue)] hover:bg-[var(--link-blue)] text-white py-4 rounded-xl font-bold transition-all">
                       Start Protocol
                     </button>
                   ) : !isActive ? (
                     <button onClick={() => setChallengeActive(selectedChallenge.id)} className="w-full bg-[var(--tint-warm)] hover:bg-[var(--tint-warm)] text-[var(--ink)] border border-[var(--border-hairline)] py-4 rounded-xl font-bold transition-all">
                       Resume Program
                     </button>
                   ) : (
                     <button onClick={pauseActiveChallenge} className="w-full bg-[var(--tint-warm)] hover:bg-[var(--tint-warm)] text-[var(--ink-soft)] border border-[var(--border-hairline)] py-4 rounded-xl font-semibold transition-all">
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
             <div className="af-card-secondary p-6 flex flex-col h-full">
               <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-[var(--border-hairline)] pb-4">
                   {selectedChallenge.weeks.map((week, wIdx) => (
                      <button
                        key={wIdx}
                        onClick={() => setActiveWeek(wIdx)}
                        className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all ${
                           activeWeek === wIdx 
                          ? "bg-white border-[var(--accent-blue)] text-[var(--accent-blue)]"
                          : "bg-white border-[var(--border-hairline)] text-[var(--ink)] hover:text-[var(--ink)]"
                        }`}
                      >
                         Phase {week.week}
                      </button>
                   ))}
                </div>

                <div className="flex-1 space-y-4">
                   <div className="mb-6">
                      <h3 className="text-xl font-bold text-[var(--ink)]">{selectedChallenge.weeks[activeWeek].theme}</h3>
                     <p className="text-xs text-[var(--ink-soft)] mt-1 uppercase tracking-widest">Tasks to complete this phase</p>
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
                                  ? "bg-[var(--bg-wash-start)] border-[var(--accent-blue)]"
                                   : isLocked
                                   ? "bg-[var(--tint-warm)] border-[var(--border-hairline)] opacity-60 cursor-not-allowed"
                                  : "bg-white border-[var(--border-hairline)] hover:border-[var(--border-hairline)] hover:bg-white"
                              }`}
                            >
                               <div className="flex items-start gap-4">
                                  <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center border ${
                                     isDone ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white" : "border-[var(--border-hairline)] text-transparent"
                                  }`}>
                                     {isDone && <CheckCircle2 className="w-4 h-4"/>}
                                  </div>
                                  <div className="flex-1">
                                     <div className="flex justify-between items-center mb-1">
                                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isDone? "text-[var(--accent-blue)]" : "text-[var(--ink-soft)]"}`}>Day {task.day}</span>
                                        <span className="text-[10px] font-mono text-yellow-500 bg-yellow-500/10 px-1.5 rounded opacity-70">+10 A$</span>
                                     </div>
                                     <p className={`text-sm font-medium ${isDone ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"}`}>{task.title}</p>
                                  </div>
                               </div>
                            </button>
                         );
                      })}
                   </div>
                </div>

                {/* Next/Prev Week Controls */}
                <div className="mt-8 flex items-center justify-between pt-4 border-t border-[var(--border-hairline)]">
                   <button
                     disabled={activeWeek === 0}
                     onClick={() => setActiveWeek(prev => prev - 1)}
                     className="flex items-center gap-2 text-xs font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] disabled:opacity-20 disabled:pointer-events-none transition-colors"
                   >
                      <ChevronLeft className="w-4 h-4"/> Prev Phase
                   </button>
                   <button
                     disabled={activeWeek >= selectedChallenge.weeks.length - 1}
                     onClick={() => setActiveWeek(prev => prev + 1)}
                     className="flex items-center gap-2 text-xs font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] disabled:opacity-20 disabled:pointer-events-none transition-colors"
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


