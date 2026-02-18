"use client";

import { useMemo, useState } from "react";
import { postHydrationLog } from "@/src/services/lifestyleApi";
import { getActiveUserName } from "@/lib/userScopedStorage";

const STORAGE_KEY = "oneman_hydration_logs_v1";

export default function HydrationTracker() {
  const [intake, setIntake] = useState(0);
  const [target, setTarget] = useState(3000);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const percent = Math.max(0, Math.min(100, Math.round((intake / Math.max(1, target)) * 100)));
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const saveLog = async () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, { intake: number; target: number }>) : {};
    parsed[todayKey] = { intake, target };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    await postHydrationLog({
      userId: getActiveUserName() || "guest",
      date: todayKey,
      intakeMl: intake,
      targetMl: target,
    });

    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white">
      <h3 className="text-lg font-semibold mb-4">Hydration Tracker</h3>
      <label className="text-sm text-gray-300">Water Intake (ml)</label>
      <input type="number" min={0} value={intake} onChange={(event) => setIntake(Number(event.target.value))} className="mt-1 mb-3 w-full rounded-xl bg-[#0c1626] border border-white/10 px-3 py-2" />
      <label className="text-sm text-gray-300">Daily Target (ml)</label>
      <input type="number" min={500} value={target} onChange={(event) => setTarget(Number(event.target.value))} className="mt-1 mb-3 w-full rounded-xl bg-[#0c1626] border border-white/10 px-3 py-2" />
      <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-cyan-400" style={{ width: `${percent}%` }} /></div>
      <p className="text-sm text-cyan-200 mt-2">Progress: {percent}%</p>
      <button onClick={saveLog} className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold">Save Hydration Entry</button>
      {savedAt && <p className="text-xs text-emerald-300 mt-2">Saved at {savedAt}</p>}
    </section>
  );
}
