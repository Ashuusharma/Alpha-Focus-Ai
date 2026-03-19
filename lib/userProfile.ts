// lib/userProfile.ts

import { normalizeRecoveryLevel, type ProtocolToleranceMode } from "@/lib/protocolTemplates";

export type SavedPlan = {
  id: string;
  createdAt: string;
  answers: Record<string, string>;
  recommendations: any[];
};

export interface StoredUserProfile {
  id: string;
  plans: SavedPlan[];
  level: number;
  recoveryProgramLevel?: ProtocolToleranceMode;
  xp: number;
  achievements: string[];
  streakCount: number;
}

const USER_KEY = "oneman_user_profile";

export function getUserProfile() {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  const parsed = JSON.parse(raw) as Partial<StoredUserProfile>;
  return {
    id: parsed.id ?? crypto.randomUUID(),
    plans: Array.isArray(parsed.plans) ? parsed.plans : [],
    level: Number.isFinite(parsed.level) ? Number(parsed.level) : 1,
    recoveryProgramLevel: normalizeRecoveryLevel(typeof parsed.recoveryProgramLevel === "string" ? parsed.recoveryProgramLevel : null),
    xp: Number.isFinite(parsed.xp) ? Number(parsed.xp) : 0,
    achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
    streakCount: Number.isFinite(parsed.streakCount) ? Number(parsed.streakCount) : 0,
  } as StoredUserProfile;
}

export function saveUserPlan(plan: SavedPlan) {
  if (typeof window === "undefined") return;

  const existing = getUserProfile();

  const updatedProfile = {
    id: existing?.id ?? crypto.randomUUID(),
    plans: existing?.plans
      ? [plan, ...existing.plans]
      : [plan],
    level: existing?.level ?? 1,
    recoveryProgramLevel: existing?.recoveryProgramLevel ?? "intermediate",
    xp: existing?.xp ?? 0,
    achievements: existing?.achievements ?? [],
    streakCount: existing?.streakCount ?? 0,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(updatedProfile));
}

export function saveRecoveryProgramLevel(level: ProtocolToleranceMode) {
  if (typeof window === "undefined") return;

  const existing = getUserProfile();
  const updatedProfile: StoredUserProfile = {
    id: existing?.id ?? crypto.randomUUID(),
    plans: existing?.plans ?? [],
    level: existing?.level ?? 1,
    recoveryProgramLevel: normalizeRecoveryLevel(level),
    xp: existing?.xp ?? 0,
    achievements: existing?.achievements ?? [],
    streakCount: existing?.streakCount ?? 0,
  };

  localStorage.setItem(USER_KEY, JSON.stringify(updatedProfile));
}

export function getRecoveryProgramLevel() {
  return getUserProfile()?.recoveryProgramLevel || "intermediate";
}
