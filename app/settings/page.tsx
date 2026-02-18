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
import { useRewardsStore } from "@/lib/rewardsStore";
import { languages } from "@/lib/languageContext";

interface UserPreferences {
  notifications: boolean;
  emailUpdates: boolean;
  weeklyReport: boolean;
  dataCollection: boolean;
  twoFactor: boolean;
  theme: "dark" | "light" | "system";
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
    theme: "dark",
    language: "en",
    timezone: "Asia/Kolkata",
  });
  const [saved, setSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [newIngredient, setNewIngredient] = useState("");
  const [newIngredientReason, setNewIngredientReason] = useState<"allergy" | "sensitivity" | "preference" | "other">("preference");
  const [walletMessage, setWalletMessage] = useState("");

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

  // Apply theme
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", settings.theme);
    localStorage.setItem("oneman-theme", settings.theme);
  }, [settings.theme, mounted]);

  // Apply language
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("oneman-language", settings.language);
  }, [settings.language, mounted]);

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
        active ? "bg-[var(--lux-accent)] shadow-[0_0_10px_var(--lux-accent)]" : "bg-[var(--lux-bg-secondary)]"
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
      className="w-full bg-[var(--lux-bg-elevated)] px-6 py-4 flex items-center justify-between hover:bg-[var(--lux-bg-secondary)] transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="font-bold text-[var(--lux-text-primary)]">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[var(--lux-accent)]/20 text-[var(--lux-accent)] text-xs font-bold">
            {badge}
          </span>
        )}
      </div>
      <ChevronDown className={`w-5 h-5 text-[var(--lux-text-muted)] transition-transform duration-300 ${expandedSection === sectionKey ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <div className="min-h-screen py-8 bg-[var(--lux-bg-primary)] text-[var(--lux-text-primary)] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[var(--lux-accent)]/5 blur-[120px] rounded-full opacity-30 animate-pulse" />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-[#0066ff]/5 blur-[120px] rounded-full opacity-30" />
      </div>

      <Container>
        <div className="max-w-3xl mx-auto relative z-10">
          {/* HEADER */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-[var(--lux-text-muted)] hover:text-[var(--lux-text-primary)] transition group mb-6"
            >
              <div className="p-1.5 rounded-lg bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] group-hover:border-[var(--lux-accent)]/50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)] flex items-center justify-center text-[var(--lux-accent)]">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[var(--lux-text-secondary)]">Settings</h1>
                  <p className="text-sm text-[var(--lux-text-muted)]">Manage your preferences</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => router.push("/assessment")} className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/[0.04] text-xs font-semibold hover:bg-white/[0.08] transition-colors">Questions</button>
                    <button onClick={() => router.push("/image-analyzer")} className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/[0.04] text-xs font-semibold hover:bg-white/[0.08] transition-colors">Photo Scan</button>
                    <button onClick={() => router.push("/tracking")} className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/[0.04] text-xs font-semibold hover:bg-white/[0.08] transition-colors">Track Lifestyle</button>
                    <button onClick={() => router.push("/reports/weekly")} className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/[0.04] text-xs font-semibold hover:bg-white/[0.08] transition-colors">Weekly Report</button>
                    <button onClick={() => router.push("/data-settings")} className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/[0.04] text-xs font-semibold hover:bg-white/[0.08] transition-colors">Data Settings</button>
                    <button onClick={() => router.push("/privacy-policy")} className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/[0.04] text-xs font-semibold hover:bg-white/[0.08] transition-colors">Privacy Policy</button>
                    <button onClick={() => router.push("/upgrade")} className="px-3 py-1.5 rounded-xl bg-blue-600 text-xs font-semibold hover:bg-blue-500 transition-colors">Upgrade</button>
                  </div>
                </div>
              </div>
              <motion.button
                onClick={handleSave}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  saved 
                  ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                  : 'bg-[var(--lux-accent)] text-black hover:shadow-[0_0_20px_var(--lux-accent)]'
                }`}>
                {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {saved ? "Saved!" : "Save"}
              </motion.button>
            </div>
          </div>

          <div className="space-y-4">
            
            {/* ==================== APPEARANCE ==================== */}
            <section className="lux-card rounded-2xl overflow-hidden border border-[var(--lux-glass-border)]">
              <SectionHeader icon={Palette} title="Appearance" color="text-purple-400" sectionKey="appearance" />
              <AnimatePresence>
                {expandedSection === "appearance" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6 border-t border-[var(--lux-glass-border)]">
                      {/* Theme Selector */}
                      <div>
                        <h3 className="font-bold text-[var(--lux-text-primary)] mb-3 flex items-center gap-2">
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
                                  ? "bg-[var(--lux-accent)]/20 border-[var(--lux-accent)] text-[var(--lux-accent)]"
                                  : "bg-[var(--lux-bg-elevated)] border-[var(--lux-glass-border)] hover:bg-[var(--lux-bg-secondary)] text-[var(--lux-text-muted)]"
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
            <section className="lux-card rounded-2xl overflow-hidden border border-[var(--lux-glass-border)]">
              <SectionHeader icon={Languages} title="Language & Region" color="text-emerald-400" sectionKey="language" />
              <AnimatePresence>
                {expandedSection === "language" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6 border-t border-[var(--lux-glass-border)]">
                      {/* Language Grid */}
                      <div>
                        <h3 className="font-bold text-[var(--lux-text-primary)] mb-3">Select Language</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => handleChange("language", lang.code)}
                              className={`p-3 rounded-xl border transition-all text-left ${
                                settings.language === lang.code
                                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                  : "bg-[var(--lux-bg-elevated)] border-[var(--lux-glass-border)] hover:bg-[var(--lux-bg-secondary)] text-[var(--lux-text-muted)]"
                              }`}
                            >
                              <span className="text-xl mr-2">{lang.flag}</span>
                              <span className="font-medium">{lang.nativeName}</span>
                              <p className="text-xs text-[var(--lux-text-muted)] mt-0.5">{lang.name}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Timezone */}
                      <div>
                        <label className="block text-sm font-bold text-[var(--lux-text-muted)] mb-2">Timezone</label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleChange("timezone", e.target.value)}
                          className="w-full bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)] rounded-xl p-3 text-[var(--lux-text-primary)] focus:outline-none focus:border-[var(--lux-accent)] transition"
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
            <section className="lux-card rounded-2xl overflow-hidden border border-[var(--lux-glass-border)]">
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
                    <div className="p-6 space-y-6 border-t border-[var(--lux-glass-border)]">
                      <p className="text-sm text-[var(--lux-text-muted)]">
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
                            className="flex-1 bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)] rounded-xl px-4 py-3 text-[var(--lux-text-primary)] placeholder-[var(--lux-text-muted)] focus:outline-none focus:border-[var(--lux-accent)]"
                            onKeyPress={(e) => e.key === "Enter" && handleAddIngredient()}
                          />
                          <select
                            value={newIngredientReason}
                            onChange={(e) => setNewIngredientReason(e.target.value as "allergy" | "sensitivity" | "preference" | "other")}
                            className="bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)] rounded-xl px-3 text-[var(--lux-text-primary)] focus:outline-none"
                          >
                            <option value="allergy">Allergy</option>
                            <option value="sensitivity">Sensitivity</option>
                            <option value="preference">Preference</option>
                            <option value="other">Other</option>
                          </select>
                          <button
                            onClick={handleAddIngredient}
                            className="px-4 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Quick Add Common Allergens */}
                        <div>
                          <p className="text-xs text-[var(--lux-text-muted)] mb-2">Quick add common allergens:</p>
                          <div className="flex flex-wrap gap-2">
                            {commonAllergens.slice(0, 6).map((allergen) => (
                              <button
                                key={allergen.name}
                                onClick={() => addIngredient({ name: allergen.name, reason: "sensitivity" })}
                                disabled={blacklist.some(b => b.name.toLowerCase() === allergen.name.toLowerCase())}
                                className="px-3 py-1.5 text-xs rounded-full bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)] text-[var(--lux-text-muted)] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-30"
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
                            <h4 className="text-sm font-bold text-[var(--lux-text-primary)]">Your Blacklist ({blacklist.length})</h4>
                            <button
                              onClick={clearBlacklist}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {blacklist.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)]"
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    item.reason === "allergy" ? "bg-red-500/20 text-red-400" :
                                    item.reason === "sensitivity" ? "bg-amber-500/20 text-amber-400" :
                                    "bg-gray-500/20 text-[var(--lux-text-muted)]"
                                  }`}>
                                    {item.reason}
                                  </span>
                                  <span className="text-[var(--lux-text-primary)] font-medium">{item.name}</span>
                                </div>
                                <button
                                  onClick={() => removeIngredient(item.id)}
                                  className="p-1.5 text-[var(--lux-text-muted)] hover:text-red-400 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[var(--lux-text-muted)]">
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
            <section className="lux-card rounded-2xl overflow-hidden border border-[var(--lux-glass-border)]">
              <SectionHeader 
                icon={Camera} 
                title="Photo Gallery" 
                color="text-blue-400" 
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
                    <div className="p-6 space-y-4 border-t border-[var(--lux-glass-border)]">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[var(--lux-text-primary)] font-medium">{photos.length} photos saved</p>
                          <p className="text-xs text-[var(--lux-text-muted)]">Progress photos are stored locally on your device</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push("/saved-scans")}
                            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> View All
                          </button>
                          {photos.length > 0 && (
                            <button
                              onClick={clearPhotos}
                              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition flex items-center gap-2"
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
                            <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-[var(--lux-bg-secondary)] relative">
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
            <section className="lux-card rounded-2xl overflow-hidden border border-[var(--lux-glass-border)]">
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
                    <div className="p-6 space-y-4 border-t border-[var(--lux-glass-border)]">
                      <div className="flex justify-between items-center">
                        <p className="text-[var(--lux-text-primary)] font-medium">{wishlistItems.length} products saved</p>
                        {wishlistItems.length > 0 && (
                          <button
                            onClick={clearWishlist}
                            className="text-xs text-red-400 hover:text-red-300"
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
                              className="flex items-center justify-between p-3 rounded-lg bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)]"
                            >
                              <div>
                                <p className="text-[var(--lux-text-primary)] font-medium">{item.name}</p>
                                <p className="text-xs text-[var(--lux-text-muted)]">{item.type} • {item.price}</p>
                              </div>
                              <span className="text-pink-400">{item.rating} ★</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[var(--lux-text-muted)]">
                          <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No products in wishlist</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ==================== REWARDS WALLET ==================== */}
            <section className="lux-card rounded-2xl overflow-hidden border border-[var(--lux-glass-border)]">
              <SectionHeader icon={Package} title="Rewards Wallet" color="text-yellow-400" sectionKey="rewards" />
              <AnimatePresence>
                {expandedSection === "rewards" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-5 border-t border-[var(--lux-glass-border)]">
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)]">
                          <p className="text-xs uppercase tracking-wider text-[var(--lux-text-muted)] mb-1">Available Credits</p>
                          <p className="text-2xl font-bold text-yellow-300">{credits}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)]">
                          <p className="text-xs uppercase tracking-wider text-[var(--lux-text-muted)] mb-1">Lifetime Earned</p>
                          <p className="text-2xl font-bold text-[var(--lux-text-primary)]">{lifetimeCredits}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)]">
                          <p className="text-xs uppercase tracking-wider text-[var(--lux-text-muted)] mb-1">Discount Status</p>
                          <p className="text-sm font-bold text-emerald-300">
                            {activeDiscount ? `${activeDiscount.discountPercent}% Active` : "No active code"}
                          </p>
                        </div>
                      </div>

                      {activeDiscount ? (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                          <p className="font-semibold text-emerald-300">{activeDiscount.label} Tier • {activeDiscount.discountPercent}% OFF</p>
                          <p className="text-sm text-emerald-200 mt-1">Code: {activeDiscount.code}</p>
                          <p className="text-xs text-emerald-200 mt-1">Valid till: {new Date(activeDiscount.expiresAt).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-3 gap-3">
                          {tiers.map((tier) => (
                            <button
                              key={tier.id}
                              onClick={() => handleRedeem(tier.id)}
                              className="p-4 rounded-xl text-left bg-[var(--lux-bg-secondary)] border border-[var(--lux-glass-border)] hover:border-[var(--lux-accent)]/40 hover:bg-[var(--lux-bg-elevated)] transition"
                            >
                              <p className="font-semibold text-[var(--lux-text-primary)]">{tier.label}</p>
                              <p className="text-xs text-[var(--lux-text-muted)] mt-1">{tier.discountPercent}% discount</p>
                              <p className="text-xs text-[var(--lux-accent)] mt-1">Redeem: {tier.creditsCost} credits</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {walletMessage && (
                        <p className="text-sm text-[var(--lux-accent)]">{walletMessage}</p>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => router.push("/challenges")}
                          className="px-4 py-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20 transition text-sm font-medium"
                        >
                          Earn via Challenges
                        </button>
                        <button
                          onClick={() => router.push("/result")}
                          className="px-4 py-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition text-sm font-medium"
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
            <section className="lux-card rounded-2xl overflow-hidden border border-[var(--lux-glass-border)]">
              <SectionHeader icon={Bell} title="Notifications" color="text-amber-400" sectionKey="notifications" />
              <AnimatePresence>
                {expandedSection === "notifications" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6 border-t border-[var(--lux-glass-border)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[var(--lux-text-primary)] mb-1">Push Notifications</h3>
                          <p className="text-sm text-[var(--lux-text-muted)]">Get alerts about analysis results</p>
                        </div>
                        <Toggle active={settings.notifications} onClick={() => handleToggle("notifications")} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[var(--lux-text-primary)] mb-1">Email Updates</h3>
                          <p className="text-sm text-[var(--lux-text-muted)]">Product recommendations via email</p>
                        </div>
                        <Toggle active={settings.emailUpdates} onClick={() => handleToggle("emailUpdates")} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[var(--lux-text-primary)] mb-1">Weekly Report</h3>
                          <p className="text-sm text-[var(--lux-text-muted)]">Summary of your weekly progress</p>
                        </div>
                        <Toggle active={settings.weeklyReport} onClick={() => handleToggle("weeklyReport")} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ==================== PRIVACY ==================== */}
            <section className="lux-card rounded-2xl overflow-hidden border border-[var(--lux-glass-border)]">
              <SectionHeader icon={Shield} title="Privacy & Security" color="text-green-400" sectionKey="privacy" />
              <AnimatePresence>
                {expandedSection === "privacy" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6 border-t border-[var(--lux-glass-border)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[var(--lux-text-primary)] mb-1">Data Collection</h3>
                          <p className="text-sm text-[var(--lux-text-muted)]">Allow anonymous usage stats to improve AI</p>
                        </div>
                        <Toggle active={settings.dataCollection} onClick={() => handleToggle("dataCollection")} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[var(--lux-text-primary)] mb-1">Two-Factor Authentication</h3>
                          <p className="text-sm text-[var(--lux-text-muted)]">Extra layer of security</p>
                        </div>
                        <Toggle active={settings.twoFactor} onClick={() => handleToggle("twoFactor")} />
                      </div>

                      <div className="pt-4 border-t border-[var(--lux-glass-border)]">
                        <button className="w-full text-left p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition">
                          <p className="text-red-400 font-bold">Delete All Data</p>
                          <p className="text-xs text-[var(--lux-text-muted)] mt-1">Permanently remove all your data from this device</p>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

          </div>
        </div>
      </Container>
    </div>
  );
}
