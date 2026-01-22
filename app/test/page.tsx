"use client";

import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";

export default function TestPage() {
  const router = useRouter();

  const sampleAnswers = {
    hair_concern: "Hair fall",
    hair_type: "Straight",
    scalp_type: "Oily",
    hair_damage: "Frequently",
    hair_goal: "Reduce hair fall",
    skin_type: "Oily",
    skin_concern: "Acne",
    breakouts: "Frequently",
    sun_exposure: "High",
    skin_goal: "Clear skin",
  };

  const handleTestResult = () => {
    router.push(
      `/result?answers=${encodeURIComponent(JSON.stringify(sampleAnswers))}`
    );
  };

  return (
    <div className="min-h-screen bg-blue-50 py-10">
      <Container>
        <div className="bg-white rounded-3xl shadow-sm p-8 max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">🧪 Test Result Page</h1>
          <p className="text-slate-600 mb-6">
            Click below to see the full result page with sample answers for Hair Care and Skin Care.
          </p>

          <button
            onClick={handleTestResult}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition mb-4"
          >
            View Sample Results →
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full border border-blue-300 py-3 rounded-xl font-semibold hover:bg-blue-50 transition"
          >
            Back to Home
          </button>
        </div>
      </Container>
    </div>
  );
}
