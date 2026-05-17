import { cookies } from "next/headers";
import {
  AuthDebugClient,
  type AuthDebugServerSnapshot,
} from "@/components/debug/auth-debug-client";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
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

  const authRow = user ? await fetchDbAuthRow(supabase, user.id) : null;

  if (authRow) {
    console.log("[ROLE FETCH]", {
      userId: user?.id ?? null,
      role: authRow.row?.role ?? null,
      account_status: authRow.row?.account_status ?? null,
      source: authRow.source,
      error: authRow.error,
      context: "debug-auth",
    });
  }

  const server: AuthDebugServerSnapshot = {
    cookieNames,
    authTokenCookiePresent,
    serverUser: {
      id: user?.id ?? null,
      email: user?.email ?? null,
      error: authError?.message ?? null,
    },
    dbRole: {
      role: authRow?.row?.role ?? null,
      account_status: authRow?.row?.account_status ?? null,
      queryError: authRow?.error ?? null,
      source: authRow?.source ?? null,
    },
    env: {
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      nodeEnv: process.env.NODE_ENV ?? "unknown",
    },
  };

  return <AuthDebugClient server={server} />;
}
