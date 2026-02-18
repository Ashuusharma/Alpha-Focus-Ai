"use client";

import { useMemo, useState } from "react";
import { postSleepLog } from "@/src/services/lifestyleApi";
import { getActiveUserName } from "@/lib/userScopedStorage";

const STORAGE_KEY = "oneman_sleep_logs_v1";

export default function SleepTracker() {
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(3);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const saveLog = async () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, { hours: number; quality: number }>) : {};
    parsed[todayKey] = { hours, quality };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    await postSleepLog({
      userId: getActiveUserName() || "guest",
      date: todayKey,
      hours,
      quality,
    });

    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white">
      <h3 className="text-lg font-semibold mb-4">Sleep Tracker</h3>
      <label className="text-sm text-gray-300">Hours Slept</label>
      <input type="number" min={0} max={14} value={hours} onChange={(event) => setHours(Number(event.target.value))} className="mt-1 mb-3 w-full rounded-xl bg-[#0c1626] border border-white/10 px-3 py-2" />
      <label className="text-sm text-gray-300">Sleep Quality (1–5)</label>
      <input type="range" min={1} max={5} value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="w-full mt-2" />
      <p className="text-sm text-blue-200 mt-1">Selected quality: {quality}/5</p>
      <button onClick={saveLog} className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold">Save Sleep Entry</button>
      {savedAt && <p className="text-xs text-emerald-300 mt-2">Saved at {savedAt}</p>}
    </section>
  );
}
