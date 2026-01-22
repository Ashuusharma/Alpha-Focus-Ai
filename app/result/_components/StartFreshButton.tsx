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
      className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition"
    >
      Start Assistant
    </button>
  );
}
