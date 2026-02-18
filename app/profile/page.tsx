"use client";

import { getUserProfile } from "@/lib/userProfile";
import { useRewardsStore } from "@/lib/rewardsStore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, User, Trophy, Flame, Medal } from "lucide-react";

type PlanRecommendation = {
  id: string;
  title: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const profile = getUserProfile();
  const level = useRewardsStore((s) => s.level);
  const levelTitle = useRewardsStore((s) => s.levelTitle);
  const xp = useRewardsStore((s) => s.xp);
  const streakCount = useRewardsStore((s) => s.streakCount);
  const achievements = useRewardsStore((s) => s.achievements);

  if (!profile || profile.plans.length === 0) {
    return (
      <div className="min-h-screen bg-[#060b14] flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.1),transparent_70%)]" />
        <div className="w-24 h-24 bg-[#0c1626] rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10 backdrop-blur-xl relative z-10">
          <User className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2 relative z-10">No Saved Plans</h2>
        <p className="text-slate-400 relative z-10">Your analysis history will appear here.</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-8 px-8 py-4 bg-gradient-to-r from-[#00f2ff] to-[#0066cc] text-[#060b14] rounded-xl font-bold hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition relative z-10"
        >
          Start New Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] py-20 px-4 flex justify-center text-white relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00f2ff]/5 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] mix-blend-screen" />
      </div>
      
      <div className="w-full max-w-3xl relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-3 bg-[#00f2ff]/10 rounded-xl border border-[#00f2ff]/20">
            <User className="w-8 h-8 text-[var(--lux-accent)]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold lux-text-gradient">
              Your Saved AI Plans
            </h1>
            <p className="text-slate-400">Access your personalized routines and history</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => router.push("/assessment")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Answer Questions</button>
              <button onClick={() => router.push("/image-analyzer")} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors">Analyze Photo</button>
              <button onClick={() => router.push("/result")} className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-500 transition-colors">Open Report</button>
            </div>
          </div>
        </div>

        <div className="mb-8 grid md:grid-cols-3 gap-4">
          <div className="lux-card border-white/10 p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4 text-[var(--lux-accent)]" />
              Rank
            </div>
            <p className="text-lg font-bold text-white">Level {level} – {levelTitle}</p>
            <p className="text-xs text-slate-400 mt-1">Total XP: {xp}</p>
          </div>
          <div className="lux-card border-white/10 p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4 text-[var(--lux-accent)]" />
              Streak
            </div>
            <p className="text-lg font-bold text-white">{streakCount} days</p>
            <p className="text-xs text-slate-400 mt-1">Consistency momentum</p>
          </div>
          <div className="lux-card border-white/10 p-5">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-2">
              <Medal className="w-4 h-4 text-[var(--lux-accent)]" />
              Achievements
            </div>
            <p className="text-lg font-bold text-white">{achievements.length}</p>
            <p className="text-xs text-slate-400 mt-1">Total unlocked milestones</p>
          </div>
        </div>

        <div className="mb-8 lux-card border-white/10 p-5">
          <h2 className="text-lg font-bold text-white mb-4">All Achievements</h2>
          {achievements.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {achievements
                .slice()
                .reverse()
                .map((achievement) => (
                  <div key={achievement} className="px-4 py-3 rounded-xl bg-[#00f2ff]/10 border border-[#00f2ff]/20 text-sm text-[var(--lux-accent)]">
                    {achievement}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No achievements unlocked yet. Complete scans and maintain streaks to unlock milestones.</p>
          )}
        </div>

        <div className="space-y-6">
          {profile.plans.map((plan, idx: number) => {
            const recommendations = Array.isArray(plan.recommendations)
              ? (plan.recommendations as PlanRecommendation[])
              : [];

            return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={plan.id}
              className="group lux-card border-white/10 p-6 hover:bg-[#0c1626] transition-all duration-300 hover:border-[var(--lux-accent)] hover:shadow-[0_0_30px_rgba(0,242,255,0.1)] cursor-pointer"
              onClick={() => router.push(`/result?answers=${encodeURIComponent(JSON.stringify(plan.answers))}`)}
            >
              <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {recommendations.slice(0, 3).map((recommendation) => (
                      <span key={recommendation.id} className="px-3 py-1 bg-[#00f2ff]/10 border border-[#00f2ff]/20 rounded-full text-xs text-[var(--lux-accent)]">
                        {recommendation.title}
                      </span>
                    ))}
                    {recommendations.length > 3 && (
                      <span className="px-3 py-1 bg-[#0c1626] border border-white/10 rounded-full text-xs text-slate-400">
                        +{recommendations.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[var(--lux-accent)] font-bold group-hover:translate-x-2 transition-transform duration-300">
                  <span>View Plan</span>
                  <ArrowRight className="w-5 h-5" />
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
