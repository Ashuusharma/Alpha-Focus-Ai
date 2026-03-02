"use client";
import { useState } from "react";
import { useToast } from "./ToastContext";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());

  const dismissToast = (id: string) => {
    setDismissingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    window.setTimeout(() => {
      removeToast(id);
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 220);
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white font-semibold animate-fadeInUp transition-all duration-300
            ${dismissingIds.has(toast.id) ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
            ${toast.type === "success" ? "bg-green-600" : ""}
            ${toast.type === "error" ? "bg-red-600" : ""}
            ${toast.type === "info" ? "bg-blue-600" : ""}
          `}
          role="alert"
          tabIndex={0}
        >
          <div className="flex items-start gap-3">
            <p className="flex-1">{toast.message}</p>
            <button
              type="button"
              className="text-xs font-bold uppercase tracking-wide text-white/90 hover:text-white"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Add animation in globals.css:
// @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
// .animate-fadeInUp { animation: fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1); }
