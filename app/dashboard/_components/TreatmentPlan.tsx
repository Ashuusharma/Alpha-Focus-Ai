"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronRight, Clock3, RotateCcw, ShoppingBag, TriangleAlert } from "lucide-react";
import { categories, type CategoryId } from "@/lib/questions";
import {
  generateDailyExecutionPayload,
  getRecoveryLevelDisplay,
  getProtocolDurationDays,
  getProtocolTemplate,
  normalizeRecoveryLevel,
  type DailyExecutionTask,
  type ProtocolContraindications,
  type ProtocolGuidanceLanguage,
  type ProtocolToleranceMode,
} from "@/lib/protocolTemplates";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import { readUserState, writeUserState } from "@/lib/dbUserState";
import { supabase } from "@/lib/supabaseClient";
import { getRecoveryProgramLevel, saveRecoveryProgramLevel } from "@/lib/userProfile";

type TreatmentPlanMode = "mission" | "full";

type TreatmentPlanProps = {
  categoryLabel: string;
  phaseName: string;
  dayNumber: number;
  category: CategoryId | null;
  availableCategories: CategoryId[];
  userId: string;
  onCategoryChange?: (category: CategoryId) => void;
  mode?: TreatmentPlanMode;
};

type TaskRuntime = {
  running: boolean;
  remainingSec: number;
  startedAt: string | null;
};

type PersistedPlanState = {
  selectedDay: number;
  timezone: string;
  completedTaskKeys: Record<string, string>;
  dayCompletions: Record<string, string>;
  toleranceMode?: ProtocolToleranceMode;
  guidanceLanguage?: ProtocolGuidanceLanguage;
  contraindications?: ProtocolContraindications;
};

type ProductRow = {
  product_id: string;
};

type TaskWindowCode = "completed" | "locked" | "in_progress" | "ready_complete" | "start" | "missed";

type TaskWindowStatus = {
  code: TaskWindowCode;
  inWindow: boolean;
  countdownSec: number;
};

type TaskPresentationState = "locked" | "active" | "in_progress" | "completed" | "missed";

type TaskCardProps = {
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

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const EXECUTION_STATE_KEY_PREFIX = "daily-execution";

function parseHHMM(value: string) {
  const [h, m] = value.split(":").map((part) => Number(part || 0));
  return Math.max(0, Math.min(23, h)) * 60 + Math.max(0, Math.min(59, m));
}

function nowMinutesInTimezone(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value || "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value || "0");
  return hour * 60 + minute;
}

function formatNowInTimezone(now: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(now);
}

function formatCountdown(seconds: number) {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function getLocalExecutionStateKey(userId: string, category: CategoryId) {
  return `${EXECUTION_STATE_KEY_PREFIX}:${userId}:${category}`;
}

function getCloudExecutionStateKey(category: CategoryId) {
  return `${EXECUTION_STATE_KEY_PREFIX}:${category}`;
}

async function awardTaskReward(referenceId: string, metadata: Record<string, unknown>) {
  const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
  await fetch("/api/alpha-sikka/earn", {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "treatment_task_completed",
      referenceId,
      metadata,
    }),
  });
}

async function awardDayReward(referenceId: string, metadata: Record<string, unknown>) {
  const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
  await fetch("/api/alpha-sikka/earn", {
    method: "POST",
    headers,
    body: JSON.stringify({
      action: "treatment_day_completed",
      referenceId,
      metadata,
    }),
  });
}

function taskWindowState(task: DailyExecutionTask, nowTzMinutes: number, runtime: TaskRuntime, completed: boolean): TaskWindowStatus {
  const startMin = parseHHMM(task.timeWindow.start);
  const endMin = parseHHMM(task.timeWindow.end);
  const inWindow = nowTzMinutes >= startMin && nowTzMinutes <= endMin;
  const beforeWindow = nowTzMinutes < startMin;

  if (completed) {
    return { code: "completed", inWindow, countdownSec: 0 };
  }

  if (beforeWindow) {
    return { code: "locked", inWindow, countdownSec: Math.max(0, (startMin - nowTzMinutes) * 60) };
  }

  if (runtime.running) {
    return { code: "in_progress", inWindow, countdownSec: runtime.remainingSec };
  }

  if (runtime.startedAt && runtime.remainingSec === 0 && inWindow) {
    return { code: "ready_complete", inWindow, countdownSec: 0 };
  }

  if (inWindow) {
    return { code: "start", inWindow, countdownSec: 0 };
  }

  return { code: "missed", inWindow, countdownSec: 0 };
}

