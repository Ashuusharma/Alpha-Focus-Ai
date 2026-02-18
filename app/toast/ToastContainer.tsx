"use client";
import { useToast } from "./ToastContext";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white font-semibold animate-fadeInUp transition-all duration-300
            ${toast.type === "success" ? "bg-green-600" : ""}
            ${toast.type === "error" ? "bg-red-600" : ""}
            ${toast.type === "info" ? "bg-blue-600" : ""}
          `}
          onClick={() => removeToast(toast.id)}
          role="alert"
          tabIndex={0}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

// Add animation in globals.css:
// @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
// .animate-fadeInUp { animation: fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1); }
