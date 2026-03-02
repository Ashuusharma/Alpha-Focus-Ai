import { supabase } from "@/lib/supabaseClient";

async function buildAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function postSleepLog(payload: { userId: string; date: string; hours: number; quality: number; bedtime?: string }) {
  const headers = await buildAuthHeaders();
  await fetch("/api/logs/sleep", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function postHydrationLog(payload: { userId: string; date: string; intakeMl: number; targetMl: number }) {
  const headers = await buildAuthHeaders();
  await fetch("/api/logs/hydration", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function postMoodLog(payload: { userId: string; date: string; mood: "calm" | "neutral" | "stressed" }) {
  const headers = await buildAuthHeaders();
  await fetch("/api/logs/mood", {
    method: "POST",
    headers,
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
  const headers = await buildAuthHeaders();
  await fetch("/api/reports/weekly", {
    method: "POST",
    headers,
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
  const headers = await buildAuthHeaders();
  await fetch("/api/scans/history", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}
