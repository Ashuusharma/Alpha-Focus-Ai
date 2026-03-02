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
import { AuthContext } from "@/contexts/AuthProvider";
import { readUserState, writeUserState } from "@/lib/dbUserState";
import { useContext } from "react";

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
  const { user } = useContext(AuthContext);
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
  }, []);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      const saved = await readUserState<UserPreferences>(user.id, "oneman_preferences");
      if (saved) {
        setSettings(saved);
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
    }
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
        active ? "bg-[#2F6F57] shadow-sm" : "bg-black/10"
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
        <span className="font-bold text-[#1F3D2B]">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[#2F6F57]/10 text-[#2F6F57] text-xs font-bold">
            {badge}
          </span>
        )}
      </div>
      <ChevronDown className={`w-5 h-5 text-[#6B665D] transition-transform duration-300 ${expandedSection === sectionKey ? 'rotate-180' : ''}`} />
    </button>
  );

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-[#F4EFE6] via-[#EFE8DD] to-[#E5E0D4] text-[#1F3D2B] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-[#2F6F57]/5 blur-[120px] rounded-full opacity-30 animate-pulse" />
        <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-[#A9CBB7]/20 blur-[120px] rounded-full opacity-30" />
      </div>

      <Container>
        <div className="max-w-3xl mx-auto relative z-10">
          {/* HEADER */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-[#6B665D] hover:text-[#1F3D2B] transition group mb-6"
            >
              <div className="p-1.5 rounded-lg bg-white/60 backdrop-blur-md border border-white/40 group-hover:border-[#2F6F57]/50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/40 backdrop-blur-sm border border-white/40 flex items-center justify-center text-[#2F6F57]">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#1F3D2B]">Settings</h1>
                  <p className="text-sm text-[#6B665D]">Manage your preferences</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => router.push("/assessment")} className="px-3 py-1.5 rounded-xl border border-[#D9D2C7] bg-white text-xs font-semibold text-[#2F6F57] hover:bg-[#F7F4EE] transition-colors">Questions</button>
                    <button onClick={() => router.push("/image-analyzer")} className="px-3 py-1.5 rounded-xl border border-[#D9D2C7] bg-white text-xs font-semibold text-[#2F6F57] hover:bg-[#F7F4EE] transition-colors">Photo Scan</button>
                    <button onClick={() => router.push("/tracking")} className="px-3 py-1.5 rounded-xl border border-[#D9D2C7] bg-white text-xs font-semibold text-[#2F6F57] hover:bg-[#F7F4EE] transition-colors">Track Lifestyle</button>
                    <button onClick={() => router.push("/reports/weekly")} className="px-3 py-1.5 rounded-xl border border-[#D9D2C7] bg-white text-xs font-semibold text-[#2F6F57] hover:bg-[#F7F4EE] transition-colors">Weekly Report</button>
                    <button onClick={() => router.push("/data-settings")} className="px-3 py-1.5 rounded-xl border border-[#D9D2C7] bg-white text-xs font-semibold text-[#2F6F57] hover:bg-[#F7F4EE] transition-colors">Data Settings</button>
                    <button onClick={() => router.push("/privacy-policy")} className="px-3 py-1.5 rounded-xl border border-[#D9D2C7] bg-white text-xs font-semibold text-[#2F6F57] hover:bg-[#F7F4EE] transition-colors">Privacy Policy</button>
                    <button onClick={() => router.push("/upgrade")} className="px-3 py-1.5 rounded-xl bg-medical-gradient text-xs font-semibold text-[#F4F1EB] transition-colors">Upgrade</button>
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
            <section className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/40 shadow-sm">
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
                        <h3 className="font-bold text-[#1F3D2B] mb-3 flex items-center gap-2">
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
                                  ? "bg-[#2F6F57]/10 border-[#2F6F57] text-[#2F6F57]"
                                  : "bg-white/40 border-white/40 hover:bg-white/60 text-[#6B665D]"
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
            <section className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/40 shadow-sm">
              <SectionHeader icon={Languages} title="Language & Region" color="text-emerald-400" sectionKey="language" />
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
                        <h3 className="font-bold text-[#1F3D2B] mb-3">Select Language</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {languages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => handleChange("language", lang.code)}
                              className={`p-3 rounded-xl border transition-all text-left ${
                                settings.language === lang.code
                                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                                  : "bg-white/40 border-white/40 hover:bg-white/60 text-[#6B665D]"
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
                        <label className="block text-sm font-bold text-[#6B665D] mb-2">Timezone</label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleChange("timezone", e.target.value)}
                          className="w-full bg-white/40 border border-white/40 rounded-xl p-3 text-[#1F3D2B] focus:outline-none focus:border-[#2F6F57] transition"
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
            <section className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/40 shadow-sm">
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
                      <p className="text-sm text-[#6B665D]">
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
                            className="flex-1 bg-white/40 border border-white/40 rounded-xl px-4 py-3 text-[#1F3D2B] placeholder-[#8C877D] focus:outline-none focus:border-[#2F6F57]"
                            onKeyPress={(e) => e.key === "Enter" && handleAddIngredient()}
                          />
                          <select
                            value={newIngredientReason}
                            onChange={(e) => setNewIngredientReason(e.target.value as "allergy" | "sensitivity" | "preference" | "other")}
                            className="bg-white/40 border border-white/40 rounded-xl px-3 text-[#1F3D2B] focus:outline-none"
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
                          <p className="text-xs text-[#6B665D] mb-2">Quick add common allergens:</p>
                          <div className="flex flex-wrap gap-2">
                            {commonAllergens.slice(0, 6).map((allergen) => (
                              <button
                                key={allergen.name}
                                onClick={() => addIngredient({ name: allergen.name, reason: "sensitivity" })}
                                disabled={blacklist.some(b => b.name.toLowerCase() === allergen.name.toLowerCase())}
                                className="px-3 py-1.5 text-xs rounded-full bg-white/40 border border-white/40 text-[#6B665D] hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 transition disabled:opacity-30"
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
                            <h4 className="text-sm font-bold text-[#1F3D2B]">Your Blacklist ({blacklist.length})</h4>
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
                                    "bg-gray-500/10 text-[#6B665D]"
                                  }`}>
                                    {item.reason}
                                  </span>
                                  <span className="text-[#1F3D2B] font-medium">{item.name}</span>
                                </div>
                                <button
                                  onClick={() => removeIngredient(item.id)}
                                  className="p-1.5 text-[#6B665D] hover:text-red-500 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[#6B665D]">
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
            <section className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/40 shadow-sm">
              <SectionHeader 
                icon={Camera} 
                title="Photo Gallery" 
                color="text-[#2F6F57]" 
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
                          <p className="text-[#1F3D2B] font-medium">{photos.length} photos saved</p>
                          <p className="text-xs text-[#6B665D]">Progress photos are stored locally on your device</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push("/saved-scans")}
                            className="px-4 py-2 bg-white/40 text-[#2F6F57] rounded-lg border border-white/40 hover:bg-white/60 transition flex items-center gap-2"
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
            <section className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/40 shadow-sm">
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
                        <p className="text-[#1F3D2B] font-medium">{wishlistItems.length} products saved</p>
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
                                <p className="text-[#1F3D2B] font-medium">{item.name}</p>
                                <p className="text-xs text-[#6B665D]">{item.type} • {item.price}</p>
                              </div>
                              <span className="text-pink-400">{item.rating} ★</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[#6B665D]">
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
                          <p className="text-xs uppercase tracking-wider text-[#6B665D] mb-1">Current Balance</p>
                          <p className="text-2xl font-bold text-[#EAB308]">{credits} A$</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/40 border border-white/40">
                          <p className="text-xs uppercase tracking-wider text-[#6B665D] mb-1">Lifetime Earned</p>
                          <p className="text-2xl font-bold text-[#1F3D2B]">{lifetimeCredits} A$</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/40 border border-white/40">
                          <p className="text-xs uppercase tracking-wider text-[#6B665D] mb-1">Discount Status</p>
                          <p className="text-sm font-bold text-emerald-600">
                            {activeDiscount ? `${activeDiscount.discountPercent}% Active` : "No active code"}
                          </p>
                        </div>
                      </div>

                      {activeDiscount ? (
                        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                          <p className="font-semibold text-emerald-700">{activeDiscount.label} Tier • {activeDiscount.discountPercent}% OFF</p>
                          <p className="text-sm text-emerald-600 mt-1">Code: {activeDiscount.code}</p>
                          <p className="text-xs text-emerald-600 mt-1">Valid till: {new Date(activeDiscount.expiresAt).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-3 gap-3">
                          {tiers.map((tier) => (
                            <button
                              key={tier.id}
                              onClick={() => handleRedeem(tier.id)}
                              className="p-4 rounded-xl text-left bg-white/40 border border-white/40 hover:border-[#2F6F57]/40 hover:bg-white/60 transition"
                            >
                              <p className="font-semibold text-[#1F3D2B]">{tier.label}</p>
                              <p className="text-xs text-[#6B665D] mt-1">{tier.discountPercent}% discount</p>
                              <p className="text-xs text-[#2F6F57] mt-1">Redeem: {tier.creditsCost} A$</p>
                            </button>
                          ))}
                        </div>
                      )}

                      {walletMessage && (
                        <p className="text-sm text-[#2F6F57]">{walletMessage}</p>
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
                          className="px-4 py-2 rounded-lg bg-[#E8EFEA] border border-[#C8DACF] text-[#2F6F57] hover:bg-[#DCE8E0] transition text-sm font-medium"
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
                          <h3 className="font-bold text-[#1F3D2B] mb-1">Push Notifications</h3>
                          <p className="text-sm text-[#6B665D]">Get alerts about analysis results</p>
                        </div>
                        <Toggle active={settings.notifications} onClick={() => handleToggle("notifications")} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#1F3D2B] mb-1">Email Updates</h3>
                          <p className="text-sm text-[#6B665D]">Product recommendations via email</p>
                        </div>
                        <Toggle active={settings.emailUpdates} onClick={() => handleToggle("emailUpdates")} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#1F3D2B] mb-1">Weekly Report</h3>
                          <p className="text-sm text-[#6B665D]">Summary of your weekly progress</p>
                        </div>
                        <Toggle active={settings.weeklyReport} onClick={() => handleToggle("weeklyReport")} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* ==================== PRIVACY ==================== */}
            <section className="bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/40 shadow-sm">
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
                          <h3 className="font-bold text-[#1F3D2B] mb-1">Data Collection</h3>
                          <p className="text-sm text-[#6B665D]">Allow anonymous usage stats to improve AI</p>
                        </div>
                        <Toggle active={settings.dataCollection} onClick={() => handleToggle("dataCollection")} />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#1F3D2B] mb-1">Two-Factor Authentication</h3>
                          <p className="text-sm text-[#6B665D]">Extra layer of security</p>
                        </div>
                        <Toggle active={settings.twoFactor} onClick={() => handleToggle("twoFactor")} />
                      </div>

                      <div className="pt-4 border-t border-white/40">
                        <button className="w-full text-left p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition">
                          <p className="text-red-500 font-bold">Delete All Data</p>
                          <p className="text-xs text-[#6B665D] mt-1">Permanently remove all your data from this device</p>
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
