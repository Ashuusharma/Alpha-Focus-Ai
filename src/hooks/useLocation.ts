"use client";

import { useCallback, useEffect, useState } from "react";

type LocationState = {
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  status: "idle" | "loading" | "granted" | "denied" | "error";
  error: string | null;
};

const initialState: LocationState = {
  latitude: null,
  longitude: null,
  city: null,
  status: "idle",
  error: null,
};

async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  try {
    const url = `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: { city?: string; town?: string; village?: string } };
    return data.address?.city || data.address?.town || data.address?.village || null;
  } catch {
    return null;
  }
}

async function getApproxCityFromIp(): Promise<{ latitude: number; longitude: number; city: string } | null> {
  try {
    const res = await fetch("https://ipwho.is/", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.success === false) return null;
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return {
      latitude,
      longitude,
      city: String(data.city || "Local Area"),
    };
  } catch {
    return null;
  }
}

export function useLocation(autoRequest = false) {
  const [location, setLocation] = useState<LocationState>(initialState);

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocation((prev) => ({ ...prev, status: "error", error: "Geolocation is not supported on this device." }));
      return;
    }

    setLocation((prev) => ({ ...prev, status: "loading", error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const city = await reverseGeocode(latitude, longitude);
        setLocation({ latitude, longitude, city, status: "granted", error: null });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocation((prev) => ({ ...prev, status: "denied", error: "Location permission denied." }));
          return;
        }
        setLocation((prev) => ({ ...prev, status: "error", error: "Failed to fetch location." }));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    void (async () => {
      const approx = await getApproxCityFromIp();
      if (!approx) return;
      setLocation((prev) => ({
        ...prev,
        latitude: prev.latitude ?? approx.latitude,
        longitude: prev.longitude ?? approx.longitude,
        city: prev.city ?? approx.city,
      }));
    })();

    if (!autoRequest) return;
    requestLocation();
  }, [autoRequest, requestLocation]);

  return { ...location, requestLocation };
}
