"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import SleepTracker from "@/src/components/tracking/SleepTracker";
import HydrationTracker from "@/src/components/tracking/HydrationTracker";
import MoodTracker from "@/src/components/tracking/MoodTracker";
import EnvironmentCard from "@/src/components/climate/EnvironmentCard";
import { useLocation } from "@/src/hooks/useLocation";
import { getWeatherSnapshot } from "@/src/services/weatherService";
import { buildClimateRecommendation } from "@/src/utils/climateEngine";

export default function TrackingPage() {
  const router = useRouter();
  const { latitude, longitude, status, requestLocation } = useLocation(true);
  const [weather, setWeather] = useState<{ humidity: number; uvIndex: number; temperatureC: number; aqi: number } | null>(null);

  useEffect(() => {
    const run = async () => {
      if (latitude === null || longitude === null) return;
      try {
        const snapshot = await getWeatherSnapshot(latitude, longitude);
        setWeather(snapshot);
      } catch {
        setWeather(null);
      }
    };
    run();
  }, [latitude, longitude]);

  const recommendation = weather
    ? buildClimateRecommendation({
        humidity: weather.humidity,
        uvIndex: weather.uvIndex,
        aqi: weather.aqi,
        temperatureC: weather.temperatureC,
      })
    : null;

  return (
    <div className="af-page-shell report-page min-h-screen text-[#1F3D2B] px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-[#6B665D] hover:text-[#1F3D2B]">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-6">
          <h1 className="text-clinical-heading text-3xl font-extrabold tracking-tight">Lifestyle Tracking</h1>
          <p className="mt-1 text-[#6B665D]">Track sleep, hydration, mood, and environment in one place.</p>
        </div>

        {status === "denied" && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-[#fff4df] p-4">
            <p className="text-sm text-[#8a5c1b]">Location permission is disabled. Enable it to load climate intelligence.</p>
            <button onClick={requestLocation} className="mt-3 px-3 py-1.5 rounded-lg bg-[#f5dfac] hover:bg-[#edd08f] text-xs font-semibold text-[#6f4a14]">Retry Location Permission</button>
          </div>
        )}

        {weather && recommendation && (
          <div className="mb-5">
            <EnvironmentCard
              humidity={weather.humidity}
              uvIndex={weather.uvIndex}
              aqi={weather.aqi}
              temperatureC={weather.temperatureC}
              recommendation={recommendation}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          <SleepTracker />
          <HydrationTracker />
          <MoodTracker />
        </div>
      </div>
    </div>
  );
}
