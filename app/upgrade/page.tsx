import { createSupabaseServerClient } from "@/lib/supabase/serverClient";
import { getUserPlan } from "@/lib/server/entitlements";
import UpgradePageClient from "./_components/UpgradePageClient";

export default async function UpgradePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // middleware.ts already enforces auth for /upgrade; user should always be
  // present here. Falling back to "free" rather than throwing keeps this
  // page resilient if that assumption is ever wrong (e.g. an internal link
  // bypasses the middleware matcher).
  const entitlement = user ? await getUserPlan(user.id) : { plan: "free" as const, active: true, expiresAt: null };

  return <UpgradePageClient currentPlan={entitlement.plan} />;
}
