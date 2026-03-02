import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ApproxLocation = {
  latitude: number;
  longitude: number;
  city: string;
  countryCode: string;
};

type ContextPayload = {
  fetchedAt: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    locality: string;
    displayLabel: string;
    countryCode: string;
    isApproximate: boolean;
    source: "geolocation" | "ip";
  };
  climate: {
    uv: number | null;
    temperatureC: number | null;
    humidity: number | null;
    windKph: number | null;
    pm25: number | null;
    pm10: number | null;
    aqi: number | null;
    pollutionLevel: "low" | "moderate" | "high";
  };
  correlations: {
    drynessSeverityWeight: number;
    scalpRiskWeight: number;
    acneRiskWeight: number;
    summary: string[];
  };
  providers: {
    openMeteo: "ok" | "failed";
    openAq: "ok" | "fallback" | "failed";
    ipwhois: "ok" | "skipped" | "failed";
  };
};

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric;
}

function getPollutionLevel(aqi: number | null): "low" | "moderate" | "high" {
  if (aqi === null) return "moderate";
  if (aqi <= 40) return "low";
  if (aqi <= 90) return "moderate";
  return "high";
}

function buildCorrelationSummary(params: {
  uv: number | null;
  humidity: number | null;
  aqi: number | null;
}) {
  const { uv, humidity, aqi } = params;
  const drynessSeverityWeight =
    (uv !== null && uv >= 7 ? 1.2 : 1) *
    (humidity !== null && humidity < 40 ? 1.18 : 1);

  const scalpRiskWeight =
    (uv !== null && uv >= 6 ? 1.12 : 1) *
    (aqi !== null && aqi >= 80 ? 1.12 : 1);

  const acneRiskWeight =
    (aqi !== null && aqi >= 70 ? 1.18 : 1) *
    (humidity !== null && humidity >= 70 ? 1.08 : 1);

  const summary: string[] = [];
  if (uv !== null && uv >= 7 && humidity !== null && humidity < 40) {
    summary.push("High UV plus low humidity can amplify dryness and scalp irritation.");
  }
  if (aqi !== null && aqi >= 70) {
    summary.push("Elevated pollution may correlate with acne flare-ups and barrier stress.");
  }
  if (summary.length === 0) {
    summary.push("Current environment is relatively stable; focus on routine consistency.");
  }

  return {
    drynessSeverityWeight: Number(drynessSeverityWeight.toFixed(2)),
    scalpRiskWeight: Number(scalpRiskWeight.toFixed(2)),
    acneRiskWeight: Number(acneRiskWeight.toFixed(2)),
    summary,
  };
}

async function fetchApproxLocationFromIp(): Promise<ApproxLocation | null> {
  try {
    const response = await fetch("https://ipwho.is/", { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data || data.success === false) return null;

    const latitude = toFiniteNumber(data.latitude);
    const longitude = toFiniteNumber(data.longitude);
    if (latitude === null || longitude === null) return null;

    return {
      latitude,
      longitude,
      city: String(data.city || "Local Area"),
      countryCode: String(data.country_code || "--"),
    };
  } catch {
    return null;
  }
}

async function reverseGeocodeWithOpenMeteo(
  latitude: number,
  longitude: number
): Promise<{ city: string; locality: string; displayLabel: string; countryCode: string }> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return { city: "Local Area", locality: "", displayLabel: "Local Area", countryCode: "--" };

    const data = await response.json();
    const first = data?.results?.[0];
    if (!first) return { city: "Local Area", locality: "", displayLabel: "Local Area", countryCode: "--" };

    const city = first.city || first.name || first.admin1 || "Local Area";
    const locality = first.name && first.name !== city ? String(first.name) : "";
    const countryCode = first.country_code || first.country || "--";
    const displayLabel = locality ? `${city}, ${locality}` : city;

    return { city, locality, displayLabel, countryCode };
  } catch {
    return { city: "Local Area", locality: "", displayLabel: "Local Area", countryCode: "--" };
  }
}

