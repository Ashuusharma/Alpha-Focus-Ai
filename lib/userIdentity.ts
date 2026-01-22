// lib/userIdentity.ts

export const getUserId = () => {
  if (typeof window === "undefined") return null;

  let userId = localStorage.getItem("oneman_user_id");

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem("oneman_user_id", userId);
  }

  return userId;
};
