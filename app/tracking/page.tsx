"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CloudSun, Droplets, MoonStar, Sparkles } from "lucide-react";
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
    <div className="af-page-shell report-page min-h-screen text-[#ffffff] px-4 py-8">
      <div className="af-page-frame mx-auto max-w-6xl space-y-6">
        <section className="nv-section-white">
          <div className="relative z-10 space-y-5">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[#6e6e73] hover:text-[#1d1d1f]">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="af-page-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Tracking
            </span>
            <div className="max-w-3xl">
              <h1 className="text-clinical-heading text-3xl font-extrabold tracking-tight md:text-4xl">Track sleep, hydration, mood, and environment from one daily execution board.</h1>
              <p className="mt-3 text-sm leading-7 text-[#6e6e73]">This page now frames the lifestyle inputs as recovery levers, with climate context and the three core trackers visible inside the same premium shell.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Sleep target</p>
                <p className="mt-2 text-2xl font-bold text-[#1d1d1f]">7h+</p>
                <p className="mt-1 text-xs text-[#6e6e73]">Support overnight repair</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Hydration target</p>
                <p className="mt-2 text-2xl font-bold text-[#1d1d1f]">2500ml</p>
                <p className="mt-1 text-xs text-[#6e6e73]">Stabilize visible recovery pace</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Climate sync</p>
                <p className="mt-2 text-base font-semibold text-[#1d1d1f]">{weather ? "Live conditions loaded" : "Waiting for location"}</p>
                <p className="mt-1 text-xs text-[#6e6e73]">Adjust routine to UV, humidity, and AQI</p>
              </div>
            </div>
          </div>
        </section>

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

        <div className="grid gap-4 md:grid-cols-3">
          <div className="af-card-secondary p-4 text-sm text-[#5F5A51]">
            <div className="flex items-center gap-2 text-[#1d1d1f]">
              <MoonStar className="h-4 w-4 text-[#0071e3]" />
              <span className="font-semibold">Night repair</span>
            </div>
            <p className="mt-2">Log sleep first to catch repair regressions before they show up in recovery scores.</p>
          </div>
          <div className="af-card-secondary p-4 text-sm text-[#5F5A51]">
            <div className="flex items-center gap-2 text-[#1d1d1f]">
              <Droplets className="h-4 w-4 text-[#0071e3]" />
              <span className="font-semibold">Barrier support</span>
            </div>
            <p className="mt-2">Hydration consistency is one of the fastest variables to improve when routine momentum starts slipping.</p>
          </div>
          <div className="af-card-secondary p-4 text-sm text-[#5F5A51]">
            <div className="flex items-center gap-2 text-[#1d1d1f]">
              <CloudSun className="h-4 w-4 text-[#0071e3]" />
              <span className="font-semibold">External stressors</span>
            </div>
            <p className="mt-2">Use climate guidance when humidity, AQI, or UV changes faster than your routine can compensate.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <SleepTracker />
          <HydrationTracker />
          <MoodTracker />
        </div>
      </div>
    </div>
  );
}

