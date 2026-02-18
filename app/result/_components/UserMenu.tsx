"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMounted } from "@/app/hooks/useMounted";
import { useCartStore } from "@/lib/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, ShoppingCart, Settings, LogOut, ChevronDown, 
  Sparkles, Trophy, BookOpen, ScanFace,
  History, Target, Zap, Bell, HelpCircle, MessageCircle,
  Crown, BarChart3, type LucideIcon
} from "lucide-react";

export default function UserMenu() {
  const mounted = useMounted();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(3); // Mock notification count
  const cartCount = useCartStore((s) => s.items.length);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (menuOpen && !target.closest('.user-menu-container')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  if (!mounted) return null;

  const navLinks: Array<{ label: string; href: string; icon: LucideIcon; matchers?: string[] }> = [
    { label: "Assistant", href: "/", icon: MessageCircle },
    { label: "Photo Analyzer", href: "/image-analyzer", icon: ScanFace, matchers: ["/image-analyzer"] },
    { label: "Challenges", href: "/challenges", icon: Trophy, matchers: ["/challenges"] },
    { label: "Learn", href: "/learning-center", icon: BookOpen, matchers: ["/learning-center"] },
    { label: "Progress", href: "/dashboard", icon: BarChart3, matchers: ["/dashboard", "/result", "/compare-results", "/saved-scans"] },
  ];

  const desktopLinks = navLinks;
  const mobileLinks = navLinks;

  const isActive = (item: { href: string; matchers?: string[] }) => {
    if (item.href === "/" && pathname === "/") return true;
    const prefixes = item.matchers ?? [item.href];
    return prefixes.some((prefix) => pathname?.startsWith(prefix));
  };

  const handleSignOut = () => {
    localStorage.removeItem("oneman_user_name");
    localStorage.removeItem("oneman_last_login");
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[rgba(5,10,26,0.76)] backdrop-blur-xl shadow-[0_10px_28px_rgba(2,6,23,0.32)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 group rounded-xl p-1.5 -m-1.5 hover:bg-white/5 transition-all duration-300"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Alpha <span className="text-blue-400">Focus</span></span>
        </button>

        {/* CENTER - NAV ITEMS (DESKTOP) */}
          <div className="hidden md:flex items-center gap-1 p-1.5 rounded-2xl bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)]">
          {desktopLinks.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <button 
                key={item.label}
                onClick={() => router.push(item.href)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  active 
                    ? 'bg-[var(--lux-accent)]/10 text-[var(--lux-accent)] border border-[var(--lux-accent)]/20 shadow-[0_0_10px_rgba(0,242,255,0.1)]' 
                    : 'text-[var(--lux-text-muted)] hover:text-[var(--lux-text-primary)] hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[var(--lux-accent)]' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* RIGHT - NOTIFICATIONS + CART + USER MENU */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/upgrade")}
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-amber-400/50 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/10"
          >
            <Crown className="w-3.5 h-3.5" />
            Upgrade to Pro
          </button>
          
          {/* NOTIFICATIONS */}
          <button
            onClick={() => {
              setNotifications(0);
            }}
            className="relative p-2.5 text-[var(--lux-text-muted)] hover:text-[var(--lux-accent)] hover:bg-[var(--lux-accent)]/10 rounded-xl transition-all duration-300"
          >
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--danger)] text-[9px] font-bold text-white shadow-lg"
              >
                {notifications}
              </motion.span>
            )}
          </button>

          {/* CART BADGE */}
          <button
            onClick={() => useCartStore.getState().openCart()}
            className="relative p-2.5 text-[var(--lux-text-muted)] hover:text-[var(--lux-accent)] hover:bg-[var(--lux-accent)]/10 rounded-xl transition-all duration-300"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--lux-accent)] text-[9px] font-bold text-[#060b14] shadow-[0_0_10px_var(--lux-accent)]"
              >
                {cartCount}
              </motion.span>
            )}
          </button>

          {/* USER MENU TOGGLE */}
          <div className="relative user-menu-container">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border transition-all duration-300 ${
                menuOpen 
                  ? 'border-[var(--lux-accent)]/40 bg-[var(--lux-accent)]/10 shadow-[0_0_15px_rgba(0,242,255,0.2)]' 
                  : 'border-[var(--lux-glass-border)] bg-[var(--lux-bg-elevated)] hover:bg-[var(--lux-bg-secondary)] hover:border-[var(--lux-accent)]/30'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--lux-accent)] to-[var(--lux-accent-secondary)] flex items-center justify-center shadow-lg text-[#060b14]">
                <User className="w-4 h-4" />
              </div>
              <ChevronDown className={`w-4 h-4 text-[var(--lux-text-muted)] transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* DROPDOWN MENU */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 mt-3 w-80 rounded-2xl border border-[var(--lux-glass-border)] bg-[#060b14]/95 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden z-[100]"
                >
                  {/* Header with Premium Badge */}
                  <div className="relative p-5 border-b border-[var(--lux-glass-border)] bg-gradient-to-br from-[var(--lux-accent)]/5 to-transparent overflow-hidden">
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wide">
                        <Crown className="w-3 h-3" /> Free Tier
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--lux-accent)] to-[var(--lux-accent-secondary)] flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)] text-[#060b14]">
                        <User className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--lux-text-primary)]">Guest User</p>
                        <p className="text-xs text-[var(--lux-text-muted)]">Sign in for full features</p>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-5">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-[var(--lux-text-muted)]">Profile Completion</span>
                        <span className="text-[var(--lux-accent)] font-semibold">40%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--lux-bg-secondary)] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '40%' }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className="h-full bg-gradient-to-r from-[var(--lux-accent-secondary)] to-[var(--lux-accent)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3 p-4 border-b border-[var(--lux-glass-border)]">
                    <div className="text-center p-3 rounded-xl bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)]">
                      <p className="text-xl font-bold text-[var(--lux-text-primary)]">3</p>
                      <p className="text-[10px] text-[var(--lux-text-muted)] uppercase tracking-wide">Scans</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)]">
                      <p className="text-xl font-bold text-[var(--lux-accent)]">7</p>
                      <p className="text-[10px] text-[var(--lux-text-muted)] uppercase tracking-wide">Streak</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)]">
                      <p className="text-xl font-bold text-blue-300">85%</p>
                      <p className="text-[10px] text-[var(--lux-text-muted)] uppercase tracking-wide">Progress</p>
                    </div>
                  </div>

                  {/* Menu Items - Organized in Sections */}
                  <div className="p-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-[var(--lux-text-subtle)] uppercase tracking-wider">My Account</p>
                    <div className="space-y-0.5">
                      <MenuItem 
                        icon={User} 
                        label="Edit Profile" 
                        sub="Update photo & info"
                        badge={null}
                        onClick={() => { router.push("/profile"); setMenuOpen(false); }}
                      />
                      <MenuItem 
                        icon={BarChart3} 
                        label="My Dashboard" 
                        sub="Recovery progress"
                        badge="New"
                        badgeColor="primary"
                        onClick={() => { router.push("/dashboard"); setMenuOpen(false); }}
                      />
                      <MenuItem 
                        icon={History} 
                        label="Saved Scans" 
                        sub="View past analyses"
                        badge="3"
                        badgeColor="gray"
                        onClick={() => { router.push("/saved-scans"); setMenuOpen(false); }}
                      />
                    </div>

                    <p className="px-3 py-1.5 mt-2 text-[10px] font-bold text-[var(--lux-text-subtle)] uppercase tracking-wider">Tools</p>
                    <div className="space-y-0.5">
                      <MenuItem 
                        icon={ScanFace} 
                        label="Photo Analyzer" 
                        sub="AI-powered skin scan"
                        badge={null}
                        onClick={() => { router.push("/image-analyzer"); setMenuOpen(false); }}
                      />
                      <MenuItem 
                        icon={Trophy} 
                        label="Challenges" 
                        sub="30/60/90 day glow up"
                        badge="Active"
                        badgeColor="info"
                        onClick={() => { router.push("/challenges"); setMenuOpen(false); }}
                      />
                      <MenuItem 
                        icon={Target} 
                        label="Goal Tracker" 
                        sub="Set & track targets"
                        badge={null}
                        onClick={() => { router.push("/dashboard"); setMenuOpen(false); }}
                      />
                    </div>

                    <p className="px-3 py-1.5 mt-2 text-[10px] font-bold text-[var(--lux-text-subtle)] uppercase tracking-wider">Resources</p>
                    <div className="space-y-0.5">
                      <MenuItem 
                        icon={BookOpen} 
                        label="Learning Center" 
                        sub="Grooming knowledge"
                        badge={null}
                        onClick={() => { router.push("/learning-center"); setMenuOpen(false); }}
                      />
                      <MenuItem 
                        icon={HelpCircle} 
                        label="Help & Support" 
                        sub="FAQs and guidance"
                        badge={null}
                        onClick={() => { router.push("/learning-center"); setMenuOpen(false); }}
                      />
                    </div>
                  </div>

                  {/* Settings & Logout */}
                  <div className="p-3 border-t border-[var(--lux-glass-border)] flex gap-2">
                    <button
                      onClick={() => { router.push("/settings"); setMenuOpen(false); }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-[var(--lux-text-muted)] hover:text-[var(--lux-accent)] hover:bg-[var(--lux-accent)]/10 rounded-xl transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-[var(--danger)]/10 rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>

                  {/* Upgrade CTA */}
                  <div className="p-4 bg-gradient-to-r from-[var(--lux-accent)]/10 via-[var(--lux-accent-secondary)]/10 to-[var(--lux-accent)]/10 border-t border-[var(--lux-accent)]/20">
                    <button 
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/upgrade");
                      }}
                      className="w-full lux-btn-primary flex items-center justify-center gap-2 py-3 text-sm"
                    >
                      <Zap className="w-4 h-4" />
                      Upgrade to Premium
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
    
    {/* Mobile Nav (Bottom Bar) */}
    <div className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-[var(--lux-glass-border)] bg-[#060b14]/95 backdrop-blur-xl pb-[calc(0.55rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(0,0,0,0.45)]">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-2">
        {mobileLinks.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <button 
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-all ${
                active ? 'text-[var(--lux-accent)]' : 'text-[var(--lux-text-muted)] hover:text-[var(--lux-text-secondary)]'
              }`}
              aria-label={item.label}
            >
              <div className={`rounded-lg p-1.5 ${active ? 'bg-[var(--lux-accent)]/10 border border-[var(--lux-accent)]/20' : 'bg-transparent border border-transparent'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
    </>
  );
}

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  sub: string;
  badge?: string | null;
  badgeColor?: 'primary' | 'info' | 'soft' | 'gray';
  onClick: () => void;
}

function MenuItem({ icon: Icon, label, sub, badge, badgeColor = 'primary', onClick }: MenuItemProps) {
  const badgeColors = {
    primary: 'bg-[var(--lux-accent)]/15 text-[var(--lux-accent)] border-[var(--lux-accent)]/25',
    info: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
    soft: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
    gray: 'bg-white/10 text-[var(--lux-text-muted)] border-[var(--lux-glass-border)]',
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[var(--lux-accent)]/5 transition-all duration-300 group"
    >
      <div className="p-2.5 rounded-xl bg-[var(--lux-bg-elevated)] border border-[var(--lux-glass-border)] text-[var(--lux-text-muted)] group-hover:text-[var(--lux-accent)] group-hover:border-[var(--lux-accent)]/20 transition-all duration-300">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--lux-text-secondary)] group-hover:text-[var(--lux-text-primary)] transition-colors">{label}</p>
        <p className="text-xs text-[var(--lux-text-subtle)] truncate">{sub}</p>
      </div>
      {badge && (
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeColors[badgeColor]}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
