"use client";

import { useEffect, useRef, useState } from "react";
import { HabitTier } from "@/lib/habitScore";
import { Nudge, getNextNudge } from "@/lib/nudges";
import { getWearableSnapshot } from "@/lib/wearableStub";
import { WeeklyMission } from "@/lib/rewardsStore";
import { EnvSummary } from "@/app/hooks/useHomeEnvironment";
import { getScopedLocalItem, setScopedLocalItem } from "@/lib/userScopedStorage";

type ToastKind = "success" | "info" | "error";

type HomeSignalsParams = {
  session: {
    userName: string | null;
    t: (key: string) => string;
  };
  progress: {
    habitScore: { score: number; tier: HabitTier } | null;
    achievements: string[];
  };
  missions: {
    newlyCompletedMissions: WeeklyMission[];
    clearNewlyCompletedMissions: () => void;
  };
  environment: {
    envSummary: EnvSummary | null;
  };
  dashboardView: {
    primaryActionLabel: string;
  };
  notify: (message: string, kind: ToastKind) => void;
};

type HomeSignalsResult = {
  activeGreeting: string;
  activeNudge: Nudge | null;
};

export function useHomeSignals({
  session,
  progress,
  missions,
  environment,
  dashboardView,
  notify,
}: HomeSignalsParams): HomeSignalsResult {
  const [activeGreeting, setActiveGreeting] = useState("Welcome");
  const [activeNudge, setActiveNudge] = useState<Nudge | null>(null);
  const seenAchievementsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setActiveGreeting(session.t("good_morning"));
    else if (hour < 18) setActiveGreeting(session.t("good_afternoon"));
    else setActiveGreeting(session.t("good_evening"));
  }, [session]);

  useEffect(() => {
    if (!session.userName) return;

    const today = new Date().toISOString().slice(0, 10);
    const key = "oneman_first_login_signal_date";
    const seenToday = getScopedLocalItem(key, session.userName, true);
    if (seenToday === today) return;

    setScopedLocalItem(key, today, session.userName, true);
    notify(`Welcome back. Next best move: ${dashboardView.primaryActionLabel}.`, "info");
  }, [dashboardView.primaryActionLabel, notify, session.userName]);

  useEffect(() => {
    if (!session.userName) return;

    if (!seenAchievementsRef.current) {
      seenAchievementsRef.current = new Set(progress.achievements);
      return;
    }

    progress.achievements.forEach((achievement) => {
      if (!seenAchievementsRef.current?.has(achievement)) {
        notify(`Achievement unlocked: ${achievement}`, "success");
        seenAchievementsRef.current?.add(achievement);
      }
    });
  }, [notify, progress.achievements, session.userName]);

  useEffect(() => {
    if (!session.userName || missions.newlyCompletedMissions.length === 0) return;

    missions.newlyCompletedMissions.forEach((mission) => {
      if (!mission.claimed) {
        notify(`Mission complete: ${mission.title}. Claim your reward.`, "success");
      }
    });

    missions.clearNewlyCompletedMissions();
  }, [missions.clearNewlyCompletedMissions, missions.newlyCompletedMissions, notify, session.userName]);

  useEffect(() => {
    if (!progress.habitScore) {
      setActiveNudge(null);
      return;
    }

    const nudge = getNextNudge({
      tier: progress.habitScore.tier,
      env: environment.envSummary
        ? {
            uvIndex: environment.envSummary.uv,
            humidity: environment.envSummary.humidity,
            pm25: environment.envSummary.pm25,
            tempC: environment.envSummary.tempC,
          }
        : undefined,
      wearable: getWearableSnapshot() || undefined,
    });

    setActiveNudge(nudge);
  }, [environment.envSummary, progress.habitScore]);

  return {
    activeGreeting,
    activeNudge,
  };
}