export const USER_NAME_KEY = "oneman_user_name";
export const USER_LAST_LOGIN_KEY = "oneman_last_login";
export const USER_TRACKING_CONSENT_KEY = "oneman_tracking_consent";
export const USER_AGE_RANGE_KEY = "oneman_user_age_range";
export const USER_PRIMARY_CONCERN_KEY = "oneman_user_primary_concern";

export type UserSession = {
  name: string;
  lastLoginAt: string;
  consent: boolean;
  ageRange?: string;
  primaryConcern?: string;
};

export function readUserSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const name = localStorage.getItem(USER_NAME_KEY) || localStorage.getItem("userName");
  if (!name) return null;

  return {
    name,
    lastLoginAt: localStorage.getItem(USER_LAST_LOGIN_KEY) || new Date().toISOString(),
    consent: localStorage.getItem(USER_TRACKING_CONSENT_KEY) === "true",
    ageRange: localStorage.getItem(USER_AGE_RANGE_KEY) || undefined,
    primaryConcern: localStorage.getItem(USER_PRIMARY_CONCERN_KEY) || undefined,
  };
}

export function writeUserSession(
  name: string,
  consent: boolean,
  metadata?: { ageRange?: string; primaryConcern?: string }
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_NAME_KEY, name);
  localStorage.setItem("userName", name);
  localStorage.setItem(USER_LAST_LOGIN_KEY, new Date().toISOString());
  localStorage.setItem(USER_TRACKING_CONSENT_KEY, String(consent));

  if (metadata?.ageRange) {
    localStorage.setItem(USER_AGE_RANGE_KEY, metadata.ageRange);
  }

  if (metadata?.primaryConcern) {
    localStorage.setItem(USER_PRIMARY_CONCERN_KEY, metadata.primaryConcern);
  }
}

export function clearUserSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem("userName");
  localStorage.removeItem(USER_LAST_LOGIN_KEY);
  localStorage.removeItem(USER_TRACKING_CONSENT_KEY);
  localStorage.removeItem(USER_AGE_RANGE_KEY);
  localStorage.removeItem(USER_PRIMARY_CONCERN_KEY);
}
