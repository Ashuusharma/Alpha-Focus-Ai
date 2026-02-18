import { HabitTier } from "./habitScore";

export type NudgeType = "micro_task" | "scan" | "hydrate" | "sun" | "barrier" | "sleep" | "reorder" | "celebrate";

export interface EnvironmentSnapshot {
  uvIndex?: number;
  humidity?: number;
  pm25?: number;
  tempC?: number;
}

export interface WearableSnapshot {
  sleepHours?: number;
  hrvScore?: number; // 0-100
}

export interface Nudge {
  type: NudgeType;
  title: string;
  body: string;
  cta: string;
}

interface GetNudgeInput {
  tier: HabitTier;
  env?: EnvironmentSnapshot;
  wearable?: WearableSnapshot;
  lastNudgeAt?: string;
  now?: Date;
}

export function getNextNudge(input: GetNudgeInput): Nudge {
  const now = input.now ?? new Date();
  const hour = now.getHours();
  const isMorning = hour < 11;
  const isEvening = hour >= 18;

  if (input.env?.uvIndex !== undefined && input.env.uvIndex >= 7 && isMorning) {
    return {
      type: "sun",
      title: "High UV today",
      body: "Apply SPF 50 and reapply every 2 hours if outside.",
      cta: "Add sunscreen now",
    };
  }

  if (input.env?.humidity !== undefined && input.env.humidity < 35) {
    return {
      type: "barrier",
      title: "Dry air alert",
      body: "Use a barrier-heavy moisturizer and go easy on exfoliants tonight.",
      cta: "Switch to barrier mode",
    };
  }

  if (input.wearable?.sleepHours !== undefined && input.wearable.sleepHours < 6) {
    return {
      type: "sleep",
      title: "Rough sleep? Go gentle",
      body: "Skip strong actives tonight and focus on cleanser + moisturizer.",
      cta: "View gentle routine",
    };
  }

  if (input.wearable?.hrvScore !== undefined && input.wearable.hrvScore < 40) {
    return {
      type: "sleep",
      title: "Recovery is low",
      body: "Keep it simple: cleanse, moisturize, hydrate. Save actives for tomorrow.",
      cta: "Use recovery routine",
    };
  }

  if (input.tier === "low") {
    return isMorning
      ? {
          type: "micro_task",
          title: "30-second win",
          body: "Splash, cleanse, moisturize. Done in under a minute.",
          cta: "Do it now",
        }
      : {
          type: "celebrate",
          title: "Reset and rest",
          body: "Lay out tomorrow’s products so you never skip the morning routine.",
          cta: "Prep 3 items",
        };
  }

  if (input.tier === "medium") {
    return isMorning
      ? {
          type: "hydrate",
          title: "Hydrate early",
          body: "Drink 500ml water and apply moisturizer to lock in your AM routine.",
          cta: "Mark hydrated",
        }
      : {
          type: "scan",
          title: "Quick check-in",
          body: "Take a 10s scan to see if oiliness/redness changed this week.",
          cta: "Open analyzer",
        };
  }

  // high tier
  return isEvening
    ? {
        type: "reorder",
        title: "Keep your streak",
        body: "You’re on a roll. Refill essentials before they run out.",
        cta: "Review kit",
      }
    : {
        type: "celebrate",
        title: "You’re consistent",
        body: "Log today’s routine to extend your streak and unlock perks.",
        cta: "Log routine",
      };
}
