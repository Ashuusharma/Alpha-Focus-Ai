type AdherenceSummaryProps = {
  consistencyScore: number;
  streakDays: number;
  weeklyCompletionPercent: number;
};

export default function AdherenceSummary({ consistencyScore, streakDays, weeklyCompletionPercent }: AdherenceSummaryProps) {
  const safeConsistency = Math.max(0, Math.min(100, Math.round(consistencyScore)));
  const safeCompletion = Math.max(0, Math.min(100, Math.round(weeklyCompletionPercent)));

  return (
    <section className="rounded-2xl border border-[#E2DDD4] bg-card-soft-gradient p-5 sm:p-6 shadow-card">
      <h3 className="text-base sm:text-lg font-semibold text-[#1E4D3A]">Adherence Summary</h3>
      <div className="mt-4 space-y-3">
        <div className="rounded-xl bg-[#F7F4EE] p-4">
          <p className="text-xs text-[#6E9F87]">Consistency Score</p>
          {safeConsistency > 0 ? (
            <p className="metric-number mt-1 text-2xl text-[#1E4D3A]">{safeConsistency}%</p>
          ) : (
            <p className="mt-1 text-sm font-semibold text-[#2F6F57]">Start your first routine to generate a consistency score.</p>
          )}
        </div>
        <div className="rounded-xl bg-[#F7F4EE] p-4">
          <p className="text-xs text-[#6E9F87]">Streak</p>
          <p className="metric-number mt-1 text-2xl text-[#1E4D3A]">{streakDays} days</p>
        </div>
        <div className="rounded-xl bg-[#F7F4EE] p-4">
          <div className="mb-2 flex items-center justify-between text-sm text-[#2F6F57]">
            <span>Weekly Completion %</span>
            <span className="metric-number text-[#1E4D3A]">{safeCompletion}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#E8E3DA]">
            <div className="h-full rounded-full bg-medical-gradient" style={{ width: `${safeCompletion}%` }} />
          </div>
          {safeCompletion === 0 && (
            <p className="mt-2 text-xs text-[#6E9F87]">Complete your first routine to unlock weekly completion insights.</p>
          )}
        </div>
      </div>
    </section>
  );
}
