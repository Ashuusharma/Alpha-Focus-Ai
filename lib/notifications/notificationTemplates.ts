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

function getPersonalization(metadata: Record<string, unknown>) {
  const firstName = typeof metadata.firstName === "string" ? metadata.firstName.trim() : "";
  const categoryLabel = typeof metadata.categoryLabel === "string" ? metadata.categoryLabel.trim() : "";
  const prefix = firstName ? `${firstName}, ` : "";
  const concern = categoryLabel ? ` for ${categoryLabel}` : "";
  return { prefix, concern };
}

function pickDailyTip(reference = new Date().toISOString().slice(0, 10)) {
  const chars = reference.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return DAILY_TIPS[chars % DAILY_TIPS.length];
}

export function buildTemplate(eventType: NotificationEventType, metadata: Record<string, unknown> = {}): NotificationTemplate {
  const { prefix, concern } = getPersonalization(metadata);

  if (eventType === "routine_reminder") {
    const slot = typeof metadata.slot === "string" ? metadata.slot.toUpperCase() : "NEXT";
    return {
      category: "routine",
      title: `${slot} routine reminder`,
      message: `${prefix}your next protocol step${concern} is due now. Finish it on time to protect today\'s streak and keep recovery moving this week.`,
      actionUrl: "/dashboard?focus=routine",
    };
  }

  if (eventType === "routine_completed") {
    const phase = typeof metadata.phase === "string" ? metadata.phase.toUpperCase() : "ROUTINE";
    return {
      category: "routine",
      title: `${phase} logged`,
      message: `${prefix}${phase.toLowerCase()} is logged${concern}. That completion strengthens your consistency score and compounds visible results over the next few weeks.`,
      actionUrl: "/dashboard",
    };
  }

  if (eventType === "routine_missed") {
    return {
      category: "routine",
      title: "Routine check-in missed",
      message: `${prefix}today\'s routine${concern} is slipping. Recover the day now to avoid losing momentum and delaying the next visible improvement window.`,
      actionUrl: "/dashboard?focus=recovery-lite",
    };
  }

  if (eventType === "challenge_started") {
    return {
      category: "challenge",
      title: "Challenge started",
      message: `${prefix}your challenge has started. Nail day one to lock momentum early and make the next 7 days easier to sustain.`,
      actionUrl: "/challenges",
    };
  }

  if (eventType === "challenge_milestone") {
    const milestoneDay = Number(metadata.milestoneDay || 0);
    const label = milestoneDay > 0 ? `Day ${milestoneDay}` : "Milestone";
    return {
      category: "challenge",
      title: `${label} unlocked`,
      message: `${prefix}${label} is complete. Stack the next win quickly to protect your streak and unlock faster confidence gains.`,
      actionUrl: "/challenges",
    };
  }

  if (eventType === "progress_improved") {
    const improvement = Number(metadata.improvementPct || 0);
    return {
      category: "progress",
      title: "Progress signal detected",
      message: improvement > 0
        ? `${prefix}your clinical score${concern} improved by ${improvement}%. Keep execution tight now to turn this signal into a visible before-and-after shift.`
        : `${prefix}your metrics${concern} are starting to move. Stay consistent through this cycle so early gains do not flatten out.`,
      actionUrl: "/result",
    };
  }

  if (eventType === "streak_milestone") {
    const streakDays = Number(metadata.streakDays || 0);
    return {
      category: "progress",
      title: `Streak: ${streakDays} days`,
      message: `${prefix}you\'re on a ${streakDays}-day streak${concern}. Protect it today because consistency is what turns effort into measurable recovery.`,
      actionUrl: "/dashboard",
    };
  }

  if (eventType === "streak_at_risk") {
    return {
      category: "progress",
      title: "Streak at risk",
      message: `${prefix}your streak${concern} is at risk today. Complete one routine slot now to save momentum and avoid restarting from zero tomorrow.`,
      actionUrl: "/dashboard?focus=streak",
    };
  }

  if (eventType === "reward_unlocked") {
    const rewardLabel = typeof metadata.rewardLabel === "string" ? metadata.rewardLabel : "reward";
    return {
      category: "progress",
      title: "Reward unlocked",
      message: `${prefix}your ${rewardLabel} is live now. Use it while momentum is high and turn current discipline into a practical reward before it expires.`,
      actionUrl: "/alpha-credits",
    };
  }

  if (eventType === "daily_tip") {
    return {
      category: "tips",
      title: "Daily tactical tip",
      message: `${prefix}${pickDailyTip(String(metadata.reference || ""))} Use it today${concern} so the benefit compounds instead of staying theoretical.`,
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
