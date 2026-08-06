import Link from "next/link";
import { CheckCircle2, ChevronRight, Clock3, RotateCcw, ShoppingBag, TriangleAlert } from "lucide-react";
import type { DailyExecutionTask } from "@/lib/protocolTemplates";

export type TaskRuntime = {
  running: boolean;
  remainingSec: number;
  startedAt: string | null;
};

export type TaskWindowCode = "completed" | "locked" | "in_progress" | "ready_complete" | "start" | "missed";

export type TaskWindowStatus = {
  code: TaskWindowCode;
  inWindow: boolean;
  countdownSec: number;
};

export type TaskPresentationState = "locked" | "active" | "in_progress" | "completed" | "missed";

export type TaskCardProps = {
  task: DailyExecutionTask;
  state: TaskWindowStatus;
  runtime: TaskRuntime;
  completed: boolean;
  userHasProduct: boolean;
  showHomeAlternative: boolean;
  isActive: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onComplete: () => void;
  onRecoveryComplete: () => void;
  onToggleHomeAlternative: () => void;
  onSetProductOwnership: () => void;
};

export function formatCountdown(seconds: number) {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export function getPresentationState(state: TaskWindowStatus, completed: boolean, runtime: TaskRuntime): TaskPresentationState {
  if (completed) return "completed";
  if (runtime.running || state.code === "in_progress") return "in_progress";
  if (state.code === "locked") return "locked";
  if (state.code === "missed") return "missed";
  return "active";
}

function getStatusMeta(presentationState: TaskPresentationState) {
  if (presentationState === "completed") {
    return {
      label: "Completed",
      badgeClass: "bg-[var(--tint-cool)] text-[var(--accent-blue)]",
      cardClass: "ring-1 ring-[var(--accent-blue)]/15 bg-[var(--tint-cool)]",
    };
  }

  if (presentationState === "in_progress") {
    return {
      label: "In Progress",
      badgeClass: "bg-[var(--ink)] text-white",
      cardClass: "ring-2 ring-[var(--accent-blue)]/20 bg-white shadow-lg",
    };
  }

  if (presentationState === "active") {
    return {
      label: "Active",
      badgeClass: "bg-[var(--tint-cool)] text-[var(--ink)]",
      cardClass: "ring-2 ring-[var(--accent-blue)]/20 bg-white shadow-lg",
    };
  }

  if (presentationState === "missed") {
    return {
      label: "Missed",
      badgeClass: "bg-red-50 text-red-600",
      cardClass: "ring-1 ring-red-100 bg-white",
    };
  }

  return {
    label: "Locked",
    badgeClass: "bg-[var(--tint-neutral)] text-[var(--ink-soft)]",
    cardClass: "bg-white",
  };
}

/**
 * One daily-protocol task card — extracted from TreatmentPlan.tsx (Phase
 * 9C.5) as a pure presentational component. All state (timers, completion,
 * server-time sync, Supabase persistence) still lives in the parent; this
 * component only renders what it's given and calls the callbacks it's
 * handed. No business logic moved — only JSX, its local formatting/style
 * helpers, and the prop-driven types it needs.
 */
export default function TaskCard({
  task,
  state,
  runtime,
  completed,
  userHasProduct,
  showHomeAlternative,
  isActive,
  onToggleTimer,
  onResetTimer,
  onComplete,
  onRecoveryComplete,
  onToggleHomeAlternative,
  onSetProductOwnership,
}: TaskCardProps) {
  const presentationState = getPresentationState(state, completed, runtime);
  const statusMeta = getStatusMeta(presentationState);
  const startDisabled = presentationState === "locked" || presentationState === "completed" || presentationState === "missed";
  const completeDisabled = state.code !== "ready_complete" && !completed;

  const activeStyling = isActive
    ? "shadow-xl scale-[1.02] bg-gradient-to-br from-[var(--tint-cool)] to-white ring-2 ring-[var(--accent-blue)]/30 z-10"
    : "shadow-md bg-white opacity-85 hover:opacity-100";

  return (
    <article
      className={`rounded-[var(--radius-card)] border-none p-6 transition-all duration-300 transform ${activeStyling}`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--bg-wash-start)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--ink-soft)]">
                {task.timeWindow.start} - {task.timeWindow.end}
              </span>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusMeta.badgeClass}`}>
                {statusMeta.label}
              </span>
              {isActive && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-blue)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-blue)]"></span>
                </span>
              )}
            </div>
            <h5 className="text-2xl font-black leading-tight text-[var(--ink)]">{task.title}</h5>
            <div className="flex items-center gap-3 text-xs font-semibold text-[var(--ink-soft)]">
              <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {task.durationMin} min</span>
              <span className="text-[var(--accent-blue)] flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> +{task.reward} A$</span>
            </div>
          </div>
          <ChevronRight className={`h-5 w-5 text-[var(--ink-soft)] transition-transform duration-300 ${isActive ? "rotate-90" : ""}`} />
        </div>

        {!isActive ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--bg-wash-start)] px-5 py-4">
            <p className="truncate text-sm font-semibold text-[var(--ink)] flex-1">{task.goal}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)] shrink-0 text-right">
              {presentationState === "locked"
                ? `Unlocks in ${formatCountdown(state.countdownSec)}`
                : presentationState === "in_progress"
                  ? `Timer running: ${formatCountdown(runtime.remainingSec)}`
                  : "Standby"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-2">

            <div className="rounded-2xl bg-[var(--ink)]/5 border border-[var(--ink)]/10 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent-blue)] mb-1">
                Primary Goal
              </p>
              <p className="text-sm font-bold text-[var(--ink)]">{task.goal}</p>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-soft)]">Execution Steps</p>
              <ul className="space-y-4">
                {task.howToSteps.map((step, idx) => (
                  <li key={`${task.id}-step-${idx}`} className="flex items-start gap-4 text-sm text-[var(--ink-soft)]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--tint-cool)] text-[11px] font-bold text-[var(--accent-blue)] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-[var(--bg-wash-start)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">Why It Helps</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{task.whyItHelps}</p>
              </div>
              <div className="rounded-2xl bg-[var(--tint-warm)] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">Care Note</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{task.caution}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--bg-wash-start)] p-5 flex flex-col sm:flex-row gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-[var(--border-hairline)]">
                <ShoppingBag className="h-6 w-6 text-[var(--ink-soft)]/50" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--ink-soft)]">{task.product.ingredient}</p>
                <p className="text-sm font-black text-[var(--ink)] mt-0.5">{task.product.name}</p>

                {!userHasProduct ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link href={`/shop?product=${encodeURIComponent(task.product.id)}`} className="rounded-xl bg-gradient-to-r from-green-600 to-green-500 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-md hover:scale-105 active:scale-95 transition-all">
                      Buy Product
                    </Link>
                    <button type="button" onClick={onSetProductOwnership} className="rounded-xl bg-white border border-[var(--border-hairline)] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] hover:bg-[var(--bg-wash-start)] active:scale-95 transition-all">
                      I have this
                    </button>
                    {!showHomeAlternative ? (
                      <button type="button" onClick={onToggleHomeAlternative} className="rounded-xl underline px-2 py-2 text-[10px] uppercase font-bold tracking-widest text-[var(--ink-soft)] hover:text-[var(--ink)] transition-all">
                        Home Remedy?
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--accent-blue)]">
                    <CheckCircle2 className="h-4 w-4" /> Ready in kit
                  </div>
                )}

                {showHomeAlternative && !userHasProduct && (
                  <div className="mt-4 rounded-xl bg-orange-50 border border-orange-100 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-orange-800 mb-2">Home Alternative</p>
                    <ul className="space-y-1.5 text-[11px] text-orange-900 list-disc pl-4">
                      {task.fallbackHomeRemedy.map((rt, ri) => <li key={ri}>{rt}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] pt-4 border-t border-[var(--tint-warm)]">
              <button
                type="button"
                onClick={onToggleTimer}
                disabled={startDisabled}
                className={`rounded-xl px-5 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  presentationState === "in_progress"
                    ? "bg-[var(--ink)] text-white shadow-lg shadow-[var(--ink)]/30"
                    : presentationState === "active"
                      ? "bg-[var(--bg-wash-start)] text-[var(--ink)] hover:bg-[var(--border-hairline)]"
                      : "bg-[var(--tint-neutral)] text-[var(--ink-soft)]"
                } ${startDisabled ? "cursor-not-allowed opacity-50" : "active:scale-95 hover:scale-105"}`}
              >
                {presentationState === "locked"
                  ? `Locked  -  ${formatCountdown(state.countdownSec)}`
                  : presentationState === "in_progress"
                    ? `Running  -  ${formatCountdown(runtime.remainingSec)}`
                    : presentationState === "missed"
                      ? "Missed"
                      : runtime.startedAt
                        ? "Resume"
                        : "Start Task"}
              </button>

              <button
                type="button"
                onClick={onResetTimer}
                className="rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-wider bg-white border border-[var(--border-hairline)] text-[var(--ink-soft)] hover:bg-[var(--bg-wash-start)] active:scale-95 transition-all"
              >
                <RotateCcw className="h-4 w-4 mx-auto" />
              </button>

              <button
                type="button"
                onClick={onComplete}
                disabled={completeDisabled}
                className={`rounded-xl px-6 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  completed
                    ? "bg-[var(--tint-cool)] text-[var(--accent-blue)]"
                    : completeDisabled
                      ? "bg-[var(--tint-neutral)] text-[var(--ink-soft)] opacity-50"
                      : "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95"
                }`}
              >
                {completed ? "Completed" : "Complete Task"}
              </button>
            </div>

            {state.code === "missed" && !completed && (
              <button
                type="button"
                onClick={onRecoveryComplete}
                className="w-full rounded-xl bg-red-50 text-red-700 px-4 py-3 text-xs font-bold uppercase tracking-wider transition hover:bg-red-100"
              >
                Mark as Recovered
              </button>
            )}

            {state.code === "ready_complete" && !completed ? (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-[var(--tint-cool)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--accent-blue)]">
                <TriangleAlert className="h-3.5 w-3.5" />
                Verification unlocked for this time window
              </div>
            ) : null}
          </div>
        )}
      </div>
    </article>
  );
}
