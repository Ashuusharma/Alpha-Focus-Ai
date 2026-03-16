"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, ChevronDown, Clock3, Play, RotateCcw, Pause, Sparkles, TriangleAlert } from "lucide-react";
import { categories, type CategoryId } from "@/lib/questions";
import {
  generateDailyProtocolTasks,
  generateDailyProtocolMeta,
  getProtocolTemplate,
  getProtocolDurationDays,
  type ProtocolTask,
  type ProtocolToleranceMode,
  type ProtocolGuidanceLanguage,
  type ProtocolContraindications,
} from "@/lib/protocolTemplates";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import { supabase } from "@/lib/supabaseClient";

type TreatmentPlanProps = {
  categoryLabel: string;
  phaseName: string;
  dayNumber: number;
  category: CategoryId | null;
  availableCategories: CategoryId[];
  userId: string;
  onCategoryChange?: (category: CategoryId) => void;
};

type TaskRuntime = {
  running: boolean;
  remainingSec: number;
};

type PersistedPlanState = {
  selectedDay: number;
  timezone: string;
  completedTaskKeys: Record<string, string>;
  dayCompletions: Record<string, string>;
  currentDay: number;
  streak: number;
  lastCompletedDate: string | null;
  toleranceMode?: ProtocolToleranceMode;
  guidanceLanguage?: ProtocolGuidanceLanguage;
  contraindications?: ProtocolContraindications;
  weeklyPhotoDoneByWeek?: Record<string, boolean>;
};

type TreatmentAction = "treatment_task_completed" | "treatment_day_completed";

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const TIMEZONES = ["Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York", "America/Los_Angeles"];
const LANGUAGE_CHOICES: Array<{ value: ProtocolGuidanceLanguage; label: string }> = [
  { value: "en", label: "English" },
  { value: "hinglish", label: "Hinglish" },
  { value: "hi", label: "Hindi" },
];

function toDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dayDiff(fromIso: string, toIso: string) {
  const a = new Date(fromIso);
  const b = new Date(toIso);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function taskDetailFor(category: CategoryId, task: ProtocolTask) {
  const slotTime: Record<ProtocolTask["slot"], string> = {
    morning: "7:00-9:00 AM",
    lifestyle: "1:00-3:00 PM",
    night: "10:00-11:30 PM",
    weekly: "Flexible",
  };

  const categoryProduct: Record<string, string> = {
    acne: "Niacinamide + non-comedogenic SPF",
    dark_circles: "Caffeine eye serum + barrier eye cream",
    hair_loss: "Scalp serum + follicle support routine",
    scalp_health: "pH-balanced scalp cleanser + soothing tonic",
    beard_growth: "Growth support oil + irritation control",
    body_acne: "Salicylic wash + friction-safe moisturizer",
    lip_care: "SPF lip balm + occlusive repair balm",
    anti_aging: "Antioxidant serum + retinoid cadence",
  };

  return {
    timeWindow: slotTime[task.slot],
    durationMin: task.durationMin || (task.slot === "weekly" ? 12 : task.slot === "lifestyle" ? 5 : 3),
    instruction: task.howTo || `Follow \"${task.label}\" precisely for ${String(category).replace("_", " ")} recovery consistency.`,
    productSuggestion: task.recommendedProduct || categoryProduct[String(category)] || "Targeted recovery essentials",
    ingredient: task.ingredient || "Targeted active blend",
    goal: task.goal || "Daily recovery objective",
    expectedImprovement: task.expectedImprovement || "Steady visible recovery with consistency.",
    whyItHelps: task.whyItHelps || "Consistent execution supports visible improvements over time.",
    caution: task.caution,
    rewardPoints: Number.isFinite(Number(task.reward)) ? Number(task.reward) : task.slot === "weekly" ? 4 : 2,
  };
}

function reminderSchedule(slot: ProtocolTask["slot"], timezone: string) {
  const schedule: Record<ProtocolTask["slot"], string[]> = {
    morning: ["7:30 AM", "7:45 AM", "8:00 AM"],
    lifestyle: ["1:15 PM", "1:45 PM", "2:30 PM"],
    night: ["10:00 PM", "10:20 PM", "10:45 PM"],
    weekly: ["7:00 PM", "8:00 PM", "9:00 PM"],
  };
  return `${schedule[slot].join(" · ")} (${timezone})`;
}

async function awardAlphaSikka(action: TreatmentAction, referenceId: string, metadata?: Record<string, unknown>) {
  try {
    await fetch("/api/alpha-sikka/earn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, referenceId, metadata }),
    });
  } catch {
    // Reward write is best-effort to keep completion UX responsive.
  }
}

