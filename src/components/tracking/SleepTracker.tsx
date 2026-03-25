"use client";

import { useContext, useMemo, useState } from "react";
import { AuthContext } from "@/contexts/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { hydrateUserData } from "@/lib/hydrateUserData";
import { recalculateClinicalScores } from "@/lib/recalculateClinicalScores";

export default function SleepTracker() {
  const { user } = useContext(AuthContext);
  const [hours, setHours] = useState(7);
  const [quality, setQuality] = useState(3);
  const [bedtime, setBedtime] = useState("23:00");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const saveLog = async () => {
    if (!user) return;

    await supabase.from("routine_logs").upsert(
      {
        user_id: user.id,
        log_date: todayKey,
        sleep_hours: hours,
        stress_level: Math.max(1, 6 - quality),
      },
      { onConflict: "user_id,log_date" }
    );

    await recalculateClinicalScores(user.id);
    await hydrateUserData(user.id);

    setSavedAt(new Date().toLocaleTimeString());
  };

  return (
    <section className="af-surface-card p-5 text-[#1F3D2B]">
      <h3 className="text-lg font-semibold mb-4">Sleep Tracker</h3>
      <label className="text-sm text-[#6B665D]">Hours Slept</label>
      <input type="number" min={0} max={14} value={hours} onChange={(event) => setHours(Number(event.target.value))} className="af-input mt-1 mb-3 w-full rounded-xl px-3 py-2" />
      <label className="text-sm text-[#6B665D]">Bedtime</label>
      <input type="time" value={bedtime} onChange={(event) => setBedtime(event.target.value)} className="af-input mt-1 mb-3 w-full rounded-xl px-3 py-2" />
      <label className="text-sm text-[#6B665D]">Sleep Quality (1–5)</label>
      <input type="range" min={1} max={5} value={quality} onChange={(event) => setQuality(Number(event.target.value))} className="w-full mt-2" />
      <p className="text-sm text-[#2F6F57] mt-1">Selected quality: {quality}/5</p>
      <button onClick={saveLog} className="mt-4 px-4 py-2 rounded-xl bg-[#2F6F57] hover:bg-[#275c48] text-sm font-semibold text-white">Save Sleep Entry</button>
      {savedAt && <p className="text-xs text-[#2F6F57] mt-2">Saved at {savedAt}</p>}
    </section>
  );
}
