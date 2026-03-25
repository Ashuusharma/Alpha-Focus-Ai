"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, RefreshCcw, ShieldCheck } from "lucide-react";
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
    <div className="af-page-shell min-h-screen text-[#1F3D2B] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-[#6B665D] hover:text-[#1F3D2B]">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-[#2F6F57]" />
          <h1 className="text-3xl font-bold">Data Permissions</h1>
        </div>

        <div className="space-y-3">
          {([
            ["location", "Location"],
            ["sleepTracking", "Sleep Tracking"],
            ["hydrationTracking", "Hydration Tracking"],
            ["moodTracking", "Mood Tracking"],
          ] as Array<[keyof PermissionState, string]>).map(([key, label]) => (
            <div key={key} className="af-surface-card flex items-center justify-between p-4">
              <p className="font-medium">{label}</p>
              <button onClick={() => toggle(key)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${permissions[key] ? "bg-[#E8EFEA] text-[#2F6F57]" : "bg-[#f3ecdf] text-[#6B665D]"}`}>
                {permissions[key] ? "Enabled" : "Disabled"}
              </button>
            </div>
          ))}
        </div>

        <div className="af-surface-card mt-4 p-4">
          <div className="flex items-center gap-2 text-sm text-[#6B665D]">
            <MapPin className="w-4 h-4 text-[#2F6F57]" />
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

        <button onClick={deleteAllData} className="mt-6 px-4 py-2 rounded-xl bg-[#f6e7e2] text-[#8C6A5A] border border-[#ddc1b8] hover:bg-[#efd7cf] text-sm font-semibold">
          Delete All Data
        </button>
      </div>
    </div>
  );
}
