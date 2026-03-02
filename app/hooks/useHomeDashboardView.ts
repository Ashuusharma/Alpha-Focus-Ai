"use client";

import { useMemo } from "react";
import { ConciergeBriefing, generateConciergeBriefing } from "@/lib/conciergeMode";
import { DiscountTier } from "@/lib/rewardsStore";
import { ScanData } from "@/lib/useUserData";

type PrimaryAction = {
  label: string;
  hint: string;
  path: string;
};

type UseHomeDashboardViewParams = {
  scans: ScanData[];
  lastLoginAt: string | null;
  categoriesCompleted: number;
  categoriesCount: number;
  tiers: DiscountTier[];
  credits: number;
  achievements: string[];
  alphaScore: number;
  consistencyScore: number;
  completedMissions: number;
  totalMissions: number;
};

type UseHomeDashboardViewResult = {
  profileCompletion: number;
  lastScan: ScanData | null;
  daysSinceLastScan: number | null;
  lastLoginLabel: string;
  nextTier: DiscountTier | null;
  creditsToNextTier: number;
  recentAchievements: string[];
  primaryAction: PrimaryAction;
  conciergeBriefing: ConciergeBriefing;
};

export function useHomeDashboardView({
  scans,
  lastLoginAt,
  categoriesCompleted,
  categoriesCount,
  tiers,
  credits,
  achievements,
  alphaScore,
  consistencyScore,
  completedMissions,
  totalMissions,
}: UseHomeDashboardViewParams): UseHomeDashboardViewResult {
  const profileCompletion = useMemo(
    () => Math.min(100, Math.round((categoriesCompleted / categoriesCount) * 100)),
    [categoriesCompleted, categoriesCount]
  );

  const lastScan = useMemo(() => (scans.length > 0 ? scans[0] : null), [scans]);

  const daysSinceLastScan = useMemo(() => {
    if (!lastScan) return null;
    const lastScanAt = new Date(lastScan.date);
    return Math.max(0, Math.floor((Date.now() - lastScanAt.getTime()) / 86400000));
  }, [lastScan]);

  const lastLoginLabel = useMemo(
    () =>
      lastLoginAt
        ? new Date(lastLoginAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })
        : "First session",
    [lastLoginAt]
  );

  const nextTier = useMemo(
    () => [...tiers].sort((a, b) => a.creditsCost - b.creditsCost).find((tier) => tier.creditsCost > credits) || null,
    [credits, tiers]
  );

  const creditsToNextTier = useMemo(
    () => (nextTier ? Math.max(0, nextTier.creditsCost - credits) : 0),
    [credits, nextTier]
  );

  const recentAchievements = useMemo(() => achievements.slice(-3).reverse(), [achievements]);

  const primaryAction = useMemo<PrimaryAction>(() => {
    if (!lastScan) {
      return { label: "Run Photo Analyzer", hint: "No recent scan found", path: "/image-analyzer" };
    }

    if (categoriesCompleted < categoriesCount) {
      return {
        label: "Answer Category Questions",
        hint: `${categoriesCount - categoriesCompleted} categories pending`,
        path: "/assessment",
      };
    }

    return { label: "Open Your AI Report", hint: "Review latest plan and actions", path: "/result" };
  }, [categoriesCompleted, categoriesCount, lastScan]);

  const conciergeBriefing = useMemo(
    () =>
      generateConciergeBriefing({
        alphaScore,
        consistencyScore,
        completedMissions,
        totalMissions,
        categoriesCompleted,
        totalCategories: categoriesCount,
        daysSinceLastScan,
      }),
    [
      alphaScore,
      consistencyScore,
      completedMissions,
      totalMissions,
      categoriesCompleted,
      categoriesCount,
      daysSinceLastScan,
    ]
  );

  return {
    profileCompletion,
    lastScan,
    daysSinceLastScan,
    lastLoginLabel,
    nextTier,
    creditsToNextTier,
    recentAchievements,
    primaryAction,
    conciergeBriefing,
  };
}