function getPresentationState(state: TaskWindowStatus, completed: boolean, runtime: TaskRuntime): TaskPresentationState {
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
      badgeClass: "bg-[#E8F4EE] text-[#0071e3]",
      cardClass: "ring-1 ring-[#0071e3]/15 bg-[#FCFFFD]",
    };
  }

  if (presentationState === "in_progress") {
    return {
      label: "In Progress",
      badgeClass: "bg-[#1d1d1f] text-white",
      cardClass: "ring-2 ring-[#0071e3]/20 bg-white shadow-lg",
    };
  }

  if (presentationState === "active") {
    return {
      label: "Active",
      badgeClass: "bg-[#E8F4EE] text-[#1d1d1f]",
      cardClass: "ring-2 ring-[#0071e3]/20 bg-white shadow-lg",
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
    badgeClass: "bg-[#F1EFEA] text-[#7D786F]",
    cardClass: "bg-white",
  };
}

function TaskCard({
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
    ? "shadow-xl scale-[1.02] bg-gradient-to-br from-[#F4FAF6] to-white ring-2 ring-[#0071e3]/30 z-10" 
    : "shadow-md bg-white opacity-85 hover:opacity-100";

  return (
    <article
      className={`rounded-[2rem] border-none p-6 transition-all duration-300 transform ${activeStyling}`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#F8F7F4] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#6e6e73]">
                {task.timeWindow.start} - {task.timeWindow.end}
              </span>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${statusMeta.badgeClass}`}>
                {statusMeta.label}
              </span>
              {isActive && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0071e3] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0071e3]"></span>
                </span>
              )}
            </div>
            <h5 className="text-2xl font-black leading-tight text-[#1d1d1f]">{task.title}</h5>
            <div className="flex items-center gap-3 text-xs font-semibold text-[#6e6e73]">
              <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {task.durationMin} min</span>
              <span className="text-[#0071e3] flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> +{task.reward} A$</span>
            </div>
          </div>
          <ChevronRight className={`h-5 w-5 text-[#6e6e73] transition-transform duration-300 ${isActive ? "rotate-90" : ""}`} />
        </div>

        {!isActive ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F8F7F4] px-5 py-4">
            <p className="truncate text-sm font-semibold text-[#1d1d1f] flex-1">{task.goal}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#6e6e73] shrink-0 text-right">
              {presentationState === "locked"
                ? `Unlocks in ${formatCountdown(state.countdownSec)}`
                : presentationState === "in_progress"
                  ? `Timer running: ${formatCountdown(runtime.remainingSec)}`
                  : "Standby"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 mt-2">
            
            <div className="rounded-2xl bg-[#1d1d1f]/5 border border-[#1d1d1f]/10 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0071e3] mb-1">
                Primary Goal
              </p>
              <p className="text-sm font-bold text-[#1d1d1f]">{task.goal}</p>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#6e6e73]">Execution Steps</p>
              <ul className="space-y-4">
                {task.howToSteps.map((step, idx) => (
                  <li key={`${task.id}-step-${idx}`} className="flex items-start gap-4 text-sm text-[#3b3834]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8F4EE] text-[11px] font-bold text-[#0071e3] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-[#F8F7F4] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6e6e73]">Why It Helps</p>
                <p className="mt-2 text-sm leading-relaxed text-[#3b3834]">{task.whyItHelps}</p>
              </div>
              <div className="rounded-2xl bg-[#FFF8F2] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6e6e73]">Care Note</p>
                <p className="mt-2 text-sm leading-relaxed text-[#3b3834]">{task.caution}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F8F7F4] p-5 flex flex-col sm:flex-row gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-[#d9d9de]">
                <ShoppingBag className="h-6 w-6 text-[#6e6e73]/50" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6e6e73]">{task.product.ingredient}</p>
                <p className="text-sm font-black text-[#1d1d1f] mt-0.5">{task.product.name}</p>
                
                {!userHasProduct ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link href={`/shop?product=${encodeURIComponent(task.product.id)}`} className="rounded-xl bg-gradient-to-r from-green-600 to-green-500 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-md hover:scale-105 active:scale-95 transition-all">
                      Buy Product
                    </Link>
                    <button type="button" onClick={onSetProductOwnership} className="rounded-xl bg-white border border-[#d9d9de] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#1d1d1f] hover:bg-[#F8F7F4] active:scale-95 transition-all">
                      I have this
                    </button>
                    {!showHomeAlternative ? (
                      <button type="button" onClick={onToggleHomeAlternative} className="rounded-xl underline px-2 py-2 text-[10px] uppercase font-bold tracking-widest text-[#6e6e73] hover:text-[#1d1d1f] transition-all">
                        Home Remedy?
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#0071e3]">
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

            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] pt-4 border-t border-[#F1ECE3]">
              <button
                type="button"
                onClick={onToggleTimer}
                disabled={startDisabled}
                className={`rounded-xl px-5 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  presentationState === "in_progress"
                    ? "bg-[#1d1d1f] text-white shadow-lg shadow-[#1d1d1f]/30"
                    : presentationState === "active"
                      ? "bg-[#F8F7F4] text-[#1d1d1f] hover:bg-[#d9d9de]"
                      : "bg-[#F1EFEA] text-[#9B958B]"
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
                className="rounded-xl px-4 py-3.5 text-xs font-black uppercase tracking-wider bg-white border border-[#d9d9de] text-[#6e6e73] hover:bg-[#F8F7F4] active:scale-95 transition-all"
              >
                <RotateCcw className="h-4 w-4 mx-auto" />
              </button>

              <button
                type="button"
                onClick={onComplete}
                disabled={completeDisabled}
                className={`rounded-xl px-6 py-3.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  completed
                    ? "bg-[#E8F4EE] text-[#0071e3]"
                    : completeDisabled
                      ? "bg-[#F1EFEA] text-[#9B958B] opacity-50"
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
              <div className="flex items-center justify-center gap-2 rounded-xl bg-[#E8F4EE] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[#0071e3]">
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

export default function TreatmentPlan({
  categoryLabel,
  phaseName,
  dayNumber,
  category,
  availableCategories,
  userId,
  onCategoryChange,
  mode = "full",
}: TreatmentPlanProps) {
  const validCategories = useMemo(() => {
    const ordered = availableCategories.length > 0 ? availableCategories : category ? [category] : [];
    return ordered.filter((id, idx) => ordered.indexOf(id) === idx && !!getProtocolTemplate(id));
  }, [availableCategories, category]);

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(category && getProtocolTemplate(category) ? category : validCategories[0] || null);
  const [selectedDay, setSelectedDay] = useState(Math.max(1, dayNumber));
  const [completedTaskKeys, setCompletedTaskKeys] = useState<Record<string, string>>({});
  const [dayCompletions, setDayCompletions] = useState<Record<string, string>>({});
  const [taskRuntime, setTaskRuntime] = useState<Record<string, TaskRuntime>>({});
  const [showHomeAlternative, setShowHomeAlternative] = useState<Record<string, boolean>>({});
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [clockTick, setClockTick] = useState(Date.now());
  const [toleranceMode, setToleranceMode] = useState<ProtocolToleranceMode>("intermediate");
  const [guidanceLanguage, setGuidanceLanguage] = useState<ProtocolGuidanceLanguage>("en");
  const [contraindications, setContraindications] = useState<ProtocolContraindications>({});
  const [ownedProducts, setOwnedProducts] = useState<Record<string, boolean>>({});

  const lastPersistedBlobRef = useRef<string>("");

  const applyPersistedState = (parsed: PersistedPlanState, categoryForState: CategoryId | null) => {
    const serialized = JSON.stringify(parsed);
    if (serialized === lastPersistedBlobRef.current) return;

    lastPersistedBlobRef.current = serialized;

    if (mode === "full") {
      setSelectedDay(parsed.selectedDay || Math.max(1, dayNumber));
    }
    setTimezone(DEFAULT_TIMEZONE);
    setCompletedTaskKeys(parsed.completedTaskKeys || {});
    setDayCompletions(parsed.dayCompletions || {});
    setToleranceMode(normalizeRecoveryLevel(parsed.toleranceMode));
    setGuidanceLanguage(parsed.guidanceLanguage || "en");
    setContraindications(parsed.contraindications || {});

    if (categoryForState) {
      window.localStorage.setItem(getLocalExecutionStateKey(userId, categoryForState), serialized);
    }
  };

  useEffect(() => {
    if (!selectedCategory && validCategories[0]) setSelectedCategory(validCategories[0]);
  }, [selectedCategory, validCategories]);

  useEffect(() => {
    if (mode === "mission") {
      setSelectedDay(Math.max(1, dayNumber));
    }
  }, [mode, dayNumber]);

  useEffect(() => {
    const syncServerTime = async () => {
      const requestStart = Date.now();
      const response = await fetch("/api/time", { cache: "no-store" });
      const payload = (await response.json()) as { serverNow: string };
      const requestEnd = Date.now();
      const roundTrip = requestEnd - requestStart;
      const estimatedServerNow = new Date(payload.serverNow).getTime() + Math.round(roundTrip / 2);
      setServerOffsetMs(estimatedServerNow - requestEnd);
    };

    void syncServerTime();
    const timer = setInterval(() => void syncServerTime(), 120000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setClockTick(Date.now());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedCategory) return;
    let cancelled = false;

    const loadPersistedState = async () => {
      const cloudState = await readUserState<PersistedPlanState>(userId, getCloudExecutionStateKey(selectedCategory));
      if (cancelled) return;

      if (cloudState) {
        applyPersistedState(cloudState, selectedCategory);
        return;
      }

      const localKey = getLocalExecutionStateKey(userId, selectedCategory);
      const raw = window.localStorage.getItem(localKey);

      if (!raw) {
        lastPersistedBlobRef.current = "";
        setCompletedTaskKeys({});
        setDayCompletions({});
        setToleranceMode(getRecoveryProgramLevel());
        return;
      }

      try {
        applyPersistedState(JSON.parse(raw) as PersistedPlanState, selectedCategory);
      } catch {
        lastPersistedBlobRef.current = "";
        setCompletedTaskKeys({});
        setDayCompletions({});
      }
    };

    void loadPersistedState();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, userId, dayNumber, mode]);

  useEffect(() => {
    saveRecoveryProgramLevel(toleranceMode);
  }, [toleranceMode]);

  useEffect(() => {
    if (!selectedCategory) return;

    const payload: PersistedPlanState = {
      selectedDay,
      timezone,
      completedTaskKeys,
      dayCompletions,
      toleranceMode,
      guidanceLanguage,
      contraindications,
    };
    const serialized = JSON.stringify(payload);
    lastPersistedBlobRef.current = serialized;
    window.localStorage.setItem(getLocalExecutionStateKey(userId, selectedCategory), serialized);

    const timeout = window.setTimeout(() => {
      void writeUserState(userId, getCloudExecutionStateKey(selectedCategory), payload);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [selectedCategory, userId, selectedDay, timezone, completedTaskKeys, dayCompletions, toleranceMode, guidanceLanguage, contraindications]);

  useEffect(() => {
    if (!selectedCategory) return;

    const loadOwnedProducts = async () => {
      const { data } = await supabase.from("user_products").select("product_id").eq("user_id", userId);
      const rows = (data || []) as ProductRow[];
      const next: Record<string, boolean> = {};
      rows.forEach((row) => {
        next[row.product_id] = true;
      });
      setOwnedProducts(next);
    };

    void loadOwnedProducts();

    const channel = supabase
      .channel(`daily-execution-sync:${userId}:${selectedCategory}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_app_state", filter: `user_id=eq.${userId}` },
        (payload) => {
          const nextRow = (payload.new || payload.old) as { state_key?: string; state_blob?: string } | null;
          if (!nextRow?.state_key || nextRow.state_key !== getCloudExecutionStateKey(selectedCategory)) return;
          if (!nextRow.state_blob) return;

          try {
            applyPersistedState(JSON.parse(nextRow.state_blob) as PersistedPlanState, selectedCategory);
          } catch {
            return;
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_products", filter: `user_id=eq.${userId}` },
        () => {
          void loadOwnedProducts();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedCategory, userId, mode, dayNumber]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTaskRuntime((prev) => {
        let changed = false;
        const next: Record<string, TaskRuntime> = { ...prev };
        Object.keys(next).forEach((taskKey) => {
          const runtime = next[taskKey];
          if (!runtime.running) return;
          const updated = { ...runtime, remainingSec: Math.max(0, runtime.remainingSec - 1) };
          if (updated.remainingSec === 0) {
            updated.running = false;
          }
          next[taskKey] = updated;
          changed = true;
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const template = selectedCategory ? getProtocolTemplate(selectedCategory) : null;
  const totalDays = template ? getProtocolDurationDays(template) : 30;
  const levelDisplay = getRecoveryLevelDisplay(toleranceMode);

  const completedIds = useMemo(() => Object.keys(completedTaskKeys), [completedTaskKeys]);
  const ownedProductIds = useMemo(() => Object.keys(ownedProducts).filter((id) => ownedProducts[id]), [ownedProducts]);
  const missedYesterday = Boolean(selectedCategory && selectedDay > 1 && !dayCompletions[`${selectedCategory}:${selectedDay - 1}`]);
  const completedDaysThisWeek = useMemo(() => {
    if (!selectedCategory) return 0;
    const weekStart = Math.floor((selectedDay - 1) / 7) * 7 + 1;
    const weekEnd = Math.min(selectedDay, weekStart + 6);
    let count = 0;

    for (let day = weekStart; day <= weekEnd; day += 1) {
      if (dayCompletions[`${selectedCategory}:${day}`]) count += 1;
    }

    return count;
  }, [dayCompletions, selectedCategory, selectedDay]);

  const execution = useMemo(() => {
    if (!selectedCategory) return null;
    return generateDailyExecutionPayload(
      selectedCategory,
      selectedDay,
      {
        toleranceMode,
        contraindications,
        guidanceLanguage,
        missedYesterday,
        completedDaysThisWeek,
        weeklyPhotoDone: selectedDay % 7 === 0,
      },
      {
        completedTaskIds: completedIds,
        ownedProductIds,
      }
    );
  }, [selectedCategory, selectedDay, toleranceMode, contraindications, guidanceLanguage, missedYesterday, completedDaysThisWeek, completedIds, ownedProductIds]);

  const now = new Date(clockTick + serverOffsetMs);
  const nowTzMinutes = nowMinutesInTimezone(now, timezone);
  const liveIndiaTime = formatNowInTimezone(now, timezone);

  const taskGroups = execution?.tasks || { morning: [], afternoon: [], night: [] };
  const allTasks = [...taskGroups.morning, ...taskGroups.afternoon, ...taskGroups.night];
  const allDone = allTasks.length > 0 && allTasks.every((task) => Boolean(completedTaskKeys[task.id]));

  const taskState = (task: DailyExecutionTask) => {
    const runtime = taskRuntime[task.id] || { running: false, remainingSec: task.durationMin * 60, startedAt: null };
    return taskWindowState(task, nowTzMinutes, runtime, Boolean(completedTaskKeys[task.id]));
  };

  const activeTaskId = useMemo(() => {
    if (allTasks.length === 0) return null;

    const pendingTasks = allTasks.filter((task) => !completedTaskKeys[task.id]);
    if (pendingTasks.length === 0) return allTasks[0]?.id || null;

    const runningTask = pendingTasks.find((task) => taskRuntime[task.id]?.running ?? false);
    if (runningTask) return runningTask.id;

    const readyTask = pendingTasks.find((task) => taskState(task).code === "ready_complete");
    if (readyTask) return readyTask.id;

    const currentWindowTask = pendingTasks.find((task) => {
      const state = taskState(task);
      return state.code === "start" || state.code === "in_progress";
    });
    if (currentWindowTask) return currentWindowTask.id;

    const upcomingTask = pendingTasks
      .map((task) => ({ task, startMin: parseHHMM(task.timeWindow.start) }))
      .filter((entry) => entry.startMin > nowTzMinutes)
      .sort((a, b) => a.startMin - b.startMin)[0];

    return upcomingTask?.task.id || pendingTasks[0]?.id || null;
  }, [allTasks, completedTaskKeys, taskRuntime, nowTzMinutes]);

  const setProductOwnership = async (productId: string, hasProduct: boolean) => {
    setOwnedProducts((prev) => ({ ...prev, [productId]: hasProduct }));

    if (hasProduct) {
      await supabase.from("user_products").upsert(
        {
          user_id: userId,
          product_id: productId,
          purchased_at: new Date().toISOString(),
        },
        { onConflict: "user_id,product_id" }
      );
      return;
    }

    await supabase.from("user_products").delete().eq("user_id", userId).eq("product_id", productId);
  };

  const toggleTaskTimer = (task: DailyExecutionTask) => {
    const state = taskState(task);
    if (state.code === "locked" || state.code === "missed" || state.code === "completed") return;

    setTaskRuntime((prev) => {
      const existing = prev[task.id] || { running: false, remainingSec: task.durationMin * 60, startedAt: null };
      return {
        ...prev,
        [task.id]: {
          ...existing,
          running: !existing.running,
          startedAt: existing.startedAt || new Date(Date.now() + serverOffsetMs).toISOString(),
        },
      };
    });
  };

  const resetTaskTimer = (task: DailyExecutionTask) => {
    setTaskRuntime((prev) => ({
      ...prev,
      [task.id]: { running: false, remainingSec: task.durationMin * 60, startedAt: null },
    }));
  };

  const completeTask = async (task: DailyExecutionTask, asRecovery = false) => {
    if (completedTaskKeys[task.id]) return;

    const runtime = taskRuntime[task.id] || { running: false, remainingSec: task.durationMin * 60, startedAt: null };
    const state = taskState(task);
    const timerCompleted = runtime.startedAt != null && runtime.remainingSec === 0;
    const withinWindow = state.inWindow;

    if (!asRecovery) {
      const strictAllowed = state.code === "ready_complete" && timerCompleted && withinWindow;
      if (!strictAllowed) return;
    }

    const completedAt = new Date(Date.now() + serverOffsetMs).toISOString();
    setCompletedTaskKeys((prev) => ({ ...prev, [task.id]: completedAt }));

    if (asRecovery) return;

    await awardTaskReward(`daily-execution:${task.id}`, {
      timerCompleted,
      withinWindow,
      cooldownLock: true,
      completedOnce: true,
      isRecovery: false,
      completedAt,
      timezone,
    });
  };

  const completeDay = async () => {
    if (!selectedCategory || !execution || !allDone) return;

    const dayKey = `${selectedCategory}:${execution.day}`;
    if (dayCompletions[dayKey]) return;

    const completedAt = new Date(Date.now() + serverOffsetMs).toISOString();
    setDayCompletions((prev) => ({ ...prev, [dayKey]: completedAt }));

    await awardDayReward(`daily-execution-day:${dayKey}`, {
      allTasksVerified: true,
      cooldownLock: true,
      completedOnce: true,
      completedAt,
      adherenceScore: execution.adherenceScore,
    });

    if (mode === "full" && selectedDay < totalDays) {
      setSelectedDay(selectedDay + 1);
    }
  };

  if (!selectedCategory || !template || !execution) {
    return (
      <section className="af-card rounded-2xl border-none bg-white p-8 shadow-xl/5">
        <h3 className="text-xl font-bold text-clinical-heading">Clinical Execution Engine</h3>
        <p className="mt-2 text-md text-clinical-body opacity-70">Please complete the AI Analyzer or Assessment to generate your specialized recovery routine.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/image-analyzer" className="af-btn-primary px-6 py-3 text-sm">Start Scan</Link>
          <Link href="/assessment" className="af-btn-soft px-6 py-3 text-sm">Start Assessment</Link>
        </div>
      </section>
    );
  }

  const progressPct = Math.max(0, Math.min(100, Math.round((Object.keys(dayCompletions).length / Math.max(1, totalDays)) * 100)));
  const completedToday = allTasks.filter((task) => Boolean(completedTaskKeys[task.id])).length;

  return (
    <section className="af-card rounded-[2rem] border-none bg-white p-4 md:p-8 shadow-sm flex flex-col relative" id="daily-execution-engine">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md pb-4 pt-2 mb-4 -mx-4 md:-mx-8 px-4 md:px-8 border-b border-[#F1ECE3] flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#6e6e73]">Daily Protocol</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-clinical-heading">
            {mode === "mission" ? "Today's Mission" : "Recovery Planner"} Â· {categories.find((c) => c.id === selectedCategory)?.label || categoryLabel}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-[#F8F7F4] px-3 py-1 text-[11px] font-bold text-[#6e6e73]">
              DAY {execution.day} / {totalDays}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#E8F4EE] px-3 py-1 text-[11px] font-bold text-[#0071e3]">
              PHASE {execution.phase}: {phaseName}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#F8F7F4] px-3 py-1 text-[11px] font-bold text-[#6e6e73]">
              IST {liveIndiaTime}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-[#FFF6E8] px-3 py-1 text-[11px] font-bold text-[#6e6e73]">
              {levelDisplay.label} Track
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[#6e6e73]">
            {levelDisplay.description} The planner uses India Standard Time for all task windows and spreads actions across the full day instead of stacking everything in one generic morning block.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {([
              "beginner",
              "intermediate",
              "advanced",
            ] as ProtocolToleranceMode[]).map((level) => {
              const option = getRecoveryLevelDisplay(level);
              const active = toleranceMode === level;

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setToleranceMode(level)}
                  className={`rounded-2xl px-4 py-2 text-left transition-all ${
                    active
                      ? "bg-[#1d1d1f] text-white shadow-lg"
                      : "bg-[#F8F7F4] text-[#4B463F] hover:bg-[#EDE7DD]"
                  }`}
                >
                  <span className="block text-[11px] font-black uppercase tracking-widest">{option.label}</span>
                  <span className={`mt-1 block max-w-[14rem] text-[10px] leading-relaxed ${active ? "text-white/80" : "text-[#7A7369]"}`}>
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {mode === "full" ? (
          <div className="flex flex-wrap gap-2">
            {validCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  onCategoryChange?.(cat);
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${cat === selectedCategory ? "bg-[#1d1d1f] text-white shadow-lg" : "bg-[#F8F7F4] text-[#6e6e73] hover:bg-[#d9d9de]"}`}
              >
                {categories.find((c) => c.id === cat)?.label || cat}
              </button>
            ))}
          </div>
        ) : (
          <Link href="/recovery-program" className="group flex items-center gap-2 text-xs font-bold text-[#1d1d1f] transition-colors hover:text-[#0071e3]">
            Full Program <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180" />
          </Link>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#F8F7F4] p-5 md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#1d1d1f]" />
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#1d1d1f]">Objective Today</p>
          </div>
          <p className="mt-2 text-md font-bold leading-snug text-clinical-heading">{execution.dailyGoal}</p>
          <p className="mt-1 text-xs italic text-clinical-body opacity-60">{execution.expectedOutcome}</p>
        </div>

        <div className="rounded-2xl bg-[#F8F7F4] p-5">
          <div className="mb-2 flex items-end justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#1d1d1f]">Progress</p>
            <span className="text-lg font-bold text-clinical-heading">{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#d9d9de]">
            <div className="h-full rounded-full bg-[#0071e3] transition-all duration-1000" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-3 space-y-1 text-[10px] font-bold uppercase tracking-widest text-[#6e6e73]">
            <p>Adherence today: {execution.adherenceScore}%</p>
            <p>Verified tasks: {completedToday} / {allTasks.length}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-10">
        {([
          { key: "morning", label: "Sunrise Routine", tasks: taskGroups.morning },
          { key: "afternoon", label: "Midday Care", tasks: taskGroups.afternoon },
          { key: "night", label: "Night Ritual", tasks: taskGroups.night },
        ] as const).map((group) => (
          <div key={group.key}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#1d1d1f]">{group.label}</h4>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6e6e73]">
                  {group.tasks.length} task{group.tasks.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="rounded-full bg-[#F8F7F4] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#6e6e73]">
                {group.tasks.some((task) => task.id === activeTaskId) ? "Current window" : "Queued"}
              </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory md:flex-col md:overflow-visible hide-scrollbar">
              {group.tasks.length === 0 ? (
                <div className="w-full rounded-[1.5rem] border-2 border-dashed border-[#d9d9de] bg-[#FCFAF9] p-8 text-center">
                  <p className="text-sm font-medium italic text-[#6e6e73]">No mandatory clinical tasks scheduled for this period.</p>
                </div>
              ) : (
                group.tasks.map((task) => {
                  const runtime = taskRuntime[task.id] || { running: false, remainingSec: task.durationMin * 60, startedAt: null };
                  const state = taskState(task);
                  const completed = Boolean(completedTaskKeys[task.id]);
                  const userHasProduct = ownedProducts[task.product.id] || task.userHasProduct;

                  return (
                    <div key={task.id} className="w-[85vw] snap-center shrink-0 md:w-auto md:shrink">
                      <TaskCard
                        task={task}
                        state={state}
                        runtime={runtime}
                        completed={completed}
                        userHasProduct={userHasProduct}
                        showHomeAlternative={Boolean(showHomeAlternative[task.id])}
                        isActive={task.id === activeTaskId}
                        onToggleTimer={() => toggleTaskTimer(task)}
                        onResetTimer={() => resetTaskTimer(task)}
                        onComplete={() => void completeTask(task, false)}
                        onRecoveryComplete={() => void completeTask(task, true)}
                        onToggleHomeAlternative={() => setShowHomeAlternative((prev) => ({ ...prev, [task.id]: !prev[task.id] }))}
                        onSetProductOwnership={() => void setProductOwnership(task.product.id, true)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-16 flex flex-col items-center gap-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1d1d1f] via-[#162d20] to-[#0A1A12] p-8 text-white shadow-xl">
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#0071e3]/20 blur-xl" />

        <div className="relative z-10 text-center">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.3em] text-[#E8F4EE]">Completion Milestone</p>
          <h4 className="text-clinical-heading mb-2 text-3xl font-black tracking-tight">Finalize Daily Protocol</h4>
          <p className="mx-auto max-w-sm text-sm text-white/85 leading-relaxed">All verified tasks sync into your recovery log instantly. Complete the day only after every active window task is properly verified.</p>
        </div>

        <button
          type="button"
          onClick={() => void completeDay()}
          disabled={!allDone || Boolean(dayCompletions[`${selectedCategory}:${execution.day}`])}
          className={`relative z-10 flex w-full max-w-xs items-center justify-center gap-3 rounded-2xl px-8 py-4 text-sm font-black uppercase tracking-[0.15em] transition-all duration-300 ${
            allDone && !dayCompletions[`${selectedCategory}:${execution.day}`]
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 hover:scale-105 hover:shadow-green-500/50 active:scale-95"
              : "cursor-not-allowed border border-white/10 bg-white/5 text-white/40"
          }`}
        >
          {dayCompletions[`${selectedCategory}:${execution.day}`] ? (
            <>
              Verified <CheckCircle2 className="h-5 w-5" />
            </>
          ) : (
            <>
              Verify Protocol <span className="rounded-md bg-white/20 px-2 py-0.5 text-[9px] text-white">+5 A$</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile Fixed Action Bar Space reserved */}
      <div className="h-24 md:hidden" />

      {/* Mobile Fixed Action Bar */}
      {activeTaskId && !allDone && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-xl border-t border-[#F1ECE3] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] md:hidden pointer-events-auto">
          <button 
            onClick={() => {
              document.getElementById('daily-execution-engine')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full bg-gradient-to-r from-[#0071e3] to-[#1d1d1f] text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-transform"
          >
            Start Next Task <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}


