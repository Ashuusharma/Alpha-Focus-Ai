export async function postSleepLog(payload: { userId: string; date: string; hours: number; quality: number }) {
  await fetch("/api/logs/sleep", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function postHydrationLog(payload: { userId: string; date: string; intakeMl: number; targetMl: number }) {
  await fetch("/api/logs/hydration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function postMoodLog(payload: { userId: string; date: string; mood: "calm" | "neutral" | "stressed" }) {
  await fetch("/api/logs/mood", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function postWeeklyReport(payload: {
  userId: string;
  strengths: string[];
  risks: string[];
  suggestedFocus: string;
  avgSleep: number;
  avgHydration: number;
  compliance: number;
  scoreDelta: number;
}) {
  await fetch("/api/reports/weekly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function postScanHistory(payload: {
  userId: string;
  scanDate: string;
  skinScore: number;
  hairScore: number;
  imageUrls: string[];
  analyzerType?: string;
}) {
  await fetch("/api/scans/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
