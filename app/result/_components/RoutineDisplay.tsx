// Routine Display Component

"use client";

import { useState } from "react";
import { DailyRoutine, RoutineProgram, getRoutineTips } from "@/lib/routineGenerator";
import { EnrichedIssue } from "@/lib/aiAnalysisEngine";

interface RoutineDisplayProps {
  routine: DailyRoutine;
  program?: RoutineProgram[];
  issues?: EnrichedIssue[];
}

export default function RoutineDisplay({
  routine,
  program,
  issues = [],
}: RoutineDisplayProps) {
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const displayRoutine = program ? program[selectedWeek].routine : routine;
  const tips = getRoutineTips(issues);

  const allSteps = [
    ...displayRoutine.morning,
    ...displayRoutine.afternoon,
    ...displayRoutine.evening,
  ].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Routine Header */}
      <div className="bg-gradient-to-r from-blue-700 to-slate-800 text-white rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-2">{displayRoutine.name}</h2>
        <p className="text-blue-100 mb-4">
          Personalized for your needs • {displayRoutine.duration} minutes daily
        </p>

        {/* Focus Areas */}
        <div className="flex flex-wrap gap-2">
          {displayRoutine.focusAreas.map((area, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium"
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* Week Selector (if program) */}
      {program && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📅 4-Week Progressive Program
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {program.map((week, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedWeek(idx)}
                className={`p-4 rounded-lg font-semibold transition ${
                  selectedWeek === idx
                    ? "bg-purple-600 text-white border border-purple-600"
                    : "bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200"
                }`}
              >
                <div className="text-lg">Week {week.week}</div>
                <div className="text-xs opacity-75">{week.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full Routine Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border-b border-blue-200">
          <h3 className="text-lg font-bold text-gray-900">
            ⏱️ Daily Routine Timeline ({displayRoutine.duration} min)
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {allSteps.map((step, idx) => (
            <div
              key={idx}
              className="border-l-4 border-blue-500 pl-4 pb-4 last:pb-0"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-bold text-blue-600">
                    {step.time}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mt-1">
                    {step.action}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {step.duration} min
                  </span>
                </div>
              </div>

              {step.product && (
                <p className="text-sm text-blue-600 font-semibold mb-2">
                  💊 Use: {step.product}
                </p>
              )}

              <p className="text-gray-700 text-sm mb-2">{step.notes}</p>

              <div className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {step.frequency}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adjustments (if program) */}
      {program && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <h3 className="text-lg font-bold text-amber-900 mb-3">
            🔄 {program[selectedWeek].name}
          </h3>
          <div className="space-y-2">
            {program[selectedWeek].adjustments.map((adj, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-amber-600 font-bold text-lg">→</span>
                <span className="text-amber-800">{adj}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Morning Routine Details */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <button
          onClick={() =>
            setExpandedSection(
              expandedSection === "morning" ? null : "morning"
            )
          }
          className="w-full p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200 flex items-center justify-between hover:bg-orange-100 transition"
        >
          <h3 className="text-lg font-bold text-gray-900">🌅 Morning Routine</h3>
          <span className={`transform transition ${expandedSection === "morning" ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {expandedSection === "morning" && (
          <div className="p-6 space-y-3">
            {displayRoutine.morning.map((step, idx) => (
              <div key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                <div className="font-semibold text-gray-900">
                  {step.time} - {step.action}
                </div>
                {step.product && (
                  <div className="text-sm text-blue-600 mt-1">
                    Product: {step.product}
                  </div>
                )}
                <div className="text-sm text-gray-600 mt-1">{step.notes}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {step.duration} min • {step.frequency}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evening Routine Details */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <button
          onClick={() =>
            setExpandedSection(
              expandedSection === "evening" ? null : "evening"
            )
          }
          className="w-full p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between hover:bg-blue-100 transition"
        >
          <h3 className="text-lg font-bold text-gray-900">🌙 Evening Routine</h3>
          <span className={`transform transition ${expandedSection === "evening" ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {expandedSection === "evening" && (
          <div className="p-6 space-y-3">
            {displayRoutine.evening.map((step, idx) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="font-semibold text-gray-900">
                  {step.time} - {step.action}
                </div>
                {step.product && (
                  <div className="text-sm text-blue-600 mt-1">
                    Product: {step.product}
                  </div>
                )}
                <div className="text-sm text-gray-600 mt-1">{step.notes}</div>
                <div className="text-xs text-gray-500 mt-2">
                  {step.duration} min • {step.frequency}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expected Results */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <h3 className="text-lg font-bold text-green-900 mb-4">
          ✨ Expected Results
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {displayRoutine.expectedResults.timeframe} days
            </div>
            <p className="text-green-800">Timeline to visible improvements</p>
          </div>
          <div className="space-y-2">
            {displayRoutine.expectedResults.improvements.map((imp, idx) => (
              <div key={idx} className="flex items-center gap-2 text-green-800">
                <span>✓</span>
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pro Tips */}
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
        <h3 className="text-lg font-bold text-yellow-900 mb-4">
          💡 Pro Tips for Success
        </h3>
        <div className="space-y-2">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-3 text-yellow-800">
              <span className="mt-1">•</span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-3">📝 Notes</h3>
        <p className="text-gray-700 leading-relaxed">{displayRoutine.notes}</p>
      </div>

      {/* Download/Export */}
      <div className="flex gap-3">
        <button className="flex-1 bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition">
          📥 Download Routine
        </button>
        <button className="flex-1 bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition">
          🔗 Share Routine
        </button>
      </div>
    </div>
  );
}
