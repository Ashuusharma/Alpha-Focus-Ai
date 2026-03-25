"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssistantEntryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/image-analyzer");
  }, [router]);

  return (
    <div className="af-page-shell min-h-screen text-[#1F3D2B] flex items-center justify-center px-4">
      <div className="af-surface-card px-6 py-5">
        <p className="text-[#6B665D] text-sm">Redirecting to assistant experience...</p>
      </div>
    </div>
  );
}