async function emitNotification(eventType: "routine_completed" | "challenge_milestone", dedupeKey: string, metadata?: Record<string, unknown>) {
  try {
    const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
    await fetch("/api/notifications", {
      method: "POST",
      headers,
      body: JSON.stringify({ eventType, dedupeKey, metadata }),
    });
  } catch {
    // Notification write is best-effort.
  }
}

export default function TreatmentPlan({ categoryLabel, phaseName, dayNumber, category, availableCategories, userId, onCategoryChange }: TreatmentPlanProps) {
  const validCategories = useMemo(() => {
    const ordered = availableCategories.length > 0 ? availableCategories : category ? [category] : [];
    return ordered.filter((id, idx) => ordered.indexOf(id) === idx && !!getProtocolTemplate(id));
  }, [availableCategories, category]);

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(category && getProtocolTemplate(category) ? category : validCategories[0] || null);
  const [expandedPhaseIndex, setExpandedPhaseIndex] = useState(0);
  const [selectedDay, setSelectedDay] = useState(Math.max(1, dayNumber));
  const [completedTaskKeys, setCompletedTaskKeys] = useState<Record<string, string>>({});
  const [dayCompletions, setDayCompletions] = useState<Record<string, string>>({});
  const [taskRuntime, setTaskRuntime] = useState<Record<string, TaskRuntime>>({});
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [streak, setStreak] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(null);
  const [hasRemoteState, setHasRemoteState] = useState(false);
  const [toleranceMode, setToleranceMode] = useState<ProtocolToleranceMode>("moderate");
  const [guidanceLanguage, setGuidanceLanguage] = useState<ProtocolGuidanceLanguage>("en");
  const [contraindications, setContraindications] = useState<ProtocolContraindications>({
    sensitiveSkin: false,
    activeIrritation: false,
    shavedToday: false,
    severeDandruff: false,
  });
  const [weeklyPhotoDoneByWeek, setWeeklyPhotoDoneByWeek] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!selectedCategory && validCategories[0]) {
      setSelectedCategory(validCategories[0]);
    }
  }, [selectedCategory, validCategories]);

  useEffect(() => {
    if (!selectedCategory) return;
    const key = `recovery-plan:${userId}:${selectedCategory}`;
    let cancelled = false;

    const applyLocal = () => {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        setSelectedDay(Math.max(1, dayNumber));
        setCompletedTaskKeys({});
        setDayCompletions({});
        setStreak(0);
        setLastCompletedDate(null);
        setTimezone(DEFAULT_TIMEZONE);
        setHasRemoteState(false);
        return;
      }
      try {
        const parsed = JSON.parse(raw) as PersistedPlanState;
        setSelectedDay(parsed.selectedDay || Math.max(1, dayNumber));
        setCompletedTaskKeys(parsed.completedTaskKeys || {});
        setDayCompletions(parsed.dayCompletions || {});
        setStreak(parsed.streak || 0);
        setLastCompletedDate(parsed.lastCompletedDate || null);
        setTimezone(parsed.timezone || DEFAULT_TIMEZONE);
        setToleranceMode(parsed.toleranceMode || "moderate");
        setGuidanceLanguage(parsed.guidanceLanguage || "en");
        setContraindications(parsed.contraindications || {});
        setWeeklyPhotoDoneByWeek(parsed.weeklyPhotoDoneByWeek || {});
        setHasRemoteState(false);
      } catch {
        setSelectedDay(Math.max(1, dayNumber));
        setHasRemoteState(false);
      }
    };

    const loadRemote = async () => {
      const { data } = await supabase
        .from("user_recovery_program_state")
        .select("selected_day,timezone,completed_task_keys,day_completions,current_day,streak,last_completed_date")
        .eq("user_id", userId)
        .eq("category", selectedCategory)
        .maybeSingle();

      if (cancelled || !data) {
        applyLocal();
        return;
      }

      const remote: PersistedPlanState = {
        selectedDay: Number(data.selected_day || 1),
        timezone: String(data.timezone || DEFAULT_TIMEZONE),
        completedTaskKeys: ((data.completed_task_keys || {}) as Record<string, string>),
        dayCompletions: ((data.day_completions || {}) as Record<string, string>),
        currentDay: Number(data.current_day || data.selected_day || 1),
        streak: Number(data.streak || 0),
        lastCompletedDate: data.last_completed_date ? String(data.last_completed_date) : null,
      };

      setSelectedDay(remote.selectedDay || Math.max(1, dayNumber));
      setCompletedTaskKeys(remote.completedTaskKeys || {});
      setDayCompletions(remote.dayCompletions || {});
      setStreak(remote.streak || 0);
      setLastCompletedDate(remote.lastCompletedDate || null);
      setTimezone(remote.timezone || DEFAULT_TIMEZONE);
      setHasRemoteState(true);
    };

    void loadRemote();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory, userId, dayNumber]);

  useEffect(() => {
    if (!selectedCategory) return;
    const key = `recovery-plan:${userId}:${selectedCategory}`;
    const payload: PersistedPlanState = {
      selectedDay,
      timezone,
      completedTaskKeys,
      dayCompletions,
      currentDay: selectedDay,
      streak,
      lastCompletedDate,
      toleranceMode,
      guidanceLanguage,
      contraindications,
      weeklyPhotoDoneByWeek,
    };
    window.localStorage.setItem(key, JSON.stringify(payload));

    const persistTimer = setTimeout(() => {
      void supabase.from("user_recovery_program_state").upsert(
        {
          user_id: userId,
          category: selectedCategory,
          selected_day: selectedDay,
          timezone,
          completed_task_keys: completedTaskKeys,
          day_completions: dayCompletions,
          current_day: selectedDay,
          streak,
          last_completed_date: lastCompletedDate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,category" }
      );
    }, hasRemoteState ? 450 : 900);

    return () => clearTimeout(persistTimer);
  }, [
    selectedCategory,
    userId,
    selectedDay,
    timezone,
    completedTaskKeys,
    dayCompletions,
    streak,
    lastCompletedDate,
    hasRemoteState,
    toleranceMode,
    guidanceLanguage,
    contraindications,
    weeklyPhotoDoneByWeek,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTaskRuntime((prev) => {
        const next: Record<string, TaskRuntime> = { ...prev };
        let changed = false;
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

  const phaseRanges = useMemo(() => {
    if (!template) return [] as Array<{ index: number; name: string; startDay: number; endDay: number; tasks: ProtocolTask[] }>;
    let cursor = 1;
    return template.phases.map((phase, index) => {
      const startDay = cursor;
      const endDay = cursor + phase.duration_days - 1;
      cursor = endDay + 1;
      return { index, name: phase.name, startDay, endDay, tasks: phase.tasks };
    });
  }, [template]);

  const activePhase = phaseRanges.find((phase) => selectedDay >= phase.startDay && selectedDay <= phase.endDay) || phaseRanges[0];

  const selectedWeek = Math.ceil(selectedDay / 7);
  const weekStart = (selectedWeek - 1) * 7 + 1;
  const weekEnd = Math.min(totalDays, selectedWeek * 7);
  const completedDaysThisWeek = useMemo(() => {
    if (!selectedCategory) return 0;
    let total = 0;
    for (let day = weekStart; day <= weekEnd; day += 1) {
      if (dayCompletions[`${selectedCategory}:${day}`]) total += 1;
    }
    return total;
  }, [dayCompletions, selectedCategory, weekStart, weekEnd]);

  const weekDayCount = Math.max(1, weekEnd - weekStart + 1);
  const weeklyAdherencePct = Math.round((completedDaysThisWeek / weekDayCount) * 100);
  const weeklyPhotoKey = `week-${selectedWeek}`;
  const weeklyPhotoDone = Boolean(weeklyPhotoDoneByWeek[weeklyPhotoKey]);

  const confidencePrompt =
    weeklyAdherencePct >= 80
      ? "Excellent consistency. Keep this pace and compare photos to reinforce progress confidence."
      : weeklyAdherencePct >= 50
        ? "Good momentum. Focus on one missed slot pattern and close it this week."
        : "Low consistency this week. Use Beginner mode and complete Recovery Lite today to restart cleanly.";

  const dailyMeta = useMemo(() => {
    if (!selectedCategory) return null;
    return generateDailyProtocolMeta(selectedCategory, selectedDay);
  }, [selectedCategory, selectedDay]);

  const todayKey = toDateKey();
  const missedDays = useMemo(() => {
    if (!lastCompletedDate) return 0;
    return Math.max(0, dayDiff(lastCompletedDate, todayKey) - 1);
  }, [lastCompletedDate, todayKey]);

  const dayTasks = useMemo(() => {
    if (!selectedCategory) return [] as Array<ProtocolTask & { taskKey: string }>;
    return generateDailyProtocolTasks(selectedCategory, selectedDay, {
      toleranceMode,
      contraindications,
      missedYesterday: missedDays >= 1,
      guidanceLanguage,
      completedDaysThisWeek,
      weeklyPhotoDone,
    }).map((task) => ({ ...task, taskKey: `${selectedCategory}:${selectedDay}:${task.id}` }));
  }, [selectedCategory, selectedDay, toleranceMode, contraindications, missedDays, guidanceLanguage, completedDaysThisWeek, weeklyPhotoDone]);

  const groupedTasks = {
    morning: dayTasks.filter((task) => task.slot === "morning"),
    afternoon: dayTasks.filter((task) => task.slot === "lifestyle"),
    night: dayTasks.filter((task) => task.slot === "night" || task.slot === "weekly"),
  };

  const allDone = dayTasks.length > 0 && dayTasks.every((task) => Boolean(completedTaskKeys[task.taskKey]));

  const transformationPct = Math.max(0, Math.min(100, Math.round((Object.keys(dayCompletions).length / totalDays) * 100)));

  const handleMarkComplete = (taskKey: string) => {
    if (!selectedCategory) return;
    if (completedTaskKeys[taskKey]) return;

    setCompletedTaskKeys((prev) => ({ ...prev, [taskKey]: new Date().toISOString() }));

    void awardAlphaSikka("treatment_task_completed", `treatment-task:${taskKey}`, {
      category: selectedCategory,
      day: selectedDay,
      taskKey,
    });

    void emitNotification("routine_completed", `treatment_task_completed:${taskKey}`, {
      category: selectedCategory,
      day: selectedDay,
      taskKey,
    });
  };

  const toggleTimer = (taskKey: string, defaultSeconds: number) => {
    setTaskRuntime((prev) => {
      const existing = prev[taskKey] || { running: false, remainingSec: defaultSeconds };
      return {
        ...prev,
        [taskKey]: { ...existing, running: !existing.running },
      };
    });
  };

  const resetTimer = (taskKey: string, defaultSeconds: number) => {
    setTaskRuntime((prev) => ({
      ...prev,
      [taskKey]: { running: false, remainingSec: defaultSeconds },
    }));
  };

  const completeDay = () => {
    if (!allDone || !selectedCategory) return;

    const completedOn = new Date().toISOString();
    setDayCompletions((prev) => ({ ...prev, [`${selectedCategory}:${selectedDay}`]: new Date().toISOString() }));

    let nextStreak = 1;
    if (lastCompletedDate) {
      const diff = dayDiff(lastCompletedDate, todayKey);
      nextStreak = diff <= 1 ? streak + 1 : 1;
      setStreak(nextStreak);
    } else {
      setStreak(1);
    }
    setLastCompletedDate(todayKey);

    const dayReference = `treatment-day:${selectedCategory}:${selectedDay}`;
    void awardAlphaSikka("treatment_day_completed", dayReference, {
      category: selectedCategory,
      day: selectedDay,
      completedAt: completedOn,
    });

    void emitNotification("challenge_milestone", `treatment_day_completed:${selectedCategory}:${selectedDay}`, {
      category: selectedCategory,
      day: selectedDay,
      streak: nextStreak,
      pointsEarned: 5,
    });

    if (selectedDay < totalDays) {
      setSelectedDay(selectedDay + 1);
    }
  };

  const resetProgram = () => {
    setSelectedDay(1);
    setCompletedTaskKeys({});
    setDayCompletions({});
    setTaskRuntime({});
    setStreak(0);
    setLastCompletedDate(null);
  };

  if (!selectedCategory || !template || phaseRanges.length === 0) {
    return (
      <section className="af-card rounded-2xl p-6">
        <h3 className="text-lg font-bold text-[#1F3D2B]">Category Treatment Plan</h3>
        <p className="mt-2 text-sm text-[#6B665D]">Complete analyzer and assessment to generate your recovery program.</p>
      </section>
    );
  }

  return (
    <section className="af-card rounded-2xl p-6">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A5A]">Category Treatment Plan</p>
      <h3 className="mt-1 text-lg font-bold text-[#1F3D2B]">Recovery Program Engine · {categories.find((c) => c.id === selectedCategory)?.label || categoryLabel}</h3>
      <p className="mt-1 text-xs text-[#6B665D]">Current phase: {activePhase?.name || phaseName} · Day {selectedDay} / {totalDays}</p>

      <div className="mt-3 overflow-x-auto">
        <div className="flex gap-2 pb-1">
          {validCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                onCategoryChange?.(cat);
              }}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${cat === selectedCategory ? "border-[#2F6F57] bg-[#E8F4EE] text-[#1F3D2B]" : "border-[#D7D1C6] bg-white text-[#6B665D]"}`}
            >
              {categories.find((c) => c.id === cat)?.label || cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#E2DDD3] bg-[#F8F6F3] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1F3D2B]">30 Day Recovery Program</p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-[#6B665D]">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="rounded-md border border-[#D7D1C6] bg-white px-2 py-1 text-xs"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>

            <label className="ml-2 text-xs text-[#6B665D]">Language</label>
            <select
              value={guidanceLanguage}
              onChange={(e) => setGuidanceLanguage(e.target.value as ProtocolGuidanceLanguage)}
              className="rounded-md border border-[#D7D1C6] bg-white px-2 py-1 text-xs"
            >
              {LANGUAGE_CHOICES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>

            <label className="ml-2 text-xs text-[#6B665D]">Mode</label>
            <select
              value={toleranceMode}
              onChange={(e) => setToleranceMode(e.target.value as ProtocolToleranceMode)}
              className="rounded-md border border-[#D7D1C6] bg-white px-2 py-1 text-xs"
            >
              <option value="beginner">Beginner</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#6B665D]">
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={Boolean(contraindications.sensitiveSkin)}
              onChange={(e) => setContraindications((prev) => ({ ...prev, sensitiveSkin: e.target.checked }))}
            />
            Sensitive skin
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={Boolean(contraindications.activeIrritation)}
              onChange={(e) => setContraindications((prev) => ({ ...prev, activeIrritation: e.target.checked }))}
            />
            Active irritation
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={Boolean(contraindications.shavedToday)}
              onChange={(e) => setContraindications((prev) => ({ ...prev, shavedToday: e.target.checked }))}
            />
            Shaved today
          </label>
          <label className="inline-flex items-center gap-1">
            <input
              type="checkbox"
              checked={Boolean(contraindications.severeDandruff)}
              onChange={(e) => setContraindications((prev) => ({ ...prev, severeDandruff: e.target.checked }))}
            />
            Severe dandruff
          </label>
        </div>

        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#E7E1D7]">
          <div className="h-full rounded-full bg-gradient-to-r from-[#8C6A5A] to-[#2F6F57]" style={{ width: `${transformationPct}%` }} />
        </div>
        <p className="mt-1 text-xs text-[#6B665D]">Transformation progress: {transformationPct}% · Streak: {streak} days</p>

        {dailyMeta ? (
          <div className="mt-3 rounded-lg border border-[#D7D1C6] bg-white px-3 py-2 text-xs">
            <p className="font-semibold text-[#1F3D2B]">Daily Clinical Objective</p>
            <p className="mt-1 text-[#6B665D]">Goal today: {dailyMeta.dailyGoal}</p>
            <p className="mt-1 text-[#2F6F57]">Expected improvement: {dailyMeta.expectedResult}</p>
          </div>
        ) : null}

        <div className="mt-3 rounded-lg border border-[#D7D1C6] bg-white px-3 py-2 text-xs">
          <p className="font-semibold text-[#1F3D2B]">Weekly confidence tracker (Week {selectedWeek})</p>
          <p className="mt-1 text-[#6B665D]">Adherence: {completedDaysThisWeek}/{weekDayCount} days ({weeklyAdherencePct}%). {confidencePrompt}</p>
          <label className="mt-2 inline-flex items-center gap-1 text-[#6B665D]">
            <input
              type="checkbox"
              checked={weeklyPhotoDone}
              onChange={(e) => {
                const checked = e.target.checked;
                setWeeklyPhotoDoneByWeek((prev) => ({ ...prev, [weeklyPhotoKey]: checked }));
              }}
            />
            Weekly comparison photo completed
          </label>
        </div>

        {missedDays >= 3 ? (
          <div className={`mt-3 rounded-lg border px-3 py-2 text-xs ${missedDays >= 5 ? "border-red-300 bg-red-50 text-red-700" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
            <p className="inline-flex items-center gap-1 font-semibold"><TriangleAlert className="h-3.5 w-3.5" /> Consistency warning</p>
            <p className="mt-1">You missed {missedDays} day(s). {missedDays >= 5 ? "Program reset is recommended (small penalty: -10 A$)." : "Complete today to protect streak."}</p>
            {missedDays >= 5 ? (
              <button type="button" onClick={resetProgram} className="mt-2 rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-semibold text-red-700">Reset Program to Day 1</button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_1.9fr]">
        <div className="space-y-2">
          {phaseRanges.map((phase) => (
            <div key={phase.index} className="rounded-xl border border-[#E2DDD3] bg-white">
              <button
                type="button"
                onClick={() => setExpandedPhaseIndex(expandedPhaseIndex === phase.index ? -1 : phase.index)}
                className="flex w-full items-center justify-between px-3 py-2 text-left"
              >
                <div>
                  <p className="text-xs font-bold text-[#2F6F57]">Day {phase.startDay}-{phase.endDay}</p>
                  <p className="text-sm font-semibold text-[#1F3D2B]">{phase.name}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#6B665D] transition ${expandedPhaseIndex === phase.index ? "rotate-180" : ""}`} />
              </button>

              {expandedPhaseIndex === phase.index ? (
                <div className="border-t border-[#EDE7DC] px-3 py-2">
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    {Array.from({ length: phase.endDay - phase.startDay + 1 }).map((_, i) => {
                      const day = phase.startDay + i;
                      const dayKey = `${selectedCategory}:${day}`;
                      const done = Boolean(dayCompletions[dayKey]);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setSelectedDay(day)}
                          className={`rounded-md border px-2 py-1 ${selectedDay === day ? "border-[#2F6F57] bg-[#E8F4EE] text-[#1F3D2B]" : done ? "border-green-300 bg-green-50 text-green-700" : "border-[#D7D1C6] bg-white text-[#6B665D]"}`}
                        >
                          Day {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#E2DDD3] bg-white p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-[#1F3D2B]">Day {selectedDay} Protocol</h4>
            <span className="text-xs font-semibold text-[#2F6F57]">Daily completion: +5 A$</span>
          </div>

          <div className="mt-3 space-y-4">
            {(["morning", "afternoon", "night"] as const).map((slotKey) => {
              const slotTasks = groupedTasks[slotKey];
              const slotTitle = slotKey === "morning" ? "Morning" : slotKey === "afternoon" ? "Afternoon" : "Night";

              return (
                <div key={slotKey}>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#8C6A5A]">{slotTitle}</p>
                  <div className="mt-2 space-y-2">
                    {slotTasks.length === 0 ? (
                      <p className="text-xs text-[#8C877D]">No required task in this slot today.</p>
                    ) : (
                      slotTasks.map((task) => {
                        const detail = taskDetailFor(selectedCategory, task);
                        const runtime = taskRuntime[task.taskKey] || { running: false, remainingSec: detail.durationMin * 60 };
                        const completed = Boolean(completedTaskKeys[task.taskKey]);

                        return (
                          <div key={task.taskKey} className="rounded-lg border border-[#E2DDD3] bg-[#F8F6F3] p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-[#1F3D2B]">{task.label}</p>
                                <p className="mt-0.5 text-[11px] text-[#8C6A5A]">Goal: {detail.goal}</p>
                                <p className="mt-0.5 text-xs text-[#6B665D]">{detail.instruction}</p>
                                <p className="mt-1 text-[11px] text-[#2F6F57]">Why it helps: {detail.whyItHelps}</p>
                                <p className="mt-1 text-[11px] text-[#6B665D]">Ingredient: {detail.ingredient}</p>
                                <p className="mt-1 text-[11px] text-[#2F6F57]">Expected: {detail.expectedImprovement}</p>
                                <p className="mt-1 text-[11px] text-[#8C877D]">Suggested: {detail.productSuggestion}</p>
                                {detail.caution ? <p className="mt-1 text-[11px] text-amber-700">Note: {detail.caution}</p> : null}
                              </div>
                              {completed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : null}
                            </div>

                            <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                              <p className="inline-flex items-center gap-1 text-[#6B665D]"><Clock3 className="h-3.5 w-3.5" /> {detail.timeWindow} · {detail.durationMin} min</p>
                              <p className="inline-flex items-center gap-1 text-[#6B665D]"><Bell className="h-3.5 w-3.5" /> {reminderSchedule(task.slot, timezone)}</p>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleTimer(task.taskKey, detail.durationMin * 60)}
                                className="af-btn-soft inline-flex items-center gap-1 px-2.5 py-1 text-xs"
                              >
                                {runtime.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {runtime.running ? "Pause" : "Start"}
                              </button>
                              <button
                                type="button"
                                onClick={() => resetTimer(task.taskKey, detail.durationMin * 60)}
                                className="af-btn-soft inline-flex items-center gap-1 px-2.5 py-1 text-xs"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Reset
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkComplete(task.taskKey)}
                                disabled={completed}
                                className="af-btn-primary inline-flex items-center gap-1 px-2.5 py-1 text-xs disabled:opacity-60"
                              >
                                <Sparkles className="h-3.5 w-3.5" /> {completed ? "Completed" : `Mark Complete (+${detail.rewardPoints} A$)`}
                              </button>
                              <span className="text-xs font-semibold text-[#2F6F57]">{Math.floor(runtime.remainingSec / 60)}:{String(runtime.remainingSec % 60).padStart(2, "0")}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E2DDD3] bg-[#FCFAF6] p-3">
            <p className="text-xs text-[#6B665D]">If skipped repeatedly: 3 missed days warning · 5 missed days reset recommendation.</p>
            <button
              type="button"
              onClick={completeDay}
              disabled={!allDone}
              className="af-btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
            >
              Complete Day (+5 A$)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}