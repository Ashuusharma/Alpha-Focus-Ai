"use client";

import React from "react";

export default function FloatingChatBubble({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col items-end space-y-3">
      {/* Chat bubble */}
      <button
        onClick={onClick}
        aria-label="Open chat"
        className="h-12 w-12 rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center hover:scale-105 transform transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 3.866-3.582 7-8 7a9 9 0 01-3-.5L3 21l1.5-4.5A8.964 8.964 0 015 12c0-3.866 3.582-7 8-7s8 3.134 8 7z" />
        </svg>
      </button>

      {/* Small chat panel when open */}
      <div className={`origin-bottom-right transform transition-all duration-300 ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
        <div className="w-64 bg-white rounded-lg shadow-lg p-3">
          <div className="text-sm font-medium">Support Chat</div>
          <div className="text-xs text-gray-500 mt-2">Hi - need help with your routine? Click to start.</div>
        </div>
      </div>
    </div>
  );
}

