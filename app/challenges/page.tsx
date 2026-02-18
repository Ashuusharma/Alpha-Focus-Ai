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
} from "@/lib/challengeEngine";
import { useRewardsStore } from "@/lib/rewardsStore";

export default function ChallengesPage() {
  const router = useRouter();
  const addCredits = useRewardsStore((s) => s.addCredits);

  const [challenges] = useState<Challenge[]>(getChallenges);
  const [activeChallengeId, setActiveId] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [activeWeek, setActiveWeek] = useState(0);
  const [view, setView] = useState<"list" | "detail">("list");

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
    },
    []
  );

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
    },
    [progress, selectedChallenge, addCredits]
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
      <div className="min-h-screen bg-[var(--lux-bg-primary)] text-[var(--lux-text-primary)] relative overflow-hidden">
        {/* Background Ambience */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-[var(--lux-accent)]/5 blur-[120px] rounded-full opacity-30" />
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-[#0066ff]/5 blur-[120px] rounded-full opacity-30" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="group flex items-center space-x-2 text-[var(--lux-text-muted)] hover:text-[var(--lux-text-primary)] transition-colors mb-8"
          >
            <div className="p-1 rounded-lg bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] group-hover:border-[var(--lux-accent)]/50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] mb-6 shadow-lg shadow-[var(--lux-accent)]/10">
              <Trophy className="w-8 h-8 text-[var(--lux-accent)]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[var(--lux-text-secondary)] mb-4">
              Grooming Challenges
            </h1>
            <p className="text-lg text-[var(--lux-text-muted)] max-w-2xl mx-auto">
              Transform yourself with daily tasks. Build discipline. Track your streak. Become the best version of yourself.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button onClick={() => router.push("/assessment")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Answer Questions</button>
              <button onClick={() => router.push("/image-analyzer")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Analyze Photo</button>
              <button onClick={() => router.push("/result")} className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-500 transition-colors">Open Report</button>
            </div>
          </motion.div>

          {/* Active Challenge Banner */}
          {activeChallengeId && progress && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-[var(--lux-accent)]/10 to-[#0066ff]/10 border border-[var(--lux-accent)]/20 text-white cursor-pointer hover:border-[var(--lux-accent)]/40 transition-all shadow-[0_0_30px_-10px_rgba(0,242,255,0.1)]"
              onClick={() => {
                const c = challenges.find((ch) => ch.id === activeChallengeId);
                if (c) openChallenge(c);
              }}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--lux-accent)]/10 flex items-center justify-center text-2xl border border-[var(--lux-accent)]/20">
                    {challenges.find((ch) => ch.id === activeChallengeId)?.icon || "🔥"}
                  </div>
                  <div>
                    <p className="text-xs text-[var(--lux-accent)] uppercase tracking-wider font-bold">Active Challenge</p>
                    <p className="text-lg font-bold text-[var(--lux-text-primary)]">
                      {challenges.find((ch) => ch.id === activeChallengeId)?.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-400 flex items-center gap-1">
                      <Flame className="w-5 h-5" />
                      {progress.streak}
                    </p>
                    <p className="text-xs text-[var(--lux-text-muted)]">Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-400">{progress.totalXP}</p>
                    <p className="text-xs text-[var(--lux-text-muted)]">XP</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[var(--lux-accent)]">{progress.completedDays.length}</p>
                    <p className="text-xs text-[var(--lux-text-muted)]">Days Done</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[var(--lux-accent)]" />
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
                      ? "border-[var(--lux-accent)]/30 bg-[var(--lux-accent)]/5"
                      : "lux-card hover:border-[var(--lux-accent)]/30"
                  }`}
                  onClick={() => openChallenge(challenge)}
                >
                  {/* Decorative glow */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${challenge.color} opacity-80`} />
                  
                  <div className="p-8">
                    <div className="flex items-start gap-6">
                      <div className={`w-16 h-16 rounded-2xl bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] flex items-center justify-center text-3xl shadow-lg flex-shrink-0 relative overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${challenge.color} opacity-20`} />
                        <span className="relative z-10">{challenge.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-bold text-[var(--lux-text-primary)]">{challenge.title}</h2>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-[var(--lux-accent)]/20 text-[var(--lux-accent)] text-xs font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--lux-text-muted)] mb-3">{challenge.subtitle}</p>
                        <p className="text-[var(--lux-text-secondary)] text-sm leading-relaxed mb-4">
                          {challenge.description}
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center gap-6 text-sm text-[var(--lux-text-muted)] mb-4">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" /> {challenge.totalDays} days
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-yellow-400" />{" "}
                            {challenge.weeks.reduce((acc, w) => acc + w.tasks.reduce((a, t) => a + t.xpReward, 0) + (w.bonusTask?.xpReward || 0), 0)} XP total
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Target className="w-4 h-4" /> {challenge.weeks.length} weeks
                          </span>
                        </div>

                        {/* Benefits */}
                        <div className="flex flex-wrap gap-2">
                          {challenge.benefits.map((b, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)] text-xs text-[var(--lux-text-secondary)]">
                              {b}
                            </span>
                          ))}
                        </div>

                        {/* Progress bar if started */}
                        {savedProgress && (
                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-[var(--lux-text-muted)] mb-1">
                              <span>Progress</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-2 bg-[var(--lux-bg-secondary)] rounded-full overflow-hidden">
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
    <div className="min-h-screen bg-[var(--lux-bg-primary)] text-[var(--lux-text-primary)] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-[var(--lux-accent)]/5 blur-[120px] rounded-full opacity-30" />
        <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-[#0066ff]/5 blur-[120px] rounded-full opacity-30" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 relative z-10">
        {/* Back */}
        <button
          onClick={() => setView("list")}
          className="group flex items-center space-x-2 text-[var(--lux-text-muted)] hover:text-[var(--lux-text-primary)] transition-colors mb-8"
        >
          <div className="p-1 rounded-lg bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] group-hover:border-[var(--lux-accent)]/50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">All Challenges</span>
        </button>

        {/* Challenge Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-start gap-6 mb-6">
            <div className={`w-20 h-20 rounded-2xl bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] flex items-center justify-center text-4xl shadow-lg flex-shrink-0 relative overflow-hidden`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${selectedChallenge.color} opacity-20`} />
              <span className="relative z-10">{selectedChallenge.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[var(--lux-text-primary)] mb-2">{selectedChallenge.title}</h1>
              <p className="text-[var(--lux-text-muted)]">{selectedChallenge.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => router.push("/assessment")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Answer Questions</button>
                <button onClick={() => router.push("/image-analyzer")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Analyze Photo</button>
                <button onClick={() => router.push("/result")} className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-500 transition-colors">Open Report</button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Streak", value: progress?.streak || 0, icon: Flame, color: "text-orange-400", suffix: " days" },
              { label: "XP Earned", value: progress?.totalXP || 0, icon: Zap, color: "text-yellow-400", suffix: "" },
              { label: "Completed", value: progress?.completedDays.length || 0, icon: CheckCircle2, color: "text-[var(--lux-accent)]", suffix: `/${selectedChallenge.totalDays}` },
              { label: "Longest Streak", value: progress?.longestStreak || 0, icon: TrendingUp, color: "text-purple-400", suffix: " days" },
            ].map((s) => (
              <div key={s.label} className="lux-card p-4 border border-[var(--lux-glass-border)] text-center">
                <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
                <p className="text-2xl font-bold text-[var(--lux-text-primary)]">
                  {s.value}
                  <span className="text-sm text-[var(--lux-text-muted)] font-normal">{s.suffix}</span>
                </p>
                <p className="text-xs text-[var(--lux-text-muted)] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Overall Progress */}
          {progress && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[var(--lux-text-muted)]">Overall Progress</span>
                <span className="text-[var(--lux-text-primary)] font-bold">{completionPercent}%</span>
              </div>
              <div className="h-3 bg-[var(--lux-bg-secondary)] rounded-full overflow-hidden">
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
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => startChallenge(selectedChallenge)}
              className={`mt-6 w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r ${selectedChallenge.color} hover:shadow-[0_0_30px_-10px_var(--lux-accent)] transition-all flex items-center justify-center gap-3`}
            >
              <Flame className="w-5 h-5" />
              Start This Challenge
            </motion.button>
          ) : (
            <div className="mt-6 flex items-center gap-3 text-[var(--lux-accent)] text-sm font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Challenge Active — Keep going! Mark tasks complete below.
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
                        ? "bg-[var(--lux-bg-secondary)] border-[var(--lux-accent)]/50 text-[var(--lux-text-primary)]"
                        : weekComplete
                          ? "bg-[var(--lux-accent)]/10 border-[var(--lux-accent)]/20 text-[var(--lux-accent)]"
                          : "bg-[var(--lux-bg-elevated)] border-[var(--lux-glass-border)] text-[var(--lux-text-muted)] hover:text-[var(--lux-text-primary)]"
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
              <div className="lux-card p-6 border border-[var(--lux-glass-border)] mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)] flex items-center justify-center`}>
                    <span className="font-bold text-sm text-[var(--lux-text-primary)]">W{currentWeek.week}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--lux-text-primary)]">{currentWeek.theme}</h2>
                    <p className="text-sm text-[var(--lux-text-muted)]">{currentWeek.description}</p>
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
                          ? "bg-[var(--lux-accent)]/10 border-[var(--lux-accent)]/20"
                          : isLocked
                            ? "bg-[var(--lux-bg-elevated)] border-[var(--lux-glass-border)] opacity-60"
                            : "bg-[var(--lux-bg-elevated)] border-[var(--lux-glass-border)] hover:border-[var(--lux-accent)]/50"
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
                            <Lock className="w-6 h-6 text-[var(--lux-text-muted)]" />
                          ) : done ? (
                            <CheckCircle2 className="w-6 h-6 text-[var(--lux-accent)]" />
                          ) : (
                            <Circle className="w-6 h-6 text-[var(--lux-text-muted)] hover:text-[var(--lux-text-primary)]" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="text-xs font-bold text-[var(--lux-text-muted)] uppercase">Day {task.day}</span>
                            <span className="text-lg">{getCategoryIcon(task.category)}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              task.difficulty === "easy"
                                ? "bg-[var(--lux-accent)]/10 text-[var(--lux-accent)]"
                                : task.difficulty === "medium"
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : "bg-red-500/10 text-red-400"
                            }`}>
                              {task.difficulty}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-yellow-400 font-medium">
                              <Zap className="w-3 h-3" /> +{task.xpReward} XP
                            </span>
                          </div>
                          <h3 className={`text-lg font-semibold mb-1 ${done ? "text-[var(--lux-accent)]/80 line-through" : "text-[var(--lux-text-primary)]"}`}>
                            {task.title}
                          </h3>
                          <p className="text-sm text-[var(--lux-text-muted)] leading-relaxed">
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
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold uppercase">
                            ⭐ Bonus Task
                          </span>
                          <span className="flex items-center gap-1 text-xs text-yellow-400 font-medium">
                            <Zap className="w-3 h-3" /> +{currentWeek.bonusTask.xpReward} XP
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--lux-text-primary)] mb-1">
                          {currentWeek.bonusTask.title}
                        </h3>
                        <p className="text-sm text-[var(--lux-text-muted)]">{currentWeek.bonusTask.description}</p>
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
                  className="flex items-center gap-2 text-sm text-[var(--lux-text-muted)] hover:text-[var(--lux-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Week
                </button>
                <button
                  disabled={activeWeek >= selectedChallenge.weeks.length - 1}
                  onClick={() => setActiveWeek((prev) => prev + 1)}
                  className="flex items-center gap-2 text-sm text-[var(--lux-text-muted)] hover:text-[var(--lux-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
