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
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">Recovery Roadmap</p>
          <h3 className="text-lg font-bold text-[#1F3D2B]">Your 30 Day Program Phases</h3>
        </div>
        <p className="text-xs text-[#6B665D]">Day {dayNumber} / {totalDays}</p>
      </div>

      <div className="mt-4 space-y-3">
        <button
          type="button"
          onClick={() => onSelectPhase?.("Reset")}
          className={`w-full rounded-xl border p-3 text-left ${currentPhase === "Reset" ? "border-[#2F6F57] bg-[#ECF5EF]" : "border-[#E2DDD3] bg-[#F8F6F3]"}`}
        >
          <p className="text-sm font-semibold text-[#1F3D2B]">RESET (Day 1-7)</p>
          <div className="mt-2 flex gap-1.5">
            {dots(resetCompleted, 7).map((done, i) => (
              <span key={`r-${i}`} className={`h-2.5 w-6 rounded-full ${done ? "bg-[#2F6F57]" : "bg-[#D7D1C6]"}`} />
            ))}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectPhase?.("Repair")}
          className={`w-full rounded-xl border p-3 text-left ${currentPhase === "Repair" ? "border-[#2F6F57] bg-[#ECF5EF]" : "border-[#E2DDD3] bg-[#F8F6F3]"}`}
        >
          <p className="text-sm font-semibold text-[#1F3D2B]">REPAIR (Day 8-14)</p>
          <div className="mt-2 flex gap-1.5">
            {dots(repairCompleted, 7).map((done, i) => (
              <span key={`p-${i}`} className={`h-2.5 w-6 rounded-full ${done ? "bg-[#2F6F57]" : "bg-[#D7D1C6]"}`} />
            ))}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectPhase?.("Stabilize")}
          className={`w-full rounded-xl border p-3 text-left ${currentPhase === "Stabilize" ? "border-[#2F6F57] bg-[#ECF5EF]" : "border-[#E2DDD3] bg-[#F8F6F3]"}`}
        >
          <p className="text-sm font-semibold text-[#1F3D2B]">STABILIZE (Day 15-30)</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {dots(stabilizeCompleted, 16).map((done, i) => (
              <span key={`s-${i}`} className={`h-2.5 w-4 rounded-full ${done ? "bg-[#2F6F57]" : "bg-[#D7D1C6]"}`} />
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
