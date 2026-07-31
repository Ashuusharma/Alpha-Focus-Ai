import { createBrowserClient } from "@supabase/ssr";

// Session storage moved from localStorage (plain createClient) to cookies
// (createBrowserClient) so middleware.ts and Server Components can read the
// same session for SSR route protection. Every existing importer keeps
// working unchanged — this is still the same @supabase/supabase-js client
// shape, just a different storage adapter under the hood.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
