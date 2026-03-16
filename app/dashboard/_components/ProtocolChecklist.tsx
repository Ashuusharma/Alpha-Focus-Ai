"use client";

import { useEffect, useMemo, useState } from "react";
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
  dayNumber: number;
  phaseName: string;
  dailyGoal: string;
  expectedResult: string;
  onToggleAm: () => void;
  onTogglePm: () => void;
  onHydrationDraftChange: (value: string) => void;
  onSleepDraftChange: (value: string) => void;
  onSaveMetrics: () => void;
  onResetDraft: () => void;
  canSaveDraft: boolean;
  saving: boolean;
};

type Runtime = {
  running: boolean;
  remainingSec: number;
};

function slotTasks(tasks: ProtocolTask[], slot: "morning" | "night" | "lifestyle") {
  if (slot === "lifestyle") {
    return tasks.filter((task) => task.slot === "lifestyle");
  }
  return tasks.filter((task) => task.slot === slot);
}

function toClock(slot: "morning" | "lifestyle" | "night", index: number) {
  if (slot === "morning") return `${7 + index}:00 AM`;
  if (slot === "lifestyle") return `${1 + index}:00 PM`;
  return `${10 + index}:00 PM`;
}

function toDuration(task: ProtocolTask) {
  return Math.max(1, Number(task.durationMin || 3));
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
  dayNumber,
  phaseName,
  dailyGoal,
  expectedResult,
  onToggleAm,
  onTogglePm,
  onHydrationDraftChange,
  onSleepDraftChange,
  onSaveMetrics,
  onResetDraft,
  canSaveDraft,
  saving,
}: ProtocolChecklistProps) {
  const [runtimeByTask, setRuntimeByTask] = useState<Record<string, Runtime>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setRuntimeByTask((prev) => {
        const next: Record<string, Runtime> = { ...prev };
        let changed = false;
        Object.keys(next).forEach((key) => {
          const item = next[key];
          if (!item.running) return;
          const remainingSec = Math.max(0, item.remainingSec - 1);
          next[key] = { running: remainingSec > 0, remainingSec };
          changed = true;
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const morningTasks = slotTasks(tasks, "morning");
  const afternoonTasks = slotTasks(tasks, "lifestyle");
  const nightTasks = slotTasks(tasks, "night");

  const hydrationDone = Number(routine?.hydration_ml || 0) >= 2500;
  const sleepDone = Number(routine?.sleep_hours || 0) >= 7;

  const completion = useMemo(() => {
    const total = 4;
    const completed =
      (routine?.am_done ? 1 : 0) +
      (routine?.pm_done ? 1 : 0) +
      (hydrationDone ? 1 : 0) +
      (sleepDone ? 1 : 0);
    return { completed, total, percent: Math.round((completed / total) * 100) };
  }, [routine?.am_done, routine?.pm_done, hydrationDone, sleepDone]);

  const toggleTimer = (taskId: string, durationMin: number) => {
    setRuntimeByTask((prev) => {
      const current = prev[taskId] || { running: false, remainingSec: durationMin * 60 };
      return {
        ...prev,
        [taskId]: { ...current, running: !current.running },
      };
    });
  };

  const resetTimer = (taskId: string, durationMin: number) => {
    setRuntimeByTask((prev) => ({
      ...prev,
      [taskId]: { running: false, remainingSec: durationMin * 60 },
    }));
  };

  const renderRow = (slot: "morning" | "lifestyle" | "night", task: ProtocolTask, index: number) => {
    const duration = toDuration(task);
    const runtime = runtimeByTask[task.id] || { running: false, remainingSec: duration * 60 };

    return (
      <div key={task.id} className="rounded-lg border border-[#E2DDD3] bg-white p-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#8C6A5A]">{toClock(slot, index)}</p>
        <p className="mt-0.5 text-sm font-semibold text-[#1F3D2B]">{task.title || task.label}</p>
        {task.goal ? <p className="mt-1 text-[11px] text-[#2F6F57]">Goal: {task.goal}</p> : null}
        {task.ingredient ? <p className="mt-1 text-[11px] text-[#6B665D]">Ingredient: {task.ingredient}</p> : null}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleTimer(task.id, duration)}
            className="af-btn-soft px-2.5 py-1 text-xs"
          >
            {runtime.running ? "Pause Timer" : "Start Timer"}
          </button>
          <button
            type="button"
            onClick={() => resetTimer(task.id, duration)}
            className="af-btn-soft px-2.5 py-1 text-xs"
          >
            Reset
          </button>
          <span className="text-xs font-semibold text-[#2F6F57]">{Math.floor(runtime.remainingSec / 60)}:{String(runtime.remainingSec % 60).padStart(2, "0")}</span>

          {slot === "morning" ? (
            <button
              type="button"
              onClick={onToggleAm}
              disabled={amDisabled || Boolean(routine?.am_done)}
              className="af-btn-primary px-2.5 py-1 text-xs disabled:opacity-60"
            >
              {routine?.am_done ? "Completed" : "Complete"}
            </button>
          ) : null}

          {slot === "night" ? (
            <button
              type="button"
              onClick={onTogglePm}
              disabled={pmDisabled || Boolean(routine?.pm_done)}
              className="af-btn-primary px-2.5 py-1 text-xs disabled:opacity-60"
            >
              {routine?.pm_done ? "Completed" : "Complete"}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <section className="af-card rounded-2xl p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">Today&apos;s Mission</p>
          <h2 className="text-lg font-bold text-[#1F3D2B]">Day {dayNumber} Protocol · {phaseName}</h2>
        </div>
        <p className="text-xs text-[#6B665D]">Interactive routine engine</p>
      </div>

      <div className="mt-3 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3">
        <p className="text-xs font-semibold text-[#1F3D2B]">Goal: {dailyGoal}</p>
        <p className="mt-1 text-xs text-[#2F6F57]">Expected result: {expectedResult}</p>
      </div>

      <div className="mt-3 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#1F3D2B]">Daily Completion</p>
          <p className="text-xs font-bold text-[#2F6F57]">{completion.completed} / {completion.total} tasks</p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E7E1D7]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#8C6A5A] to-[#2F6F57]" style={{ width: `${completion.percent}%` }} />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8C6A5A]">Morning</p>
          <div className="mt-2 space-y-2">
            {morningTasks.map((task, index) => renderRow("morning", task, index))}
          </div>
          {!routine?.am_done ? <p className="mt-2 text-[11px] text-[#8C877D]">{amHint}</p> : null}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8C6A5A]">Afternoon</p>
          <div className="mt-2 space-y-2">
            {afternoonTasks.map((task, index) => renderRow("lifestyle", task, index))}
          </div>

          <div className="mt-2 rounded-lg border border-[#E2DDD3] bg-white p-3">
            <p className="text-xs font-semibold text-[#1F3D2B]">Hydration & Sleep Checkpoint</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8C6A5A]">Night</p>
          <div className="mt-2 space-y-2">
            {nightTasks.map((task, index) => renderRow("night", task, index))}
          </div>
          {!routine?.pm_done ? <p className="mt-2 text-[11px] text-[#8C877D]">{pmHint}</p> : null}
        </div>
      </div>
    </section>
  );
}
