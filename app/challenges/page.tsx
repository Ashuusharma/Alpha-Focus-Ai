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
      <div className="min-h-screen bg-gradient-to-b from-[#F4EFE6] via-[#EFE8DD] to-[#E5E0D4] text-[#1F3D2B] relative overflow-hidden">
        {/* Background Ambience */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-[#1F3D2B]/5 blur-[120px] rounded-full opacity-30" />
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-[#A9CBB7]/20 blur-[120px] rounded-full opacity-30" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="group flex items-center space-x-2 text-[#6B665D] hover:text-[#1F3D2B] transition-colors mb-8"
          >
            <div className="p-1 rounded-lg bg-white/60 border border-white/40 group-hover:border-[#1F3D2B]/50 transition-colors shadow-sm">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/60 border border-white/40 mb-6 shadow-sm">
              <Trophy className="w-8 h-8 text-[#1F3D2B]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1F3D2B] mb-4">
              Grooming Challenges
            </h1>
            <p className="text-lg text-[#6B665D] max-w-2xl mx-auto">
              Transform yourself with daily tasks. Build discipline. Track your streak. Become the best version of yourself.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button onClick={() => router.push("/assessment")} className="px-4 py-2 rounded-xl border border-[#1F3D2B]/10 bg-white/60 text-[#1F3D2B] text-sm font-semibold hover:bg-white/80 transition-colors shadow-sm">Answer Questions</button>
              <button onClick={() => router.push("/image-analyzer")} className="px-4 py-2 rounded-xl border border-[#1F3D2B]/10 bg-white/60 text-[#1F3D2B] text-sm font-semibold hover:bg-white/80 transition-colors shadow-sm">Analyze Photo</button>
              <button onClick={() => router.push("/result")} className="px-4 py-2 rounded-xl bg-[#1F3D2B] text-white text-sm font-semibold hover:bg-[#2A5239] transition-colors shadow-sm">Open Report</button>
            </div>
          </motion.div>

          {/* Active Challenge Banner */}
          {activeChallengeId && progress && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-10 p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 text-[#1F3D2B] cursor-pointer hover:border-[#1F3D2B]/40 transition-all shadow-sm"
              onClick={() => {
                const c = challenges.find((ch) => ch.id === activeChallengeId);
                if (c) openChallenge(c);
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1F3D2B]/10 flex items-center justify-center text-2xl border border-[#1F3D2B]/20">
                    {challenges.find((ch) => ch.id === activeChallengeId)?.icon || "🔥"}
                  </div>
                  <div>
                    <p className="text-xs text-[#1F3D2B] uppercase tracking-wider font-bold">Active Challenge</p>
                    <p className="text-lg font-bold text-[#1F3D2B]">
                      {challenges.find((ch) => ch.id === activeChallengeId)?.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-500 flex items-center gap-1">
                      <Flame className="w-5 h-5" />
                      {progress.streak}
                    </p>
                    <p className="text-xs text-[#6B665D]">Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-500">{progress.totalXP}</p>
                    <p className="text-xs text-[#6B665D]">A$</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#1F3D2B]">{progress.completedDays.length}</p>
                    <p className="text-xs text-[#6B665D]">Days Done</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#1F3D2B]" />
                  <button onClick={() => router.push("/result")} className="px-4 py-2 rounded-xl bg-[#1F3D2B] text-sm font-semibold text-white transition-colors shadow-sm">Open Report</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Challenge Cards */}
          <div className="grid gap-8">
            {challenges.map((challenge, idx) => {
              const isActive = activeChallengeId === challenge.id;
              const savedProgress = loadChallengeProgress(challenge.id);
              const pct = savedProgress
                ? Math.round((savedProgress.completedDays.length / challenge.totalDays) * 100)
                : 0;

              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 cursor-pointer hover:scale-[1.01] ${
                    isActive
                      ? "border-[#1F3D2B]/30 bg-[#1F3D2B]/5"
                      : "bg-white/40 border-white/40 hover:border-[#1F3D2B]/30 shadow-sm"
                  }`}
                  onClick={() => openChallenge(challenge)}
                >
                  {/* Decorative glow */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${challenge.color} opacity-80`} />
                  
                  <div className="p-8">
                    <div className="flex items-start gap-6">
                      <div className={`w-16 h-16 rounded-2xl bg-white/60 border border-white/40 flex items-center justify-center text-3xl shadow-sm flex-shrink-0 relative overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${challenge.color} opacity-20`} />
                        <span className="relative z-10">{challenge.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-bold text-[#1F3D2B]">{challenge.title}</h2>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-[#1F3D2B]/20 text-[#1F3D2B] text-xs font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#6B665D] mb-3">{challenge.subtitle}</p>
                        <p className="text-[#2F6F57] text-sm leading-relaxed mb-4">
                          {challenge.description}
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center gap-6 text-sm text-[#6B665D] mb-4">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" /> {challenge.totalDays} days
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-yellow-500" />{" "}
                            {challenge.weeks.reduce((acc, w) => acc + w.tasks.reduce((a, t) => a + t.xpReward, 0) + (w.bonusTask?.xpReward || 0), 0)} A$ total
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Target className="w-4 h-4" /> {challenge.weeks.length} weeks
                          </span>
                        </div>

                        {/* Benefits */}
                        <div className="flex flex-wrap gap-2">
                          {challenge.benefits.map((b, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-white/40 border border-white/40 text-xs text-[#2F6F57]">
                              {b}
                            </span>
                          ))}
                        </div>

                        {/* Progress bar if started */}
                        {savedProgress && (
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-[#6B665D] mb-1">
                              <span>Progress</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-2 bg-white/40 rounded-full overflow-hidden border border-white/20">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${challenge.color}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── CHALLENGE DETAIL VIEW ──────────────────────────────────

  if (!selectedChallenge) return null;

  const isActive = activeChallengeId === selectedChallenge.id;
  const currentWeek = selectedChallenge.weeks[activeWeek];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F4EFE6] via-[#EFE8DD] to-[#E5E0D4] text-[#1F3D2B] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-[#2F6F57]/5 blur-[120px] rounded-full opacity-30" />
        <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-[#A9CBB7]/20 blur-[120px] rounded-full opacity-30" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        {/* Back */}
        <button
          onClick={() => setView("list")}
          className="group flex items-center space-x-2 text-[#6B665D] hover:text-[#1F3D2B] transition-colors mb-8"
        >
          <div className="p-1 rounded-lg bg-white/60 backdrop-blur-md border border-white/40 group-hover:border-[#2F6F57]/50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">All Challenges</span>
        </button>

        {/* Challenge Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-start gap-6 mb-6">
            <div className={`w-20 h-20 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 flex items-center justify-center text-4xl shadow-sm flex-shrink-0 relative overflow-hidden`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${selectedChallenge.color} opacity-20`} />
              <span className="relative z-10">{selectedChallenge.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1F3D2B] mb-2">{selectedChallenge.title}</h1>
              <p className="text-[#6B665D]">{selectedChallenge.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => router.push("/assessment")} className="px-4 py-2 rounded-xl border border-[#D9D2C7] bg-[#F7F4EE] text-sm font-semibold text-[#1F3D2B] hover:bg-[#E8EFEA] transition-colors">Answer Questions</button>
                <button onClick={() => router.push("/image-analyzer")} className="px-4 py-2 rounded-xl border border-[#D9D2C7] bg-[#F7F4EE] text-sm font-semibold text-[#1F3D2B] hover:bg-[#E8EFEA] transition-colors">Analyze Photo</button>
                <button onClick={() => router.push("/result")} className="px-4 py-2 rounded-xl bg-medical-gradient text-sm font-semibold text-[#F4F1EB] transition-colors">Open Report</button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Streak", value: progress?.streak || 0, icon: Flame, color: "text-orange-400", suffix: " days" },
              { label: "A$ Earned", value: progress?.totalXP || 0, icon: Zap, color: "text-yellow-400", suffix: "" },
              { label: "Completed", value: progress?.completedDays.length || 0, icon: CheckCircle2, color: "text-[#2F6F57]", suffix: `/${selectedChallenge.totalDays}` },
              { label: "Longest Streak", value: progress?.longestStreak || 0, icon: TrendingUp, color: "text-purple-400", suffix: " days" },
            ].map((s) => (
              <div key={s.label} className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/40 shadow-sm text-center">
                <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
                <p className="text-2xl font-bold text-[#1F3D2B]">
                  {s.value}
                  <span className="text-sm text-[#6B665D] font-normal">{s.suffix}</span>
                </p>
                <p className="text-xs text-[#6B665D] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Overall Progress */}
          {progress && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#6B665D]">Overall Progress</span>
                <span className="text-[#1F3D2B] font-bold">{completionPercent}%</span>
              </div>
              <div className="h-3 bg-[#E5E0D4] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r ${selectedChallenge.color} shadow-[0_0_15px_-5px_var(--lux-accent)]`}
                />
              </div>
            </div>
          )}

          {/* Start / Continue Buttons */}
          {!isActive ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (progress) {
                    setChallengeActive(selectedChallenge.id);
                  } else {
                    startChallenge(selectedChallenge);
                  }
                }}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r ${selectedChallenge.color} hover:shadow-[0_0_30px_-10px_var(--lux-accent)] transition-all flex items-center justify-center gap-3`}
              >
                <Flame className="w-5 h-5" />
                {progress ? "Set as Active" : "Start This Challenge"}
              </motion.button>
              {progress && (
                <button
                  onClick={() => restartChallenge(selectedChallenge)}
                  className="w-full py-4 rounded-xl font-semibold border border-[#D9D2C7] bg-[#F7F4EE] text-[#2F6F57] hover:bg-[#E8EFEA] transition-colors"
                >
                  Restart Challenge
                </button>
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-[#C8DACF] bg-[#E8EFEA] p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 text-[#2F6F57] text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  Challenge Active — Keep going! Mark tasks complete below.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={pauseActiveChallenge}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#D9D2C7] bg-white text-[#8C6A5A] hover:bg-[#F7F4EE]"
                  >
                    Cancel Active
                  </button>
                  <button
                    onClick={() => restartChallenge(selectedChallenge)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-medical-gradient text-[#F4F1EB]"
                  >
                    Restart
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Week Tabs */}
        <div className="mb-8 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {selectedChallenge.weeks.map((week, idx) => {
                const weekComplete = week.tasks.every((t) => getDayStatus(t.day));
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveWeek(idx)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      activeWeek === idx
                        ? "bg-white border-[#2F6F57]/50 text-[#1F3D2B] shadow-sm"
                        : weekComplete
                          ? "bg-[#2F6F57]/10 border-[#2F6F57]/20 text-[#2F6F57]"
                          : "bg-white/60 backdrop-blur-md border-white/40 text-[#6B665D] hover:text-[#1F3D2B]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {weekComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                      Week {week.week}
                    </span>
                  </button>
                );
              })}
            </div>
        </div>

        {/* Current Week Content */}
        <AnimatePresence mode="wait">
          {currentWeek && (
            <motion.div
              key={activeWeek}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Week Header */}
              <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-2xl shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-[#E5E0D4] border border-white/40 flex items-center justify-center`}>
                    <span className="font-bold text-sm text-[#1F3D2B]">W{currentWeek.week}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1F3D2B]">{currentWeek.theme}</h2>
                    <p className="text-sm text-[#6B665D]">{currentWeek.description}</p>
                  </div>
                </div>
              </div>

              {/* Daily Tasks */}
              <div className="space-y-3">
                {currentWeek.tasks.map((task) => {
                  const done = getDayStatus(task.day);
                  const isLocked = !isActive;

                  return (
                    <motion.div
                      key={task.day}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (task.day % 7) * 0.05 }}
                      className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 ${
                        done
                          ? "bg-[#2F6F57]/10 border-[#2F6F57]/20"
                          : isLocked
                            ? "bg-white/40 backdrop-blur-sm border-white/30 opacity-60"
                            : "bg-white/60 backdrop-blur-md border-white/40 hover:border-[#2F6F57]/50"
                      }`}
                    >
                      <div className="p-5 flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          disabled={isLocked}
                          onClick={() => toggleDay(task.day, task.xpReward)}
                          className={`mt-0.5 flex-shrink-0 transition-all ${
                            isLocked ? "cursor-not-allowed" : "cursor-pointer hover:scale-110"
                          }`}
                        >
                          {isLocked ? (
                            <Lock className="w-6 h-6 text-[#6B665D]" />
                          ) : done ? (
                            <CheckCircle2 className="w-6 h-6 text-[#2F6F57]" />
                          ) : (
                            <Circle className="w-6 h-6 text-[#6B665D] hover:text-[#1F3D2B]" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="text-xs font-bold text-[#6B665D] uppercase">Day {task.day}</span>
                            <span className="text-lg">{getCategoryIcon(task.category)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              task.difficulty === "easy"
                                ? "bg-[#2F6F57]/10 text-[#2F6F57]"
                                : task.difficulty === "medium"
                                  ? "bg-yellow-500/10 text-yellow-600"
                                  : "bg-red-500/10 text-red-600"
                            }`}>
                              {task.difficulty}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                              <Zap className="w-3 h-3" /> +{task.xpReward} A$
                            </span>
                          </div>
                          <h3 className={`text-lg font-semibold mb-1 ${done ? "text-[#2F6F57]/80 line-through" : "text-[#1F3D2B]"}`}>
                            {task.title}
                          </h3>
                          <p className="text-sm text-[#6B665D] leading-relaxed">
                            {task.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Bonus Task */}
                {currentWeek.bonusTask && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`rounded-2xl border-2 border-dashed overflow-hidden transition-all duration-300 ${
                      getDayStatus(currentWeek.bonusTask.day * 100)
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : "bg-yellow-500/5 border-yellow-500/20"
                    }`}
                  >
                    <div className="p-5 flex items-start gap-4">
                      <button
                        disabled={!isActive}
                        onClick={() =>
                          toggleDay(currentWeek.bonusTask!.day * 100, currentWeek.bonusTask!.xpReward)
                        }
                        className={!isActive ? "cursor-not-allowed" : "cursor-pointer hover:scale-110"}
                      >
                        {getDayStatus(currentWeek.bonusTask.day * 100) ? (
                          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                        ) : (
                          <Star className="w-6 h-6 text-yellow-500/50" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-700 text-xs font-bold uppercase">
                            ⭐ Bonus Task
                          </span>
                          <span className="flex items-center gap-1 text-xs text-yellow-700 font-medium">
                            <Zap className="w-3 h-3" /> +{currentWeek.bonusTask.xpReward} A$
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-[#1F3D2B] mb-1">
                          {currentWeek.bonusTask.title}
                        </h3>
                        <p className="text-sm text-[#6B665D]">{currentWeek.bonusTask.description}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Week Navigation */}
              <div className="flex justify-between items-center mt-8">
                <button
                  disabled={activeWeek === 0}
                  onClick={() => setActiveWeek((prev) => prev - 1)}
                  className="flex items-center gap-2 text-sm text-[#6B665D] hover:text-[#1F3D2B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Week
                </button>
                <button
                  disabled={activeWeek >= selectedChallenge.weeks.length - 1}
                  onClick={() => setActiveWeek((prev) => prev + 1)}
                  className="flex items-center gap-2 text-sm text-[#6B665D] hover:text-[#1F3D2B] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next Week <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
