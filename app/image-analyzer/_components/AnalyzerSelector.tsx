"use client";

import { AnalyzerType } from "@/lib/analyzeImage";
import { analyzerList } from "@/lib/analyzerCatalog";
import AnalyzerCard from "@/components/ui/AnalyzerCard";

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
  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold text-[var(--ink)] mb-2 flex items-center gap-2">
        <span className="w-1 h-7 bg-[var(--accent-blue)] rounded-full" />
        Choose Analysis Type
      </h3>
      <p className="text-[var(--accent-blue)] text-sm mb-8 ml-4">Select the concern you want to evaluate. You will then capture guided photo angles.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {analyzerList.map((option, idx) => (
          <AnalyzerCard
            key={option.type}
            meta={option}
            language="en"
            index={idx}
            variant="select"
            selected={selected === option.type}
            disabled={disabled}
            onClick={() => onSelect(option.type)}
          />
        ))}
      </div>
    </div>
  );
}
