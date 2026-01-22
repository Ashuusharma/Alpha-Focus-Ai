"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMounted } from "@/app/hooks/useMounted";
import { useCartStore } from "@/lib/cartStore";

export default function UserMenu() {
  const mounted = useMounted();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCartStore((s) => s.items.length);

  if (!mounted) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-blue-200 z-40 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* LOGO */}
        <button
          onClick={() => router.push("/")}
          className="text-lg sm:text-xl font-bold text-black"
        >
          🧔 Oneman Grooming & Wellness Assistant
        </button>

        {/* CENTER - NAV ITEMS (DESKTOP) */}
        <div className="hidden sm:flex items-center gap-6">
          <button
            onClick={() => router.push("/")}
            className="text-gray-700 hover:text-black transition font-medium"
          >
            Assistant
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="text-gray-700 hover:text-black transition font-medium"
          >
            My Plans
          </button>
          <button className="text-gray-700 hover:text-black transition font-medium">
            Learn
          </button>
        </div>

        {/* RIGHT - CART + USER MENU */}
        <div className="flex items-end gap-4">
          {/* CART BADGE */}
          {cartCount > 0 && (
            <button
              onClick={() => useCartStore.getState().openCart()}
              className="relative bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
            >
              🛒 {cartCount}
            </button>
          )}

          {/* USER MENU TOGGLE - VECTOR MAN AVATAR */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="relative w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 via-slate-600 to-slate-800 text-white flex items-center justify-center font-bold hover:shadow-lg transition mb-1 border-2 border-white"
            title="Profile Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
              <circle cx="12" cy="8" r="4" />
              <path d="M12 14c-5 0-8 2.5-8 5v3h16v-3c0-2.5-3-5-8-5z" />
            </svg>
          </button>

          {/* DROPDOWN MENU */}
          {menuOpen && (
            <div className="absolute top-16 right-4 bg-white border border-blue-200 rounded-2xl shadow-2xl w-64 overflow-hidden z-50">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-slate-700 px-6 py-5 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-blue-400">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M12 14c-5 0-8 2.5-8 5v3h16v-3c0-2.5-3-5-8-5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">Guest User</p>
                    <p className="text-blue-100 text-xs">Welcome to Oneman</p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="divide-y divide-blue-100">
                <button
                  onClick={() => {
                    router.push("/profile");
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-blue-50 transition flex items-start space-x-3 group"
                >
                  <span className="text-xl group-hover:scale-110 transition">👤</span>
                  <div>
                    <span className="font-semibold text-slate-900">Edit Profile</span>
                    <p className="text-xs text-slate-600">Update photo & info</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    router.push("/dashboard");
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-blue-50 transition flex items-start space-x-3 group"
                >
                  <span className="text-xl group-hover:scale-110 transition">📊</span>
                  <div>
                    <span className="font-semibold text-slate-900">My Dashboard</span>
                    <p className="text-xs text-slate-600">Recovery progress</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    router.push("/saved-scans");
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-blue-50 transition flex items-start space-x-3 group"
                >
                  <span className="text-xl group-hover:scale-110 transition">💾</span>
                  <div>
                    <span className="font-semibold text-slate-900">Saved Scans</span>
                    <p className="text-xs text-slate-600">View past analyses</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    router.push("/compare-results");
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-blue-50 transition flex items-start space-x-3 group"
                >
                  <span className="text-xl group-hover:scale-110 transition">📈</span>
                  <div>
                    <span className="font-semibold text-slate-900">Compare Results</span>
                    <p className="text-xs text-slate-600">Track your progress</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    router.push("/learning-center");
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-blue-50 transition flex items-start space-x-3 group"
                >
                  <span className="text-xl group-hover:scale-110 transition">📚</span>
                  <div>
                    <span className="font-semibold text-slate-900">Learning Center</span>
                    <p className="text-xs text-slate-600">Ingredients & tips</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    router.push("/settings");
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-blue-50 transition flex items-start space-x-3 group"
                >
                  <span className="text-xl group-hover:scale-110 transition">⚙️</span>
                  <div>
                    <span className="font-semibold text-slate-900">Settings</span>
                    <p className="text-xs text-slate-600">Notifications & privacy</p>
                  </div>
                </button>

                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-left px-6 py-4 hover:bg-red-50 transition flex items-start space-x-3 group text-red-600"
                >
                  <span className="text-xl group-hover:scale-110 transition">🚪</span>
                  <div>
                    <span className="font-semibold">Logout</span>
                    <p className="text-xs text-red-500">Sign out of your account</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
