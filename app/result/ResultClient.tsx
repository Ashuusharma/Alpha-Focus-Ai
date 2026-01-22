"use client";

import { loadRecoveryState } from "@/lib/recoveryPersistence";

export default function ResultClient() {
  const state =
    typeof window !== "undefined"
      ? loadRecoveryState()
      : null;

  if (!state || !Object.keys(state.answers || {}).length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow">
          <h2 className="text-xl font-semibold">
            No recovery plan found
          </h2>
          <p className="text-gray-500 mt-2">
            Please complete the assistant first.
          </p>
          <a
            href="/"
            className="mt-4 inline-block bg-black text-white px-6 py-3 rounded-lg"
          >
            Start Assistant
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <pre className="bg-white p-6 rounded-xl">
        {JSON.stringify(state.answers, null, 2)}
      </pre>
    </div>
  );
}
