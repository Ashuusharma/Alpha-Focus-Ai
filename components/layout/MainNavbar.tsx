"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Activity,
  Bell,
  BookOpen,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  MapPin,
  Menu, // Added Menu icon
  RefreshCcw,
  ShoppingCart,
  User,
  X, // Added X icon
  Zap
} from "lucide-react";
import { useMounted } from "@/app/hooks/useMounted";
import { useLocation } from "@/app/hooks/useLocation";
import { useCartStore } from "@/lib/cartStore";
import { BRAND_LOGO_FALLBACK, BRAND_LOGO_LEGACY_FALLBACK, BRAND_LOGO_PRIMARY } from "@/lib/branding";
import AuthModal from "@/components/AuthModal";
import { AuthContext } from "@/contexts/AuthProvider";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import { useUserStore } from "@/stores/useUserStore";

const LINKS = [
  { label: "Home", href: "/dashboard" },
  { label: "Analyze", href: "/assessment" },
  { label: "Protocol", href: "/result" },
  { label: "Progress", href: "/alpha-credits" },
  { label: "Challenges", href: "/challenges" },
  { label: "Knowledge", href: "/learning-center" },
  { label: "Shop", href: "/shop" },
] as const;

const MOBILE_PRIMARY_LINKS = [
  { label: "Home", href: "/dashboard" },
  { label: "Protocol", href: "/result" },
  { label: "Progress", href: "/alpha-credits" },
] as const;

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  tag?: string;
  createdAt: string;
  ctaHref?: string;
  ctaLabel?: string;
  isRead?: boolean;
};

