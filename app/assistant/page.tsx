"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssistantEntryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/image-analyzer");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#030917] text-white flex items-center justify-center px-4">
      <p className="text-gray-300 text-sm">Redirecting to assistant experience...</p>
    </div>
  );
}
