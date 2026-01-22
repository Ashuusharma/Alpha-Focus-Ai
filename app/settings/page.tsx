"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/result/_components/Container";

interface UserPreferences {
  notifications: boolean;
  emailUpdates: boolean;
  weeklyReport: boolean;
  dataCollection: boolean;
  twoFactor: boolean;
  language: string;
  timezone: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<UserPreferences>({
    notifications: true,
    emailUpdates: true,
    weeklyReport: false,
    dataCollection: true,
    twoFactor: false,
    language: "English",
    timezone: "UTC",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load preferences from localStorage
    const stored = localStorage.getItem("oneman_preferences");
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse preferences", e);
      }
    }
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (key: keyof typeof settings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    localStorage.setItem("oneman_preferences", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <Container>
        <div className="max-w-3xl mx-auto">
          {/* HEADER */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 font-medium mb-4"
            >
              <span>←</span>
              <span>Back</span>
            </button>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center space-x-3 mb-2">
              <span>⚙️</span>
              <span>Settings</span>
            </h1>
            <p className="text-slate-600">Manage your account preferences and privacy</p>
          </div>

          {/* ACCOUNT SECTION */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>👤</span>
                <span>Account Settings</span>
              </h2>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Email Address</h3>
                  <p className="text-sm text-slate-600">user@example.com</p>
                </div>
                <button className="px-4 py-2 text-indigo-600 font-medium hover:text-indigo-700 transition">
                  Change
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">Password</h3>
                    <p className="text-sm text-slate-600">Last changed 3 months ago</p>
                  </div>
                  <button className="px-4 py-2 text-blue-700 font-medium hover:text-blue-800 transition">
                    Change
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <span>🌐</span>
                      <span>Language</span>
                    </h3>
                    <p className="text-sm text-slate-600">Choose your preferred language</p>
                  </div>
                  <select
                    value={settings.language}
                    onChange={(e) => handleChange("language", e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                    <option>Chinese</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <span>🕐</span>
                      <span>Timezone</span>
                    </h3>
                    <p className="text-sm text-slate-600">Set your local timezone</p>
                  </div>
                  <select
                    value={settings.timezone}
                    onChange={(e) => handleChange("timezone", e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option>UTC</option>
                    <option>EST</option>
                    <option>CST</option>
                    <option>MST</option>
                    <option>PST</option>
                    <option>GMT</option>
                    <option>IST</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* NOTIFICATIONS SECTION */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>🔔</span>
                <span>Notification Preferences</span>
              </h2>
            </div>

            <div className="p-8 space-y-6">
              {[
                {
                  key: "notifications",
                  label: "Push Notifications",
                  desc: "Get updates about your progress",
                  icon: "📬",
                },
                {
                  key: "emailUpdates",
                  label: "Email Updates",
                  desc: "Receive tips and product recommendations",
                  icon: "📧",
                },
                {
                  key: "weeklyReport",
                  label: "Weekly Report",
                  desc: "Get a summary of your progress every week",
                  icon: "📊",
                },
              ].map((notif) => (
                <div key={notif.key} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{notif.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{notif.label}</h3>
                      <p className="text-sm text-gray-600">{notif.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-block w-12 h-7 bg-gray-300 rounded-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typeof settings[notif.key as keyof typeof settings] === "boolean" ? (settings[notif.key as keyof typeof settings] as boolean) : false}
                      onChange={() => handleToggle(notif.key as keyof typeof settings)}
                      className="opacity-0 w-0 h-0"
                    />
                    <span
                      className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors rounded-full ${
                        typeof settings[notif.key as keyof typeof settings] === "boolean" && settings[notif.key as keyof typeof settings] ? "bg-indigo-600" : "bg-gray-300"
                      }`}
                    />
                    <span
                      className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${
                        typeof settings[notif.key as keyof typeof settings] === "boolean" && settings[notif.key as keyof typeof settings] ? "translate-x-6 left-1" : "left-1"
                      }`}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* PRIVACY SECTION */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>🔐</span>
                <span>Privacy & Data</span>
              </h2>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Data Collection</h3>
                  <p className="text-sm text-gray-600">Help improve Oneman by sharing anonymous data</p>
                </div>
                <label className="relative inline-block w-12 h-7 bg-gray-300 rounded-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dataCollection}
                    onChange={() => handleToggle("dataCollection")}
                    className="opacity-0 w-0 h-0"
                  />
                  <span
                    className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-colors rounded-full ${
                      settings.dataCollection ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  />
                  <span
                    className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-transform ${
                      settings.dataCollection ? "translate-x-6 left-1" : "left-1"
                    }`}
                  />
                </label>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <button className="text-gray-700 hover:text-gray-900 font-medium text-sm flex items-center space-x-2">
                  <span>📄</span>
                  <span>Privacy Policy</span>
                </button>
              </div>

              <div>
                <button className="text-gray-700 hover:text-gray-900 font-medium text-sm flex items-center space-x-2">
                  <span>📋</span>
                  <span>Terms of Service</span>
                </button>
              </div>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="bg-white rounded-2xl border-2 border-red-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 px-8 py-6 border-b border-red-200">
              <h2 className="text-2xl font-bold text-red-900 flex items-center space-x-2">
                <span>⚠️</span>
                <span>Danger Zone</span>
              </h2>
            </div>

            <div className="p-8 space-y-4">
              <button className="w-full px-6 py-3 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition flex items-center justify-center space-x-2">
                <span>🔄</span>
                <span>Reset Recovery Plan</span>
              </button>

              <button className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition flex items-center justify-center space-x-2">
                <span>🚪</span>
                <span>Logout</span>
              </button>

              <button className="w-full px-6 py-3 border-2 border-red-600 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition flex items-center justify-center space-x-2">
                <span>❌</span>
                <span>Delete Account</span>
              </button>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleSave}
              className="px-8 py-4 bg-gradient-to-r from-blue-700 to-slate-800 text-white font-bold rounded-xl hover:from-blue-800 hover:to-slate-900 transition flex items-center space-x-2 shadow-lg"
            >
              <span>💾</span>
              <span>Save Changes</span>
            </button>
            {saved && (
              <span className="text-green-600 font-medium flex items-center space-x-2">
                <span>✓</span>
                <span>Saved to localStorage</span>
              </span>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
