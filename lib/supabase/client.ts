import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Single browser Supabase client for the whole app.
 * Always import via `@/lib/supabase/client` or `getBrowserSupabase()`.
 */
let browserClient: SupabaseClient | null = null;

function readSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local.",
    );
  }
  return { url, anonKey };
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient must run in the browser");
  }
  if (!browserClient) {
    const { url, anonKey } = readSupabaseEnv();
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}

/** @deprecated Use getSupabaseBrowserClient — kept for existing imports. */
export const getBrowserSupabase = getSupabaseBrowserClient;

export function resetBrowserSupabaseForTests() {
  browserClient = null;
}
