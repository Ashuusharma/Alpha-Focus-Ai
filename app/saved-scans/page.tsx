"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";
import { useScans } from "@/lib/useUserData";

export default function SavedScansPage() {
  const router = useRouter();
  const { scans } = useScans();
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <Container>
        <div className="max-w-4xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium mb-4"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center space-x-3 mb-2">
              <span>💾</span>
              <span>Saved Scans</span>
            </h1>
            <p className="text-slate-600">View all your previous skin and hair analyses ({scans.length} total)</p>
          </div>

          {/* SCANS LIST */}
          {scans.length > 0 ? (
            <div className="space-y-4 mb-8">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => setSelectedScan(scan.id)}
                  className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition transform hover:shadow-lg ${
                    selectedScan === scan.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl">{scan.type === "skin" ? "🔍" : scan.type === "hair" ? "💇" : "👤"}</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{scan.type.charAt(0).toUpperCase() + scan.type.slice(1)} Analysis</h3>
                        <p className="text-sm text-gray-600">{new Date(scan.date).toLocaleDateString()} at {new Date(scan.date).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        ✓ Analyzed
                      </span>
                      <p className="text-sm text-gray-600 mt-2">{scan.confidence}% confidence</p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{scan.condition}</p>

                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${scan.confidence}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl border border-blue-200 p-12 text-center">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-lg font-semibold text-slate-900 mb-2">No saved scans yet</p>
              <p className="text-slate-700">Upload and analyze your first photo to get started!</p>
            </div>
          )}

          {/* SELECTED SCAN DETAILS */}
          {selectedScan && (
            <div className="bg-white rounded-2xl p-8 border border-blue-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Detailed Analysis</h2>

              {scans
                .filter((s) => s.id === selectedScan)
                .map((scan) => (
                  <div key={scan.id} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-6 border border-blue-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <span>🎯</span>
                          <span>Recommendations</span>
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                          {scan.recommendations.map((rec, idx) => (
                            <li key={idx}>✓ {rec}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                          <span>💡</span>
                          <span>Key Findings</span>
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                          {scan.findings.map((finding, idx) => (
                            <li key={idx}>• {finding}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedScan(null)}
                      className="w-full px-6 py-3 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition"
                    >
                      Close Details
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
