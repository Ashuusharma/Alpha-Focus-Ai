"use client";

import { Bell } from "lucide-react";

export default function NotificationBell({ onClick }: { onClick?: () => void }) {
  return (
    <button onClick={onClick} className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/[0.04] text-gray-200 hover:bg-white/[0.08] transition-colors">
      <Bell className="h-4 w-4" />
    </button>
  );
}
