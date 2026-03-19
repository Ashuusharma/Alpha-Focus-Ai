import { Flag, Flame, Sparkles, TrendingUp, Target, Activity } from "lucide-react";

type DashboardHeroProps = {
  userName: string;
  categoryLabel: string;
  transformationProgress: number;
  phaseLabel: string;
  recoveryTrend: string;
  confidenceScore: number;
  streakDays: number;
  alphaBalance: number;
  dayLabel: string;
  nextMilestone: string;
};

export default function DashboardHero({
  userName,
  categoryLabel,
  transformationProgress,
  phaseLabel,
  recoveryTrend,
  confidenceScore,
  streakDays,
  alphaBalance,
  dayLabel,
  nextMilestone,
}: DashboardHeroProps) {
  const dashOffset = 251.2 - (251.2 * transformationProgress) / 100;

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1F3D2B] via-[#162d20] to-[#0A1A12] p-8 md:p-12 text-white shadow-xl">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#2F6F57]/20 blur-2xl" />

      <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#E8F4EE] backdrop-blur-sm">
              {phaseLabel} Phase
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-orange-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 backdrop-blur-sm">
              <Flame className="h-3.5 w-3.5" /> {streakDays} Day Streak
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Welcome back,<br /><span className="text-[#ffffff]">{userName}</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/70 leading-relaxed">
            {categoryLabel} Recovery Program · {dayLabel}. You are on a {recoveryTrend.toLowerCase()} trajectory. Stay consistent today.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
              <Activity className="mb-2 h-5 w-5 text-[#ffffff]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Confidence</p>
              <p className="mt-1 text-2xl font-bold">{confidenceScore}/100</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
              <Sparkles className="mb-2 h-5 w-5 text-[#2F6F57]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Alpha Sikka</p>
              <p className="mt-1 text-2xl font-bold">{alphaBalance}</p>
            </div>
            <div className="col-span-2 rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
              <Target className="mb-2 h-5 w-5 text-orange-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Next Milestone</p>
              <p className="mt-1 text-sm font-bold leading-tight">{nextMilestone}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <div className="relative flex h-48 w-48 flex-col items-center justify-center rounded-full bg-white/5 shadow-inner backdrop-blur-md shrink-0">
            <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                className="text-white/10"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className="text-[#2F6F57] transition-all duration-1000 ease-out"
                strokeWidth="6"
                strokeDasharray="251.2"
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="text-center mt-2">
              <span className="block text-4xl font-black tabular-nums">{transformationProgress}%</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-widest text-white/50">Recovery Score</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
