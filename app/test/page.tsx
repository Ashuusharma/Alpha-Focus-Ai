"use client";

import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";
import { FlaskConical, ArrowRight, Home } from "lucide-react";

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
    <div className="min-h-screen bg-[#0B0F19] py-20 flex items-center relative overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
      
      <Container>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 max-w-lg mx-auto text-center relative shadow-2xl overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-50" />
          
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <FlaskConical className="w-10 h-10 text-blue-400" />
          </div>

          <h1 className="text-3xl font-bold mb-4 text-white">Test Result Page</h1>
          <p className="text-white/60 mb-8 leading-relaxed">
            Click below to verify the results UI with pre-defined sample answers for Hair & Skin Care analysis.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleTestResult}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition flex items-center justify-center gap-2 group"
            >
              <span>View Sample Results</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full bg-white/5 text-white py-4 rounded-xl font-bold hover:bg-white/10 transition border border-white/10 flex items-center justify-center gap-2 group"
            >
              <Home className="w-5 h-5 opacity-60 group-hover:opacity-100 transition" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
