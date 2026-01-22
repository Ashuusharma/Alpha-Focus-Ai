"use client";

import { useMounted } from "@/app/hooks/useMounted";

type Props = {
  progress: number;
};

export default function HealingProgressBar({ progress }: Props) {
  const mounted = useMounted();

  /* 🚨 HYDRATION GUARD */
  if (!mounted) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{progress}% healed</span>
        <span className="text-gray-500">
          Personalizing your recovery…
        </span>
      </div>

      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
