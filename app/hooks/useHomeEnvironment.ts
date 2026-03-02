"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getApproximateContextIntelligence,
  getPreciseContextIntelligence,
} from "@/app/services/contextIntelligence";
import { getPollutionRisk } from "@/app/services/homeMetrics";

export type EnvSummary = {
  uv: number;
  humidity: number;
  pm25: number;
  tempC: number;
  label: string;
  fetchedAt: string;
  pollutionRisk: string;
};

export function useHomeEnvironment() {
  const [envSummary, setEnvSummary] = useState<EnvSummary | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const savedLocationPref = localStorage.getItem("oneman_location_enabled") === "true";
    setLocationEnabled(savedLocationPref);

    void (async () => {
      const payload = await getApproximateContextIntelligence();
      if (!payload) return;

      const summary: EnvSummary = {
        uv: payload.climate.uv ?? 0,
        humidity: payload.climate.humidity ?? 0,
        pm25: payload.climate.pm25 ?? 0,
        tempC: payload.climate.temperatureC ?? 0,
        label: payload.location.city,
        fetchedAt: payload.fetchedAt,
        pollutionRisk: getPollutionRisk(payload.climate.pm25 ?? 0),
      };

      setEnvSummary(summary);
    })();
  }, []);

  const fetchLocationData = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!("geolocation" in navigator)) {
      setLocationLoading(false);
      setLocationError("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;
          const payload = await getPreciseContextIntelligence(latitude, longitude);

          if (!payload) {
            setLocationError("Could not fetch local environment data.");
            return;
          }

          const pm25 = payload.climate.pm25 ?? 0;
          const summary: EnvSummary = {
            uv: payload.climate.uv ?? 0,
            humidity: payload.climate.humidity ?? 0,
            pm25,
            tempC: payload.climate.temperatureC ?? 0,
            label: payload.location.city,
            fetchedAt: payload.fetchedAt,
            pollutionRisk: getPollutionRisk(pm25),
          };

          setEnvSummary(summary);
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Location permission denied. Enable it in browser settings.");
        } else {
          setLocationError("Unable to read your location right now.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const toggleLocation = useCallback(async (enabled: boolean) => {
    setLocationEnabled(enabled);
    localStorage.setItem("oneman_location_enabled", String(enabled));

    if (!enabled) {
      setEnvSummary(null);
      setLocationError(null);
      return;
    }

    await fetchLocationData();
  }, [fetchLocationData]);

  return {
    envSummary,
    locationEnabled,
    locationLoading,
    locationError,
    fetchLocationData,
    toggleLocation,
  };
}
