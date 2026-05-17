import { cookies } from "next/headers";
import {
  AuthDebugClient,
  type AuthDebugServerSnapshot,
} from "@/components/debug/auth-debug-client";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";
import { hasSupabaseAuthCookie } from "@/lib/supabase/server-cookie-debug";

export const dynamic = "force-dynamic";

export default async function DebugAuthPage() {
  const cookieStore = await cookies();
  const cookieNames = cookieStore.getAll().map((c) => c.name);
  const authTokenCookiePresent = hasSupabaseAuthCookie(cookieNames);

  const supabase = await createRouteSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  const { data: profile, error: profileError } = user
    ? await supabase.from("users").select("role, account_status").eq("id", user.id).single()
    : { data: null, error: null };

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
      account_status: profile?.account_status ?? null,
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
