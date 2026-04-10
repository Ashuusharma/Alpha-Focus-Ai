"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, MapPin, RefreshCcw, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useLocation } from "@/app/hooks/useLocation";

type PermissionState = {
  location: boolean;
  sleepTracking: boolean;
  hydrationTracking: boolean;
  moodTracking: boolean;
};

const STORAGE_KEY = "oneman_data_permissions_v1";

export default function DataSettingsPage() {
  const router = useRouter();
  const { displayLabel, status: locationStatus, refreshLocation } = useLocation();
  const [permissions, setPermissions] = useState<PermissionState>({
    location: false,
    sleepTracking: true,
    hydrationTracking: true,
    moodTracking: true,
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setPermissions(JSON.parse(raw) as PermissionState);
    } catch {
      setPermissions({ location: false, sleepTracking: true, hydrationTracking: true, moodTracking: true });
    }
  }, []);

  const toggle = (key: keyof PermissionState) => {
    setPermissions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const deleteAllData = () => {
    const keys = [
      "oneman_sleep_logs_v1",
      "oneman_hydration_logs_v1",
      "oneman_mood_logs_v1",
      "oneman_scan_history",
      "oneman_env_cache",
      "oneman_recovery_state",
      "oneman_user_profile",
    ];
    keys.forEach((key) => localStorage.removeItem(key));
  };

  const locationText =
    locationStatus === "loading"
      ? "Detecting location..."
      : !displayLabel || displayLabel === "Local Area" || displayLabel === "Location not enabled"
        ? "Enable location"
        : displayLabel;

  return (
    <div className="af-page-shell min-h-screen text-[#1d1d1f] px-4 py-8">
      <div className="af-page-frame mx-auto max-w-4xl space-y-6">
        <section className="af-page-hero p-6 md:p-8">
          <div className="relative z-10 space-y-5">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[#6e6e73] hover:text-[#1d1d1f]">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="af-page-kicker">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Data Controls
            </span>
            <div className="max-w-3xl">
              <h1 className="text-clinical-heading text-3xl font-extrabold tracking-tight md:text-4xl">Manage what the app tracks, where it gets context, and how local data is retained.</h1>
              <p className="mt-3 text-sm leading-7 text-[#6e6e73]">This screen now makes permissions and destructive actions clearer so users understand what they are enabling before any recovery signals are stored.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Enabled permissions</p>
                <p className="mt-2 text-3xl font-bold text-[#1d1d1f]">{Object.values(permissions).filter(Boolean).length}</p>
                <p className="mt-1 text-xs text-[#6e6e73]">Currently active</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Location status</p>
                <p className="mt-2 text-base font-semibold text-[#1d1d1f]">{locationText}</p>
                <p className="mt-1 text-xs text-[#6e6e73]">Used for climate intelligence</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Storage model</p>
                <p className="mt-2 text-base font-semibold text-[#1d1d1f]">Local-first toggles</p>
                <p className="mt-1 text-xs text-[#6e6e73]">You can clear local logs any time</p>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-3">
          {([
            ["location", "Location"],
            ["sleepTracking", "Sleep Tracking"],
            ["hydrationTracking", "Hydration Tracking"],
            ["moodTracking", "Mood Tracking"],
          ] as Array<[keyof PermissionState, string]>).map(([key, label]) => (
            <div key={key} className="af-card-secondary flex items-center justify-between p-4">
              <div>
                <p className="font-medium text-[#1d1d1f]">{label}</p>
                <p className="mt-1 text-xs text-[#6e6e73]">{key === "location" ? "Enables local climate recommendations." : `Allows ${label.toLowerCase()} logs to shape your recovery insights.`}</p>
              </div>
              <button onClick={() => toggle(key)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${permissions[key] ? "bg-[#eef5ff] text-[#0071e3]" : "bg-[#f3ecdf] text-[#6e6e73]"}`}>
                {permissions[key] ? "Enabled" : "Disabled"}
              </button>
            </div>
          ))}
        </div>

        <div className="af-card-secondary mt-4 p-4">
          <div className="flex items-center gap-2 text-sm text-[#6e6e73]">
            <MapPin className="w-4 h-4 text-[#0071e3]" />
            <span className="truncate" title={locationText}>{locationText}</span>
            <button
              type="button"
              onClick={refreshLocation}
              className="ml-auto p-1.5 rounded-md bg-[#f3ecdf] hover:bg-[#ebe1d2] transition-colors"
              title="Refresh location"
              aria-label="Refresh location"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="af-card-primary border-[rgba(200,107,78,0.2)] p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#F8E6DE] p-3 text-[#A04F39]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-[#1d1d1f]">Destructive action</h2>
              <p className="mt-1 text-sm text-[#6e6e73]">Delete locally stored lifestyle and recovery data from this device. This should stay visually separate from the permission toggles above.</p>
            </div>
            <button onClick={deleteAllData} className="rounded-xl border border-[#ddc1b8] bg-[#f6e7e2] px-4 py-2 text-sm font-semibold text-[#6e6e73] hover:bg-[#efd7cf]">
              Delete All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

