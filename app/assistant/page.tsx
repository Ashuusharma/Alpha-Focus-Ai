"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function AssistantEntryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/image-analyzer");
  }, [router]);

  return (
    <div className="af-page-shell min-h-screen flex items-center justify-center px-4">
      <div className="glass-card max-w-md px-6 py-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ink)] text-white shadow-[var(--shadow-glow-blue)]">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-[var(--ink)]">Opening your AI assistant</p>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Taking you to the scan and analysis flow — this is where Alpha Focus reads your skin and hair data.</p>
      </div>
    </div>
  );
}

