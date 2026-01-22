"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";
import { useAssessments } from "@/lib/useUserData";

export default function CompareResultsPage() {
  const router = useRouter();
  const { assessments } = useAssessments();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const sorted = [...assessments].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const current = sorted[0];
  const previous = sorted[1];

  const hasComparison = current && previous;

  const comparisons = hasComparison
    ? [
        {
          metric: "Overall Progress",
          jan: current.progress,
          dec: previous.progress,
          change: current.progress - previous.progress,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 font-medium mb-4"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center space-x-3 mb-2">
              <span>📈</span>
              <span>Compare Results</span>
            </h1>
            <p className="text-slate-600">Track your progress over time</p>
          </div>

          {!hasComparison ? (
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl border border-blue-200 p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg font-semibold text-slate-900 mb-2">Not enough data to compare</p>
              <p className="text-slate-700">Complete at least 2 assessments to see progress comparison</p>
            </div>
          ) : (
            <>
              {/* TIME PERIOD SELECTOR */}
              <div className="bg-white rounded-2xl p-6 border border-blue-200 mb-8 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-4">Comparing</h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-700 font-medium">Latest Assessment</p>
                    <p className="text-2xl font-bold text-blue-700">{new Date(current.completedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-2xl">vs</div>
                  <div className="flex-1 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 text-center">
                    <p className="text-sm text-slate-700 font-medium">Previous Assessment</p>
                    <p className="text-2xl font-bold text-slate-700">{new Date(previous.completedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* COMPARISON CHARTS */}
              <div className="space-y-6">
                {comparisons.map((item, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">{item.metric}</h3>
                      <span className={`font-bold text-lg ${item.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {item.change >= 0 ? "+" : ""}{item.change}%
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">Latest</span>
                          <span className="font-bold text-indigo-600">{item.jan}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-700"
                            style={{ width: `${item.jan}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-slate-600">Previous</span>
                          <span className="font-bold text-purple-600">{item.dec}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-slate-600 to-slate-700"
                            style={{ width: `${item.dec}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center space-x-2 text-sm font-medium rounded-lg p-3 ${
                      item.change >= 0 ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"
                    }`}>
                      <span>{item.change >= 0 ? "✓" : "⚠️"}</span>
                      <span>{item.change >= 0 ? "You're on an upward trend!" : "Room for improvement"}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* SUMMARY */}
              <div className="mt-8 bg-gradient-to-r from-blue-700 to-slate-800 rounded-2xl p-8 text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
                  <span>🎉</span>
                  <span>Overall Progress</span>
                </h2>
                <p className="text-blue-100 mb-6">
                  {comparisons[0]?.change >= 0
                    ? "Great work! You're making consistent progress. Keep following your routine!"
                    : "You're on your recovery journey. Stay consistent and results will follow!"}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white/20 rounded-lg p-4 text-center">
                    <p className="text-blue-100 text-sm">Assessments</p>
                    <p className="text-3xl font-bold">{assessments.length}</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 text-center">
                    <p className="text-blue-100 text-sm">Latest Progress</p>
                    <p className="text-3xl font-bold">{current.progress}%</p>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 text-center">
                    <p className="text-blue-100 text-sm">Change</p>
                    <p className="text-3xl font-bold">{comparisons[0]?.change >= 0 ? "+" : ""}{comparisons[0]?.change}%</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
