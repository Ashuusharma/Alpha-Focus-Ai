"use client";

import { useRouter } from "next/navigation";

export default function ImageAnalyzerCTA() {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-blue-700 to-slate-800 text-white rounded-2xl p-8 overflow-hidden relative">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16" />

      <div className="relative z-10">
        <h3 className="text-2xl font-bold mb-2"> Get Even Better Results</h3>
        <p className="text-blue-100 mb-4">
          Combine your questionnaire with photo analysis for AI-powered insights. Our image analyzer
          detects skin condition, hair quality, and beard potential with 95% accuracy.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/image-analyzer")}
            className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Try Photo Analysis
          </button>
          <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

