"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { calculateImprovementPercent } from "@/src/utils/improvementEngine";

type Props = {
  beforeImage: string;
  afterImage: string;
  previousScore: number;
  currentScore: number;
};

export default function ComparisonSlider({ beforeImage, afterImage, previousScore, currentScore }: Props) {
  const [position, setPosition] = useState(50);
  const improvement = useMemo(() => calculateImprovementPercent(currentScore, previousScore), [currentScore, previousScore]);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white">
      <h3 className="text-lg font-semibold mb-4">Before / After Comparison</h3>
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl border border-white/10">
        <Image src={beforeImage} alt="Before" fill className="object-cover" unoptimized />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          <Image src={afterImage} alt="After" fill className="object-cover" unoptimized />
        </div>
        <div className="absolute top-0 bottom-0" style={{ left: `${position}%` }}>
          <div className="h-full w-0.5 bg-white" />
        </div>
      </div>
      <input type="range" min={0} max={100} value={position} onChange={(event) => setPosition(Number(event.target.value))} className="w-full mt-4" />
      <div className="mt-2 text-sm text-gray-300">
        Previous Score: <span className="text-white font-semibold">{previousScore}</span> · Current Score: <span className="text-white font-semibold">{currentScore}</span> · Improvement: <span className="text-emerald-300 font-semibold">{improvement}%</span>
      </div>
    </section>
  );
}
