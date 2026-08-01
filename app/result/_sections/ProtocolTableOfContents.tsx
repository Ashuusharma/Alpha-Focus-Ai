"use client";

import { useEffect, useState } from "react";

export type ProtocolTocEntry = {
  id: string;
  label: string;
};

/**
 * Desktop-only sticky in-page nav. Mobile stays a plain stacked scroll (no
 * TOC clutter on small screens, per the phase's "mobile-friendly stacked
 * layout" requirement) — hidden below the lg breakpoint.
 */
export default function ProtocolTableOfContents({ entries }: { entries: ProtocolTocEntry[] }) {
  const [activeId, setActiveId] = useState(entries[0]?.id || "");

  useEffect(() => {
    const sections = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (visibleEntries) => {
        const visible = visibleEntries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [entries]);

  return (
    <nav
      aria-label="Protocol report sections"
      className="af-surface-card sticky top-[4.5rem] hidden max-h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto p-4 lg:block"
    >
      <p className="px-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--ink-soft)]">On this page</p>
      <ul className="mt-2 space-y-0.5">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={activeId === entry.id ? "true" : undefined}
              className={`block rounded-lg px-2 py-1.5 text-sm transition-colors ${
                activeId === entry.id
                  ? "bg-[var(--accent-blue)]/10 font-semibold text-[var(--accent-blue)]"
                  : "text-[var(--ink-soft)] hover:bg-black/[0.03] hover:text-[var(--ink)]"
              }`}
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
