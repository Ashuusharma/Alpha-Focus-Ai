import { Flag, Flame, Sparkles, TrendingUp } from "lucide-react";

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
  const phaseTone = phaseLabel.toLowerCase().includes("reset")
    ? "border-blue-200 bg-blue-50 text-blue-700"
    : phaseLabel.toLowerCase().includes("repair")
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-green-200 bg-green-50 text-green-700";

  return (
    <section className="af-card overflow-hidden rounded-2xl p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#8C6A5A]">Transformation Command Center</p>
          <h1 className="mt-1 text-2xl font-bold text-[#1F3D2B]">Welcome {userName} 👋</h1>
          <p className="mt-1 text-sm text-[#6B665D]">{categoryLabel} Recovery Program · {dayLabel}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${phaseTone}`}>Phase: {phaseLabel}</span>
            <span className="rounded-full border border-[#D7D1C6] bg-white px-2.5 py-1 text-xs font-semibold text-[#1F3D2B]">Trend: {recoveryTrend}</span>
          </div>

          <div className="mt-5 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-[#1F3D2B]">Transformation Progress</span>
              <span className="font-bold text-[#2F6F57]">{transformationProgress}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E7E1D7]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#8C6A5A] to-[#2F6F57]" style={{ width: `${transformationProgress}%` }} />
            </div>
            <div className="mt-3 rounded-lg border border-[#D7D1C6] bg-white p-2.5">
              <p className="text-xs font-semibold text-[#1F3D2B]">Next Milestone</p>
              <p className="mt-1 text-xs text-[#6B665D]">{nextMilestone}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#E2DDD3] bg-white p-3">
              <p className="text-xs text-[#6B665D]">Program Day</p>
              <p className="mt-1 text-lg font-bold text-[#1F3D2B]">{dayLabel}</p>
            </div>
            <div className="rounded-xl border border-[#E2DDD3] bg-white p-3">
              <p className="text-xs text-[#6B665D]">Recovery Trend</p>
              <p className="mt-1 text-lg font-bold text-[#1F3D2B]">{recoveryTrend}</p>
            </div>
            <div className="rounded-xl border border-[#E2DDD3] bg-white p-3">
              <p className="text-xs text-[#6B665D]">Confidence</p>
              <p className="mt-1 text-2xl font-bold text-[#1F3D2B]">{confidenceScore}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D9E8DF] bg-[#F4FAF6] p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2F6F57]">Milestone Tracker</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1F3D2B]">
              <Flame className="h-4 w-4 text-orange-500" />
              {streakDays} Day Streak
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1F3D2B]">
              <Sparkles className="h-4 w-4 text-[#2F6F57]" />
              {alphaBalance} Alpha Sikka Earned
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1F3D2B]">
              <Flag className="h-4 w-4 text-[#8C6A5A]" />
              Milestone: {nextMilestone}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1F3D2B]">
              <TrendingUp className="h-4 w-4 text-[#2F6F57]" />
              Trend: {recoveryTrend}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
