"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Pause, Play, RotateCcw, ShoppingBag, TriangleAlert } from "lucide-react";
import { categories, type CategoryId } from "@/lib/questions";
import {
  generateDailyExecutionPayload,
  getProtocolDurationDays,
  getProtocolTemplate,
  type DailyExecutionTask,
  type ProtocolContraindications,
  type ProtocolGuidanceLanguage,
  type ProtocolToleranceMode,
} from "@/lib/protocolTemplates";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import { supabase } from "@/lib/supabaseClient";

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

const DEFAULT_TIMEZONE = "Asia/Kolkata";

function toDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

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

function formatCountdown(seconds: number) {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
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

function taskWindowState(task: DailyExecutionTask, nowTzMinutes: number, runtime: TaskRuntime, completed: boolean) {
  const startMin = parseHHMM(task.timeWindow.start);
  const endMin = parseHHMM(task.timeWindow.end);
  const inWindow = nowTzMinutes >= startMin && nowTzMinutes <= endMin;
  const beforeWindow = nowTzMinutes < startMin;

  if (completed) {
    return { code: "completed" as const, inWindow, countdownSec: 0 };
  }

  if (beforeWindow) {
    const countdownSec = Math.max(0, (startMin - nowTzMinutes) * 60);
    return { code: "locked" as const, inWindow, countdownSec };
  }

  if (runtime.running) {
    return { code: "in_progress" as const, inWindow, countdownSec: runtime.remainingSec };
  }

  if (runtime.startedAt && runtime.remainingSec === 0) {
    return { code: "ready_complete" as const, inWindow, countdownSec: 0 };
  }

  if (inWindow) {
    return { code: "start" as const, inWindow, countdownSec: 0 };
  }

  return { code: "missed" as const, inWindow, countdownSec: 0 };
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
  const [toleranceMode, setToleranceMode] = useState<ProtocolToleranceMode>("moderate");
  const [guidanceLanguage, setGuidanceLanguage] = useState<ProtocolGuidanceLanguage>("en");
  const [contraindications, setContraindications] = useState<ProtocolContraindications>({});
  const [ownedProducts, setOwnedProducts] = useState<Record<string, boolean>>({});

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
    if (!selectedCategory) return;
    const key = `daily-execution:${userId}:${selectedCategory}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      setCompletedTaskKeys({});
      setDayCompletions({});
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedPlanState;
      if (mode === "full") {
        setSelectedDay(parsed.selectedDay || Math.max(1, dayNumber));
      }
      setTimezone(parsed.timezone || DEFAULT_TIMEZONE);
      setCompletedTaskKeys(parsed.completedTaskKeys || {});
      setDayCompletions(parsed.dayCompletions || {});
      setToleranceMode(parsed.toleranceMode || "moderate");
      setGuidanceLanguage(parsed.guidanceLanguage || "en");
      setContraindications(parsed.contraindications || {});
    } catch {
      setCompletedTaskKeys({});
      setDayCompletions({});
    }
  }, [selectedCategory, userId, dayNumber, mode]);

  useEffect(() => {
    if (!selectedCategory) return;

    const key = `daily-execution:${userId}:${selectedCategory}`;
    const payload: PersistedPlanState = {
      selectedDay,
      timezone,
      completedTaskKeys,
      dayCompletions,
      toleranceMode,
      guidanceLanguage,
      contraindications,
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  }, [selectedCategory, userId, selectedDay, timezone, completedTaskKeys, dayCompletions, toleranceMode, guidanceLanguage, contraindications]);

  useEffect(() => {
    if (!selectedCategory) return;

    const loadOwnedProducts = async () => {
      const { data } = await supabase
        .from("user_products")
        .select("product_id")
        .eq("user_id", userId);

      const rows = (data || []) as ProductRow[];
      const next: Record<string, boolean> = {};
      rows.forEach((row) => {
        next[row.product_id] = true;
      });
      setOwnedProducts(next);
    };

    void loadOwnedProducts();
  }, [selectedCategory, userId]);

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

  const completedIds = useMemo(() => Object.keys(completedTaskKeys), [completedTaskKeys]);
  const ownedProductIds = useMemo(() => Object.keys(ownedProducts).filter((id) => ownedProducts[id]), [ownedProducts]);

  const execution = useMemo(() => {
    if (!selectedCategory) return null;
    return generateDailyExecutionPayload(
      selectedCategory,
      selectedDay,
      {
        toleranceMode,
        contraindications,
        guidanceLanguage,
      },
      {
        completedTaskIds: completedIds,
        ownedProductIds,
      }
    );
  }, [selectedCategory, selectedDay, toleranceMode, contraindications, guidanceLanguage, completedIds, ownedProductIds]);

  const now = new Date(Date.now() + serverOffsetMs);
  const nowTzMinutes = nowMinutesInTimezone(now, timezone);

  const taskGroups = execution?.tasks || { morning: [], afternoon: [], night: [] };
  const allTasks = [...taskGroups.morning, ...taskGroups.afternoon, ...taskGroups.night];
  const allDone = allTasks.length > 0 && allTasks.every((task) => Boolean(completedTaskKeys[task.id]));

  const taskState = (task: DailyExecutionTask) => {
    const runtime = taskRuntime[task.id] || { running: false, remainingSec: task.durationMin * 60, startedAt: null };
    return taskWindowState(task, nowTzMinutes, runtime, Boolean(completedTaskKeys[task.id]));
  };

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
      const strictAllowed = (state.code === "ready_complete") && timerCompleted && withinWindow;
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
      <section className="af-card rounded-2xl p-8 bg-white shadow-xl/5 border-none">
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

  return (
    <section className="af-card rounded-[2rem] p-8 bg-white border-none shadow-sm" id="daily-execution-engine">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#8C6A5A]">Daily Protocol</p>
          <h3 className="mt-1 text-2xl font-bold text-clinical-heading tracking-tight">
            {mode === "mission" ? "Mission Control" : "Recovery Planner"} · {categories.find((c) => c.id === selectedCategory)?.label || categoryLabel}
          </h3>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#F8F7F4] rounded-full text-[11px] font-bold text-[#6B665D]">
              DAY {execution.day} / {totalDays}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-[#E8F4EE] rounded-full text-[11px] font-bold text-[#2F6F57]">
              PHASE {execution.phase}: {phaseName}
            </span>
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
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${cat === selectedCategory ? "bg-[#1F3D2B] text-white shadow-lg" : "bg-[#F8F7F4] text-[#6B665D] hover:bg-[#E2DDD3]"}`}
              >
                {categories.find((c) => c.id === cat)?.label || cat}
              </button>
            ))}
          </div>
        ) : (
          <Link href="/recovery-program" className="group flex items-center gap-2 text-xs font-bold text-[#1F3D2B] hover:text-[#2F6F57] transition-colors">
            FULL PROGRAM <RotateCcw className="h-3.5 w-3.5 group-hover:rotate-180 transition-transform duration-500" />
          </Link>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#F8F7F4] p-5 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1F3D2B]" />
            <p className="text-[12px] font-bold text-[#1F3D2B] uppercase tracking-wider">Objectives Today</p>
          </div>
          <p className="text-md font-bold text-clinical-heading leading-snug">{execution.dailyGoal}</p>
          <p className="text-xs text-clinical-body opacity-60 italic">{execution.expectedOutcome}</p>
        </div>
        
        <div className="rounded-2xl bg-[#F8F7F4] p-5 flex flex-col justify-center">
           <div className="flex justify-between items-end mb-2">
              <p className="text-[11px] font-bold text-[#1F3D2B] uppercase tracking-wider">Overall Consistency</p>
              <span className="text-lg font-bold text-clinical-heading">{progressPct}%</span>
           </div>
           <div className="h-2 overflow-hidden rounded-full bg-[#E2DDD3]">
             <div 
               className="h-full rounded-full bg-[#2F6F57] transition-all duration-1000" 
               style={{ width: `${progressPct}%`, transitionDelay: '0.2s' }} 
             />
           </div>
           <p className="mt-2 text-[10px] text-[#8C6A5A] uppercase font-bold tracking-widest">Adherence today: {execution.adherenceScore}%</p>
        </div>
      </div>

      <div className="mt-12 space-y-12">
        {([
          { key: "morning", label: "Sunrise Routine", time: "6:00 AM - 10:00 AM", tasks: taskGroups.morning, icon: <Clock3 className="h-4 w-4" /> },
          { key: "afternoon", label: "Midday Care", time: "12:00 PM - 3:00 PM", tasks: taskGroups.afternoon, icon: <Clock3 className="h-4 w-4" /> },
          { key: "night", label: "Night Ritual", time: "8:00 PM - 11:00 PM", tasks: taskGroups.night, icon: <Clock3 className="h-4 w-4" /> },
        ] as const).map((group) => (
          <div key={group.key} className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#F8F7F4] rounded-lg text-[#1F3D2B]">
                {group.icon}
              </div>
              <div>
                 <h4 className="text-sm font-bold uppercase tracking-widest text-[#1F3D2B]">{group.label}</h4>
                 <p className="text-[10px] font-bold text-[#8C6A5A] opacity-60">{group.time}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {group.tasks.length === 0 ? (
                <div className="col-span-full border-2 border-dashed border-[#E2DDD3] rounded-[1.5rem] p-8 text-center bg-[#FCFAF9]">
                   <p className="text-sm text-[#8C6A5A] font-medium italic">No mandatory clinical tasks scheduled for this period.</p>
                </div>
              ) : (
                group.tasks.map((task) => {
                  const runtime = taskRuntime[task.id] || { running: false, remainingSec: task.durationMin * 60, startedAt: null };
                  const state = taskState(task);
                  const completed = Boolean(completedTaskKeys[task.id]);
                  const userHasProduct = ownedProducts[task.product.id] || task.userHasProduct;

                  return (
                    <div 
                      key={task.id} 
                      className={`relative overflow-hidden rounded-[1.5rem] bg-white transition-all duration-300 ${completed ? 'completion-glow ring-2 ring-[#2F6F57]/20 shadow-xl' : 'shadow-md hover:shadow-lg hover:-translate-y-1'}`}
                    >
                      {/* Progress background indicator */}
                      {state.code === "in_progress" && (
                         <div className="absolute top-0 left-0 w-full h-1 bg-[#E2DDD3]">
                            <div className="h-full bg-[#2F6F57] animate-progress" style={{ "--progress-target": "100%" } as any} />
                         </div>
                      )}

                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-5">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#8C6A5A] px-2 py-0.5 bg-[#F8F7F4] rounded-md">
                              {task.timeWindow.start}
                            </span>
                            <h5 className="mt-2 text-lg font-bold text-clinical-heading leading-tight">{task.title}</h5>
                          </div>
                          
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            completed ? "bg-[#E8F4EE] text-[#2F6F57]" : 
                            state.code === "missed" ? "bg-red-50 text-red-600" :
                            state.code === "locked" ? "bg-gray-100 text-gray-500" :
                            "bg-amber-50 text-amber-600"
                          }`}>
                            {completed ? "Completed" : state.code.replace("_", " ")}
                          </div>
                        </div>

                        {/* Body - Body: clean sans-serif */}
                        <div className="space-y-4 text-clinical-body">
                          <div>
                            <p className="text-xs font-bold text-[#1F3D2B] mb-1.5 flex items-center gap-1.5">
                               <CheckCircle2 className="h-3.5 w-3.5 text-[#2F6F57]" /> Goal
                            </p>
                            <p className="text-sm font-bold text-[#1F3D2B]">{task.goal}</p>
                          </div>

                          <div className="space-y-2">
                             <p className="text-[11px] font-bold text-[#8C6A5A] uppercase tracking-wider">Instructions</p>
                             <ul className="space-y-2">
                               {task.howToSteps.map((step, idx) => (
                                 <li key={idx} className="flex gap-3 text-sm">
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#1F3D2B] text-white text-[10px] flex items-center justify-center font-bold">
                                      {idx + 1}
                                    </span>
                                    <span className="leading-snug">{step}</span>
                                 </li>
                               ))}
                             </ul>
                          </div>

                          {task.whyItHelps && (
                            <div className="pt-2">
                               <p className="text-[11px] text-[#6B665D] leading-relaxed italic border-l-2 border-[#E2DDD3] pl-3">
                                 <span className="font-bold text-[#1F3D2B] not-italic mr-1">Clinical Insight:</span> {task.whyItHelps}
                               </p>
                            </div>
                          )}
                        </div>

                        {/* Product Section */}
                        <div className="mt-8 border-t border-[#F1ECE3] pt-6">
                            <div className="flex items-center gap-4">
                               <div className="w-14 h-14 bg-[#F8F7F4] rounded-xl flex items-center justify-center text-[#8C6A5A] shadow-inner">
                                  <ShoppingBag className="h-6 w-6 opacity-40" />
                               </div>
                               <div className="flex-grow">
                                  <p className="text-[10px] font-bold text-[#8C6A5A] uppercase tracking-widest">{task.product.ingredient}</p>
                                  <p className="text-sm font-bold text-clinical-heading">{task.product.name}</p>
                               </div>
                            </div>
                            
                            {!userHasProduct ? (
                              <div className="mt-4 flex flex-wrap gap-2">
                                <Link href={`/shop?product=${encodeURIComponent(task.product.id)}`} className="af-btn-primary flex-grow text-center px-4 py-2.5 text-[11px] uppercase tracking-wider">
                                  Buy Solution
                                </Link>
                                <button
                                  type="button"
                                  className="af-btn-soft flex-grow px-4 py-2.5 text-[11px] uppercase tracking-wider"
                                  onClick={() => void setProductOwnership(task.product.id, true)}
                                >
                                  I Have This
                                </button>
                                <button
                                  type="button"
                                  className="w-full text-[10px] font-bold text-[#8C6A5A] uppercase tracking-widest mt-2 hover:text-[#1F3D2B] transition-colors underline underline-offset-4"
                                  onClick={() => setShowHomeAlternative((prev) => ({ ...prev, [task.id]: !prev[task.id] }))}
                                >
                                  {showHomeAlternative[task.id] ? "Hide Alternative" : "View Home Remedy"}
                                </button>
                                {showHomeAlternative[task.id] && (
                                   <div className="w-full mt-3 p-4 bg-[#FFFBF0] rounded-xl border border-amber-100 animate-fadeInUp">
                                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2">Home Remedy Steps</p>
                                      <ul className="space-y-1.5">
                                        {task.fallbackHomeRemedy.map((item, i) => (
                                          <li key={i} className="text-[11px] text-amber-900 flex items-start gap-2">
                                            <span className="mt-1 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" /> {item}
                                          </li>
                                        ))}
                                      </ul>
                                   </div>
                                )}
                              </div>
                            ) : (
                              <div className="mt-4 px-4 py-2.5 bg-[#F8F7F4] rounded-xl flex items-center justify-center gap-2">
                                 <CheckCircle2 className="h-3.5 w-3.5 text-[#2F6F57]" />
                                 <span className="text-[11px] font-black text-[#1F3D2B] uppercase tracking-widest">In Your Kit</span>
                              </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex gap-3">
                          {state.code === "locked" ? (
                            <div className="flex-grow p-3 bg-[#F8F7F4] rounded-xl text-center border border-[#E2DDD3]">
                               <p className="text-[10px] font-bold text-[#8C6A5A] uppercase">Unlocks in</p>
                               <p className="text-md font-black text-clinical-heading tracking-widest">{formatCountdown(state.countdownSec)}</p>
                            </div>
                          ) : (
                            <>
                              {!completed && state.code !== "missed" && (
                                <button
                                  type="button"
                                  onClick={() => toggleTaskTimer(task)}
                                  className={`flex-grow flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs transition-all ${
                                    runtime.running ? "bg-[#1F3D2B] text-white shadow-lg ring-4 ring-[#1F3D2B]/10" : "bg-white border-2 border-[#1F3D2B] text-[#1F3D2B]"
                                  }`}
                                >
                                  {runtime.running ? (
                                    <>
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                      </span>
                                      {formatCountdown(runtime.remainingSec)}
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4" fill="currentColor" /> {runtime.startedAt ? "RESUME" : "START SESSION"}
                                    </>
                                  )}
                                </button>
                              )}

                              {state.code === "missed" && !completed && (
                                <button
                                  type="button"
                                  onClick={() => void completeTask(task, true)}
                                  className="flex-grow bg-[#F8F7F4] text-[#1F3D2B] font-bold py-3.5 rounded-xl text-xs hover:bg-[#E2DDD3] transition-colors"
                                >
                                  RECOVERY ACTION
                                </button>
                              )}

                              {completed ? (
                                <div className="flex-grow p-4 bg-[#E8F4EE] rounded-2xl flex flex-col items-center justify-center gap-1">
                                   <div className="flex items-center gap-2">
                                      <CheckCircle2 className="h-5 w-5 text-[#2F6F57]" />
                                      <span className="text-sm font-black text-[#1F3D2B] uppercase tracking-tighter">Verified Session</span>
                                   </div>
                                   <p className="text-[9px] font-bold text-[#2F6F57]/60 tracking-widest">+{task.reward} ALPHA SIKKA EARNED</p>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void completeTask(task, false)}
                                  disabled={state.code !== "ready_complete"}
                                  className={`aspect-square px-4 rounded-xl font-bold transition-all ${
                                    state.code === "ready_complete" ? "bg-[#2F6F57] text-white shadow-lg" : "bg-[#F8F7F4] text-gray-400 opacity-50 border border-[#E2DDD3]"
                                  }`}
                                  title="Complete Task"
                                >
                                  {completed ? <CheckCircle2 className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        
                        {state.code === "ready_complete" && !completed && (
                           <div className="mt-3 flex items-center justify-center gap-2 animate-pulse">
                              <TriangleAlert className="h-3 w-3 text-[#2F6F57]" />
                              <span className="text-[10px] font-black text-[#2F6F57] uppercase tracking-widest">Ready for verification</span>
                           </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center gap-6 p-8 bg-[#1F3D2B] rounded-[2rem] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
        
        <div className="text-center relative z-10">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Completion Milestone</p>
          <h4 className="text-2xl font-bold tracking-tight mb-2">Finalize Daily Protocol</h4>
          <p className="text-sm opacity-80 max-w-sm mx-auto">Verify all tasks above to secure your daily discipline bonus and update your recovery progression.</p>
        </div>

        <button
          type="button"
          onClick={() => void completeDay()}
          disabled={!allDone || Boolean(dayCompletions[`${selectedCategory}:${execution.day}`])}
          className={`relative z-10 w-full max-w-xs group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.15em] transition-all ${
            allDone && !dayCompletions[`${selectedCategory}:${execution.day}`]
              ? "bg-white text-[#1F3D2B] shadow-2xl hover:scale-105 active:scale-95"
              : "bg-white/10 text-white/40 cursor-not-allowed border border-white/10"
          }`}
        >
          {dayCompletions[`${selectedCategory}:${execution.day}`] ? (
            <>Verified <CheckCircle2 className="h-5 w-5" /></>
          ) : (
            <>Verify Protocol <span className="px-2 py-0.5 bg-[#2F6F57] text-white rounded-md text-[9px]">+5 A$</span></>
          )}
        </button>
      </div>
    </section>
  );
}
