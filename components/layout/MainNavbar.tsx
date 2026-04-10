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
  Zap,
  ArrowRight
} from "lucide-react";
import { useMounted } from "@/app/hooks/useMounted";
import { useLocation } from "@/app/hooks/useLocation";
import { RewardUnlockModal, type RewardUnlockModalData } from "@/app/alpha-credits/_components/RewardUnlockModal";
import { useCartStore } from "@/lib/cartStore";
import { BRAND_LOGO_FALLBACK, BRAND_LOGO_LEGACY_FALLBACK, BRAND_LOGO_PRIMARY } from "@/lib/branding";
import { buildRewardProductHref, getRewardFeaturedProduct } from "@/lib/alphaRewardCommerce";
import AuthModal from "@/components/AuthModal";
import { AuthContext } from "@/contexts/AuthProvider";
import { getSupabaseAuthHeaders } from "@/lib/auth/clientAuthHeaders";
import { getRewardCountdownLabel } from "@/lib/rewardUnlockService";
import { trackRewardEvent } from "@/lib/rewardTracking";
import { useRewardStore } from "@/stores/useRewardStore";

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

type NotificationFilter = "All" | "Rewards" | "Alerts";

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
  if (category === "challenge" || category === "progress") return "Rewards";
  return "Alerts";
}

const LOGO_SOURCES = [BRAND_LOGO_PRIMARY, BRAND_LOGO_FALLBACK, BRAND_LOGO_LEGACY_FALLBACK] as const;

