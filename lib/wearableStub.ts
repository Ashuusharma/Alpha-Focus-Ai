// Minimal wearable ingestion stub to keep web/mobile parity.
export interface WearableData {
  sleepHours?: number;
  hrvScore?: number; // 0-100
  steps?: number;
  collectedAt: string;
}

const KEY = "oneman_wearable_stub";

export function saveWearableSnapshot(data: Omit<WearableData, "collectedAt">) {
  if (typeof window === "undefined") return;
  const snapshot: WearableData = { ...data, collectedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.error("Failed to save wearable snapshot", e);
  }
}

export function getWearableSnapshot(): WearableData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WearableData) : null;
  } catch (e) {
    console.error("Failed to load wearable snapshot", e);
    return null;
  }
}
