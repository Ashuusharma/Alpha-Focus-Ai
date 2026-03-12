import type { ProtocolTask } from "@/lib/protocolTemplates";

type RoutineState = {
  am_done?: boolean | null;
  pm_done?: boolean | null;
  hydration_ml?: number | null;
  sleep_hours?: number | null;
};

type ProtocolChecklistProps = {
  tasks: ProtocolTask[];
  routine: RoutineState | null;
  amDisabled: boolean;
  pmDisabled: boolean;
  amHint: string;
  pmHint: string;
  hydrationDraft: string;
  sleepDraft: string;
  onToggleAm: () => void;
  onTogglePm: () => void;
  onHydrationDraftChange: (value: string) => void;
  onSleepDraftChange: (value: string) => void;
  onSaveMetrics: () => void;
  onResetDraft: () => void;
  canSaveDraft: boolean;
  saving: boolean;
};

function slotTasks(tasks: ProtocolTask[], slot: "morning" | "night" | "lifestyle") {
  if (slot === "lifestyle") {
    return tasks.filter((task) => task.slot === "lifestyle");
  }
  return tasks.filter((task) => task.slot === slot);
}

export default function ProtocolChecklist({
  tasks,
  routine,
  amDisabled,
  pmDisabled,
  amHint,
  pmHint,
  hydrationDraft,
  sleepDraft,
  onToggleAm,
  onTogglePm,
  onHydrationDraftChange,
  onSleepDraftChange,
  onSaveMetrics,
  onResetDraft,
  canSaveDraft,
  saving,
}: ProtocolChecklistProps) {
  const morningTasks = slotTasks(tasks, "morning");
  const nightTasks = slotTasks(tasks, "night");
  const lifestyleTasks = slotTasks(tasks, "lifestyle");

  const hydrationDone = Number(routine?.hydration_ml || 0) >= 2500;
  const sleepDone = Number(routine?.sleep_hours || 0) >= 7;

  return (
    <section className="af-card rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">Today&apos;s Protocol</p>
          <h2 className="text-lg font-bold text-[#1F3D2B]">Daily Routine Engine</h2>
        </div>
        <p className="text-xs text-[#6B665D]">Each completion earns Alpha Sikka</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
          <p className="text-sm font-bold text-[#1F3D2B]">Morning Routine</p>
          <ul className="mt-2 space-y-1 text-sm text-[#6B665D]">
            {(morningTasks.length ? morningTasks : [{ id: "am-default", label: "Cleanser + SPF" }]).map((task) => (
              <li key={task.id}>• {task.label}</li>
            ))}
          </ul>
          <button
            onClick={onToggleAm}
            disabled={amDisabled}
            className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${routine?.am_done ? "bg-[#E8F4EE] text-[#1F3D2B] border border-[#2F6F57]" : "bg-white border border-[#D7D1C6] text-[#1F3D2B]"}`}
          >
            {routine?.am_done ? "✔ Completed (+3 A$)" : "Mark Complete"}
          </button>
          {!routine?.am_done ? <p className="mt-2 text-[11px] text-[#8C877D]">{amHint}</p> : null}
        </div>

        <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
          <p className="text-sm font-bold text-[#1F3D2B]">Lifestyle</p>
          <ul className="mt-2 space-y-1 text-sm text-[#6B665D]">
            {(lifestyleTasks.length ? lifestyleTasks : [{ id: "life-default", label: "Hydration + sleep recovery" }]).map((task) => (
              <li key={task.id}>• {task.label}</li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              max={6000}
              step={100}
              value={hydrationDraft}
              onChange={(e) => onHydrationDraftChange(e.target.value)}
              placeholder="Hydration ml"
              className="rounded-lg border border-[#D7D1C6] bg-white px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              min={0}
              max={12}
              step={0.5}
              value={sleepDraft}
              onChange={(e) => onSleepDraftChange(e.target.value)}
              placeholder="Sleep hrs"
              className="rounded-lg border border-[#D7D1C6] bg-white px-2 py-1.5 text-sm"
            />
          </div>
          <p className="mt-2 text-[11px] text-[#6B665D]">
            {hydrationDone ? "✔ Hydration goal" : "○ Hydration pending"} · {sleepDone ? "✔ Sleep goal" : "○ Sleep pending"}
          </p>
          <div className="mt-2 flex gap-2">
            <button onClick={onSaveMetrics} disabled={!canSaveDraft || saving} className="af-btn-primary px-3 py-1.5 text-xs disabled:opacity-60">
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={onResetDraft} disabled={!canSaveDraft || saving} className="af-btn-soft px-3 py-1.5 text-xs disabled:opacity-60">
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
          <p className="text-sm font-bold text-[#1F3D2B]">Night Routine</p>
          <ul className="mt-2 space-y-1 text-sm text-[#6B665D]">
            {(nightTasks.length ? nightTasks : [{ id: "pm-default", label: "Repair balm + barrier lock" }]).map((task) => (
              <li key={task.id}>• {task.label}</li>
            ))}
          </ul>
          <button
            onClick={onTogglePm}
            disabled={pmDisabled}
            className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${routine?.pm_done ? "bg-[#E8F4EE] text-[#1F3D2B] border border-[#2F6F57]" : "bg-white border border-[#D7D1C6] text-[#1F3D2B]"}`}
          >
            {routine?.pm_done ? "✔ Completed (+3 A$)" : "Mark Complete"}
          </button>
          {!routine?.pm_done ? <p className="mt-2 text-[11px] text-[#8C877D]">{pmHint}</p> : null}
        </div>
      </div>
    </section>
  );
}