export default function MainNavbar() {
  const pathname = usePathname();
  const mounted = useMounted();
  const items = useCartStore((state) => state.items);
  const openCart = useCartStore((state) => state.openCart);
  const { displayLabel, status: locationStatus, refreshLocation } = useLocation();
  const { user, profile, signOut } = useContext(AuthContext);
  const activeReward = useRewardStore((state) => state.activeReward);
  const isExpiringSoon = useRewardStore((state) => state.isExpiringSoon);
  const initializeRewardStore = useRewardStore((state) => state.initialize);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>("All");
  const [showUnreadOnly, setShowUnreadOnly] = useState(true);
  const [toast, setToast] = useState<NotificationItem | null>(null);
  const [toastPhase, setToastPhase] = useState<"enter" | "exit">("enter");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mountedDom, setMountedDom] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Added mobile menu state
  const [logoSrc, setLogoSrc] = useState<string>(LOGO_SOURCES[0]);
  const [rewardModal, setRewardModal] = useState<RewardUnlockModalData | null>(null);

  const userDisplayName =
    profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "User";

  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const notificationTriggerRef = useRef<HTMLButtonElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const toastFadeTimerRef = useRef<number | null>(null);
  const toastHideTimerRef = useRef<number | null>(null);

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => {
      const matchesFilter = notificationFilter === "All" || item.tag === notificationFilter;
      const matchesUnread = !showUnreadOnly || !item.isRead;
      return matchesFilter && matchesUnread;
    }),
    [notificationFilter, notifications, showUnreadOnly]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.isRead),
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

      const mapped = payload.notifications.map((item) => ({
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

    setNotifications((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
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

  useEffect(() => initializeRewardStore(), [initializeRewardStore]);

  // Lock body scroll only for mobile drawer.
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

  useEffect(() => {
    void refreshNotifications();
  }, [user?.id]);

  useEffect(() => {
    if (!mountedDom) return;

    const maybeOpenReward = () => {
      if (!activeReward) return;

      const sessionKey = `navbar-reward-modal:${activeReward.id}`;
      if (window.sessionStorage.getItem(sessionKey)) return;

      const featuredProduct = getRewardFeaturedProduct(activeReward.discountPercent);
      window.sessionStorage.setItem(sessionKey, "1");
      setRewardModal({
        discountPercent: activeReward.discountPercent,
        title: `You unlocked ${activeReward.discountPercent}% OFF`,
        body: featuredProduct
          ? `${featuredProduct.name} is ready as your highest-conversion next move.`
          : "Your active reward is ready to use now.",
        href: buildRewardProductHref(activeReward.discountPercent),
        ctaLabel: "Use Reward Now",
        expiresAt: activeReward.expiresAt,
        productName: featuredProduct?.name || null,
      });
    };

    maybeOpenReward();

    const handleRewardEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ type?: string }>;
      if (customEvent.detail?.type === "created") {
        maybeOpenReward();
      }
    };

    window.addEventListener("alpha-reward-unlock", handleRewardEvent);
    window.addEventListener("focus", maybeOpenReward);
    return () => {
      window.removeEventListener("alpha-reward-unlock", handleRewardEvent);
      window.removeEventListener("focus", maybeOpenReward);
    };
  }, [activeReward, mountedDom]);

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

    const nextToast = unreadNotifications[0];
    if (!nextToast) return;

    setToast(nextToast);
    setToastPhase("enter");
  }, [toast, unreadNotifications]);

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
    setShowMoreMenu(false);
  }, [pathname]);

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

  useEffect(() => {
    if (!showMoreMenu) return;
    const handleClickOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (moreMenuRef.current?.contains(target)) return;
      setShowMoreMenu(false);
    };

    document.addEventListener("pointerdown", handleClickOutside, true);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside, true);
    };
  }, [showMoreMenu]);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  if (!mounted) return <div className="h-12 bg-black/80 border-b border-white/10" />;

  const filterTabs: NotificationFilter[] = ["All", "Rewards", "Alerts"];
  const primaryDesktopLinks = LINKS.slice(0, 5);
  const overflowDesktopLinks = LINKS.slice(5);

  const notificationPanel = showNotifications ? (
    <div
      ref={notificationPanelRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-[48px] z-[9999] w-[360px] border border-white/12 bg-black/94 p-3 text-white shadow-[0_20px_40px_rgba(0,0,0,0.45)] transition-all duration-200"
      style={{ opacity: showNotifications ? 1 : 0, transform: showNotifications ? "translateY(0)" : "translateY(-10px)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a7a7a7]">Notifications</p>
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
          className="border border-[#0071e3] px-2 py-1 text-[11px] font-bold uppercase text-white"
          disabled={unreadNotifications.length === 0}
        >
          Mark all read
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        {filterTabs.map((filter) => {
          const active = notificationFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setNotificationFilter(filter)}
              className={`border px-2 py-1 text-[11px] font-bold uppercase ${active ? "border-[#0071e3] text-[#2997ff]" : "border-[#4a4a4a] text-[#a7a7a7]"}`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-center justify-between border border-[#2d2d2d] px-2 py-2">
        <span className="text-[11px] font-bold uppercase text-[#a7a7a7]">Unread only</span>
        <button
          type="button"
          onClick={() => setShowUnreadOnly((current) => !current)}
          className={`h-6 w-10 border ${showUnreadOnly ? "border-[#0071e3]" : "border-[#5a5a5a]"}`}
          aria-pressed={showUnreadOnly}
        >
          <span className={`block h-4 w-4 bg-[#0071e3] transition-transform ${showUnreadOnly ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>

      <div className="space-y-2">
        {visibleNotifications.slice(0, 5).length === 0 && (
          <div className="border border-[#2d2d2d] p-3 text-sm text-[#a7a7a7]">No notifications found.</div>
        )}
        {visibleNotifications.slice(0, 5).map((note) => (
          <div key={note.id} className="border border-[#2d2d2d] bg-[#111611] p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{note.title}</p>
                <p className="mt-1 text-xs text-[#a7a7a7]">{note.time}</p>
              </div>
              {!note.isRead && <span className="h-2 w-2 bg-[#d94444]" />}
            </div>
            <p className="mt-2 text-xs text-[#a7a7a7]">{note.body}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="border border-[#0071e3] px-2 py-0.5 text-[10px] font-bold uppercase text-[#2997ff]">{note.tag || "Alerts"}</span>
              {!note.isRead && (
                <button
                  type="button"
                  onClick={() => {
                    void markNotificationRead(note.id);
                    if (toast?.id === note.id) setToast(null);
                  }}
                  className="border border-[#5a5a5a] px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                >
                  Mark read
                </button>
              )}
              {note.ctaHref && note.ctaLabel && (
                <Link href={note.ctaHref} onClick={() => setShowNotifications(false)} className="border border-[#5a5a5a] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  {note.ctaLabel}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <>
      <header className="sticky top-0 z-50 h-14 border-b border-white/10 bg-[linear-gradient(180deg,rgba(10,12,18,0.9)_0%,rgba(8,10,14,0.78)_100%)] backdrop-blur-[20px]">
        <div className="mx-auto grid h-full max-w-[1320px] grid-cols-[auto,1fr,auto] items-center gap-3 px-3 sm:px-4 lg:px-6">
          
          {/* Mobile: Hamburger + Logo */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden p-2 -ml-2 text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Left: Logo */}
            <Link href="/" className="flex items-center group mr-0.5 md:mr-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.24)]">
              <img
                src={logoSrc}
                alt="Alpha Focus"
                className="h-5 sm:h-6 md:h-6 w-auto object-contain"
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
          <nav className="hidden md:flex items-center justify-center gap-2 lg:gap-2.5 px-2 lg:px-3 min-w-0 max-w-full whitespace-nowrap">
            {primaryDesktopLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-200 group whitespace-nowrap ${isActive ? "bg-white/12 text-white shadow-[0_10px_22px_rgba(0,0,0,0.25)]" : "text-white/90 hover:text-white hover:bg-white/8"}`}
              >
                {link.label}
                {isActive ? (
                  <span className="absolute bottom-0 left-2 right-2 h-px bg-[#2997ff]/70" />
                ) : (
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-white/75 transition-all duration-300 group-hover:w-full" />
                )}
              </Link>
            )})}

            {overflowDesktopLinks.length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu((current) => !current)}
                  className="text-[12px] font-medium text-white/90 hover:text-white px-3 py-1.5 border border-white/20 rounded-full bg-white/5 hover:bg-white/10"
                  aria-expanded={showMoreMenu}
                  aria-label="Open more routes"
                >
                  More
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 top-[38px] z-[9999] min-w-[180px] border border-white/15 bg-black/85 backdrop-blur-xl p-2 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
                    {overflowDesktopLinks.map((link) => {
                      const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                      return (
                        <Link
                          key={`overflow-${link.label}`}
                          href={link.href}
                          onClick={() => setShowMoreMenu(false)}
                          className={`block px-3 py-2 text-xs transition-colors ${isActive ? "text-white bg-white/10" : "text-white/80 hover:text-white hover:bg-white/5"}`}
                        >
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 text-white min-w-0 justify-self-end">
            {/* Location (Desktop Only) */}
            <div className="hidden xl:flex items-center gap-1 max-w-[150px] 2xl:max-w-[190px] text-[#a7a7a7]">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate text-xs font-medium" title={locationText}>{locationText}</span>
              <button
                type="button"
                onClick={refreshLocation}
                aria-label="Refresh location"
                className="p-1 hover:bg-white/10 transition-colors"
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
                className="relative rounded-full p-2.5 hover:bg-white/10 transition-colors"
                aria-label="Notifications"
                aria-expanded={showNotifications}
                onClickCapture={(e) => e.stopPropagation()}
              >
                <Bell className="h-5 w-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-[#d94444]" />
                )}
              </button>
              {notificationPanel}
            </div>

            <button
              type="button"
              aria-label="Open cart drawer"
              onClick={() => openCart()}
              className="relative rounded-full p-2.5 hover:bg-white/10 active:scale-95 transition-all duration-150"
            >
              <ShoppingCart className="h-5 w-5 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0071e3] text-[10px] text-white font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            <Link href="/profile" className="hidden sm:block rounded-full p-2.5 hover:bg-white/10 transition-colors">
              <User className="h-5 w-5 text-white" />
            </Link>

            {user && (
              <span className="hidden 2xl:block text-xs font-semibold text-[#a7a7a7] max-w-[140px] truncate" title={userDisplayName}>
                Welcome, {userDisplayName}
              </span>
            )}

            {!user ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:flex items-center gap-2 rounded-full border border-[#0071e3] px-3 py-1 text-[12px] font-normal text-white hover:bg-white/10 whitespace-nowrap"
              >
                Sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-2 rounded-full border border-[#0071e3] px-3 py-1 text-[12px] font-normal text-white hover:bg-white/10 whitespace-nowrap"
              >
                Logout
              </button>
            )}

            <Link 
              href="/upgrade" 
              className="hidden sm:flex items-center gap-2 rounded-full border border-[#0071e3] bg-[#0071e3] px-3 lg:px-4 py-1 text-[12px] font-normal text-white transition-all whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              UPGRADE
            </Link>
          </div>
        </div>
      </header>

      {activeReward && pathname && (pathname.startsWith("/dashboard") || pathname.startsWith("/shop") || pathname.startsWith("/product")) && (
        <div className={`sticky top-12 z-40 flex items-center justify-center gap-2 lg:gap-3 border-b px-3 py-2 text-center text-xs font-normal shadow-sm transition-colors ${
          isExpiringSoon 
            ? "border-[#E85D4E]/30 bg-[#FFF5F3] text-[#A63C31]" 
            : "border-[#d9d9de] bg-[#eef5ff] text-[#1d1d1f]"
        }`}>
          {isExpiringSoon && <span className="inline-flex h-2 w-2 rounded-full bg-[#E85D4E] animate-pulse" />}
          <span>
            You have {activeReward.discountPercent}% OFF
            {isExpiringSoon && <span className="hidden sm:inline">  -  Expiring {getRewardCountdownLabel(activeReward.expiresAt)}</span>}
          </span>
          <Link 
            href="/checkout" 
            className="group ml-2 inline-flex items-center gap-1 uppercase tracking-widest font-black underline decoration-transparent transition-all hover:decoration-current"
          >
            Use now <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}

      {/* Mobile Drawer Portal */}
      {mobileMenuOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-[80%] max-w-[300px] h-full bg-[#0d0d10]/95 border-r border-white/15 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 text-white">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <img
                src={logoSrc}
                alt="Alpha Focus"
                className="h-9 w-auto object-contain rounded-full border border-white/15 bg-white/5 px-2 py-1"
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
                className="p-2 -mr-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
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
                      ? "bg-[#0071e3] text-white shadow-md shadow-[#0071e3]/30" 
                      : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  {/* Optional icons mapping could go here if links had icons */}
                  {link.label}
                </Link>
              )})}

              <div className="mt-2 px-4 text-[11px] uppercase tracking-wider text-white/55">More</div>

              {LINKS.filter((item) => !MOBILE_PRIMARY_LINKS.some((m) => m.href === item.href)).map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                <Link
                  key={`more-${link.label}`}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-all ${
                    isActive
                      ? "bg-[#0071e3] text-white shadow-md shadow-[#0071e3]/30"
                      : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              )})}

              <div className="my-4 border-t border-white/10" />

              <Link
                 href="/profile"
                 onClick={() => setMobileMenuOpen(false)}
                 className="flex items-center gap-3 px-4 py-3 text-base font-medium text-white/85 rounded-xl hover:bg-white/10 transition-colors"
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
                  className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-white/85 rounded-xl hover:bg-white/10 transition-colors text-left"
                >
                  <User className="h-5 w-5 opacity-0" /> {/* Spacer */}
                  Sign in
                </button>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-white/85 rounded-xl hover:bg-white/10 transition-colors text-left"
                >
                  <User className="h-5 w-5 opacity-0" />
                  Logout
                </button>
              )}

              <div className="mt-4 px-4">
                 <Link 
                  href="/upgrade"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0071e3] px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#005bbf] transition-all"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  UPGRADE TO PRO
                </Link>
              </div>
            </nav>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-white/10 bg-transparent">
              <div className="w-full flex items-center gap-2 text-xs font-medium text-white/70">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate" title={locationText}>{locationText}</span>
                <button
                  type="button"
                  onClick={refreshLocation}
                  aria-label="Refresh location"
                  className="ml-auto p-1 rounded-md hover:bg-white/10 transition-colors"
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

      {mountedDom && toast &&
        createPortal(
          <div
            className={`fixed bottom-4 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 z-[10000] w-[min(420px,calc(100vw-1rem))] rounded-2xl border border-[#d9d9de] bg-white px-4 py-3 shadow-xl shadow-black/10 transition-all duration-300 ${toastPhase === "exit" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
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
              <div className="mt-0.5 h-2 w-2 rounded-full bg-[#0071e3]" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1d1d1f]">{toast.title}</p>
                <p className="text-xs text-[#4A453E] mt-1 leading-relaxed">{toast.body}</p>
                <p className="text-[11px] text-[#6e6e73] mt-1">{toast.time}</p>
              </div>
              <button
                type="button"
                aria-label="Dismiss toast"
                onClick={() => dismissToast(toast.id)}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClickCapture={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-[#6e6e73] hover:text-[#1d1d1f]"
              >
                Dismiss
              </button>
            </div>
          </div>,
          document.body
        )}

      <RewardUnlockModal
        data={rewardModal}
        onClose={() => setRewardModal(null)}
        onPrimaryClick={() => {
          if (!rewardModal) return;
          trackRewardEvent("product_clicked_from_reward", {
            discountPercent: rewardModal.discountPercent,
            href: rewardModal.href,
            productName: rewardModal.productName || null,
            source: "navbar_global_modal",
          });
        }}
      />

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}