async function reverseGeocodeWithNominatim(
  latitude: number,
  longitude: number
): Promise<{ city: string; locality: string; displayLabel: string; countryCode: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`;
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "User-Agent": "oneman-ai/1.0 (location-intelligence)",
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const address = data?.address || {};

    const city =
      address.city ||
      address.town ||
      address.state_district ||
      address.county ||
      address.state ||
      "";

    const locality =
      address.suburb ||
      address.neighbourhood ||
      address.city_district ||
      address.village ||
      address.hamlet ||
      "";

    const countryCode = String(address.country_code || "--").toUpperCase();
    if (!city) return null;

    const displayLabel = locality ? `${city}, ${locality}` : city;
    return {
      city: String(city),
      locality: String(locality || ""),
      displayLabel,
      countryCode,
    };
  } catch {
    return null;
  }
}

async function fetchOpenMeteoContext(latitude: number, longitude: number) {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,uv_index,wind_speed_10m`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=pm2_5,pm10,us_aqi`;

  const [weatherRes, airRes] = await Promise.all([
    fetch(weatherUrl, { cache: "no-store" }),
    fetch(airUrl, { cache: "no-store" }),
  ]);

  if (!weatherRes.ok || !airRes.ok) {
    throw new Error("Open-Meteo request failed");
  }

  const weather = await weatherRes.json();
  const air = await airRes.json();

  const uv = toFiniteNumber(weather?.current?.uv_index ?? weather?.hourly?.uv_index?.[0]);
  const humidity = toFiniteNumber(weather?.current?.relative_humidity_2m ?? weather?.hourly?.relative_humidity_2m?.[0]);
  const temperatureC = toFiniteNumber(weather?.current?.temperature_2m ?? weather?.hourly?.temperature_2m?.[0]);
  const windKph = toFiniteNumber(weather?.current?.wind_speed_10m ?? weather?.hourly?.wind_speed_10m?.[0]);
  const pm25 = toFiniteNumber(air?.hourly?.pm2_5?.[0]);
  const pm10 = toFiniteNumber(air?.hourly?.pm10?.[0]);
  const aqi = toFiniteNumber(air?.hourly?.us_aqi?.[0]);

  return {
    uv,
    humidity,
    temperatureC,
    windKph,
    pm25,
    pm10,
    aqi,
  };
}

async function fetchOpenAqAqi(latitude: number, longitude: number): Promise<number | null> {
  try {
    const url = `https://api.openaq.org/v3/locations?coordinates=${latitude},${longitude}&radius=10000&limit=1`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;

    const data = await response.json();
    const first = data?.results?.[0];
    const sensors = Array.isArray(first?.sensors) ? first.sensors : [];
    const pm25Sensor = sensors.find((sensor: { parameter?: { name?: string } }) => sensor?.parameter?.name === "pm25");
    const latest = pm25Sensor?.latest;
    const maybeValue = toFiniteNumber(latest?.value);
    if (maybeValue === null) return null;

    return Math.max(0, Math.min(500, Math.round(maybeValue * 2.5)));
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const latitudeParam = toFiniteNumber(request.nextUrl.searchParams.get("lat"));
  const longitudeParam = toFiniteNumber(request.nextUrl.searchParams.get("lon"));

  let latitude = latitudeParam;
  let longitude = longitudeParam;
  let city = "Local Area";
  let locality = "";
  let displayLabel = "Local Area";
  let countryCode = "--";
  let isApproximate = false;
  let source: "geolocation" | "ip" = "geolocation";

  const providers: ContextPayload["providers"] = {
    openMeteo: "failed",
    openAq: "fallback",
    ipwhois: "skipped",
  };

  if (latitude === null || longitude === null) {
    const approx = await fetchApproxLocationFromIp();
    if (!approx) {
      providers.ipwhois = "failed";
      latitude = 19.076;
      longitude = 72.8777;
      city = "Local Area";
      locality = "";
      displayLabel = "Local Area";
      countryCode = "--";
      isApproximate = true;
      source = "ip";
    } else {
      providers.ipwhois = "ok";
      latitude = approx.latitude;
      longitude = approx.longitude;
      city = approx.city;
      locality = "";
      displayLabel = approx.city;
      countryCode = approx.countryCode;
      isApproximate = true;
      source = "ip";
    }
  }

  const nominatimPlace = await reverseGeocodeWithNominatim(latitude, longitude);
  if (nominatimPlace) {
    city = nominatimPlace.city;
    locality = nominatimPlace.locality;
    displayLabel = nominatimPlace.displayLabel;
    countryCode = nominatimPlace.countryCode || countryCode;
  } else {
    const openMeteoPlace = await reverseGeocodeWithOpenMeteo(latitude, longitude);
    if (openMeteoPlace.city !== "Local Area") {
      city = openMeteoPlace.city;
      locality = openMeteoPlace.locality;
      displayLabel = openMeteoPlace.displayLabel;
      countryCode = openMeteoPlace.countryCode || countryCode;
    }
  }

  try {
    const meteo = await fetchOpenMeteoContext(latitude, longitude);
    providers.openMeteo = "ok";

    const openAqAqi = await fetchOpenAqAqi(latitude, longitude);
    if (openAqAqi !== null) {
      providers.openAq = "ok";
    }

    const aqi = openAqAqi ?? meteo.aqi ?? null;
    const correlations = buildCorrelationSummary({ uv: meteo.uv, humidity: meteo.humidity, aqi });

    const payload: ContextPayload = {
      fetchedAt: new Date().toISOString(),
      location: {
        latitude,
        longitude,
        city,
        locality,
        displayLabel,
        countryCode,
        isApproximate,
        source,
      },
      climate: {
        uv: meteo.uv,
        temperatureC: meteo.temperatureC,
        humidity: meteo.humidity,
        windKph: meteo.windKph,
        pm25: meteo.pm25,
        pm10: meteo.pm10,
        aqi,
        pollutionLevel: getPollutionLevel(aqi),
      },
      correlations,
      providers,
    };

    return NextResponse.json({ ok: true, payload });
  } catch {
    return NextResponse.json({ ok: false, error: "context_fetch_failed", providers }, { status: 503 });
  }
}
