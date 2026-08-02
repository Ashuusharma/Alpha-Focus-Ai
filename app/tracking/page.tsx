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
    <div className="af-page-shell min-h-screen px-4 py-8">
      <div className="af-page-frame mx-auto max-w-6xl space-y-6">
        <section className="nv-section-white">
          <div className="relative z-10 space-y-5">
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[var(--ink-soft)] hover:text-[var(--ink)]">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="af-page-kicker">
              <Sparkles className="h-3.5 w-3.5" />
              Daily Tracking
            </span>
            <div className="max-w-3xl">
              <h1 className="text-clinical-heading text-3xl font-extrabold tracking-tight md:text-4xl">Track sleep, hydration, mood, and environment from one daily execution board.</h1>
              <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">This page now frames the lifestyle inputs as recovery levers, with climate context and the three core trackers visible inside the same premium shell.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ink-soft)]">Sleep target</p>
                <p className="mt-2 text-2xl font-bold text-[var(--ink)]">7h+</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Support overnight repair</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ink-soft)]">Hydration target</p>
                <p className="mt-2 text-2xl font-bold text-[var(--ink)]">2500ml</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Stabilize visible recovery pace</p>
              </div>
              <div className="af-stat-tile">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--ink-soft)]">Climate sync</p>
                <p className="mt-2 text-base font-semibold text-[var(--ink)]">{weather ? "Live conditions loaded" : "Waiting for location"}</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">Adjust routine to UV, humidity, and AQI</p>
              </div>
            </div>
          </div>
        </section>

        {status === "denied" && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-[var(--warning-bg)] p-4">
            <p className="text-sm text-[var(--warning-text)]">Location permission is disabled. Enable it to load climate intelligence.</p>
            <button onClick={requestLocation} className="mt-3 px-3 py-1.5 rounded-lg bg-[var(--tint-warm)] hover:bg-[var(--tint-warm)] text-xs font-semibold text-[var(--warning-text)]">Retry Location Permission</button>
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
          <div className="af-card-secondary p-4 text-sm text-[var(--ink-soft)]">
            <div className="flex items-center gap-2 text-[var(--ink)]">
              <MoonStar className="h-4 w-4 text-[var(--accent-blue)]" />
              <span className="font-semibold">Night repair</span>
            </div>
            <p className="mt-2">Log sleep first to catch repair regressions before they show up in recovery scores.</p>
          </div>
          <div className="af-card-secondary p-4 text-sm text-[var(--ink-soft)]">
            <div className="flex items-center gap-2 text-[var(--ink)]">
              <Droplets className="h-4 w-4 text-[var(--accent-blue)]" />
              <span className="font-semibold">Barrier support</span>
            </div>
            <p className="mt-2">Hydration consistency is one of the fastest variables to improve when routine momentum starts slipping.</p>
          </div>
          <div className="af-card-secondary p-4 text-sm text-[var(--ink-soft)]">
            <div className="flex items-center gap-2 text-[var(--ink)]">
              <CloudSun className="h-4 w-4 text-[var(--accent-blue)]" />
              <span className="font-semibold">External stressors</span>
            </div>
            <p className="mt-2">Use climate guidance when humidity, AQI, or UV changes faster than your routine can compensate.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0"><SleepTracker /></div>
          <div className="min-w-0"><HydrationTracker /></div>
          <div className="min-w-0 md:col-span-2 xl:col-span-1"><MoodTracker /></div>
        </div>
      </div>
    </div>
  );
}

