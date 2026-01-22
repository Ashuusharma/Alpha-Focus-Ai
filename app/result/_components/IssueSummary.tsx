"use client";

import { Recommendation } from "@/lib/recommendationRules";

interface IssueSummaryProps {
  recommendations: Recommendation[];
}

export default function IssueSummary({
  recommendations,
}: IssueSummaryProps) {
  if (!recommendations.length) return null;

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <div
          key={rec.id}
          className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-transparent p-6 rounded-lg"
        >
          {/* Category Badge */}
          <div className="inline-block mb-3 px-3 py-1 bg-blue-100 text-blue-900 text-xs font-semibold rounded-full">
            {rec.category === "hairCare" && "Hair Care"}
            {rec.category === "skinCare" && "Skin Care"}
            {rec.category === "beardCare" && "Beard Care"}
            {rec.category === "bodyCare" && "Body Care"}
            {rec.category === "healthCare" && "Health Care"}
            {rec.category === "fitness" && "Fitness"}
            {rec.category === "fragrance" && "Fragrance"}
          </div>

          {/* Issue Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {rec.title}
          </h3>

          {/* Root Cause */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">
              🔍 Root Cause:
            </p>
            <p className="text-gray-600 leading-relaxed">{rec.cause}</p>
          </div>

          {/* Solution */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">
              ✅ Solution:
            </p>
            <p className="text-gray-600 leading-relaxed">{rec.solution}</p>
          </div>

          {/* Steps */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              📋 Your Routine Steps:
            </p>
            <ol className="space-y-2">
              {rec.steps.map((step, idx) => (
                <li
                  key={idx}
                  className="flex gap-3 text-sm text-gray-700"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ))}
    </div>
  );
}
