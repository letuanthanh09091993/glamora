import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logServerCookieCheck } from "@/lib/supabase/server-cookie-debug";

/**
 * Server Supabase client (@supabase/ssr).
 * Uses get/getAll/setAll — compatible with Next.js App Router cookie store.
 */
export async function createRouteSupabase(debugContext = "createRouteSupabase") {
  const cookieStore = await cookies();
  logServerCookieCheck(cookieStore, debugContext);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* Server Component — cookie writes may be read-only */
        }
      },
    },
  });
}
