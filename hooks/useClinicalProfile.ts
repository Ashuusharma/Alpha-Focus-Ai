"use client";

import { useCallback, useEffect, useState } from "react";
import { getActiveUserName, getScopedSessionItem } from "@/lib/userScopedStorage";
import { loadRecoveryState } from "@/lib/recoveryPersistence";
import { AnalysisResult } from "@/lib/analyzeImage";
import { getCreditSnapshot } from "@/lib/creditService";
import { getTierProgress } from "@/lib/rewardTierService";
import { computeSeverity } from "@/lib/clinical/computeSeverity";
import { computeRecovery } from "@/lib/clinical/computeRecovery";
import { computeConfidence } from "@/lib/clinical/computeConfidence";
import { UserClinicalProfile } from "@/lib/clinical/types";

const STORAGE_KEYS = {
  assessment: "assessment_answers_v1",
  photoAnalysis: "photoAnalysis",
  galaxyAnalysis: "galaxyAnalysis",
  scanHistory: "oneman_scan_history",
};

type HydrationLog = {
  intakeMl: number;
  targetMl: number;
  date?: string;
  createdAt?: string;
};

type MoodLog = {
  mood: "calm" | "neutral" | "stressed";
  date?: string;
  createdAt?: string;
};

type LifestyleSignals = {
  hydrationLevel?: number;
  stressLevel?: number;
  lastHydrationAt?: string;
  lastMoodAt?: string;
};

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function scoreFromAnswer(value?: string | null, mode: "positive" | "negative" = "positive") {
  if (!value) return undefined;
  const normalized = value.toLowerCase();

  const lowSignals = /(poor|low|fatigued|very low|rarely|broken|irregular|not good)/;
  const midSignals = /(average|sometimes|moderate|mixed|ok|fair)/;
  const highSignals = /(good|restorative|high|consistent|daily|excellent|balanced)/;

  if (lowSignals.test(normalized)) return mode === "positive" ? 35 : 75;
  if (midSignals.test(normalized)) return mode === "positive" ? 60 : 55;
  if (highSignals.test(normalized)) return mode === "positive" ? 85 : 35;
  return mode === "positive" ? 55 : 55;
}

function mapStress(value?: string | null) {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (/high|intense|overwhelming/.test(normalized)) return 82;
  if (/moderate|some/.test(normalized)) return 58;
  if (/low|minimal|calm/.test(normalized)) return 32;
  return 55;
}

function mapUvIndex(value?: string | null) {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (/high|daily|frequent/.test(normalized)) return 8;
  if (/moderate|some days|weekly/.test(normalized)) return 5;
  if (/low|rarely/.test(normalized)) return 2;
  return 4;
}

function getAssessmentAnswers(): Record<string, string> {
  const user = getActiveUserName();
  const raw = getScopedSessionItem(STORAGE_KEYS.assessment, user, true);
  const parsed = parseJson<Record<string, string>>(raw, {});
  if (Object.keys(parsed).length > 0) return parsed;

  const recovery = loadRecoveryState();
  return recovery?.answers || {};
}

function getPhotoAnalysis(): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEYS.photoAnalysis);
  return parseJson<AnalysisResult | null>(raw, null);
}

function getGalaxyAnalysis(): { annotatedImageUrl?: string; createdAt?: string } | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEYS.galaxyAnalysis);
  return parseJson<{ annotatedImageUrl?: string; createdAt?: string } | null>(raw, null);
}

