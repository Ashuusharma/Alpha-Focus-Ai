export type WeatherSnapshot = {
  humidity: number;
  uvIndex: number;
  temperatureC: number;
  aqi: number;
  fetchedAt: string;
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_PREFIX = "oneman_weather_6h";

function buildCacheKey(lat: number, lon: number) {
  return `${CACHE_PREFIX}_${lat.toFixed(2)}_${lon.toFixed(2)}`;
}

function readCache(cacheKey: string): WeatherSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherSnapshot;
    const age = Date.now() - new Date(parsed.fetchedAt).getTime();
    return age < CACHE_TTL_MS ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(cacheKey: string, payload: WeatherSnapshot) {
  if (typeof window === "undefined") return;
  localStorage.setItem(cacheKey, JSON.stringify(payload));
}

export async function getWeatherSnapshot(lat: number, lon: number): Promise<WeatherSnapshot> {
  const cacheKey = buildCacheKey(lat, lon);
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const response = await fetch(`/api/context/intelligence?lat=${lat}&lon=${lon}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Weather service unavailable");
  }

  const data = await response.json();
  const contextPayload = data?.payload;
  if (!contextPayload) {
    throw new Error("Weather payload missing");
  }

  const humidity = Number(contextPayload.climate?.humidity ?? 0);
  const uvIndex = Number(contextPayload.climate?.uv ?? 0);
  const temperatureC = Number(contextPayload.climate?.temperatureC ?? 0);
  const aqi = Number(contextPayload.climate?.aqi ?? 0);

  const payload: WeatherSnapshot = {
    humidity,
    uvIndex,
    temperatureC,
    aqi,
    fetchedAt: new Date().toISOString(),
  };

  writeCache(cacheKey, payload);
  return payload;
}
