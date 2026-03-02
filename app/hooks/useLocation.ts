"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getApproximateContextIntelligence,
  getPreciseContextIntelligence,
} from "@/app/services/contextIntelligence";

type LocationStatus = "idle" | "loading" | "granted" | "denied" | "error";

type ClimateData = {
  uv: number | null;
  humidity: number | null;
  aqi: number | null;
};

type LocationState = {
  status: LocationStatus;
  city: string;
  locality: string;
  displayLabel: string;
  latitude: number | null;
  longitude: number | null;
  climate: ClimateData;
  lastUpdated: string | null;
  error: string | null;
};

const STORAGE_KEY = "oneman_location_state_v1";

const initialState: LocationState = {
  status: "idle",
  city: "Location not enabled",
  locality: "",
  displayLabel: "Location not enabled",
  latitude: null,
  longitude: null,
  climate: {
    uv: null,
    humidity: null,
    aqi: null,
  },
  lastUpdated: null,
  error: null,
};

function readStoredState() {
  if (typeof window === "undefined") return initialState;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as LocationState;
    return { ...initialState, ...parsed };
  } catch {
    return initialState;
  }
}

function persistState(next: LocationState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

async function fetchClimateFromOpenWeather(latitude: number, longitude: number): Promise<ClimateData> {
  const payload = await getPreciseContextIntelligence(latitude, longitude);
  if (!payload) return { uv: null, humidity: null, aqi: null };
  return {
    uv: payload.climate.uv,
    humidity: payload.climate.humidity,
    aqi: payload.climate.aqi,
  };
}

export function useLocation() {
  const [state, setState] = useState<LocationState>(initialState);

  useEffect(() => {
    setState(readStoredState());

    void (async () => {
      const payload = await getApproximateContextIntelligence();
      if (!payload) return;

      setState((prev) => ({
        ...prev,
        city: payload.location.city || prev.city,
        locality: payload.location.locality || prev.locality || "",
        displayLabel:
          payload.location.displayLabel && payload.location.displayLabel !== "Local Area"
            ? payload.location.displayLabel
            : payload.location.city && payload.location.city !== "Local Area"
              ? payload.location.city
              : prev.displayLabel,
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
        climate: {
          uv: payload.climate.uv,
          humidity: payload.climate.humidity,
          aqi: payload.climate.aqi,
        },
        lastUpdated: payload.fetchedAt,
      }));
    })();
  }, []);

  const refreshLocation = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState((prev) => ({ ...prev, status: "error", error: "Geolocation is unavailable on this device." }));
      return;
    }

    setState((prev) => ({ ...prev, status: "loading", error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const precisePayload = await getPreciseContextIntelligence(latitude, longitude);
          const fallbackClimate = await fetchClimateFromOpenWeather(latitude, longitude);

          const climate: ClimateData = {
            uv: precisePayload?.climate.uv ?? fallbackClimate.uv,
            humidity: precisePayload?.climate.humidity ?? fallbackClimate.humidity,
            aqi: precisePayload?.climate.aqi ?? fallbackClimate.aqi,
          };

          const nextState: LocationState = {
            status: "granted",
            city: precisePayload?.location.city || "Local Area",
            locality: precisePayload?.location.locality || "",
            displayLabel:
              precisePayload?.location.displayLabel ||
              precisePayload?.location.city ||
              "Local Area",
            latitude,
            longitude,
            climate,
            lastUpdated: new Date().toISOString(),
            error: null,
          };

          setState(nextState);
          persistState(nextState);
        } catch {
          const nextState: LocationState = {
            ...initialState,
            status: "error",
            city: "Location unavailable",
            error: "Could not resolve your location details.",
          };
          setState(nextState);
          persistState(nextState);
        }
      },
      (error) => {
        const nextState: LocationState = {
          ...initialState,
          status: error.code === error.PERMISSION_DENIED ? "denied" : "error",
          city: "Location not enabled",
          error: error.code === error.PERMISSION_DENIED ? "Location permission denied." : "Location request failed.",
        };

        setState(nextState);
        persistState(nextState);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  const disableLocation = useCallback(() => {
    const nextState: LocationState = {
      ...initialState,
      status: "idle",
      city: "Location not enabled",
      error: null,
    };
    setState(nextState);
    persistState(nextState);
  }, []);

  useEffect(() => {
    if (state.status !== "granted") return;

    const interval = setInterval(() => {
      refreshLocation();
    }, 300000);

    return () => clearInterval(interval);
  }, [refreshLocation, state.status]);

  const uvLevel = useMemo(() => {
    if (state.climate.uv === null) return "--";
    return state.climate.uv.toFixed(1);
  }, [state.climate.uv]);

  return {
    ...state,
    uvLevel,
    refreshLocation,
    disableLocation,
  };
}
