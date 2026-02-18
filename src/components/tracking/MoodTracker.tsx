"use client";

import { useMemo, useState } from "react";
import { postMoodLog } from "@/src/services/lifestyleApi";
import { getActiveUserName } from "@/lib/userScopedStorage";

const STORAGE_KEY = "oneman_mood_logs_v1";

type Mood = "calm" | "neutral" | "stressed";

export default function MoodTracker() {
  const [mood, setMood] = useState<Mood>("neutral");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const saveLog = async () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, Mood>) : {};
    parsed[todayKey] = mood;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));

    await postMoodLog({
      userId: getActiveUserName() || "guest",
      date: todayKey,
      mood,
    });

    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white">
      <h3 className="text-lg font-semibold mb-4">Mood / Stress Tracker</h3>
      <div className="flex gap-2 flex-wrap">
        {(["calm", "neutral", "stressed"] as Mood[]).map((option) => (
          <button key={option} onClick={() => setMood(option)} className={`px-4 py-2 rounded-xl border text-sm font-semibold ${mood === option ? "bg-blue-600 border-blue-500" : "bg-white/[0.04] border-white/20 hover:bg-white/[0.08]"}`}>
            {option[0].toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>
      <button onClick={saveLog} className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold">Save Mood Entry</button>
      {savedAt && <p className="text-xs text-emerald-300 mt-2">Saved at {savedAt}</p>}
    </section>
  );
}
