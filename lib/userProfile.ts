// lib/userProfile.ts

export type SavedPlan = {
  id: string;
  createdAt: string;
  answers: Record<string, string>;
  recommendations: any[];
};

const USER_KEY = "oneman_user_profile";

export function getUserProfile() {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveUserPlan(plan: SavedPlan) {
  if (typeof window === "undefined") return;

  const existing = getUserProfile();

  const updatedProfile = {
    id: existing?.id ?? crypto.randomUUID(),
    plans: existing?.plans
      ? [plan, ...existing.plans]
      : [plan],
  };

  localStorage.setItem(USER_KEY, JSON.stringify(updatedProfile));
}
