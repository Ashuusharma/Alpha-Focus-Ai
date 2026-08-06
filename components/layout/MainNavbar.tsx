"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  MapPin,
  Menu,
  RefreshCcw,
  ShoppingCart,
  User,
  X,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useMounted } from "@/app/hooks/useMounted";
import { useIsMobileViewport } from "@/app/hooks/useIsMobileViewport";
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
import NotificationCenter, { type NotificationFilter, type NotificationItem } from "./NotificationCenter";

const LINKS = [
  { label: "Home", href: "/dashboard" },
  { label: "Analyze", href: "/assessment" },
  { label: "Protocol", href: "/result" },
  { label: "Progress", href: "/alpha-credits" },
  { label: "Challenges", href: "/challenges" },
  { label: "Knowledge", href: "/learning-center" },
  { label: "Shop", href: "/shop" },
] as const;

// The floating nav shell's top padding + inner capsule height, in px. The
// reward banner below is `sticky` and needs to sit flush against the
// bottom of this shell - if either value changes, update both together
// (this exact class of mismatch was a real bug fixed in Phase 7C).
const NAV_SHELL_TOP_PADDING_PX = 12;
const NAV_CAPSULE_HEIGHT_PX = 56;
const NAV_SHELL_TOTAL_HEIGHT_PX = NAV_SHELL_TOP_PADDING_PX + NAV_CAPSULE_HEIGHT_PX;

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
  const prefersReducedMotion = useReducedMotion();
  const isMobileViewport = useIsMobileViewport();
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

  const markAllNotificationsRead = async () => {
    const headers = await getSupabaseAuthHeaders({ "Content-Type": "application/json" });
    await fetch("/api/notifications/read", {
      method: "POST",
      headers,
      body: JSON.stringify({ all: true }),
    });
    setToast(null);
    void refreshNotifications();
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

  if (!mounted) return <div style={{ height: NAV_SHELL_TOTAL_HEIGHT_PX }} className="bg-[var(--nav-surface)] border-b border-[var(--nav-border)]" />;

  // Phase 7ZB nav simplification: primary nav now matches the same 4-item
  // core priority as the mobile bottom nav (Home/Analyze/Protocol/Progress)
  // instead of 5 - Challenges moves into "More" alongside Knowledge/Shop,
  // reducing top-level visual noise on desktop.
  const primaryDesktopLinks = LINKS.slice(0, 4);
  const overflowDesktopLinks = LINKS.slice(4);

  return (
    <>
      {/* Floating glass shell: sticky (not fixed) so it still reserves its
          own space in normal flow like before - only the padding here
          creates the "floating" gap from the viewport edge, nothing else
          on the page needs to account for a new offset. */}
      <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-3 rounded-2xl border border-[var(--nav-border)] bg-[linear-gradient(180deg,var(--nav-bg-start)_0%,var(--nav-bg-end)_100%)] px-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-[20px] sm:px-4">
          <div className="grid h-full w-full grid-cols-[auto,1fr,auto] items-center gap-3">

          {/* Mobile: Hamburger + Logo */}
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              type="button"
              className="af-nav-icon-btn md:hidden -ml-2 text-white"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Left: Logo */}
            <Link href="/" className="flex items-center group mr-0.5 md:mr-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.24)] transition-transform hover:scale-105 active:scale-95">
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
          <nav className="hidden md:flex items-center justify-center gap-1 lg:gap-1.5 px-2 lg:px-3 min-w-0 max-w-full whitespace-nowrap">
            {primaryDesktopLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
              return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap ${isActive ? "text-white" : "text-white/80 hover:text-white"}`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-full bg-white/12 shadow-[0_10px_22px_rgba(0,0,0,0.25)]"
                    transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            )})}

            {overflowDesktopLinks.length > 0 && (
              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu((current) => !current)}
                  className="text-[12px] font-medium text-white/90 hover:text-white px-3 py-1.5 border border-white/20 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  aria-expanded={showMoreMenu}
                  aria-label="Open more routes"
                >
                  More
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 top-[38px] z-[9999] min-w-[180px] rounded-2xl border border-white/15 bg-black/85 backdrop-blur-xl p-2 shadow-[0_20px_40px_rgba(0,0,0,0.35)]">
                    {overflowDesktopLinks.map((link) => {
                      const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                      return (
                        <Link
                          key={`overflow-${link.label}`}
                          href={link.href}
                          onClick={() => setShowMoreMenu(false)}
                          className={`block rounded-xl px-3 py-2 text-xs transition-colors ${isActive ? "text-white bg-white/10" : "text-white/80 hover:text-white hover:bg-white/5"}`}
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
            <div className="hidden xl:flex items-center gap-1 max-w-[150px] 2xl:max-w-[190px] text-[var(--text-secondary-dark)]">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate text-xs font-medium" title={locationText}>{locationText}</span>
              <button
                type="button"
                onClick={refreshLocation}
                aria-label="Refresh location"
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
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
                className="af-nav-icon-btn"
                aria-label="Notifications"
                aria-expanded={showNotifications}
              >
                <Bell className="h-5 w-5 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-[var(--danger)]" />
                )}
              </button>

              {showNotifications && !isMobileViewport && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)]">
                  <NotificationCenter
                    ref={notificationPanelRef}
                    variant="desktop"
                    notifications={notifications}
                    visibleNotifications={visibleNotifications}
                    unreadCount={unreadCount}
                    filter={notificationFilter}
                    onFilterChange={setNotificationFilter}
                    showUnreadOnly={showUnreadOnly}
                    onToggleUnreadOnly={() => setShowUnreadOnly((current) => !current)}
                    onMarkRead={(id) => {
                      void markNotificationRead(id);
                      if (toast?.id === id) setToast(null);
                    }}
                    onMarkAllRead={() => void markAllNotificationsRead()}
                    onNavigate={() => setShowNotifications(false)}
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              aria-label="Open cart drawer"
              onClick={() => openCart()}
              className="af-nav-icon-btn"
            >
              <ShoppingCart className="h-5 w-5 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-blue)] text-[10px] text-white font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            <Link href="/profile" aria-label="Profile" className="af-nav-icon-btn hidden sm:flex">
              <User className="h-5 w-5 text-white" />
            </Link>

            {user && (
              <span className="hidden 2xl:block text-xs font-semibold text-[var(--text-secondary-dark)] max-w-[140px] truncate" title={userDisplayName}>
                Welcome, {userDisplayName}
              </span>
            )}

            {!user ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--accent-blue)] px-3 py-1 text-[12px] font-normal text-white hover:bg-white/10 whitespace-nowrap transition-colors"
              >
                Sign in
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--accent-blue)] px-3 py-1 text-[12px] font-normal text-white hover:bg-white/10 whitespace-nowrap transition-colors"
              >
                Logout
              </button>
            )}

            <Link
              href="/upgrade"
              className="hidden sm:flex items-center gap-2 rounded-full border border-[var(--accent-blue)] bg-[var(--accent-blue)] px-3 lg:px-4 py-1 text-[12px] font-normal text-white transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              UPGRADE
            </Link>
          </div>
          </div>
        </div>
      </header>

      {activeReward && pathname && (pathname.startsWith("/dashboard") || pathname.startsWith("/shop") || pathname.startsWith("/product")) && (
        <div
          style={{ top: NAV_SHELL_TOTAL_HEIGHT_PX }}
          className={`sticky z-40 flex items-center justify-center gap-2 lg:gap-3 border-b px-3 py-2 text-center text-xs font-normal shadow-sm transition-colors ${
            isExpiringSoon
              ? "border-[var(--warning-accent)]/30 bg-[var(--warning-bg)] text-[var(--warning-text)]"
              : "border-[var(--border-hairline)] bg-[var(--bg-wash-start)] text-[var(--ink)]"
          }`}
        >
          {isExpiringSoon && <span className="inline-flex h-2 w-2 rounded-full bg-[var(--warning-accent)] animate-pulse" />}
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

      {/* Mobile notification sheet - separate from the desktop dropdown
          above so it can render as a full bottom sheet with its own
          backdrop instead of a cramped fixed-width dropdown. */}
      {mountedDom && showNotifications && isMobileViewport && createPortal(
        <div>
          <NotificationCenter
            variant="mobile"
            notifications={notifications}
            visibleNotifications={visibleNotifications}
            unreadCount={unreadCount}
            filter={notificationFilter}
            onFilterChange={setNotificationFilter}
            showUnreadOnly={showUnreadOnly}
            onToggleUnreadOnly={() => setShowUnreadOnly((current) => !current)}
            onMarkRead={(id) => {
              void markNotificationRead(id);
              if (toast?.id === id) setToast(null);
            }}
            onMarkAllRead={() => void markAllNotificationsRead()}
            onNavigate={() => setShowNotifications(false)}
          />
        </div>,
        document.body
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
          <div className="relative w-[80%] max-w-[300px] h-full bg-[var(--nav-drawer-bg)] border-r border-white/15 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300 text-white">
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
                aria-label="Close menu"
                className="af-nav-icon-btn -mr-2 text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Links List */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {/* Same primary/secondary split as desktop (primaryDesktopLinks/
                  overflowDesktopLinks) — previously mobile had its own,
                  differently-curated 3-link "primary" set that disagreed
                  with desktop's 5, a real inconsistency found in the Phase 7B
                  audit. One source of truth for "what's primary" now. */}
              {primaryDesktopLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-all ${
                    isActive
                      ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[var(--accent-blue)]/30"
                      : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              )})}

              {overflowDesktopLinks.length > 0 && (
                <div className="mt-2 px-4 text-[11px] uppercase tracking-wider text-white/55">More</div>
              )}

              {overflowDesktopLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
                return (
                <Link
                  key={`more-${link.label}`}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-all ${
                    isActive
                      ? "bg-[var(--accent-blue)] text-white shadow-md shadow-[var(--accent-blue)]/30"
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-blue)] px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-[var(--accent-blue-dark)] transition-all"
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
            className={`fixed bottom-4 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-5 z-[10000] w-[min(420px,calc(100vw-1rem))] rounded-2xl border border-[var(--border-hairline)] bg-white px-4 py-3 shadow-xl shadow-black/10 transition-all duration-300 ${toastPhase === "exit" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
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
              <div className="mt-0.5 h-2 w-2 rounded-full bg-[var(--accent-blue)]" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--ink)]">{toast.title}</p>
                <p className="text-xs text-[var(--ink-soft)] mt-1 leading-relaxed">{toast.body}</p>
                <p className="text-[11px] text-[var(--ink-soft)] mt-1">{toast.time}</p>
              </div>
              <button
                type="button"
                aria-label="Dismiss toast"
                onClick={() => dismissToast(toast.id)}
                className="text-xs font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)]"
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
