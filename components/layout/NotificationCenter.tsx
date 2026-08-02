"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BellRing, Check, CheckCheck, Gift, Inbox } from "lucide-react";

export type NotificationItem = {
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

export type NotificationFilter = "All" | "Rewards" | "Alerts";

const FILTERS: NotificationFilter[] = ["All", "Rewards", "Alerts"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Today / Yesterday / Earlier - the grouping premium notification centers
 * (Linear, Stripe) use instead of one flat chronological list. */
function groupByRecency(items: NotificationItem[]) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const groups: { label: string; items: NotificationItem[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Earlier", items: [] },
  ];

  for (const item of items) {
    const created = new Date(item.createdAt);
    if (isSameDay(created, now)) groups[0].items.push(item);
    else if (isSameDay(created, yesterday)) groups[1].items.push(item);
    else groups[2].items.push(item);
  }

  return groups.filter((group) => group.items.length > 0);
}

function NotificationIcon({ tag, isRead }: { tag?: string; isRead?: boolean }) {
  const Icon = tag === "Rewards" ? Gift : BellRing;
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        isRead ? "bg-white/10 text-white/50" : "bg-[var(--accent-blue)]/20 text-[var(--link-blue-dark)]"
      }`}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

type NotificationCenterProps = {
  notifications: NotificationItem[];
  visibleNotifications: NotificationItem[];
  unreadCount: number;
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  showUnreadOnly: boolean;
  onToggleUnreadOnly: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: () => void;
  /** Mobile renders as a bottom sheet with its own backdrop; desktop as a
   * floating dropdown anchored to the bell. */
  variant: "desktop" | "mobile";
};

const NotificationCenter = forwardRef<HTMLDivElement, NotificationCenterProps>(function NotificationCenter(
  {
    visibleNotifications,
    unreadCount,
    filter,
    onFilterChange,
    showUnreadOnly,
    onToggleUnreadOnly,
    onMarkRead,
    onMarkAllRead,
    onNavigate,
    variant,
  },
  ref
) {
  const prefersReducedMotion = useReducedMotion();
  const groups = groupByRecency(visibleNotifications.slice(0, 20));

  const listMotion = prefersReducedMotion
    ? {}
    : {
        variants: {
          hidden: {},
          show: { transition: { staggerChildren: 0.035 } },
        },
        initial: "hidden",
        animate: "show",
      };

  const itemMotion = prefersReducedMotion
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 6 },
          show: { opacity: 1, y: 0 },
        },
      };

  const body = (
    <div
      ref={ref}
      role="dialog"
      aria-label="Notifications"
      className={
        variant === "desktop"
          ? "flex max-h-[28rem] w-[380px] flex-col overflow-hidden rounded-2xl border border-white/12 bg-black/95 text-white shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          : "flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-white/12 bg-[#0a0c12] text-white shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
      }
    >
      {variant === "mobile" && <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-white/20" aria-hidden="true" />}

      <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-4">
        <p className="flex items-center gap-2 text-sm font-bold text-white">
          Notifications
          {unreadCount > 0 && (
            <span className="rounded-full bg-[var(--accent-blue)] px-2 py-0.5 text-[10px] font-bold">{unreadCount}</span>
          )}
        </p>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all read
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 px-4 pb-3">
        {FILTERS.map((item) => {
          const active = filter === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onFilterChange(item)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                active ? "bg-[var(--accent-blue)] text-white" : "bg-white/8 text-white/70 hover:bg-white/14 hover:text-white"
              }`}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onToggleUnreadOnly}
          aria-pressed={showUnreadOnly}
          className={`ml-auto rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
            showUnreadOnly ? "bg-white/16 text-white" : "bg-white/8 text-white/60 hover:text-white"
          }`}
        >
          Unread
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Inbox className="h-6 w-6 text-white/30" />
            <p className="text-sm text-white/60">
              {showUnreadOnly ? "No unread notifications." : "You’re all caught up."}
            </p>
            {showUnreadOnly ? (
              <button
                type="button"
                onClick={onToggleUnreadOnly}
                className="mt-1 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/16"
              >
                Show all notifications
              </button>
            ) : (
              <p className="text-xs text-white/35">New updates on your protocol and rewards will show up here.</p>
            )}
          </div>
        ) : (
          <motion.div {...listMotion} className="space-y-4">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="px-2 pb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((note) => (
                    <motion.div
                      key={note.id}
                      {...itemMotion}
                      className={`group relative flex gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/6 ${
                        !note.isRead ? "bg-white/[0.04]" : ""
                      }`}
                    >
                      {!note.isRead && (
                        <span className="absolute left-0 top-3 h-[calc(100%-1.5rem)] w-0.5 rounded-full bg-[var(--accent-blue)]" aria-hidden="true" />
                      )}
                      <NotificationIcon tag={note.tag} isRead={note.isRead} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[13px] leading-snug ${note.isRead ? "font-medium text-white/70" : "font-semibold text-white"}`}>
                            {note.title}
                          </p>
                          <span className="shrink-0 text-[10px] text-white/40">{note.time}</span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-white/55">{note.body}</p>
                        {(note.ctaHref || !note.isRead) && (
                          <div className="mt-1.5 flex items-center gap-3">
                            {note.ctaHref && note.ctaLabel && (
                              <Link
                                href={note.ctaHref}
                                onClick={onNavigate}
                                className="text-[11px] font-semibold text-[var(--link-blue-dark)] hover:underline"
                              >
                                {note.ctaLabel}
                              </Link>
                            )}
                            {!note.isRead && (
                              <button
                                type="button"
                                onClick={() => onMarkRead(note.id)}
                                className="flex items-center gap-1 text-[11px] font-medium text-white/45 hover:text-white"
                              >
                                <Check className="h-3 w-3" />
                                Mark read
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );

  if (variant === "desktop") return body;

  return (
    <AnimatePresence>
      <motion.div
        key="notification-sheet-backdrop"
        initial={prefersReducedMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/50"
        onClick={onNavigate}
      />
      <motion.div
        key="notification-sheet-panel"
        initial={prefersReducedMotion ? undefined : { y: "100%" }}
        animate={{ y: 0 }}
        exit={prefersReducedMotion ? undefined : { y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        className="fixed inset-x-0 bottom-0 z-[9999]"
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          // Swipe-down-to-dismiss: a decisive downward drag or flick closes
          // the sheet, matching the native bottom-sheet gesture.
          if (info.offset.y > 120 || info.velocity.y > 800) onNavigate();
        }}
      >
        {body}
      </motion.div>
    </AnimatePresence>
  );
});

export default NotificationCenter;
