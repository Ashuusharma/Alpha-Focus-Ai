export type ContextIntelligencePayload = {
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
};

async function fetchContext(url: string): Promise<ContextIntelligencePayload | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return data?.payload ?? null;
  } catch {
    return null;
  }
}

export async function getApproximateContextIntelligence() {
  return fetchContext("/api/context/intelligence");
}

export async function getPreciseContextIntelligence(latitude: number, longitude: number) {
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude) });
  return fetchContext(`/api/context/intelligence?${params.toString()}`);
}
