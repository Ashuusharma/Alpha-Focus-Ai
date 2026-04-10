"use client";

import { useState } from "react";

interface RoutineChecklistItem {
  id: string;
  title: string;
  emoji: string;
  completed: boolean;
}

interface RoutineComplianceTrackerProps {
  routineTitle: string;
}

export default function RoutineComplianceTracker({
  routineTitle,
}: RoutineComplianceTrackerProps) {
  const [items, setItems] = useState<RoutineChecklistItem[]>([
    {
      id: "morning",
      title: "Morning routine completed",
      emoji: "",
      completed: false,
    },
    {
      id: "evening",
      title: "Evening routine completed",
      emoji: "",
      completed: false,
    },
    {
      id: "weekly",
      title: "Weekly deep treatment done",
      emoji: "",
      completed: false,
    },
    {
      id: "hydration",
      title: "Drank 3L+ water",
      emoji: "",
      completed: false,
    },
  ]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const completedCount = items.filter((i) => i.completed).length;
  const completionPercentage = Math.round((completedCount / items.length) * 100);

  return (
    <div className="bg-white border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">
          Check
        </span>
        <h3 className="text-lg font-bold text-slate-900">Today's Routine Check</h3>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700">
            Completion: {completionPercentage}%
          </span>
          <span className="text-sm text-slate-500">
            {completedCount}/{items.length} done
          </span>
        </div>
        <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition ${
              item.completed
                ? "bg-green-50 border-green-300"
                : "bg-gray-50 border-gray-200 hover:border-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                item.completed ? "bg-green-500 text-white" : "border-2 border-gray-300"
              }`}
            >
              {item.completed && "OK"}
            </div>
            <span className="text-lg">{item.emoji}</span>
            <span
              className={`text-sm font-medium ${
                item.completed ? "text-green-700 line-through" : "text-gray-700"
              }`}
            >
              {item.title}
            </span>
          </button>
        ))}
      </div>

      {/* Motivation */}
      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-900">
           <strong>Keep it up!</strong> Completing your routine daily will show
          results in 4 weeks. You're building a life-changing habit.
        </p>
      </div>
    </div>
  );
}

