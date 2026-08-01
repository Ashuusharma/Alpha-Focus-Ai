import { Flame, Sparkles, Target, Activity } from "lucide-react";

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
    <section className="af-hero-dark relative overflow-hidden p-8 md:p-12">
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[var(--accent-blue)]/16 blur-3xl" />
      <div className="absolute -left-14 bottom-0 h-56 w-56 rounded-full bg-[var(--accent-green)]/12 blur-3xl" />

      <div className="relative z-10 grid gap-10 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--accent-blue-soft)]/40 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-green)] shadow-[0_8px_22px_rgba(0,0,0,0.3)]">
              {phaseLabel} Phase
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-[var(--accent-blue-soft)]/40 bg-black/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-green)] shadow-[0_8px_22px_rgba(0,0,0,0.3)]">
              <Flame className="h-3.5 w-3.5" /> {streakDays} Day Streak
            </span>
          </div>

          <h1 className="text-clinical-heading mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Welcome back,<br /><span className="text-[var(--accent-green)]">{userName}</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[var(--text-secondary-dark)]">
            {categoryLabel} Recovery Program - {dayLabel}. You are on a {recoveryTrend.toLowerCase()} trajectory. Stay consistent today.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-white p-4 shadow-[var(--shadow-raised)] transition-transform duration-200 hover:-translate-y-1">
              <Activity className="mb-2 h-5 w-5 text-[var(--accent-blue)]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">Confidence</p>
              <p className="mt-1 text-2xl font-bold text-[var(--ink)]">{confidenceScore}/100</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-hairline)] bg-white p-4 shadow-[var(--shadow-raised)] transition-transform duration-200 hover:-translate-y-1">
              <Sparkles className="mb-2 h-5 w-5 text-[var(--accent-blue)]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">Alpha Sikka</p>
              <p className="mt-1 text-2xl font-bold text-[var(--ink)]">{alphaBalance}</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-[var(--border-hairline)] bg-white p-4 shadow-[var(--shadow-raised)] transition-transform duration-200 hover:-translate-y-1">
              <Target className="mb-2 h-5 w-5 text-[var(--accent-blue)]" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">Next Milestone</p>
              <p className="mt-1 text-sm font-bold leading-tight text-[var(--ink)]">{nextMilestone}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center lg:justify-end">
          <div className="relative flex h-52 w-52 shrink-0 flex-col items-center justify-center rounded-full border border-[var(--accent-blue)]/65 bg-black/40 shadow-[0_22px_48px_rgba(0,0,0,0.36)]">
            <svg className="absolute inset-0 h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="dashboardHeroRing" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0071e3" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
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
            <div className="mt-2 text-center">
              <span className="block text-4xl font-black tabular-nums text-white">{transformationProgress}%</span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary-dark)]">Recovery Score</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

