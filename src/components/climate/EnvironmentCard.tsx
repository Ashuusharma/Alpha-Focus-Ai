"use client";

import { ThermometerSun, Droplets, Wind, ShieldCheck } from "lucide-react";
import { ClimateRecommendation } from "@/src/utils/climateEngine";

type Props = {
  humidity: number;
  uvIndex: number;
  aqi: number;
  temperatureC: number;
  recommendation: ClimateRecommendation;
};

export default function EnvironmentCard({ humidity, uvIndex, aqi, temperatureC, recommendation }: Props) {
  return (
    <section className="af-surface-card p-5 text-[#1F3D2B]">
      <h3 className="text-lg font-semibold mb-4">Environment Impact</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="af-surface-soft p-3"><div className="flex items-center gap-2 text-sm text-[#6B665D]"><Droplets className="w-4 h-4 text-cyan-600" />Humidity</div><p className="text-xl font-bold mt-1">{humidity}%</p></div>
        <div className="af-surface-soft p-3"><div className="flex items-center gap-2 text-sm text-[#6B665D]"><ThermometerSun className="w-4 h-4 text-amber-500" />UV Index</div><p className="text-xl font-bold mt-1">{uvIndex}</p></div>
        <div className="af-surface-soft p-3"><div className="flex items-center gap-2 text-sm text-[#6B665D]"><Wind className="w-4 h-4 text-sky-600" />AQI</div><p className="text-xl font-bold mt-1">{aqi}</p></div>
        <div className="af-surface-soft p-3"><div className="flex items-center gap-2 text-sm text-[#6B665D]"><ShieldCheck className="w-4 h-4 text-emerald-600" />Temp</div><p className="text-xl font-bold mt-1">{temperatureC}°C</p></div>
      </div>
      <div className="af-surface-soft p-4">
        <p className="text-sm text-[#2F6F57] font-semibold mb-2">Auto-Adjusted Routine</p>
        <ul className="list-disc pl-5 text-sm text-[#5F5A51] space-y-1">
          {recommendation.routineAdjustments.length === 0 && recommendation.reminders.length === 0 ? (
            <li>Conditions are stable. Continue baseline routine.</li>
          ) : (
            [...recommendation.routineAdjustments, ...recommendation.reminders].map((line) => <li key={line}>{line}</li>)
          )}
        </ul>
      </div>
    </section>
  );
}
