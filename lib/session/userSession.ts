export const USER_NAME_KEY = "oneman_user_name";
export const USER_LAST_LOGIN_KEY = "oneman_last_login";
export const USER_TRACKING_CONSENT_KEY = "oneman_tracking_consent";

export type UserSession = {
  name: string;
  lastLoginAt: string;
  consent: boolean;
};

export function readUserSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  const name = localStorage.getItem(USER_NAME_KEY) || localStorage.getItem("userName");
  if (!name) return null;

  return {
    name,
    lastLoginAt: localStorage.getItem(USER_LAST_LOGIN_KEY) || new Date().toISOString(),
    consent: localStorage.getItem(USER_TRACKING_CONSENT_KEY) === "true",
  };
}

export function writeUserSession(name: string, consent: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_NAME_KEY, name);
  localStorage.setItem("userName", name);
  localStorage.setItem(USER_LAST_LOGIN_KEY, new Date().toISOString());
  localStorage.setItem(USER_TRACKING_CONSENT_KEY, String(consent));
}

export function clearUserSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem("userName");
  localStorage.removeItem(USER_LAST_LOGIN_KEY);
  localStorage.removeItem(USER_TRACKING_CONSENT_KEY);
}
