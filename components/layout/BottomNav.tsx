"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Sparkles, FileText, TrendingUp, User } from "lucide-react";
import { useMounted } from "@/app/hooks/useMounted";
import { useIsKeyboardLikelyOpen } from "@/app/hooks/useIsKeyboardLikelyOpen";

const SIDE_LINKS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Protocol", href: "/result", icon: FileText },
] as const;

const RIGHT_LINKS = [
  { label: "Progress", href: "/alpha-credits", icon: TrendingUp },
  { label: "Profile", href: "/profile", icon: User },
] as const;

/** Native-app bottom nav (Phase 7ZA) - mobile only, hidden md and up where
 * the floating top nav already covers primary navigation. The center FAB is
 * the app's single most important action (start a new AI scan), raised
 * above the bar the way Instagram/TikTok/Arc treat a primary action. */
export default function BottomNav() {
  const pathname = usePathname();
  const mounted = useMounted();
  const keyboardOpen = useIsKeyboardLikelyOpen();

  if (!mounted || keyboardOpen) return null;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const renderLink = (link: { label: string; href: string; icon: typeof Home }) => {
    const active = isActive(link.href);
    const Icon = link.icon;
    return (
      <Link
        key={link.href}
        href={link.href}
        className="relative flex min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-1 py-1.5"
        aria-current={active ? "page" : undefined}
      >
        {active && (
          <motion.span
            layoutId="bottom-nav-active"
            className="absolute inset-x-2 top-0.5 h-0.5 rounded-full bg-[var(--accent-blue)]"
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
          />
        )}
        <Icon className={`h-5 w-5 ${active ? "text-white" : "text-white/55"}`} strokeWidth={active ? 2.4 : 2} />
        <span className={`text-[10px] font-semibold ${active ? "text-white" : "text-white/55"}`}>{link.label}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="af-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[linear-gradient(180deg,var(--nav-bg-start)_0%,var(--nav-bg-end)_100%)] backdrop-blur-[20px] md:hidden"
    >
      <div className="relative mx-auto flex h-16 max-w-lg items-stretch px-2">
        {SIDE_LINKS.map(renderLink)}

        {/* Center FAB - Analyze */}
        <div className="flex w-16 shrink-0 items-center justify-center">
          <Link
            href="/image-analyzer"
            aria-label="Start AI analysis"
            className="flex h-14 w-14 -translate-y-4 items-center justify-center rounded-full border-4 border-[var(--nav-bg-start)] bg-[linear-gradient(160deg,var(--accent-blue)_0%,var(--link-blue-dark)_100%)] text-white shadow-[0_10px_24px_rgba(0,113,227,0.45)] transition-transform active:scale-90"
          >
            <Sparkles className="h-6 w-6" />
          </Link>
        </div>

        {RIGHT_LINKS.map(renderLink)}
      </div>
    </nav>
  );
}
