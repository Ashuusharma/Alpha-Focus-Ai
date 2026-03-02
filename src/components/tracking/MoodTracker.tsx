"use client";

import { useContext, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

type Mood = "calm" | "neutral" | "stressed";

export default function MoodTracker() {
  const { user } = useContext(AuthContext);
  const [mood, setMood] = useState<Mood>("neutral");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const saveLog = async () => {
    if (!user) return;

    const stressLevel = mood === "calm" ? 2 : mood === "neutral" ? 5 : 8;

    await supabase.from("routine_logs").upsert(
      {
        user_id: user.id,
        log_date: todayKey,
        stress_level: stressLevel,
      },
      { onConflict: "user_id,log_date" }
    );

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
