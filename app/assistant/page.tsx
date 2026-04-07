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
    <div className="af-page-shell min-h-screen text-[#1F3D2B] flex items-center justify-center px-4">
      <div className="af-card-primary max-w-md px-6 py-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1F3D2B] text-white shadow-[0_14px_30px_rgba(31,61,43,0.18)]">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-[#1F3D2B]">Opening assistant experience</p>
        <p className="mt-2 text-sm text-[#6B665D]">You are being redirected to the analyzer flow, which is the current assistant entry point.</p>
      </div>
    </div>
  );
}
