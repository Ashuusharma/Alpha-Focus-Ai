// Progress Tracking & Comparison Component

"use client";

import { useEffect, useState } from "react";
import {
  getUserHistory,
  ScanRecord,
  calculateProgress,
  getLatestScan,
  getPreviousScan,
} from "@/lib/userProfileManager";

interface ProgressComparisonProps {
  showComparison?: boolean;
}

export default function ProgressComparison({
  showComparison = true,
}: ProgressComparisonProps) {
  const [latest, setLatest] = useState<ScanRecord | null>(null);
  const [previous, setPrevious] = useState<ScanRecord | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);

  useEffect(() => {
    const latest = getLatestScan();
    const previous = getPreviousScan();

    setLatest(latest);
    setPrevious(previous);

    if (latest && previous) {
      const comparison = calculateProgress(previous, latest);
      setProgress(comparison);
    }

    setHistory(getUserHistory());
  }, []);

  if (!latest) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow text-center">
        <p className="text-gray-600">
           Complete another scan to see progress tracking
        </p>
      </div>
    );
  }

  if (!showComparison || !previous || !progress) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-6 shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
           Your Progress
        </h3>
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">
            First scan recorded! Complete another scan in 1-2 weeks to compare.
          </p>
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-medium">
            Scan Date: {new Date(latest.timestamp).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
           Your Progress Summary
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overall Improvement */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-800 font-semibold">
                Overall Improvement
              </span>
              <span className="text-2xl font-bold text-green-600">
                +{progress.overallImprovement}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-green-100 shadow-inner overflow-hidden relative">
              <div
                className="h-full absolute left-0 top-0 bg-gradient-to-r from-green-400 via-accent to-green-600 animate-pulse-slow transition-all duration-700 rounded-full shadow-lg"
                style={{ width: `${Math.min(progress.overallImprovement, 100)}%` }}
              />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-green-800 drop-shadow-sm">
                {progress.overallImprovement}%
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Since {new Date(previous.timestamp).toLocaleDateString()}
            </p>
          </div>

          {/* Days Since Previous */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-800 font-semibold">
                Time Between Scans
              </span>
              <span className="text-2xl font-bold text-blue-600">
                {Math.floor(
                  (latest.timestamp - previous.timestamp) / (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {new Date(previous.timestamp).toLocaleDateString()} -&gt;{" "}
              {new Date(latest.timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Resolved Issues */}
      {progress.resolvedIssues.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 border border-green-300">
          <h4 className="text-lg font-bold text-green-900 mb-3">
            Issues Resolved ({progress.resolvedIssues.length})
          </h4>
          <div className="space-y-2">
            {progress.resolvedIssues.map((issue: string, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 text-green-800 bg-white/50 p-3 rounded-lg"
              >
                <span className="text-2xl">*</span>
                <span className="font-medium">{issue}</span>
                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full ml-auto">
                  Cleared
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improved Issues */}
      {progress.improvedIssues.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-300">
          <h4 className="text-lg font-bold text-blue-900 mb-3">
             Issues Improving ({progress.improvedIssues.length})
          </h4>
          <div className="space-y-2">
            {progress.improvedIssues.map((issue: string, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 text-blue-800 bg-white/50 p-3 rounded-lg"
              >
                <span className="text-2xl">down</span>
                <span className="font-medium">{issue}</span>
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full ml-auto">
                  Getting better
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Issues */}
      {progress.newIssues.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-300">
          <h4 className="text-lg font-bold text-amber-900 mb-3">
             New Detections ({progress.newIssues.length})
          </h4>
          <div className="space-y-2">
            {progress.newIssues.map((issue: string, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-3 text-amber-800 bg-white/50 p-3 rounded-lg"
              >
                <span className="text-2xl">
                  New
                </span>
                <span className="font-medium">{issue}</span>
                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full ml-auto">
                  New
                </span>
              </div>
            ))}
            <p className="text-xs text-amber-700 mt-3">
               These may be new issues or previously undetected. Add to your routine!
            </p>
          </div>
        </div>
      )}

      {/* Overall Trend */}
      {history && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h4 className="text-lg font-bold text-gray-900 mb-4">
             Overall Trend
          </h4>

          {history.averageImprovement > 0 ? (
            <div className="text-center py-6">
              <div className="text-5xl font-bold text-green-600 mb-2">
                down {history.averageImprovement}%
              </div>
              <p className="text-gray-600 text-lg">
                Average improvement across all tracked issues
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Keep it up! Your routine is working.
              </p>
            </div>
          ) : progress.overallImprovement === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-600 text-lg">
                 No change detected yet
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Give your routine 2-4 weeks for visible results.
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600 text-lg">
                Warning: Some issues may have increased
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Check if you're following the routine consistently. Adjust products if needed.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Items */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h4 className="text-lg font-bold text-slate-900 mb-3"> Action Items</h4>
        <ul className="space-y-2">
          <li className="flex items-start gap-3 text-blue-800">
            <span className="mt-1">-&gt;</span>
            <span>
              <strong>Maintain consistency:</strong> Keep following your routine exactly
            </span>
          </li>
          <li className="flex items-start gap-3 text-blue-800">
            <span className="mt-1">-&gt;</span>
            <span>
              <strong>Take photos:</strong> Document progress with dated photos
            </span>
          </li>
          <li className="flex items-start gap-3 text-blue-800">
            <span className="mt-1">-&gt;</span>
            <span>
              <strong>Scan again:</strong> Next scan in 1-2 weeks for detailed comparison
            </span>
          </li>
          <li className="flex items-start gap-3 text-blue-800">
            <span className="mt-1">-&gt;</span>
            <span>
              <strong>Track sleep & water:</strong> These dramatically impact results
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

