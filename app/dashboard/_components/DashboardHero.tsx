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
    <section className="af-surface-card relative overflow-hidden rounded-[2rem] p-8 md:p-12 text-[#1F3D2B] shadow-xl">
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#A9CBB7]/25 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#d8b55f]/16 blur-2xl" />

      <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#E8EFEA] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#2F6F57] backdrop-blur-sm border border-[#C8DACF]">
              {phaseLabel} Phase
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#fff0df] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#b86d13] backdrop-blur-sm border border-[#f0cfad]">
              <Flame className="h-3.5 w-3.5" /> {streakDays} Day Streak
            </span>
          </div>

          <h1 className="text-clinical-heading mt-6 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Welcome back,<br /><span className="text-[#2F6F57]">{userName}</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-[#5F5A51] leading-relaxed">
            {categoryLabel} Recovery Program · {dayLabel}. You are on a {recoveryTrend.toLowerCase()} trajectory. Stay consistent today.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="af-surface-soft p-4 backdrop-blur-sm">
              <Activity className="mb-2 h-5 w-5 text-[#2F6F57]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C6A5A]">Confidence</p>
              <p className="mt-1 text-2xl font-bold">{confidenceScore}/100</p>
            </div>
            <div className="af-surface-soft p-4 backdrop-blur-sm">
              <Sparkles className="mb-2 h-5 w-5 text-[#2F6F57]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C6A5A]">Alpha Sikka</p>
              <p className="mt-1 text-2xl font-bold">{alphaBalance}</p>
            </div>
            <div className="col-span-2 af-surface-soft p-4 backdrop-blur-sm">
              <Target className="mb-2 h-5 w-5 text-[#b86d13]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#8C6A5A]">Next Milestone</p>
              <p className="mt-1 text-sm font-bold leading-tight">{nextMilestone}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <div className="relative flex h-52 w-52 flex-col items-center justify-center rounded-full bg-[linear-gradient(180deg,#fffdf9_0%,#efe6d8_100%)] border border-[#e2d8ca] shadow-[inset_8px_8px_16px_rgba(161,139,110,0.12),inset_-8px_-8px_16px_rgba(255,252,245,0.88)] backdrop-blur-md shrink-0">
            <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="dashboardHeroRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD700" />
                  <stop offset="55%" stopColor="#F4D675" />
                  <stop offset="100%" stopColor="#2F6F57" />
                </linearGradient>
              </defs>
              <circle
                className="text-[#dccfbf]"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                className="transition-all duration-1000 ease-out"
                strokeWidth="6"
                strokeDasharray="251.2"
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                stroke="url(#dashboardHeroRing)"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
            <div className="text-center mt-2">
              <span className="block text-4xl font-black tabular-nums">{transformationProgress}%</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-widest text-[#8C6A5A]">Recovery Score</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
