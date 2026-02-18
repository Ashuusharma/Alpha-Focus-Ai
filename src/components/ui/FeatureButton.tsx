"use client";

import { ReactNode } from "react";

export default function FeatureButton({ label, onClick, icon }: { label: string; onClick: () => void; icon?: ReactNode }) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-xl border border-white/20 bg-white/[0.04] text-sm font-semibold hover:bg-white/[0.08] transition-colors inline-flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </button>
  );
}
