"use client";

import React from "react";

export default function ProfileDrawer({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity backdrop-blur-sm ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <div
        className={`fixed left-4 bottom-4 w-96 bg-white rounded-2xl shadow-2xl z-50 transform transition-transform duration-300 overflow-hidden ${
          open ? 'translate-y-0 scale-100' : 'translate-y-6 scale-95 opacity-0'
        }`}
        aria-hidden={!open}
      >
        {/* HEADER WITH GRADIENT */}
        <div className="bg-gradient-to-r from-blue-600 to-slate-700 px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-blue-400">
                <circle cx="12" cy="8" r="4" />
                <path d="M12 14c-5 0-8 2.5-8 5v3h16v-3c0-2.5-3-5-8-5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Guest User</h3>
              <p className="text-blue-100 text-sm">Recovery in progress</p>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition">
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          
          {/* RECOVERY SNAPSHOT */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-slate-50 p-4 space-y-3 border border-blue-200">
            <h4 className="font-bold text-gray-900 flex items-center space-x-2">
              <span className="text-xl">📊</span>
              <span>Your Recovery Snapshot</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Progress</span>
                <span className="font-bold text-blue-700 bg-white px-3 py-1 rounded-full text-xs">45%</span>
              </div>
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-slate-700" style={{ width: '45%' }}></div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-700">Categories</span>
                <span className="font-bold text-slate-700 bg-white px-3 py-1 rounded-full text-xs">3/6</span>
              </div>
            </div>
          </div>

          {/* SAVED PLANS */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 flex items-center space-x-2">
              <span className="text-xl">💼</span>
              <span>Saved Recovery Plans</span>
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Hair + Beard</p>
                  <p className="text-xs text-slate-600">Jan 2026</p>
                </div>
                <span className="text-indigo-600 font-bold text-lg">→</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Hair Care</p>
                  <p className="text-xs text-slate-600">Dec 2025</p>
                </div>
                <span className="text-indigo-600 font-bold text-lg">→</span>
              </div>
            </div>
          </div>

          {/* AI ACTIONS */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 flex items-center space-x-2">
              <span className="text-xl">🤖</span>
              <span>AI Assistant</span>
            </h4>
            <div className="space-y-2">
              <button className="w-full p-3 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition text-sm">
                Ask AI About My Condition
              </button>
              <button className="w-full p-3 bg-slate-50 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition text-sm">
                Optimize My Routine
              </button>
            </div>
          </div>

          {/* SETTINGS */}
          <div className="pt-4 border-t border-blue-200 space-y-2">
            <button className="w-full text-left p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center space-x-2">
              <span>🔔</span>
              <span className="font-medium text-sm\">Notifications</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center space-x-2">
              <span>🔐</span>
              <span className="font-medium text-sm\">Data & Privacy</span>
            </button>
            <button className="w-full text-left p-3 rounded-lg text-red-600 hover:bg-red-50 transition flex items-center space-x-2">
              <span>🔄</span>
              <span className="font-medium text-sm\">Reset Recovery Plan</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
