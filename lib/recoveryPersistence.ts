import { CategoryId } from "@/lib/questions";

export type RecoveryState = {
  answers: Record<string, string>;
  lastActiveCategory: CategoryId | null;
  timestamp?: number;
};

const STORAGE_KEY = "oneman_recovery_state";

export function saveRecoveryState(state: RecoveryState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadRecoveryState(): RecoveryState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return {
      answers: parsed.answers || {},
      lastActiveCategory:
        parsed.lastActiveCategory ?? null,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
}

export function clearRecoveryState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
