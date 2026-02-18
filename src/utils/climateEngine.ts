export type ClimateInput = {
  humidity: number;
  uvIndex: number;
  aqi: number;
  temperatureC: number;
};

export type ClimateRecommendation = {
  routineAdjustments: string[];
  reminders: string[];
  severity: "low" | "moderate" | "high";
};

export function buildClimateRecommendation(input: ClimateInput): ClimateRecommendation {
  const routineAdjustments: string[] = [];
  const reminders: string[] = [];

  if (input.humidity > 75) {
    routineAdjustments.push("Use a lightweight, non-comedogenic moisturizer.");
  }

  if (input.aqi > 150) {
    reminders.push("Add antioxidant serum to reduce pollution oxidative stress.");
  }

  if (input.uvIndex > 7) {
    reminders.push("Sunscreen required. Reapply SPF every 2 hours outdoors.");
  }

  const highRiskSignals = Number(input.uvIndex > 7) + Number(input.aqi > 150);
  const severity: "low" | "moderate" | "high" = highRiskSignals >= 2 ? "high" : highRiskSignals === 1 ? "moderate" : "low";

  return { routineAdjustments, reminders, severity };
}
