"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Container from "@/app/result/_components/Container";
import { 
  ArrowLeft, Settings, Bell, Shield, Save, CheckCircle2,
  Moon, Sun, Languages, AlertTriangle, Plus, X, Trash2, Eye,
  Palette, Camera, Heart, Package, ChevronDown
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useIngredientBlacklistStore, 
  commonAllergens
} from "@/lib/ingredientBlacklistStore";
import { usePhotoGalleryStore } from "@/lib/photoGalleryStore";
import { useWishlistStore } from "@/lib/wishlistStore";
import { useRewardsStore, type DiscountTier } from "../../lib/rewardsStore";
import { languages, type LanguageOption } from "../../lib/languageContext";
import { AuthContext } from "@/contexts/AuthProvider";
import { readUserState, writeUserState } from "@/lib/dbUserState";
import { useContext } from "react";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";

type PushStatus = "checking" | "enabled" | "disabled" | "unsupported" | "blocked" | "unavailable";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

interface UserPreferences {
  notifications: boolean;
  emailUpdates: boolean;
  weeklyReport: boolean;
  routineNotifications: boolean;
  challengeNotifications: boolean;
  progressNotifications: boolean;
  tipNotifications: boolean;
  dataCollection: boolean;
  twoFactor: boolean;
  theme: "dark" | "light" | "system";
  language: string;
  timezone: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<UserPreferences>({
    notifications: true,
    emailUpdates: true,
    weeklyReport: false,
    routineNotifications: true,
    challengeNotifications: true,
    progressNotifications: true,
    tipNotifications: true,
    dataCollection: true,
    twoFactor: false,
    theme: "dark",
    language: "en",
    timezone: "Asia/Kolkata",
  });
  const [saved, setSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [newIngredient, setNewIngredient] = useState("");
  const [newIngredientReason, setNewIngredientReason] = useState<"allergy" | "sensitivity" | "preference" | "other">("preference");
  const [walletMessage, setWalletMessage] = useState("");
  const [pushStatus, setPushStatus] = useState<PushStatus>("checking");
  const [pushMessage, setPushMessage] = useState("");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [pushDeliveryReady, setPushDeliveryReady] = useState(false);
  const [pushMissingConfig, setPushMissingConfig] = useState<string[]>([]);
  const [pushTestBusy, setPushTestBusy] = useState(false);

  // Stores
  const { blacklist, addIngredient, removeIngredient, clearAll: clearBlacklist } = useIngredientBlacklistStore();
  const { photos, clearAll: clearPhotos } = usePhotoGalleryStore();
  const { items: wishlistItems, clearAll: clearWishlist } = useWishlistStore();
  const credits = useRewardsStore((s) => s.credits);
  const lifetimeCredits = useRewardsStore((s) => s.lifetimeCredits);
  const activeDiscount = useRewardsStore((s) => s.activeDiscount);
  const tiers = useRewardsStore((s) => s.tiers);
  const redeemTier = useRewardsStore((s) => s.redeemTier);
  const clearExpiredDiscount = useRewardsStore((s) => s.clearExpiredDiscount);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      const saved = await readUserState<UserPreferences>(user.id, "oneman_preferences");
      if (saved) {
        setSettings(saved);
      }

      try {
        const headers = await getSupabaseAuthHeaders();
        const response = await fetch("/api/notifications/preferences", { cache: "no-store", headers });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          ok: boolean;
          preferences?: {
            routineEnabled: boolean;
            challengeEnabled: boolean;
            progressEnabled: boolean;
            tipsEnabled: boolean;
          };
        };
        if (!payload.ok || !payload.preferences) return;

        setSettings((prev) => ({
          ...prev,
          routineNotifications: payload.preferences?.routineEnabled ?? prev.routineNotifications,
          challengeNotifications: payload.preferences?.challengeEnabled ?? prev.challengeNotifications,
          progressNotifications: payload.preferences?.progressEnabled ?? prev.progressNotifications,
          tipNotifications: payload.preferences?.tipsEnabled ?? prev.tipNotifications,
          notifications:
            Boolean(payload.preferences?.routineEnabled)
            || Boolean(payload.preferences?.challengeEnabled)
            || Boolean(payload.preferences?.progressEnabled)
            || Boolean(payload.preferences?.tipsEnabled),
        }));
      } catch {
        return;
      }

      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          setPushStatus("unsupported");
          return;
        }

        const headers = await getSupabaseAuthHeaders();
        const response = await fetch("/api/notifications/push", { cache: "no-store", headers });
        if (!response.ok) {
          setPushStatus(Notification.permission === "denied" ? "blocked" : "disabled");
          return;
        }

        const payload = (await response.json()) as {
          ok: boolean;
          configured?: boolean;
          deliveryReady?: boolean;
          serviceRoleReady?: boolean;
          missing?: string[];
          subscribed?: boolean;
        };

        setPushConfigured(Boolean(payload.configured));
        setPushDeliveryReady(Boolean(payload.deliveryReady));
        setPushMissingConfig(Array.isArray(payload.missing) ? payload.missing : []);
        if (!payload.configured) {
          setPushStatus("unavailable");
        } else if (Notification.permission === "denied") {
          setPushStatus("blocked");
        } else {
          setPushStatus(payload.subscribed ? "enabled" : "disabled");
        }
      } catch {
        setPushStatus(Notification.permission === "denied" ? "blocked" : "disabled");
      }
    };

    if (mounted) {
      void loadPreferences();
    }
  }, [mounted, user?.id]);

  // Apply theme
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    clearExpiredDiscount();
  }, [mounted, clearExpiredDiscount]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleMasterNotificationsToggle = () => {
    void (async () => {
      const enabling = !settings.notifications;

      setSettings((prev) => ({
        ...prev,
        notifications: enabling,
        routineNotifications: enabling,
        challengeNotifications: enabling,
        progressNotifications: enabling,
        tipNotifications: enabling,
      }));

      if (enabling) {
        await enableBrowserPush();
      } else {
        await disableBrowserPush();
      }
    })();
  };

  const handleNotificationChannelToggle = (key: "routineNotifications" | "challengeNotifications" | "progressNotifications" | "tipNotifications") => {
    setSettings((prev) => {
      const next = !prev[key];
      const updated = {
        ...prev,
        [key]: next,
      };
      const anyEnabled =
        Boolean(updated.routineNotifications)
        || Boolean(updated.challengeNotifications)
        || Boolean(updated.progressNotifications)
        || Boolean(updated.tipNotifications);
      return {
        ...updated,
        notifications: anyEnabled,
      };
    });
  };

  const handleChange = (key: keyof typeof settings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (user) {
      await writeUserState(user.id, "oneman_preferences", settings);
      await writeUserState(user.id, "oneman-theme", settings.theme);
      await writeUserState(user.id, "oneman-language", settings.language);

      await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: await getSupabaseAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          routineEnabled: Boolean(settings.routineNotifications),
          challengeEnabled: Boolean(settings.challengeNotifications),
          progressEnabled: Boolean(settings.progressNotifications),
          tipsEnabled: Boolean(settings.tipNotifications),
        }),
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const enableBrowserPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported");
      setPushMessage("This browser does not support web push.");
      return;
    }

    setPushBusy(true);
    setPushMessage("");

    try {
      const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
      const statusResponse = await fetch("/api/notifications/push", { cache: "no-store", headers });
      const statusPayload = statusResponse.ok
        ? (await statusResponse.json()) as {
            ok: boolean;
            publicKey?: string;
            configured?: boolean;
            deliveryReady?: boolean;
            missing?: string[];
          }
        : { ok: false };

      if (!statusPayload.configured || !statusPayload.publicKey) {
        setPushConfigured(false);
        setPushDeliveryReady(false);
        setPushMissingConfig(Array.isArray(statusPayload.missing) ? statusPayload.missing : []);
        setPushStatus("unavailable");
        setPushMessage("Push is not configured on the server yet.");
        return;
      }

      setPushConfigured(true);
      setPushDeliveryReady(Boolean(statusPayload.deliveryReady));
      setPushMissingConfig(Array.isArray(statusPayload.missing) ? statusPayload.missing : []);

      const permission = Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();

      if (permission !== "granted") {
        setPushStatus(permission === "denied" ? "blocked" : "disabled");
        setPushMessage(permission === "denied" ? "Browser permission is blocked. Enable notifications in site settings." : "Notification permission was not granted.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(statusPayload.publicKey),
      });

      const saveResponse = await fetch("/api/notifications/push", {
        method: "POST",
        headers,
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!saveResponse.ok) {
        throw new Error("Could not save the browser push subscription.");
      }

      setPushStatus("enabled");
      setPushMessage(
        statusPayload.deliveryReady
          ? "Browser push is active for this device and backend delivery is fully ready."
          : "Browser push is active for this device. Automatic scheduler delivery still needs the remaining server config shown below."
      );
    } catch (error) {
      setPushStatus(Notification.permission === "denied" ? "blocked" : "disabled");
      setPushMessage(error instanceof Error ? error.message : "Could not enable browser push.");
    } finally {
      setPushBusy(false);
    }
  };

  const disableBrowserPush = async () => {
    if (!("serviceWorker" in navigator)) {
      setPushStatus("unsupported");
      return;
    }

    setPushBusy(true);
    setPushMessage("");

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const endpoint = subscription?.endpoint;
      if (subscription) {
        await subscription.unsubscribe();
      }

      await fetch("/api/notifications/push", {
        method: "DELETE",
        headers: await getSupabaseAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ endpoint }),
      });

      setPushStatus(Notification.permission === "denied" ? "blocked" : "disabled");
      setPushMessage("Browser push is off for this device.");
    } catch (error) {
      setPushMessage(error instanceof Error ? error.message : "Could not disable browser push.");
    } finally {
      setPushBusy(false);
    }
  };

  const sendTestPush = async () => {
    if (pushStatus !== "enabled") {
      setPushMessage("Enable browser push on this device before sending a test notification.");
      return;
    }

    setPushTestBusy(true);
    setPushMessage("");

    try {
      const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers,
        body: JSON.stringify({
          eventType: "progress_improved",
          metadata: {
            improvementPct: 12,
            categoryLabel: "your active recovery track",
          },
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; skipped?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Could not send a test notification.");
      }

      setPushMessage("Test notification queued. Lock the screen or switch tabs, then click the notification to verify deep linking to your report.");
    } catch (error) {
      setPushMessage(error instanceof Error ? error.message : "Could not send a test notification.");
    } finally {
      setPushTestBusy(false);
    }
  };

  const handleAddIngredient = () => {
    if (!newIngredient.trim()) return;
    addIngredient({
      name: newIngredient.trim(),
      reason: newIngredientReason,
    });
    setNewIngredient("");
  };

  const handleRedeem = (tierId: "bronze" | "silver" | "gold") => {
    const result = redeemTier(tierId);
    setWalletMessage(result.message);
    setTimeout(() => setWalletMessage(""), 2400);
  };

  if (!mounted) return null;

  const Toggle = ({ active, onClick }: { active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
        active ? "bg-[#0071e3] shadow-sm" : "bg-black/10"
      }`}
    >
      <div
        className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
          active ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );

  const SectionHeader = ({ 
    icon: Icon, 
    title, 
    color, 
    sectionKey,
    badge
  }: { 
    icon: LucideIcon; 
    title: string; 
    color: string;
    sectionKey: string;
    badge?: number;
  }) => (
    <button 
      onClick={() => setExpandedSection(expandedSection === sectionKey ? null : sectionKey)}
      className="w-full bg-white/60 backdrop-blur-md px-6 py-4 flex items-center justify-between hover:bg-white/80 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="font-bold text-[#1d1d1f]">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[#0071e3]/10 text-[#0071e3] text-xs font-bold">
            {badge}
          </span>
        )}
      </div>
      <ChevronDown className={`w-5 h-5 text-[#6e6e73] transition-transform duration-300 ${expandedSection === sectionKey ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <div className="af-page-shell min-h-screen py-8 text-[#ffffff] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[#0071e3]/5 blur-[120px] rounded-full opacity-30 animate-pulse" />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-[#99c9ff]/20 blur-[120px] rounded-full opacity-30" />
      </div>

      <Container>
        <div className="af-page-frame mx-auto max-w-5xl">
          <div className="af-page-stack">
          {/* HEADER */}
          <div className="nv-section-white">
            <div className="relative z-10 space-y-6">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#6e6e73] transition hover:text-[#1d1d1f]"
              >
                <div className="rounded-xl border border-white/60 bg-white/70 p-2 shadow-sm">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span>Back</span>
              </button>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <span className="af-page-kicker">
                    <Settings className="h-3.5 w-3.5" />
                    Control Center
                  </span>
                  <div>
                    <h1 className="text-clinical-heading text-3xl font-extrabold tracking-tight md:text-4xl">Tune notifications, privacy, rewards, and device behavior from one place.</h1>
                    <p className="mt-3 text-sm leading-7 text-[#6e6e73]">The settings stack now matches the premium app shell and keeps the highest-friction controls visible before the deeper sections below.</p>
                  </div>
                  <div className="af-badge-row">
                    <span className="af-badge-chip text-[#0071e3]">Push {pushStatus === "enabled" ? "active" : pushStatus}</span>
                    <span className="af-badge-chip text-[#A46A2D]">{settings.language.toUpperCase()} locale</span>
                    <span className="af-badge-chip text-[#7A5C47]">{blacklist.length} blocked ingredients</span>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-4 lg:max-w-sm">
                  <motion.button
                    onClick={handleSave}
                    whileTap={{ scale: 0.98 }}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold transition-all duration-200 ${
                      saved
                        ? "bg-[#0071e3] text-white shadow-[0_0_20px_rgba(0,113,227,0.26)]"
                        : "btn-primary text-[#000000]"
                    }`}
                  >
                    {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saved ? "Saved" : "Save preferences"}
                  </motion.button>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="af-stat-tile">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Wishlist</p>
                      <p className="mt-2 text-2xl font-bold text-[#1d1d1f]">{wishlistItems.length}</p>
                      <p className="mt-1 text-xs text-[#6e6e73]">Saved products</p>
                    </div>
                    <div className="af-stat-tile">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Gallery</p>
                      <p className="mt-2 text-2xl font-bold text-[#1d1d1f]">{photos.length}</p>
                      <p className="mt-1 text-xs text-[#6e6e73]">Stored captures</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={() => router.push("/assessment")} className="af-quick-action">Questions</button>
                <button onClick={() => router.push("/image-analyzer")} className="af-quick-action">Photo Scan</button>
                <button onClick={() => router.push("/tracking")} className="af-quick-action">Track Lifestyle</button>
                <button onClick={() => router.push("/reports/weekly")} className="af-quick-action">Weekly Report</button>
                <button onClick={() => router.push("/data-settings")} className="af-quick-action">Data Settings</button>
                <button onClick={() => router.push("/privacy-policy")} className="af-quick-action">Privacy Policy</button>
                <button onClick={() => router.push("/upgrade")} className="af-btn-primary px-4 py-3 text-sm">Upgrade</button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="af-card-secondary p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Delivery status</p>
              <p className="mt-2 text-base font-semibold text-[#1d1d1f]">{pushDeliveryReady ? "All notification routes ready" : "Browser-ready, server follow-up may remain"}</p>
              <p className="mt-1 text-xs text-[#6e6e73]">{pushMissingConfig.length ? `${pushMissingConfig.length} config items still missing.` : "No missing push config detected."}</p>
            </div>
            <div className="af-card-secondary p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Reward balance</p>
              <p className="mt-2 text-base font-semibold text-[#1d1d1f]">{credits} credits available</p>
              <p className="mt-1 text-xs text-[#6e6e73]">Lifetime earned: {lifetimeCredits}</p>
            </div>
            <div className="af-card-secondary p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6e6e73]">Theme mode</p>
              <p className="mt-2 text-base font-semibold text-[#1d1d1f] capitalize">{settings.theme}</p>
              <p className="mt-1 text-xs text-[#6e6e73]">Timezone set to {settings.timezone}</p>
            </div>
          </div>

          <div className="space-y-4">
            
            {/* ==================== APPEARANCE ==================== */}
            <section className="nv-section-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(11,18,32,0.14)]">
              <SectionHeader icon={Palette} title="Appearance" color="text-purple-400" sectionKey="appearance" />
              <AnimatePresence>
                {expandedSection === "appearance" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6 border-t border-white/40">
                      {/* Theme Selector */}
                      <div>
                        <h3 className="font-bold text-[#1d1d1f] mb-3 flex items-center gap-2">
                          {settings.theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                          Theme
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: "dark", label: "Dark", icon: Moon },
                            { value: "light", label: "Light", icon: Sun },
                            { value: "system", label: "System", icon: Settings },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleChange("theme", option.value)}
                              className={`p-4 rounded-xl border transition-all ${
                                settings.theme === option.value
                                  ? "bg-[#0071e3]/10 border-[#0071e3] text-[#0071e3]"
                                  : "bg-white/40 border-white/40 hover:bg-white/60 text-[#6e6e73]"
                              }`}
                            >
                              <option.icon className="w-5 h-5 mx-auto mb-2" />
                              <span className="text-sm font-medium">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ==================== LANGUAGE ==================== */}
            <section className="nv-section-white overflow-hidden">
              <SectionHeader icon={Languages} title="Language & Region" color="text-[#0071e3]" sectionKey="language" />
              <AnimatePresence>
                {expandedSection === "language" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6 border-t border-white/40">
                      {/* Language Grid */}
                      <div>
                        <h3 className="font-bold text-[#1d1d1f] mb-3">Select Language</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {languages.map((lang: LanguageOption) => (
                            <button
                              key={lang.code}
                              onClick={() => handleChange("language", lang.code)}
                              className={`p-3 rounded-xl border transition-all text-left ${
                                settings.language === lang.code
                                    ? "bg-[#0071e3]/10 border-[#0071e3] text-[#0071e3]"
                                  : "bg-white/40 border-white/40 hover:bg-white/60 text-[#6e6e73]"
                              }`}
                            >
                              <span className="text-xl mr-2">{lang.flag}</span>
                              <span className="font-medium">{lang.nativeName}</span>
                              <p className="text-xs text-[#8C877D] mt-0.5">{lang.name}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="block text-sm font-bold text-[#6e6e73] mb-2">Timezone</label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleChange("timezone", e.target.value)}
                          className="w-full bg-white/40 border border-white/40 rounded-xl p-3 text-[#1d1d1f] focus:outline-none focus:border-[#0071e3] transition"
                        >
                          <option value="Asia/Kolkata">India (IST)</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">US Eastern</option>
                          <option value="Europe/London">UK (GMT)</option>
                          <option value="Asia/Dubai">Dubai (GST)</option>
                          <option value="Asia/Singapore">Singapore (SGT)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ==================== INGREDIENT BLACKLIST ==================== */}
            <section className="nv-section-white overflow-hidden">
              <SectionHeader 
                icon={AlertTriangle} 
                title="Ingredient Blacklist" 
                color="text-red-400" 
                sectionKey="blacklist"
                badge={blacklist.length}
              />
              <AnimatePresence>
                {expandedSection === "blacklist" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6 border-t border-white/40">
                      <p className="text-sm text-[#6e6e73]">
                        Products containing these ingredients will be flagged or filtered out from recommendations.
                      </p>

                      {/* Add New Ingredient */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newIngredient}
                            onChange={(e) => setNewIngredient(e.target.value)}
                            placeholder="Enter ingredient name..."
                            className="flex-1 bg-white/40 border border-white/40 rounded-xl px-4 py-3 text-[#1d1d1f] placeholder-[#8C877D] focus:outline-none focus:border-[#0071e3]"
                            onKeyPress={(e) => e.key === "Enter" && handleAddIngredient()}
                          />
                          <select
                            value={newIngredientReason}
                            onChange={(e) => setNewIngredientReason(e.target.value as "allergy" | "sensitivity" | "preference" | "other")}
                            className="bg-white/40 border border-white/40 rounded-xl px-3 text-[#1d1d1f] focus:outline-none"
                          >
                            <option value="allergy">Allergy</option>
                            <option value="sensitivity">Sensitivity</option>
                            <option value="preference">Preference</option>
                            <option value="other">Other</option>
                          </select>
                          <button
                            onClick={handleAddIngredient}
                            className="px-4 py-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Quick Add Common Allergens */}
                        <div>
                          <p className="text-xs text-[#6e6e73] mb-2">Quick add common allergens:</p>
                          <div className="flex flex-wrap gap-2">
                            {commonAllergens.slice(0, 6).map((allergen) => (
                              <button
                                key={allergen.name}
                                onClick={() => addIngredient({ name: allergen.name, reason: "sensitivity" })}
                                disabled={blacklist.some(b => b.name.toLowerCase() === allergen.name.toLowerCase())}
                                className="px-3 py-1.5 text-xs rounded-full bg-white/40 border border-white/40 text-[#6e6e73] hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 transition disabled:opacity-30"
                              >
                                + {allergen.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Blacklisted Items */}
                      {blacklist.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-[#1d1d1f]">Your Blacklist ({blacklist.length})</h4>
                            <button
                              onClick={clearBlacklist}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {blacklist.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/40 border border-white/40"
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    item.reason === "allergy" ? "bg-red-500/10 text-red-600" :
                                    item.reason === "sensitivity" ? "bg-amber-500/10 text-amber-600" :
                                    "bg-gray-500/10 text-[#6e6e73]"
                                  }`}>
                                    {item.reason}
                                  </span>
                                  <span className="text-[#1d1d1f] font-medium">{item.name}</span>
                                </div>
                                <button
                                  onClick={() => removeIngredient(item.id)}
                                  className="p-1.5 text-[#6e6e73] hover:text-red-500 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[#6e6e73]">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No ingredients blacklisted yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ==================== PHOTO GALLERY MANAGEMENT ==================== */}
            <section className="nv-section-white overflow-hidden">
              <SectionHeader 
                icon={Camera} 
                title="Photo Gallery" 
                color="text-[#0071e3]" 
                sectionKey="photos"
                badge={photos.length}
              />
              <AnimatePresence>
                {expandedSection === "photos" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-4 border-t border-white/40">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[#1d1d1f] font-medium">{photos.length} photos saved</p>
                          <p className="text-xs text-[#6e6e73]">Progress photos are stored locally on your device</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push("/saved-scans")}
                            className="px-4 py-2 bg-white/40 text-[#0071e3] rounded-lg border border-white/40 hover:bg-white/60 transition flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> View All
                          </button>
                          {photos.length > 0 && (
                            <button
                              onClick={clearPhotos}
                              className="px-4 py-2 bg-red-500/10 text-red-600 rounded-lg hover:bg-red-500/20 transition flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete All
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Photo Preview Grid */}
                      {photos.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {photos.slice(0, 8).map((photo) => (
                            <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-white/40 relative">
                              <Image src={photo.dataUrl} alt="Progress photo" fill unoptimized className="object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ==================== WISHLIST MANAGEMENT ==================== */}
            <section className="nv-section-white overflow-hidden">
              <SectionHeader 
                icon={Heart} 
                title="Wishlist" 
                color="text-pink-400" 
                sectionKey="wishlist"
                badge={wishlistItems.length}
              />
              <AnimatePresence>
                {expandedSection === "wishlist" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-4 border-t border-white/40">
                      <div className="flex justify-between items-center">
                        <p className="text-[#1d1d1f] font-medium">{wishlistItems.length} products saved</p>
                        {wishlistItems.length > 0 && (
                          <button
                            onClick={clearWishlist}
                            className="text-xs text-red-500 hover:text-red-400"
                          >
                            Clear Wishlist
                          </button>
                        )}
                      </div>

                      {wishlistItems.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {wishlistItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-white/40 border border-white/40"
                            >
                              <div>
                                <p className="text-[#1d1d1f] font-medium">{item.name}</p>
                                <p className="text-xs text-[#6e6e73]">{item.type}  -  {item.price}</p>
                              </div>
                              <span className="text-pink-400">{item.rating} star</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[#6e6e73]">
                          <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No products in wishlist</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ==================== ALPHA SIKKA WALLET ==================== */}
            <section className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/40 shadow-sm">
              <SectionHeader icon={Package} title="Alpha Sikka Wallet" color="text-yellow-400" sectionKey="rewards" />
              <AnimatePresence>
                {expandedSection === "rewards" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-5 border-t border-white/40">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl bg-white/40 border border-white/40">
                          <p className="text-xs uppercase tracking-wider text-[#6e6e73] mb-1">Current Balance</p>
                          <p className="text-2xl font-bold text-[#EAB308]">{credits} A$</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/40 border border-white/40">
                          <p className="text-xs uppercase tracking-wider text-[#6e6e73] mb-1">Lifetime Earned</p>
                          <p className="text-2xl font-bold text-[#1d1d1f]">{lifetimeCredits} A$</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/40 border border-white/40">
                          <p className="text-xs uppercase tracking-wider text-[#6e6e73] mb-1">Discount Status</p>
                          <p className="text-sm font-bold text-emerald-600">
                            {activeDiscount ? `${activeDiscount.discountPercent}% Active` : "No active code"}
                          </p>
                        </div>
                      </div>

                      {activeDiscount ? (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                          <p className="font-semibold text-emerald-700">{activeDiscount.label} Tier  -  {activeDiscount.discountPercent}% OFF</p>
                          <p className="text-sm text-emerald-600 mt-1">Code: {activeDiscount.code}</p>
                          <p className="text-xs text-emerald-600 mt-1">Valid till: {new Date(activeDiscount.expiresAt).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-3 gap-3">
                          {tiers.map((tier: DiscountTier) => (
                            <button
                              key={tier.id}
                              onClick={() => handleRedeem(tier.id)}
                              className="p-4 rounded-xl text-left bg-white/40 border border-white/40 hover:border-[#0071e3]/40 hover:bg-white/60 transition"
                            >
                              <p className="font-semibold text-[#1d1d1f]">{tier.label}</p>
                              <p className="text-xs text-[#6e6e73] mt-1">{tier.discountPercent}% discount</p>
                              <p className="text-xs text-[#0071e3] mt-1">Redeem: {tier.creditsCost} A$</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {walletMessage && (
                        <p className="text-sm text-[#0071e3]">{walletMessage}</p>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => router.push("/challenges")}
                          className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 hover:bg-yellow-500/20 transition text-sm font-medium"
                        >
                          Earn via Challenges
                        </button>
                        <button
                          onClick={() => router.push("/result")}
                          className="px-4 py-2 rounded-lg bg-[#eef5ff] border border-[#d9d9de] text-[#0071e3] hover:bg-[#DCE8E0] transition text-sm font-medium"
                        >
                          Open Report Wallet
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ==================== NOTIFICATIONS ==================== */}
            <section className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/40 shadow-sm">
              <SectionHeader icon={Bell} title="Notifications" color="text-amber-400" sectionKey="notifications" />
              <AnimatePresence>
                {expandedSection === "notifications" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6 border-t border-white/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#1d1d1f] mb-1">Push Notifications</h3>
                          <p className="text-sm text-[#6e6e73]">Get routine, streak, reward, and recovery alerts on this device</p>
                        </div>
                        <Toggle active={settings.notifications} onClick={handleMasterNotificationsToggle} />
                      </div>

                      <div className={`skeuo-panel rounded-2xl border px-4 py-4 ${pushStatus === "enabled" ? "border-[#0071e3]/30 bg-[#eef5ff]" : pushStatus === "blocked" ? "border-[#E4B9AA] bg-[#FFF5F1]" : "border-[#D9D2C7] bg-white/50"}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#1d1d1f]">Browser push status</p>
                            <p className="text-xs text-[#6e6e73] mt-1">
                              {pushStatus === "enabled" && "Enabled on this device."}
                              {pushStatus === "disabled" && "Permission is available, but this device is not subscribed yet."}
                              {pushStatus === "blocked" && "Permission is blocked in the browser. Allow notifications in site settings first."}
                              {pushStatus === "unsupported" && "This browser does not support web push."}
                              {pushStatus === "unavailable" && "Server VAPID keys are missing, so push cannot be delivered yet."}
                              {pushStatus === "checking" && "Checking current device status..."}
                            </p>
                            {pushConfigured && !pushDeliveryReady ? (
                              <p className="mt-2 text-xs text-[#6e6e73]">
                                Device subscription is ready, but automatic backend delivery still needs: {pushMissingConfig.filter((item) => item === "SUPABASE_SERVICE_ROLE_KEY").join(", ") || "server completion"}.
                              </p>
                            ) : null}
                          </div>
                          <button
                            onClick={pushStatus === "enabled" ? disableBrowserPush : enableBrowserPush}
                            disabled={pushBusy || pushStatus === "unsupported" || (!pushConfigured && pushStatus === "unavailable")}
                            className="skeuo-button rounded-xl border border-[#d9d9de] bg-white px-4 py-2 text-sm font-semibold text-[#1d1d1f] transition hover:bg-[#F7F4EE] disabled:opacity-50"
                          >
                            {pushBusy ? "Updating..." : pushStatus === "enabled" ? "Disable on this device" : "Enable on this device"}
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={sendTestPush}
                            disabled={pushTestBusy || pushStatus !== "enabled"}
                            className="skeuo-button rounded-xl border border-[#d9d9de] px-4 py-2 text-sm font-semibold text-[#1d1d1f] disabled:opacity-50"
                          >
                            {pushTestBusy ? "Sending test..." : "Send test push"}
                          </button>
                          <p className="self-center text-xs text-[#6e6e73]">Test push uses your signed-in session so you can verify delivery and click-through immediately on this device.</p>
                        </div>
                        {pushMessage ? <p className="mt-3 text-xs text-[#0071e3]">{pushMessage}</p> : null}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <button
                          onClick={() => handleNotificationChannelToggle("routineNotifications")}
                          className={`rounded-xl border px-4 py-3 text-left transition ${settings.routineNotifications ? "bg-[#0071e3]/10 border-[#0071e3]/40" : "bg-white/40 border-white/40"}`}
                        >
                          <p className="text-sm font-semibold text-[#1d1d1f]">Routine Alerts</p>
                          <p className="text-xs text-[#6e6e73] mt-1">AM/PM completion and missed routine nudges</p>
                        </button>
                        <button
                          onClick={() => handleNotificationChannelToggle("challengeNotifications")}
                          className={`rounded-xl border px-4 py-3 text-left transition ${settings.challengeNotifications ? "bg-[#0071e3]/10 border-[#0071e3]/40" : "bg-white/40 border-white/40"}`}
                        >
                          <p className="text-sm font-semibold text-[#1d1d1f]">Challenge Milestones</p>
                          <p className="text-xs text-[#6e6e73] mt-1">Start updates and milestone-day achievements</p>
                        </button>
                        <button
                          onClick={() => handleNotificationChannelToggle("progressNotifications")}
                          className={`rounded-xl border px-4 py-3 text-left transition ${settings.progressNotifications ? "bg-[#0071e3]/10 border-[#0071e3]/40" : "bg-white/40 border-white/40"}`}
                        >
                          <p className="text-sm font-semibold text-[#1d1d1f]">Progress Signals</p>
                          <p className="text-xs text-[#6e6e73] mt-1">Improvements and streak notifications</p>
                        </button>
                        <button
                          onClick={() => handleNotificationChannelToggle("tipNotifications")}
                          className={`rounded-xl border px-4 py-3 text-left transition ${settings.tipNotifications ? "bg-[#0071e3]/10 border-[#0071e3]/40" : "bg-white/40 border-white/40"}`}
                        >
                          <p className="text-sm font-semibold text-[#1d1d1f]">Daily Tips</p>
                          <p className="text-xs text-[#6e6e73] mt-1">One tactical optimization tip per day</p>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                        <div className="af-card-secondary p-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#5e5e5e]">Routine window</p>
                          <p className="mt-2 text-sm font-semibold text-[#000000]">07:30 to 09:00</p>
                          <p className="mt-1 text-xs text-[#5e5e5e]">Morning reminder block ({settings.timezone})</p>
                        </div>
                        <div className="af-card-secondary p-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#5e5e5e]">Night window</p>
                          <p className="mt-2 text-sm font-semibold text-[#000000]">20:00 to 22:00</p>
                          <p className="mt-1 text-xs text-[#5e5e5e]">PM completion and streak nudges</p>
                        </div>
                        <div className="af-card-secondary p-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#5e5e5e]">Delivery state</p>
                          <p className="mt-2 text-sm font-semibold text-[#000000]">{pushStatus === "enabled" ? "Subscribed" : "Not subscribed"}</p>
                          <p className="mt-1 text-xs text-[#5e5e5e]">{pushDeliveryReady ? "Server path complete" : "Pending server follow-up"}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#1d1d1f] mb-1">Email Updates</h3>
                          <p className="text-sm text-[#6e6e73]">Product recommendations via email</p>
                        </div>
                        <Toggle active={settings.emailUpdates} onClick={() => handleToggle("emailUpdates")} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#1d1d1f] mb-1">Weekly Report</h3>
                          <p className="text-sm text-[#6e6e73]">Summary of your weekly progress</p>
                        </div>
                        <Toggle active={settings.weeklyReport} onClick={() => handleToggle("weeklyReport")} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ==================== PRIVACY ==================== */}
            <section className="nv-section-white overflow-hidden">
              <SectionHeader icon={Shield} title="Privacy & Security" color="text-green-400" sectionKey="privacy" />
              <AnimatePresence>
                {expandedSection === "privacy" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6 border-t border-white/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#1d1d1f] mb-1">Data Collection</h3>
                          <p className="text-sm text-[#6e6e73]">Allow anonymous usage stats to improve AI</p>
                        </div>
                        <Toggle active={settings.dataCollection} onClick={() => handleToggle("dataCollection")} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#1d1d1f] mb-1">Two-Factor Authentication</h3>
                          <p className="text-sm text-[#6e6e73]">Extra layer of security</p>
                        </div>
                        <Toggle active={settings.twoFactor} onClick={() => handleToggle("twoFactor")} />
                      </div>

                      <div className="pt-4 border-t border-white/40">
                        <button className="w-full text-left p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition">
                          <p className="text-red-500 font-bold">Delete All Data</p>
                          <p className="text-xs text-[#6e6e73] mt-1">Permanently remove all your data from this device</p>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

          </div>
          </div>
        </div>
      </Container>
    </div>
  );
}


