"use client";

import { useRouter } from "next/navigation";
import { clearRecoveryState } from "@/lib/recoveryPersistence";

export default function StartFreshButton() {
  const router = useRouter();

  const handleStartFresh = () => {
    clearRecoveryState();
    router.push("/assistant"); // change if your entry route differs
  };

  return (
    <button
      onClick={handleStartFresh}
      className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium hover:bg-white/10 hover:border-white/30 transition shadow-lg shadow-black/20 backdrop-blur-sm"
    >
      Start Assistant
    </button>
  );
}
