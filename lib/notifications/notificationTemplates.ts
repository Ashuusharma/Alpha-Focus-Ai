import { NotificationCategory, NotificationEventType } from "@/lib/notifications/types";

type NotificationTemplate = {
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
};

const DAILY_TIPS = [
  "Use sunscreen every morning. It is the highest ROI skincare habit.",
  "Pair AM and PM routine completion with the same trigger to improve adherence.",
  "Hydration target is easier when split into 4 fixed checkpoints.",
  "Progress compounds when routine consistency is tracked daily.",
];

function pickDailyTip(reference = new Date().toISOString().slice(0, 10)) {
  const chars = reference.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return DAILY_TIPS[chars % DAILY_TIPS.length];
}

export function buildTemplate(eventType: NotificationEventType, metadata: Record<string, unknown> = {}): NotificationTemplate {
  if (eventType === "routine_completed") {
    const phase = typeof metadata.phase === "string" ? metadata.phase.toUpperCase() : "ROUTINE";
    return {
      category: "routine",
      title: `${phase} logged`,
      message: "Great consistency. Keep the loop tight for compounding results.",
      actionUrl: "/dashboard",
    };
  }

  if (eventType === "routine_missed") {
    return {
      category: "routine",
      title: "Routine check-in missed",
      message: "You still have time to recover today. Complete your next routine slot now.",
      actionUrl: "/dashboard",
    };
  }

  if (eventType === "challenge_started") {
    return {
      category: "challenge",
      title: "Challenge started",
      message: "Momentum matters in the first week. Complete day one to lock a streak.",
      actionUrl: "/challenges",
    };
  }

  if (eventType === "challenge_milestone") {
    const milestoneDay = Number(metadata.milestoneDay || 0);
    const label = milestoneDay > 0 ? `Day ${milestoneDay}` : "Milestone";
    return {
      category: "challenge",
      title: `${label} unlocked`,
      message: "Strong discipline. Keep stacking completions to protect your streak.",
      actionUrl: "/challenges",
    };
  }

  if (eventType === "progress_improved") {
    const improvement = Number(metadata.improvementPct || 0);
    return {
      category: "progress",
      title: "Progress signal detected",
      message: improvement > 0
        ? `Clinical improvement up ${improvement}%. Stay consistent for the next cycle.`
        : "Your metrics are moving in the right direction. Keep protocol consistency high.",
      actionUrl: "/result",
    };
  }

  if (eventType === "streak_milestone") {
    const streakDays = Number(metadata.streakDays || 0);
    return {
      category: "progress",
      title: `Streak: ${streakDays} days`,
      message: "Your discipline is compounding. Protect this streak today.",
      actionUrl: "/dashboard",
    };
  }

  if (eventType === "daily_tip") {
    return {
      category: "tips",
      title: "Daily tactical tip",
      message: pickDailyTip(String(metadata.reference || "")),
      actionUrl: "/learning-center",
    };
  }

  return {
    category: "system",
    title: "System update",
    message: "Your account insights are up to date.",
    actionUrl: "/dashboard",
  };
}
