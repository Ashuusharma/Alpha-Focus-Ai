type RecoveryProgramNavigatorProps = {
  dayNumber: number;
  totalDays: number;
  activePhase?: "Reset" | "Repair" | "Stabilize";
  onSelectPhase?: (phase: "Reset" | "Repair" | "Stabilize") => void;
  onViewFullProgram?: () => void;
};

function dots(completed: number, total: number) {
  return Array.from({ length: total }).map((_, i) => i < completed);
}

export default function RecoveryProgramNavigator({ dayNumber, totalDays, activePhase, onSelectPhase, onViewFullProgram }: RecoveryProgramNavigatorProps) {
  const resetCompleted = Math.max(0, Math.min(7, dayNumber));
  const repairCompleted = dayNumber <= 7 ? 0 : Math.max(0, Math.min(7, dayNumber - 7));
  const stabilizeCompleted = dayNumber <= 14 ? 0 : Math.max(0, Math.min(16, dayNumber - 14));

  const currentPhase = activePhase || (dayNumber <= 7 ? "Reset" : dayNumber <= 14 ? "Repair" : "Stabilize");

  return (
    <section className="af-card rounded-2xl p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Recovery Roadmap</p>
          <h3 className="text-lg font-bold text-[var(--ink)]">Your 30 Day Program Phases</h3>
        </div>
        <p className="text-xs text-[var(--ink-soft)]">Day {dayNumber} / {totalDays}</p>
      </div>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={() => onSelectPhase?.("Reset")}
          className={`w-full rounded-xl border p-3 text-left ${currentPhase === "Reset" ? "border-[var(--accent-blue)] bg-[var(--tint-cool)]" : "border-[var(--border-hairline)] bg-[var(--tint-neutral)]"}`}
        >
          <p className="text-sm font-semibold text-[var(--ink)]">RESET (Day 1-7)</p>
          <div className="mt-2 flex gap-1.5">
            {dots(resetCompleted, 7).map((done, i) => (
              <span key={`r-${i}`} className={`h-2.5 w-6 rounded-full ${done ? "bg-[var(--accent-blue)]" : "bg-[var(--border-hairline)]"}`} />
            ))}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectPhase?.("Repair")}
          className={`w-full rounded-xl border p-3 text-left ${currentPhase === "Repair" ? "border-[var(--accent-blue)] bg-[var(--tint-cool)]" : "border-[var(--border-hairline)] bg-[var(--tint-neutral)]"}`}
        >
          <p className="text-sm font-semibold text-[var(--ink)]">REPAIR (Day 8-14)</p>
          <div className="mt-2 flex gap-1.5">
            {dots(repairCompleted, 7).map((done, i) => (
              <span key={`p-${i}`} className={`h-2.5 w-6 rounded-full ${done ? "bg-[var(--accent-blue)]" : "bg-[var(--border-hairline)]"}`} />
            ))}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectPhase?.("Stabilize")}
          className={`w-full rounded-xl border p-3 text-left ${currentPhase === "Stabilize" ? "border-[var(--accent-blue)] bg-[var(--tint-cool)]" : "border-[var(--border-hairline)] bg-[var(--tint-neutral)]"}`}
        >
          <p className="text-sm font-semibold text-[var(--ink)]">STABILIZE (Day 15-30)</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dots(stabilizeCompleted, 16).map((done, i) => (
              <span key={`s-${i}`} className={`h-2.5 w-4 rounded-full ${done ? "bg-[var(--accent-blue)]" : "bg-[var(--border-hairline)]"}`} />
            ))}
          </div>
        </button>
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

