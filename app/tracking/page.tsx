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
    <div className="min-h-screen bg-[#030917] text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="mb-5 inline-flex items-center gap-2 text-gray-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="mb-6">
          <h1 className="text-clinical-heading text-3xl font-extrabold tracking-tight">Lifestyle Tracking</h1>
          <p className="mt-1 text-zinc-300">Track sleep, hydration, mood, and environment in one place.</p>
        </div>

        {status === "denied" && (
          <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-100">Location permission is disabled. Enable it to load climate intelligence.</p>
            <button onClick={requestLocation} className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-xs font-semibold">Retry Location Permission</button>
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
