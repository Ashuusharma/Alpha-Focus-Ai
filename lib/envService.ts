// Lightweight environment fetcher for weather/UV/PM with caching for web/mobile

export interface EnvData {
  uvIndex?: number;
  humidity?: number;
  pm25?: number;
  tempC?: number;
  fetchedAt: string;
}

const CACHE_KEY = "oneman_env_cache";
const TTL_MINUTES = 60; // cache per hour

export async function getEnvironment(city: string, lat?: number, lon?: number): Promise<EnvData | null> {
  const cached = readCache(city);
  if (cached) return cached;

  // Open-Meteo free endpoint (no key). Adjust lat/lon if provided; fallback to city via geocoding API call if needed.
  const url = lat !== undefined && lon !== undefined
    ? `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,uv_index,pm10&current_weather=true`
    : null;

  try {
    if (!url) return null;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Env fetch failed: ${res.status}`);
    const json = await res.json();

    const currentIdx = 0;
    const data: EnvData = {
      uvIndex: json.hourly?.uv_index?.[currentIdx],
      humidity: json.hourly?.relative_humidity_2m?.[currentIdx],
      pm25: json.hourly?.pm10?.[currentIdx],
      tempC: json.current_weather?.temperature,
      fetchedAt: new Date().toISOString(),
    };

    writeCache(city, data);
    return data;
  } catch (err) {
    console.error("Environment fetch error", err);
    return null;
  }
}

function readCache(city: string): EnvData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: Record<string, EnvData> = JSON.parse(raw);
    const entry = parsed[city.toLowerCase()];
    if (!entry) return null;
    const ageMin = (Date.now() - new Date(entry.fetchedAt).getTime()) / 60000;
    return ageMin < TTL_MINUTES ? entry : null;
  } catch {
    return null;
  }
}

function writeCache(city: string, data: EnvData) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const parsed: Record<string, EnvData> = raw ? JSON.parse(raw) : {};
    parsed[city.toLowerCase()] = data;
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
  } catch (err) {
    console.error("Env cache write error", err);
  }
}
