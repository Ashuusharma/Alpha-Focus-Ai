"use client";

import { getUserProfile } from "@/lib/userProfile";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const profile = getUserProfile();

  if (!profile || profile.plans.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        No saved plans yet
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 py-12 px-4 flex justify-center">
      <div className="w-full max-w-3xl bg-white rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-semibold mb-6">
          Your Saved AI Plans
        </h1>

        <div className="space-y-6">
          {profile.plans.map((plan: any) => (
            <div
              key={plan.id}
              className="border rounded-xl p-6 hover:shadow transition"
            >
              <p className="text-sm text-gray-500 mb-2">
                Saved on {new Date(plan.createdAt).toDateString()}
              </p>

              <ul className="list-disc list-inside text-gray-700 mb-4">
                {plan.recommendations.map((r: any) => (
                  <li key={r.id}>{r.title}</li>
                ))}
              </ul>

              <button
                onClick={() =>
                  router.push(
                    `/result?answers=${encodeURIComponent(
                      JSON.stringify(plan.answers)
                    )}`
                  )
                }
                className="text-sm font-medium text-black underline"
              >
                View Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
