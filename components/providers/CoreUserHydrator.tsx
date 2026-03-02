"use client";

import { useContext, useEffect } from "react";
import { AuthContext } from "@/contexts/AuthProvider";
import { hydrateCoreUserData } from "@/lib/hydrateCoreUserData";
import { useUserStore } from "@/stores/useUserStore";

export default function CoreUserHydrator() {
  const { user } = useContext(AuthContext);
  const hydratedUserId = useUserStore((state) => state.hydratedUserId);
  const resetUserState = useUserStore((state) => state.resetUserState);

  useEffect(() => {
    if (!user) {
      resetUserState();
      return;
    }

    if (hydratedUserId === user.id) return;
    void hydrateCoreUserData(user.id);
  }, [user, hydratedUserId, resetUserState]);

  return null;
}