function formatTimeAgo(iso?: string) {
  if (!iso) return "Just now";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function mapCategoryToTag(category?: string) {
  if (category === "challenge") return "Program";
  if (category === "progress") return "Progress";
  if (category === "routine") return "Routine";
  if (category === "tips") return "Tip";
  return "System";
}

const LOGO_SOURCES = [BRAND_LOGO_PRIMARY, BRAND_LOGO_FALLBACK, BRAND_LOGO_LEGACY_FALLBACK] as const;

export default function MainNavbar() {
  const pathname = usePathname();
  const mounted = useMounted();
  const items = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);
  const { displayLabel, status: locationStatus, refreshLocation } = useLocation();
  const { user, profile, signOut } = useContext(AuthContext);
  const alphaStreak = useUserStore((state) => state.alphaStreak as Record<string, unknown> | null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const [toastPhase, setToastPhase] = useState<"enter" | "exit">("enter");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mountedDom, setMountedDom] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Added mobile menu state
  const [logoSrc, setLogoSrc] = useState<string>(LOGO_SOURCES[0]);

  const userDisplayName =
    profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "User";

  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const notificationTriggerRef = useRef<HTMLButtonElement | null>(null);
  const toastFadeTimerRef = useRef<number | null>(null);
  const toastHideTimerRef = useRef<number | null>(null);

  const visibleNotifications = useMemo(
    () => notifications,
    [notifications]
  );

  const refreshNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const headers = await getSupabaseAuthHeaders();
      const response = await fetch("/api/notifications?limit=20", { cache: "no-store", headers });
      if (response.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      if (!response.ok) return;
      const payload = (await response.json()) as {
        ok: boolean;
        notifications?: Array<{
          id: string;
          title: string;
          message: string;
          category: string;
          created_at: string;
          action_url: string | null;
          is_read: boolean;
        }>;
        unreadCount?: number;
      };
      if (!payload.ok || !Array.isArray(payload.notifications)) return;

      const mapped = payload.notifications
        .filter((item) => !item.is_read)
        .map((item) => ({
        id: item.id,
        title: item.title,
        body: item.message,
        tag: mapCategoryToTag(item.category),
        createdAt: item.created_at,
        time: formatTimeAgo(item.created_at),
        ctaHref: item.action_url || undefined,
        ctaLabel: item.action_url ? "Open" : undefined,
        isRead: Boolean(item.is_read),
      }));

      setNotifications(mapped);
      setUnreadCount(Number(payload.unreadCount || 0));
    } catch {
      return;
    }
  };

  const markNotificationRead = async (id: string) => {
    if (!user) return;

    try {
      const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
      await fetch("/api/notifications/read", {
        method: "POST",
        headers,
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {
      // Ignore transient read-write failures.
    }

    setNotifications((current) => current.filter((item) => item.id !== id));
    setUnreadCount((current) => Math.max(0, current - 1));
  };

  const dismissToast = (id?: string) => {
    if (toastFadeTimerRef.current) {
      window.clearTimeout(toastFadeTimerRef.current);
      toastFadeTimerRef.current = null;
    }
    if (toastHideTimerRef.current) {
      window.clearTimeout(toastHideTimerRef.current);
      toastHideTimerRef.current = null;
    }

    if (!id) {
      setToast(null);
      return;
    }

    setToastPhase("exit");
    void markNotificationRead(id);
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
      setToastPhase("enter");
    }, 220);
  };

  useEffect(() => {
    setMountedDom(true);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen]);

  // Calculate cart total safely
  const cartCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const locationText =
    locationStatus === "loading"
      ? "Detecting location..."
      : !displayLabel || displayLabel === "Local Area" || displayLabel === "Location not enabled"
        ? "Enable location"
        : displayLabel;

  const streakDays = Number(alphaStreak?.current_streak || 0);

  useEffect(() => {
    void refreshNotifications();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      void refreshNotifications();
    }, 30000);

    const onFocus = () => {
      void refreshNotifications();
    };
    window.addEventListener("focus", onFocus);

    const onVisibility = () => {
      if (!document.hidden) void refreshNotifications();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user?.id]);

  useEffect(() => {
    if (toast) return;

    const nextToast = visibleNotifications[0];
    if (!nextToast) return;

    setToast(nextToast);
    setToastPhase("enter");
  }, [toast, visibleNotifications]);

  useEffect(() => {
    if (!toast) return;

    if (toastFadeTimerRef.current) {
      window.clearTimeout(toastFadeTimerRef.current);
    }
    if (toastHideTimerRef.current) {
      window.clearTimeout(toastHideTimerRef.current);
    }

    toastFadeTimerRef.current = window.setTimeout(() => {
      setToastPhase("exit");
    }, 4500);

    toastHideTimerRef.current = window.setTimeout(() => {
      void markNotificationRead(toast.id);
      setToast((current) => (current?.id === toast.id ? null : current));
      setToastPhase("enter");
    }, 5000);

    return () => {
      if (toastFadeTimerRef.current) {
        window.clearTimeout(toastFadeTimerRef.current);
        toastFadeTimerRef.current = null;
      }
      if (toastHideTimerRef.current) {
        window.clearTimeout(toastHideTimerRef.current);
        toastHideTimerRef.current = null;
      }
    };
  }, [toast]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        notificationPanelRef.current?.contains(target) ||
        notificationTriggerRef.current?.contains(target)
      ) {
        return;
      }

      setShowNotifications(false);
    };

    document.addEventListener("pointerdown", handleClickOutside, true);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside, true);
    };
  }, [showNotifications]);

  useEffect(() => {
    if (!showNotifications) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowNotifications(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showNotifications]);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  if (!mounted) return <div className="h-20 bg-[#F4EFE6] border-b border-[#E2DDD3]" />;

  const notificationPanel = showNotifications && mountedDom
    ? createPortal(
        <div
          ref={notificationPanelRef}
          role="dialog"
          aria-label="Notifications"
          className="fixed top-[72px] left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[10000] w-[min(460px,calc(100vw-1rem))] max-h-[72vh] overflow-y-auto rounded-2xl border border-[#E2DDD3] bg-[#F8F4EC] p-4 shadow-xl"
          style={{ boxShadow: "0px 12px 40px rgba(31, 61, 43, 0.16)" }}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          <div className="flex items-start justify-between pb-3 mb-3 border-b border-[#E6E1D7]">
            <div className="space-y-0.5">
              <p className="text-lg font-semibold text-[#1F3D2B]">Updates & alerts</p>
              <p className="text-sm text-[#6C7A70]">Unread: {unreadCount}</p>
            </div>
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setShowNotifications(false)}
              className="h-7 w-7 rounded-full bg-[#E8E1D6] text-[#1F3D2B] flex items-center justify-center hover:bg-[#D9D2CD]"
            >
              ×
            </button>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void refreshNotifications();
              }}
              className="rounded-full border border-[#D9D2C6] px-3 py-1.5 text-xs font-semibold text-[#1F3D2B] hover:bg-white"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={async () => {
                const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
                await fetch("/api/notifications/read", {
                  method: "POST",
                  headers,
                  body: JSON.stringify({ all: true }),
                });
                setToast(null);
                void refreshNotifications();
              }}
              className="rounded-full border border-[#D9D2C6] px-3 py-1.5 text-xs font-semibold text-[#1F3D2B] hover:bg-white"
              disabled={visibleNotifications.length === 0}
            >
              Mark all read
            </button>
          </div>

          {visibleNotifications.length > 0 && (
            <div className="mb-3 rounded-xl border border-[#E2DDD3] bg-gradient-to-r from-[#F6F0E3] to-[#EFE8DD] px-4 py-3 text-sm text-[#1F3D2B]">
              <p className="font-semibold">You have {visibleNotifications.length} active notification{visibleNotifications.length === 1 ? "" : "s"}</p>
              <p className="text-xs text-[#6C7A70]">Latest routine, challenge, and progress updates for your account.</p>
            </div>
          )}

          <div className="space-y-2 pr-1">
            {visibleNotifications.length === 0 && (
              <div className="py-12 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-[#E8F1EC] flex items-center justify-center mb-3">
                  <Bell className="h-5 w-5 text-[#6C7A70]" />
                </div>
                <p className="text-sm font-semibold text-[#1F3D2B]">No active notifications</p>
                <p className="text-xs text-[#6C7A70]">You are all caught up.</p>
              </div>
            )}

            {visibleNotifications.map((note) => (
              <div
                key={note.id}
                className="group flex gap-3 p-3 rounded-xl border border-[#E6E1D7] bg-white/80 hover:bg-white shadow-[0_6px_16px_rgba(31,61,43,0.06)] transition-all"
              >
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-xl bg-[#E8F1EC] flex items-center justify-center text-[#2F5D46]">
                    {note.tag === "Program" ? <Activity className="h-4 w-4" /> : note.tag === "Progress" ? <Zap className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-[#1F3D2B] text-sm leading-snug break-words">{note.title}</p>
                    <span className="text-[11px] text-[#8A948C] flex-shrink-0 whitespace-nowrap">{note.time}</span>
                  </div>
                  <p className="text-sm text-[#4F5B52] leading-snug break-words">{note.body}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {note.tag && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#2F5D46] text-white text-[10px] font-semibold px-2 py-0.5 uppercase">
                        {note.tag}
                      </span>
                    )}
                    {note.ctaHref && note.ctaLabel && (
                      <Link
                        href={note.ctaHref}
                        onClick={() => setShowNotifications(false)}
                        className="inline-flex items-center rounded-full border border-[#D9D2C6] px-2.5 py-1 text-[11px] font-semibold text-[#1F3D2B] hover:bg-[#F4EFE6]"
                      >
                        {note.ctaLabel}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        void markNotificationRead(note.id);
                        if (toast?.id === note.id) setToast(null);
                      }}
                      className="inline-flex items-center rounded-full border border-[#D9D2C6] px-2.5 py-1 text-[11px] font-semibold text-[#1F3D2B] hover:bg-[#F4EFE6]"
                    >
                      Mark read
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <header className="sticky top-0 z-50 h-20 bg-[#F4EFE6] border-b border-[#E2DDD3] shadow-sm">
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[auto,1fr,auto] items-center gap-2 px-3 sm:px-4 lg:px-6">
          
          {/* Mobile: Hamburger + Logo */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden p-2 -ml-2 text-[#1F3D2B] hover:bg-black/5 rounded-full"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Left: Logo */}
            <Link href="/" className="flex items-center group mr-0.5 md:mr-1">
              <img
                src={logoSrc}
                alt="Alpha Focus"
                className="h-8 sm:h-9 md:h-10 lg:h-11 w-auto object-contain"
                onError={() => {
                  const currentIndex = LOGO_SOURCES.indexOf(logoSrc as (typeof LOGO_SOURCES)[number]);
                  const next = Math.min((currentIndex >= 0 ? currentIndex : 0) + 1, LOGO_SOURCES.length - 1);
                  setLogoSrc(LOGO_SOURCES[next]);
                }}
                loading="eager"
                decoding="async"
              />
            </Link>
          </div>

          {/* Center: Links (Desktop Only - hidden on smaller screens) */}
          <nav className="hidden md:flex items-center justify-center gap-3 lg:gap-4 xl:gap-5 px-2 lg:px-4 min-w-0 max-w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
            {LINKS.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative text-[13px] lg:text-sm font-medium transition-all py-2 group whitespace-nowrap ${isActive ? "text-[#1F3D2B]" : "text-[#6B665D] hover:text-[#1F3D2B]"}`}
              >
                {link.label}
                {isActive ? (
                  <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2F6F57] rounded-t-full shadow-[0_-2px_10px_rgba(47,111,87,0.4)]" />
                ) : (
                  <span className="absolute bottom-0 left-0 w-0 h-[3px] bg-[#2F6F57]/50 rounded-t-full transition-all duration-300 group-hover:w-full" />
                )}
              </Link>
            )})}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-[#1F3D2B] min-w-0 justify-self-end">
            {/* Location (Desktop Only) */}
            <div className="hidden xl:flex items-center gap-1 max-w-[150px] 2xl:max-w-[190px] text-[#6B665D]">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate text-xs font-medium" title={locationText}>{locationText}</span>
              <button
                type="button"
                onClick={refreshLocation}
                aria-label="Refresh location"
                className="p-1 rounded-md hover:bg-white/60 transition-colors"
                title="Refresh location"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="relative">
              <button
                ref={notificationTriggerRef}
                type="button"
                onClick={() => {
                  void refreshNotifications();
                  setShowNotifications((current) => !current);
                }}
                className="relative p-2 hover:bg-white/40 rounded-full transition-colors"
                aria-label="Notifications"
                aria-expanded={showNotifications}
                onClickCapture={(e) => e.stopPropagation()}
              >
                <Bell className="h-5 w-5 text-[#1F3D2B]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#8C6A5A] text-[10px] text-white font-bold ring-2 ring-[#F4EFE6]">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              aria-label="Open cart drawer"
              onClick={() => openCart()}
              className="relative p-2 hover:bg-white/40 active:scale-95 rounded-full transition-all duration-150"
            >
              <ShoppingCart className="h-5 w-5 text-[#1F3D2B]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2F6F57] text-[10px] text-white font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            <Link href="/profile" className="hidden sm:block p-2 hover:bg-white/40 rounded-full transition-colors">
              <User className="h-5 w-5 text-[#1F3D2B]" />
            </Link>

            {user && (
              <span className="hidden xl:block text-xs font-semibold text-[#1F3D2B] max-w-[110px] 2xl:max-w-[140px] truncate" title={userDisplayName}>
                Welcome, {userDisplayName}
              </span>
            )}

            <span className="hidden lg:flex items-center rounded-full border border-[#E2DDD3] bg-white/50 px-2.5 py-1 text-[11px] font-semibold text-[#8C6A5A] whitespace-nowrap">
              🔥 {streakDays} Day Streak
            </span>

            {!user ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:flex items-center gap-2 rounded-full border border-[#E2DDD3] px-2.5 lg:px-3 py-2 text-xs font-semibold text-[#1F3D2B] hover:bg-white/50 whitespace-nowrap"
              >
                Sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-2 rounded-full border border-[#E2DDD3] px-2.5 lg:px-3 py-2 text-xs font-semibold text-[#1F3D2B] hover:bg-white/50 whitespace-nowrap"
              >
                Logout
              </button>
            )}

            <Link 
              href="/upgrade" 
              className="hidden sm:flex items-center gap-2 rounded-full bg-[#2F6F57] px-3 lg:px-4 py-2 text-xs font-bold text-white shadow-lg shadow-[#2F6F57]/20 hover:bg-[#1F4D3B] transition-all hover:-translate-y-0.5 whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              UPGRADE
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Portal */}
      {mobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-[80%] max-w-[300px] h-full bg-[#F4EFE6] shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E2DDD3]">
              <img
                src={logoSrc}
                alt="Alpha Focus"
                className="h-9 w-auto object-contain"
                onError={() => {
                  const currentIndex = LOGO_SOURCES.indexOf(logoSrc as (typeof LOGO_SOURCES)[number]);
                  const next = Math.min((currentIndex >= 0 ? currentIndex : 0) + 1, LOGO_SOURCES.length - 1);
                  setLogoSrc(LOGO_SOURCES[next]);
                }}
                loading="eager"
                decoding="async"
              />
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 -mr-2 text-[#6B665D] hover:text-[#1F3D2B] hover:bg-black/5 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Links List */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {MOBILE_PRIMARY_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-all ${
                    isActive 
                      ? "bg-[#2F6F57] text-white shadow-md shadow-[#2F6F57]/20" 
                      : "text-[#1F3D2B] hover:bg-black/5"
                  }`}
                >
                  {/* Optional icons mapping could go here if links had icons */}
                  {link.label}
                </Link>
              )})}

              <div className="mt-2 px-4 text-[11px] uppercase tracking-wider text-[#8C877D]">More</div>

              {LINKS.filter((item) => !MOBILE_PRIMARY_LINKS.some((m) => m.href === item.href)).map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                <Link
                  key={`more-${link.label}`}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-all ${
                    isActive
                      ? "bg-[#2F6F57] text-white shadow-md shadow-[#2F6F57]/20"
                      : "text-[#1F3D2B] hover:bg-black/5"
                  }`}
                >
                  {link.label}
                </Link>
              )})}

              <div className="my-4 border-t border-[#E2DDD3]" />

              <Link
                 href="/profile"
                 onClick={() => setMobileMenuOpen(false)}
                 className="flex items-center gap-3 px-4 py-3 text-base font-medium text-[#1F3D2B] rounded-xl hover:bg-black/5 transition-colors"
              >
                <User className="h-5 w-5" />
                Profile
              </Link>

               {!user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-[#1F3D2B] rounded-xl hover:bg-black/5 transition-colors text-left"
                >
                  <User className="h-5 w-5 opacity-0" /> {/* Spacer */}
                  Sign in
                </button>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-[#1F3D2B] rounded-xl hover:bg-black/5 transition-colors text-left"
                >
                  <User className="h-5 w-5 opacity-0" />
                  Logout
                </button>
              )}

              <div className="mt-4 px-4">
                 <Link 
                  href="/upgrade"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F6F57] px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#1F4D3B] transition-all"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  UPGRADE TO PRO
                </Link>
              </div>
            </nav>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-[#E2DDD3] bg-[#F0EBE0]">
              <div className="w-full flex items-center gap-2 text-xs font-medium text-[#6B665D]">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate" title={locationText}>{locationText}</span>
                <button
                  type="button"
                  onClick={refreshLocation}
                  aria-label="Refresh location"
                  className="ml-auto p-1 rounded-md hover:bg-white/60 transition-colors"
                  title="Refresh location"
                >
                  <RefreshCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {notificationPanel}


      {mountedDom && toast &&
        createPortal(
          <div
            className={`fixed bottom-4 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 z-[10000] w-[min(420px,calc(100vw-1rem))] rounded-2xl border border-[#E2DDD3] bg-white px-4 py-3 shadow-xl shadow-black/10 transition-all duration-300 ${toastPhase === "exit" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
            onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
            onTouchEnd={(e) => {
              if (touchStartX === null) return;
              const endX = e.changedTouches[0]?.clientX ?? touchStartX;
              if (Math.abs(endX - touchStartX) > 70) {
                dismissToast(toast.id);
              }
              setTouchStartX(null);
            }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-[#2F6F57]" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1F3D2B]">{toast.title}</p>
                <p className="text-xs text-[#4A453E] mt-1 leading-relaxed">{toast.body}</p>
                <p className="text-[11px] text-[#6B665D] mt-1">{toast.time}</p>
              </div>
              <button
                type="button"
                aria-label="Dismiss toast"
                onClick={() => dismissToast(toast.id)}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClickCapture={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-[#6B665D] hover:text-[#1F3D2B]"
              >
                Dismiss
              </button>
            </div>
          </div>,
          document.body
        )}

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
