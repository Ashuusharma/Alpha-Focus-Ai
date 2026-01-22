"use client";

import { AnalyzerType } from "@/lib/analyzeImage";

interface AnalyzerSelectorProps {
  selected: AnalyzerType | null;
  onSelect: (type: AnalyzerType) => void;
  disabled?: boolean;
}

export default function AnalyzerSelector({
  selected,
  onSelect,
  disabled = false,
}: AnalyzerSelectorProps) {
  const options: Array<{
    type: AnalyzerType;
    label: string;
    emoji: string;
    description: string;
  }> = [
    {
      type: "skin",
      label: "Skin Analyzer",
      emoji: "🧴",
      description:
        "Detect acne, texture, tone, sensitivity, and dryness patterns",
    },
    {
      type: "hair",
      label: "Hair Analyzer",
      emoji: "💇",
      description:
        "Analyze hair loss, texture, strength, growth patterns, and health",
    },
    {
      type: "beard",
      label: "Beard Analyzer",
      emoji: "🧔",
      description: "Assess beard growth, density, patchiness, and potential",
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 mb-4">
        Choose What to Analyze
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {options.map((option) => (
          <button
            key={option.type}
            onClick={() => onSelect(option.type)}
            disabled={disabled}
            className={`p-6 rounded-xl border-2 transition ${
              selected === option.type
                ? "border-purple-600 bg-purple-50"
                : "border-gray-200 hover:border-gray-300"
            } disabled:opacity-50`}
          >
            <div className="text-4xl mb-3">{option.emoji}</div>
            <h4 className="font-bold text-slate-900 mb-2">{option.label}</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
