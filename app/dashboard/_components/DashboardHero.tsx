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
    <section className="relative overflow-hidden rounded-[2rem] border border-[#2997ff]/20 bg-[radial-gradient(circle_at_top_right,rgba(0,113,227,0.22),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(191,242,48,0.08),transparent_26%),linear-gradient(160deg,#0c1018_0%,#0a0e16_54%,#080c12_100%)] p-8 shadow-[0_26px_60px_rgba(0,0,0,0.36)] md:p-12">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#0071e3]/16 blur-3xl" />
      <div className="absolute -left-14 bottom-0 h-56 w-56 rounded-full bg-[#2997ff]/12 blur-3xl" />

      <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-[#2997ff]/40 bg-[#09111f]/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#bff230] shadow-[0_8px_22px_rgba(0,0,0,0.3)]">
              {phaseLabel} Phase
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-[#2997ff]/40 bg-[#09111f]/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#bff230] shadow-[0_8px_22px_rgba(0,0,0,0.3)]">
              <Flame className="h-3.5 w-3.5" /> {streakDays} Day Streak
            </span>
          </div>

          <h1 className="text-clinical-heading mt-6 text-4xl font-black tracking-tight text-[#ffffff] sm:text-5xl lg:text-6xl">
            Welcome back,<br /><span className="text-[#bff230]">{userName}</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-[#a7a7a7] leading-relaxed">
            {categoryLabel} Recovery Program - {dayLabel}. You are on a {recoveryTrend.toLowerCase()} trajectory. Stay consistent today.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#d9d9de] bg-white/95 p-4 shadow-[0_16px_34px_rgba(0,0,0,0.24)] transition-transform duration-200 hover:-translate-y-1">
              <Activity className="mb-2 h-5 w-5 text-[#0071e3]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5e5e5e]">Confidence</p>
              <p className="mt-1 text-2xl font-bold text-[#000000]">{confidenceScore}/100</p>
            </div>
            <div className="rounded-2xl border border-[#d9d9de] bg-white/95 p-4 shadow-[0_16px_34px_rgba(0,0,0,0.24)] transition-transform duration-200 hover:-translate-y-1">
              <Sparkles className="mb-2 h-5 w-5 text-[#0071e3]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5e5e5e]">Alpha Sikka</p>
              <p className="mt-1 text-2xl font-bold text-[#000000]">{alphaBalance}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-[#d9d9de] bg-white/95 p-4 shadow-[0_16px_34px_rgba(0,0,0,0.24)] transition-transform duration-200 hover:-translate-y-1">
              <Target className="mb-2 h-5 w-5 text-[#0071e3]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5e5e5e]">Next Milestone</p>
              <p className="mt-1 text-sm font-bold leading-tight text-[#000000]">{nextMilestone}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <div className="relative flex h-52 w-52 flex-col items-center justify-center rounded-full border border-[#0071e3]/65 bg-[#09111a] shadow-[0_22px_48px_rgba(0,0,0,0.36)] shrink-0">
            <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="dashboardHeroRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0071e3" />
                  <stop offset="100%" stopColor="#bff230" />
                </linearGradient>
              </defs>
              <circle
                className="text-[#2a3324]"
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
              <span className="block text-4xl font-black tabular-nums text-[#ffffff]">{transformationProgress}%</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-widest text-[#a7a7a7]">Recovery Score</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

