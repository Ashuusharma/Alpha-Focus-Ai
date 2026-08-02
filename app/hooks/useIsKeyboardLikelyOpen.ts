"use client";

import { useEffect, useState } from "react";

const TEXT_ENTRY_TYPES = new Set(["text", "email", "password", "tel", "number", "search", "url", "date"]);

function isTextEntryElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return TEXT_ENTRY_TYPES.has(el.type);
  return el.isContentEditable;
}

/** Fixed bottom-pinned chrome (BottomNav, sticky action bars) needs to get
 * out of the way while the on-screen keyboard is up, or it ends up floating
 * mid-screen above the keyboard, covering whatever the user is typing into
 * - a classic mobile-web problem native apps don't have. Approximated via
 * focus/blur on text-entry elements rather than the (poorly supported)
 * VisualViewport resize heuristic, which is unreliable across browsers. */
export function useIsKeyboardLikelyOpen() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      if (isTextEntryElement(e.target)) setKeyboardOpen(true);
    };
    const handleFocusOut = (e: FocusEvent) => {
      if (isTextEntryElement(e.target)) setKeyboardOpen(false);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return keyboardOpen;
}
