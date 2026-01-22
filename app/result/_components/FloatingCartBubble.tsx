"use client";

import React from "react";

export default function FloatingCartBubble({ onClick, count = 0 }: { onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open cart"
      className="fixed right-6 bottom-6 bg-pink-500 text-white p-4 rounded-full shadow-lg z-50 flex items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
      </svg>
      {count > 0 && (
        <span className="ml-2 bg-white text-pink-600 px-2 py-0.5 rounded-full text-xs font-semibold">{count}</span>
      )}
    </button>
  );
}
