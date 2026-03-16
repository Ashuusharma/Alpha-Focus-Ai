type RecoveryProgramNavigatorProps = {
  dayNumber: number;
  totalDays: number;
  onViewFullProgram?: () => void;
};

function dots(completed: number, total: number) {
  return Array.from({ length: total }).map((_, i) => i < completed);
}

export default function RecoveryProgramNavigator({ dayNumber, totalDays, onViewFullProgram }: RecoveryProgramNavigatorProps) {
  const resetCompleted = Math.max(0, Math.min(7, dayNumber));
  const repairCompleted = dayNumber <= 7 ? 0 : Math.max(0, Math.min(7, dayNumber - 7));
  const stabilizeCompleted = dayNumber <= 14 ? 0 : Math.max(0, Math.min(16, dayNumber - 14));

  return (
    <section className="af-card rounded-2xl p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">Recovery Program Navigator</p>
          <h3 className="text-lg font-bold text-[#1F3D2B]">Your 30 Day Recovery Roadmap</h3>
        </div>
        <p className="text-xs text-[#6B665D]">Day {dayNumber} / {totalDays}</p>
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3">
          <p className="text-sm font-semibold text-[#1F3D2B]">Phase 1 Reset (Day 1-7)</p>
          <div className="mt-2 flex gap-1.5">
            {dots(resetCompleted, 7).map((done, i) => (
              <span key={`r-${i}`} className={`h-2.5 w-6 rounded-full ${done ? "bg-[#2F6F57]" : "bg-[#D7D1C6]"}`} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3">
          <p className="text-sm font-semibold text-[#1F3D2B]">Phase 2 Repair (Day 8-14)</p>
          <div className="mt-2 flex gap-1.5">
            {dots(repairCompleted, 7).map((done, i) => (
              <span key={`p-${i}`} className={`h-2.5 w-6 rounded-full ${done ? "bg-[#2F6F57]" : "bg-[#D7D1C6]"}`} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3">
          <p className="text-sm font-semibold text-[#1F3D2B]">Phase 3 Stabilize (Day 15-30)</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dots(stabilizeCompleted, 16).map((done, i) => (
              <span key={`s-${i}`} className={`h-2.5 w-4 rounded-full ${done ? "bg-[#2F6F57]" : "bg-[#D7D1C6]"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onViewFullProgram}
          className="af-btn-soft px-3 py-1.5 text-xs"
        >
          View full program
        </button>
      </div>
    </section>
  );
}