function getScanHistoryMeta() {
  if (typeof window === "undefined") return { total: 0 };
  const raw = localStorage.getItem(STORAGE_KEYS.scanHistory);
  const entries = parseJson<Array<{ createdAt?: string; annotatedImageUrl?: string }>>(raw, []);
  return {
    total: entries.length,
    lastScanAt: entries[0]?.createdAt,
    lastImageUrl: entries[0]?.annotatedImageUrl,
  };
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function computeHydrationLevel(logs: HydrationLog[]): { level?: number; lastAt?: string } {
  if (!logs.length) return {};
  const sorted = [...logs].sort((a, b) => (b.createdAt || b.date || "").localeCompare(a.createdAt || a.date || ""));
  const recent = sorted.slice(0, 7);
  const ratios = recent.map((log) => {
    const target = log.targetMl || 3000;
    return target > 0 ? log.intakeMl / target : 0;
  });
  const avgRatio = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
  return {
    level: clamp(Math.round(avgRatio * 100)),
    lastAt: sorted[0]?.createdAt || sorted[0]?.date,
  };
}

function computeStressLevel(logs: MoodLog[]): { level?: number; lastAt?: string } {
  if (!logs.length) return {};
  const sorted = [...logs].sort((a, b) => (b.createdAt || b.date || "").localeCompare(a.createdAt || a.date || ""));
  const recent = sorted.slice(0, 7);
  const mapped = recent.map((log) => {
    if (log.mood === "stressed") return 80;
    if (log.mood === "calm") return 30;
    return 55;
  });
  const avg = mapped.reduce((sum, value) => sum + value, 0) / mapped.length;
  return {
    level: clamp(Math.round(avg)),
    lastAt: sorted[0]?.createdAt || sorted[0]?.date,
  };
}

function derivePhotoScores(photoAnalysis: AnalysisResult | null) {
  if (!photoAnalysis) return {};

  const severityMap: Record<AnalysisResult["severity"], number> = {
    low: 28,
    moderate: 52,
    high: 76,
  };

  const baseSeverity = severityMap[photoAnalysis.severity] ?? 52;
  const confidence = photoAnalysis.confidence ?? 70;

  let densityScore = clamp(90 - baseSeverity + (confidence - 70) * 0.25);
  let inflammationScore = clamp(baseSeverity + (100 - confidence) * 0.2);
  let oilBalanceScore = clamp(75 - baseSeverity * 0.2 + (confidence - 70) * 0.15);

  const issueText = (photoAnalysis.detectedIssues || [])
    .map((issue) => `${issue.name} ${issue.description}`.toLowerCase())
    .join(" ");

  if (/oily|sebum|greasy/.test(issueText)) oilBalanceScore = clamp(oilBalanceScore - 12);
  if (/dry|dehydration|flake/.test(issueText)) oilBalanceScore = clamp(oilBalanceScore + 6);
  if (/inflamm|irritation|redness/.test(issueText)) inflammationScore = clamp(inflammationScore + 8);
  if (/thin|shed|loss|density/.test(issueText)) densityScore = clamp(densityScore - 10);

  return { densityScore, inflammationScore, oilBalanceScore };
}

async function fetchLifestyleSignals(userId: string | null): Promise<LifestyleSignals> {
  if (typeof window === "undefined") return {};
  const id = userId || "guest";
  try {
    const [hydrationRes, moodRes] = await Promise.all([
      fetch(`/api/logs/hydration?userId=${encodeURIComponent(id)}`),
      fetch(`/api/logs/mood?userId=${encodeURIComponent(id)}`),
    ]);

    const hydrationJson = hydrationRes.ok ? await hydrationRes.json() : { logs: [] };
    const moodJson = moodRes.ok ? await moodRes.json() : { logs: [] };

    const hydrationLogs = Array.isArray(hydrationJson.logs) ? hydrationJson.logs : [];
    const moodLogs = Array.isArray(moodJson.logs) ? moodJson.logs : [];

    const hydration = computeHydrationLevel(hydrationLogs);
    const stress = computeStressLevel(moodLogs);

    return {
      hydrationLevel: hydration.level,
      stressLevel: stress.level,
      lastHydrationAt: hydration.lastAt,
      lastMoodAt: stress.lastAt,
    };
  } catch {
    return {};
  }
}

function buildClinicalProfile(lifestyle: LifestyleSignals): UserClinicalProfile {
  const answers = getAssessmentAnswers();
  const photoAnalysis = getPhotoAnalysis();
  const galaxy = getGalaxyAnalysis();
  const scanHistory = getScanHistoryMeta();
  const userName = getActiveUserName() || "Guest";

  const sleepScore = scoreFromAnswer(answers.sleep, "positive");
  const hydrationLevel = lifestyle.hydrationLevel ?? scoreFromAnswer(answers.diet, "positive");
  const stressLevel = lifestyle.stressLevel ?? mapStress(answers.stress);
  const uvIndex = mapUvIndex(answers.sun_exposure);

  const creditSnapshot = typeof window !== "undefined" ? getCreditSnapshot() : null;
  const tierProgress = creditSnapshot ? getTierProgress(creditSnapshot.model.totalEarned) : null;
  const routineDays = creditSnapshot ? Object.keys(creditSnapshot.dailyRoutineTotals || {}).length : 0;
  const routineAdherence = routineDays > 0 ? Math.min(100, Math.round((routineDays / 7) * 100)) : undefined;

  const photoScores = derivePhotoScores(photoAnalysis);

  const lastUpdatedCandidates = [
    galaxy?.createdAt,
    scanHistory.lastScanAt,
    lifestyle.lastHydrationAt,
    lifestyle.lastMoodAt,
  ].filter(Boolean) as string[];

  const lastUpdated = lastUpdatedCandidates.length > 0
    ? lastUpdatedCandidates.sort().slice(-1)[0]
    : new Date().toISOString();

  const profile: UserClinicalProfile = {
    userId: userName.toLowerCase().replace(/\s+/g, "-") || "guest",
    userName,
    assessment: {
      answers,
      completedAt: undefined,
    },
    photoAnalysis: {
      imageUrl: galaxy?.annotatedImageUrl || photoAnalysis?.capturedPhotos?.[0],
      densityScore: photoScores.densityScore,
      inflammationScore: photoScores.inflammationScore,
      oilBalanceScore: photoScores.oilBalanceScore,
      uploadedAt: galaxy?.createdAt,
    },
    metrics: {
      alphaScore: 0,
      severityIndex: 0,
      confidenceScore: 0,
      recoveryProbability: 0,
    },
    signals: {
      sleepScore,
      hydrationLevel,
      stressLevel,
      uvIndex,
      routineAdherence,
    },
    projections: {
      estimatedWeeksToImprove: 8,
      adherenceImpact: 0,
    },
    rewards: creditSnapshot
      ? {
          alphaSikka: creditSnapshot.model.currentBalance,
          tierName: creditSnapshot.tier.label,
          levelLabel: creditSnapshot.tier.id.toUpperCase(),
          nextTierName: tierProgress?.nextTier?.label,
          discountEligibility: creditSnapshot.coupons?.[0]?.discountPercent
            ? `${creditSnapshot.coupons[0].discountPercent}% coupon available`
            : "No active coupon",
        }
      : undefined,
    history: {
      totalScans: scanHistory.total,
      lastScanAt: scanHistory.lastScanAt,
    },
    lastUpdated,
  };

  profile.metrics.severityIndex = computeSeverity(profile);
  profile.metrics.alphaScore = Math.max(0, Math.round(100 - profile.metrics.severityIndex));
  profile.metrics.confidenceScore = computeConfidence(profile);

  const recovery = computeRecovery(profile);
  profile.metrics.recoveryProbability = recovery.recoveryProbability;
  profile.projections.estimatedWeeksToImprove = recovery.estimatedWeeksToImprove;
  profile.projections.adherenceImpact = recovery.adherenceImpact;

  return profile;
}

export function useClinicalProfile() {
  const [clinicalProfile, setClinicalProfile] = useState<UserClinicalProfile | null>(null);
  const [lifestyleSignals, setLifestyleSignals] = useState<LifestyleSignals>({});
  const [fallbackUpdatedAt] = useState(() => new Date().toISOString());

  const recompute = useCallback((override?: LifestyleSignals) => {
    const next = buildClinicalProfile(override || lifestyleSignals);
    if (!next.lastUpdated) {
      next.lastUpdated = fallbackUpdatedAt;
    }
    setClinicalProfile(next);
  }, [fallbackUpdatedAt, lifestyleSignals]);

  const refreshLifestyle = useCallback(async () => {
    const signals = await fetchLifestyleSignals(getActiveUserName());
    setLifestyleSignals(signals);
    recompute(signals);
  }, [recompute]);

  useEffect(() => {
    recompute();
    refreshLifestyle();

    const handleStorage = () => recompute();
    window.addEventListener("storage", handleStorage);

    const interval = window.setInterval(recompute, 2000);
    const lifestyleInterval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      refreshLifestyle();
    }, 60000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(interval);
      window.clearInterval(lifestyleInterval);
    };
  }, [recompute, refreshLifestyle]);

  return { clinicalProfile, refresh: recompute };
}
