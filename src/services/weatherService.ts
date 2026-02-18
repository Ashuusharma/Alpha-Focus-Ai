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

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=relative_humidity_2m,uv_index,temperature_2m&current_weather=true`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi`;

  const [weatherRes, airRes] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);

  if (!weatherRes.ok || !airRes.ok) {
    throw new Error("Weather service unavailable");
  }

  const weatherJson = await weatherRes.json();
  const airJson = await airRes.json();

  const humidity = Number(weatherJson.hourly?.relative_humidity_2m?.[0] ?? 0);
  const uvIndex = Number(weatherJson.hourly?.uv_index?.[0] ?? 0);
  const temperatureC = Number(weatherJson.current_weather?.temperature ?? weatherJson.hourly?.temperature_2m?.[0] ?? 0);
  const aqi = Number(airJson.hourly?.us_aqi?.[0] ?? 0);

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
