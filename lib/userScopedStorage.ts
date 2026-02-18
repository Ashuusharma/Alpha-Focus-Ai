function normalizeUserSegment(userName?: string | null): string {
  const raw = (userName || "guest").trim().toLowerCase();
  const normalized = raw.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || "guest";
}

export function getActiveUserName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("oneman_user_name");
}

export function getUserScopedKey(baseKey: string, userName?: string | null): string {
  return `${baseKey}::${normalizeUserSegment(userName)}`;
}

export function getScopedSessionItem(baseKey: string, userName?: string | null, allowLegacyFallback = true): string | null {
  if (typeof window === "undefined") return null;
  const scoped = sessionStorage.getItem(getUserScopedKey(baseKey, userName));
  if (scoped !== null) return scoped;
  return allowLegacyFallback ? sessionStorage.getItem(baseKey) : null;
}

export function setScopedSessionItem(baseKey: string, value: string, userName?: string | null, mirrorLegacy = true): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(getUserScopedKey(baseKey, userName), value);
  if (mirrorLegacy) {
    sessionStorage.setItem(baseKey, value);
  }
}

export function getScopedLocalItem(baseKey: string, userName?: string | null, allowLegacyFallback = true): string | null {
  if (typeof window === "undefined") return null;
  const scoped = localStorage.getItem(getUserScopedKey(baseKey, userName));
  if (scoped !== null) return scoped;
  return allowLegacyFallback ? localStorage.getItem(baseKey) : null;
}

export function setScopedLocalItem(baseKey: string, value: string, userName?: string | null, mirrorLegacy = false): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getUserScopedKey(baseKey, userName), value);
  if (mirrorLegacy) {
    localStorage.setItem(baseKey, value);
  }
}
