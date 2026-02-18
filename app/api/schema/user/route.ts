import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    userSchema: {
      location: {
        city: "String",
        climateEnabled: "Boolean",
      },
      sleepLogs: ["ObjectId"],
      hydrationLogs: ["ObjectId"],
      moodLogs: ["ObjectId"],
      scanHistory: ["ObjectId"],
      weeklyReports: ["ObjectId"],
      xp: "Number",
      level: "Number",
      permissions: {
        location: "Boolean",
        notifications: "Boolean",
        sleepTracking: "Boolean",
        hydrationTracking: "Boolean",
        moodTracking: "Boolean",
        consent: "Boolean",
      },
    },
    collections: ["sleepLogs", "hydrationLogs", "moodLogs", "weeklyReports", "scanHistory"],
  });
}
