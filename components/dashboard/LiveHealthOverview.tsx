"use client";

import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, Legend, XAxis, YAxis } from "recharts";

type EnvironmentMetrics = {
  uv: number | null;
  humidity: number | null;
  aqi: number | null;
};

type LiveHealthOverviewProps = {
  alphaScore: number;
  consistency: number;
  recovery: number;
  streakDays: number;
  missionsCompleted: number;
  missionsTotal: number;
  scansCount: number;
  locationLabel: string;
  environment: EnvironmentMetrics;
};

type TrendPoint = {
  label: string;
  alpha: number;
  consistency: number;
  recovery: number;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function nudgeValue(value: number, variance: number) {
  const delta = (Math.random() * variance * 2) - variance;
  return clampScore(value + delta);
}

function getAqiLabel(aqi: number | null) {
  if (aqi === null) return "Unavailable";
  if (aqi <= 1) return "Good";
  if (aqi === 2) return "Fair";
  if (aqi === 3) return "Moderate";
  if (aqi === 4) return "Poor";
  return "Very Poor";
}

export default function LiveHealthOverview({
  alphaScore,
  consistency,
  recovery,
  streakDays,
  missionsCompleted,
  missionsTotal,
  scansCount,
  locationLabel,
  environment,
}: LiveHealthOverviewProps) {
  const [liveMetrics, setLiveMetrics] = useState({
    alpha: clampScore(alphaScore),
    consistency: clampScore(consistency),
    recovery: clampScore(recovery),
    streak: Math.max(0, streakDays),
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [trendPoints, setTrendPoints] = useState<TrendPoint[]>(() => {
    const baseline = [6, 5, 4, 3, 2, 1, 0];
    return baseline.map((day, index) => ({
      label: day === 0 ? "Now" : `${day}d`,
      alpha: clampScore(alphaScore - (6 - index)),
      consistency: clampScore(consistency - (5 - index)),
      recovery: clampScore(recovery - (4 - index)),
    }));
  });

  const refreshMetrics = () => {
    setLiveMetrics((prev) => {
      const next = {
        alpha: nudgeValue(prev.alpha, 2.2),
        consistency: nudgeValue(prev.consistency, 2),
        recovery: nudgeValue(prev.recovery, 1.8),
        streak: prev.streak,
      };

      setTrendPoints((history) => {
        const shifted = history.slice(1).map((point, index) => ({
          ...point,
          label: index === 5 ? "1d" : `${6 - index}d`,
        }));

        return [
          ...shifted,
          {
            label: "Now",
            alpha: next.alpha,
            consistency: next.consistency,
            recovery: next.recovery,
          },
        ];
      });

      return next;
    });

    setLastUpdated(new Date());
  };

  useEffect(() => {
    setLiveMetrics({
      alpha: clampScore(alphaScore),
      consistency: clampScore(consistency),
      recovery: clampScore(recovery),
      streak: Math.max(0, streakDays),
    });
  }, [alphaScore, consistency, recovery, streakDays]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const activityState = useMemo(() => {
    const currentHour = new Date().getHours();
    const progressThreshold = Math.max(1, Math.ceil(missionsTotal * 0.5));

    const completedToday = missionsCompleted >= progressThreshold || scansCount > 0;
    const inProgress = !completedToday && (missionsCompleted > 0 || scansCount > 0 || streakDays > 0);

    let nextAction = "Open your detail plan";
    if (currentHour < 12 && scansCount === 0) {
      nextAction = "Run a morning image scan";
    } else if (missionsCompleted < Math.max(1, missionsTotal)) {
      nextAction = "Complete your next mission";
    } else if (streakDays < 3) {
      nextAction = "Complete evening routine to keep streak";
    }

    return { completedToday, inProgress, nextAction };
  }, [missionsCompleted, missionsTotal, scansCount, streakDays]);

  return (
    <section className="rounded-2xl border border-[#E2DDD4] bg-card-soft-gradient p-6 shadow-card">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#6E9F87]">Clinical Snapshot</p>
          <h2 className="text-2xl font-semibold text-[#1E4D3A]">Live Health Overview</h2>
        </div>
        <div className="text-right text-sm text-[#2F6F57]">
          <p>Last updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          <p className="text-xs text-[#6E9F87]">{locationLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-[#DDD7CC] bg-[#F7F4EE] p-6">
          <p className="text-xs text-[#6E9F87]">Alpha Score</p>
          <p className="metric-number mt-2 text-3xl text-[#1E4D3A]">{liveMetrics.alpha}</p>
        </div>
        <div className="rounded-2xl border border-[#DDD7CC] bg-[#F7F4EE] p-6">
          <p className="text-xs text-[#6E9F87]">Consistency</p>
          <p className="metric-number mt-2 text-3xl text-[#1E4D3A]">{liveMetrics.consistency}%</p>
        </div>
        <div className="rounded-2xl border border-[#DDD7CC] bg-[#F7F4EE] p-6">
          <p className="text-xs text-[#6E9F87]">Recovery</p>
          <p className="metric-number mt-2 text-3xl text-[#1E4D3A]">{liveMetrics.recovery}%</p>
        </div>
        <div className="rounded-2xl border border-[#DDD7CC] bg-[#F7F4EE] p-6">
          <p className="text-xs text-[#6E9F87]">Streak</p>
          <p className="metric-number mt-2 text-3xl text-[#1E4D3A]">{liveMetrics.streak}d</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#DDD7CC] bg-[#F7F4EE] p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#1E4D3A]">Progress Trend</h3>
          <button className="text-xs font-semibold text-[#2F6F57]">View Details</button>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#E8E3DA" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: "#6E9F87", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6E9F87", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#DDD7CC", backgroundColor: "#F7F4EE" }} />
              <Legend wrapperStyle={{ color: "#2F6F57" }} />
              <Line type="monotone" dataKey="alpha" stroke="#2F6F57" strokeWidth={2.5} dot={false} name="Alpha Score" />
              <Line type="monotone" dataKey="consistency" stroke="#6E9F87" strokeWidth={2.5} dot={false} name="Consistency" />
              <Line type="monotone" dataKey="recovery" stroke="#C9A227" strokeWidth={2.5} dot={false} name="Recovery %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[#DDD7CC] bg-[#F7F4EE] p-6">
          <p className="text-xs text-[#6E9F87]">Completed Today</p>
          <p className="mt-2 text-base font-semibold text-[#1E4D3A]">{activityState.completedToday ? "Yes" : "Not yet"}</p>
        </div>
        <div className="rounded-2xl border border-[#DDD7CC] bg-[#F7F4EE] p-6">
          <p className="text-xs text-[#6E9F87]">In Progress</p>
          <p className="mt-2 text-base font-semibold text-[#1E4D3A]">{activityState.inProgress ? "Active" : "Idle"}</p>
        </div>
        <div className="rounded-2xl border border-[#A9CBB7] bg-[#E8EFEA] p-6 shadow-[0_8px_18px_rgba(47,111,87,0.12)]">
          <p className="text-xs text-[#2F6F57]">Next Action</p>
          <p className="mt-2 text-base font-semibold text-[#1E4D3A]">{activityState.nextAction}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#DDD7CC] bg-[#F7F4EE] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#6E9F87]">Environment</p>
            <p className="text-lg font-semibold text-[#1E4D3A]">
              UV {environment.uv ?? "--"} · AQI {environment.aqi ?? "--"}
            </p>
          </div>
          <details className="text-sm text-[#2F6F57]">
            <summary className="cursor-pointer list-none font-semibold">View Details</summary>
            <div className="mt-2 rounded-xl border border-[#DDD7CC] bg-white px-3 py-2 text-xs">
              <p>UV: {environment.uv ?? "--"}</p>
              <p>Humidity: {environment.humidity ?? "--"}%</p>
              <p>AQI: {environment.aqi ?? "--"} {environment.aqi !== null ? `(${getAqiLabel(environment.aqi)})` : ""}</p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
