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

type NotificationFilter = "All" | "Routine" | "Program" | "Progress" | "Tip" | "System";

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
  const activeReward = useRewardStore((state) => state.activeReward);
  const isExpiringSoon = useRewardStore((state) => state.isExpiringSoon);
  const initializeRewardStore = useRewardStore((state) => state.initialize);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
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

  // Lock body scroll when an overlay drawer is open
  useEffect(() => {
    if (mobileMenuOpen || showNotifications) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileMenuOpen, showNotifications]);

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

  const filterTabs: NotificationFilter[] = ["All", "Routine", "Program", "Progress", "Tip", "System"];

  const notificationPanel = showNotifications && mountedDom
    ? createPortal(
        <div className="fixed inset-0 z-[10000] flex justify-end">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowNotifications(false)} />
          <div
            ref={notificationPanelRef}
            role="dialog"
            aria-label="Notifications"
            className="relative z-10 flex h-full w-full max-w-[460px] flex-col overflow-hidden border-l border-[#264534] bg-[#F7F0E4] shadow-[0_24px_80px_rgba(15,31,21,0.38)]"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <div className="relative overflow-hidden border-b border-[#24402f] bg-gradient-to-br from-[#0F1F15] via-[#173123] to-[#122419] px-5 py-5 text-white">
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#22C55E]/10 blur-3xl" />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#A3BFA5]">Notification Center</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight">Updates & alerts</h2>
                  <p className="mt-1 text-sm text-[#D0DDD2]">Unread: {unreadCount} · Total: {notifications.length}</p>
                </div>
                <button
                  type="button"
                  aria-label="Close notifications"
                  onClick={() => setShowNotifications(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative z-10 mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A3BFA5]">Live unread</p>
                  <p className="mt-1 text-2xl font-black text-white">{unreadCount}</p>
                </div>
                <div className="rounded-2xl border border-[#F4D675]/20 bg-[#F4D675]/10 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#FFE7A1]">Focus filter</p>
                  <p className="mt-1 text-base font-black text-white">{notificationFilter}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="mb-4 flex flex-wrap gap-2">
                {filterTabs.map((filter) => {
                  const active = notificationFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setNotificationFilter(filter)}
                      className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition-all ${active ? "bg-[#1A3626] text-white shadow-md" : "border border-[#D9D2C6] bg-white/80 text-[#6B665D] hover:bg-white"}`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>

              <div className="mb-4 rounded-[1.5rem] border border-[#E2DDD3] bg-[#FFF8EE] p-4 shadow-[0_8px_24px_rgba(17,17,17,0.05)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7A6D5A]">Display mode</p>
                    <p className="mt-1 text-sm font-semibold text-[#111]">Unread only</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUnreadOnly((current) => !current)}
                    aria-pressed={showUnreadOnly}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full p-1 transition-colors ${showUnreadOnly ? "bg-[#1A3626]" : "bg-black/10"}`}
                  >
                    <span className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${showUnreadOnly ? "translate-x-6" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void refreshNotifications();
                    }}
                    className="rounded-full border border-[#D9D2C6] bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#1F3D2B] hover:bg-[#F7F0E4]"
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
                    className="rounded-full border border-[#D9D2C6] bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#1F3D2B] hover:bg-[#F7F0E4] disabled:opacity-40"
                    disabled={unreadNotifications.length === 0}
                  >
                    Mark all read
                  </button>
                </div>
              </div>

              <div className="space-y-3 pr-1">
                {visibleNotifications.length === 0 && (
                  <div className="rounded-[2rem] border border-[#E2DDD3] bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F1EC]">
                      <Bell className="h-6 w-6 text-[#2F5D46]" />
                    </div>
                    <p className="text-base font-black text-[#111]">No notifications in this view</p>
                    <p className="mt-1 text-sm text-[#6C7A70]">Try another filter or disable unread-only mode.</p>
                  </div>
                )}

                {visibleNotifications.map((note) => (
                  <div
                    key={note.id}
                    className={`group rounded-[1.7rem] border p-4 shadow-[0_8px_20px_rgba(17,17,17,0.05)] transition-all ${note.isRead ? "border-[#E6E1D7] bg-[#FCF8F1]" : "border-[#E9D9B5] bg-white"}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${note.tag === "Program" ? "bg-[#E8F1EC] text-[#2F5D46]" : note.tag === "Progress" ? "bg-[#FFF4DF] text-[#B47B00]" : note.tag === "Routine" ? "bg-[#EEF0FF] text-[#4C5FC1]" : "bg-[#F2EAE1] text-[#8C6A5A]"}`}>
                          {note.tag === "Program" ? <Activity className="h-4 w-4" /> : note.tag === "Progress" ? <Zap className="h-4 w-4" /> : note.tag === "Routine" ? <ClipboardCheck className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black leading-snug text-[#111] break-words">{note.title}</p>
                            <p className="mt-1 text-xs font-semibold text-[#8A948C]">{note.time}</p>
                          </div>
                          {!note.isRead && <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.5)]" />}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-[#4F5B52] break-words">{note.body}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {note.tag && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#1A3626] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                              {note.tag}
                            </span>
                          )}
                          {note.ctaHref && note.ctaLabel && (
                            <Link
                              href={note.ctaHref}
                              onClick={() => setShowNotifications(false)}
                              className="inline-flex items-center rounded-full border border-[#D9D2C6] bg-[#FFF8EE] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#1F3D2B] hover:bg-white"
                            >
                              {note.ctaLabel}
                            </Link>
                          )}
                          {!note.isRead && (
                            <button
                              type="button"
                              onClick={() => {
                                void markNotificationRead(note.id);
                                if (toast?.id === note.id) setToast(null);
                              }}
                              className="inline-flex items-center rounded-full border border-[#D9D2C6] bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#1F3D2B] hover:bg-[#F7F0E4]"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

      {activeReward && pathname && (pathname.startsWith("/dashboard") || pathname.startsWith("/shop") || pathname.startsWith("/product")) && (
        <div className={`sticky top-20 z-40 flex items-center justify-center gap-2 lg:gap-3 border-b px-3 py-2.5 text-center text-xs font-semibold shadow-sm transition-colors ${
          isExpiringSoon 
            ? "border-[#E85D4E]/30 bg-[#FFF5F3] text-[#A63C31]" 
            : "border-[#C8DACF] bg-[#E8EFEA] text-[#1F3D2B]"
        }`}>
          {isExpiringSoon && <span className="inline-flex h-2 w-2 rounded-full bg-[#E85D4E] animate-pulse" />}
          <span>
            You have {activeReward.discountPercent}% OFF
            {isExpiringSoon && <span className="hidden sm:inline"> • Expiring {getRewardCountdownLabel(activeReward.expiresAt)}</span>}
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
