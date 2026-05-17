import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import type { AccountStatus, UserRole } from "@/lib/auth-types";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import { AUTH_DEBUG_SKIP_REDIRECTS } from "@/lib/auth/auth-debug-flags";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";
import { logServerCookieCheck } from "@/lib/supabase/server-cookie-debug";

export type DbUser = {
  id: string;
  role: UserRole;
  account_status: AccountStatus;
};

export type CurrentUser = {
  authUser: User;
  dbUser: DbUser;
};

/**
 * Server-only: validated Supabase auth user + public.users row.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const cookieStore = await cookies();
  logServerCookieCheck(cookieStore, "getCurrentUser");

  const supabase = await createRouteSupabase("getCurrentUser");

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("[getCurrentUser] auth.getUser", {
    userId: authUser?.id ?? null,
    email: authUser?.email ?? null,
    authError: authError?.message ?? null,
  });

  if (authError || !authUser) {
    if (AUTH_DEBUG_SKIP_REDIRECTS) {
      throw new Error("getCurrentUser: no auth user (debug mode — redirect skipped)");
    }
    redirect("/auth/login");
  }

  const { row } = await fetchDbAuthRow(supabase, authUser.id);

  console.log("[getCurrentUser] db row", {
    role: row?.role ?? null,
    account_status: row?.account_status ?? null,
    found: !!row,
  });

  if (!row) {
    if (AUTH_DEBUG_SKIP_REDIRECTS) {
      throw new Error("getCurrentUser: no public.users row (debug mode — redirect skipped)");
    }
    redirect("/auth/login");
  }

  return {
    authUser,
    dbUser: {
      id: row.id,
      role: row.role,
      account_status: row.account_status,
    },
  };
}
