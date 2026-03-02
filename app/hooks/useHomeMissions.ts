"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WeeklyMission, useRewardsStore } from "@/lib/rewardsStore";
import { getWeeklyResetTimeLabel } from "@/app/services/homeMetrics";

type MissionSnapshot = {
  assessmentAnswered: number;
  scansCount: number;
  streakCount: number;
  consistencyScore?: number;
};

type UseHomeMissionsParams = {
  userId: string | null;
  snapshot: MissionSnapshot;
};

type UseHomeMissionsResult = {
  missions: WeeklyMission[];
  claimMission: (missionId: string) => { ok: boolean; message: string };
  resetCountdown: string;
  completedMissionsCount: number;
  newlyCompletedMissions: WeeklyMission[];
  clearNewlyCompletedMissions: () => void;
  isSyncing: boolean;
  error: string | null;
};

export function useHomeMissions({ userId, snapshot }: UseHomeMissionsParams): UseHomeMissionsResult {
  const missions = useRewardsStore((s) => s.weeklyMissions);
  const initializeWeeklyMissions = useRewardsStore((s) => s.initializeWeeklyMissions);
  const syncWeeklyMissions = useRewardsStore((s) => s.syncWeeklyMissions);
  const claimWeeklyMission = useRewardsStore((s) => s.claimWeeklyMission);

  const [resetCountdown, setResetCountdown] = useState(getWeeklyResetTimeLabel());
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newlyCompletedMissions, setNewlyCompletedMissions] = useState<WeeklyMission[]>([]);
  const seenMissionCompletionsRef = useRef<Set<string> | null>(null);
  const assessmentAnswered = snapshot.assessmentAnswered;
  const scansCount = snapshot.scansCount;
  const streakCount = snapshot.streakCount;
  const consistencyScore = snapshot.consistencyScore ?? 0;

  useEffect(() => {
    if (!userId) {
      seenMissionCompletionsRef.current = null;
      setNewlyCompletedMissions([]);
      return;
    }

    initializeWeeklyMissions();
  }, [initializeWeeklyMissions, userId]);

  useEffect(() => {
    if (!userId) return;

    setIsSyncing(true);
    setError(null);

    try {
      syncWeeklyMissions({
        assessmentAnswered,
        scansCount,
        streakCount,
        consistencyScore,
      });
    } catch {
      setError("Could not sync weekly missions.");
    } finally {
      setIsSyncing(false);
    }
  }, [assessmentAnswered, consistencyScore, scansCount, streakCount, syncWeeklyMissions, userId]);

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      setResetCountdown(getWeeklyResetTimeLabel());
    }, 60000);

    setResetCountdown(getWeeklyResetTimeLabel());
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const doneMissionIds = new Set(
      missions
        .filter((mission) => mission.progress >= mission.target)
        .map((mission) => mission.id)
    );

    if (!seenMissionCompletionsRef.current) {
      seenMissionCompletionsRef.current = doneMissionIds;
      return;
    }

    const freshCompletions = missions.filter(
      (mission) =>
        mission.progress >= mission.target &&
        !mission.claimed &&
        !seenMissionCompletionsRef.current?.has(mission.id)
    );

    if (freshCompletions.length > 0) {
      setNewlyCompletedMissions(freshCompletions);
      freshCompletions.forEach((mission) => seenMissionCompletionsRef.current?.add(mission.id));
    }
  }, [missions, userId]);

  const claimMission = useCallback(
    (missionId: string) => {
      setError(null);
      try {
        return claimWeeklyMission(missionId);
      } catch {
        setError("Could not claim mission reward.");
        return { ok: false, message: "Could not claim mission reward." };
      }
    },
    [claimWeeklyMission]
  );

  const completedMissionsCount = useMemo(
    () => missions.filter((mission) => mission.progress >= mission.target).length,
    [missions]
  );

  const clearNewlyCompletedMissions = useCallback(() => {
    setNewlyCompletedMissions([]);
  }, []);

  return {
    missions,
    claimMission,
    resetCountdown,
    completedMissionsCount,
    newlyCompletedMissions,
    clearNewlyCompletedMissions,
    isSyncing,
    error,
  };
}