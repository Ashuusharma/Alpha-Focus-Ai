export async function getLocationLabel(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return "Local Area";
    const json = await res.json();
    const place = json?.results?.[0];
    if (!place) return "Local Area";
    const parts = [place.name, place.admin1, place.country].filter(Boolean);
    return parts.join(", ");
  } catch {
    return "Local Area";
  }
}
