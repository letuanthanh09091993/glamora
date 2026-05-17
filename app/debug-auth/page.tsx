import { cookies } from "next/headers";
import {
  AuthDebugClient,
  type AuthDebugServerSnapshot,
} from "@/components/debug/auth-debug-client";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";
import { logServerCookieCheck } from "@/lib/supabase/server-cookie-debug";

export const dynamic = "force-dynamic";

export default async function DebugAuthPage() {
  const cookieStore = await cookies();
  const { cookieNames, authTokenCookiePresent } = logServerCookieCheck(cookieStore, "debug-auth/page");

  const supabase = await createRouteSupabase("debug-auth/page");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const { data: profile, error: profileError } = user
    ? await supabase.from("users").select("role").eq("id", user.id).single()
    : { data: null, error: null };

  console.log("[debug-auth] server snapshot", {
    userId: user?.id ?? null,
    email: user?.email ?? null,
    role: profile?.role ?? null,
    authTokenCookiePresent,
  });

  const server: AuthDebugServerSnapshot = {
    cookieNames,
    authTokenCookiePresent,
    serverUser: {
      id: user?.id ?? null,
      email: user?.email ?? null,
      error: authError?.message ?? null,
    },
    dbRole: {
      role: profile?.role ?? null,
      queryError: profileError?.message ?? null,
    },
    env: {
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      nodeEnv: process.env.NODE_ENV ?? "unknown",
    },
  };

  return <AuthDebugClient server={server} />;
}
