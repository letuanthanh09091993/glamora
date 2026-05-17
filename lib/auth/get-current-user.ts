import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { AccountStatus, UserRole } from "@/lib/auth-types";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import { createRouteSupabase } from "@/lib/supabase/create-route-supabase";

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
 * Redirects to /auth/login when either is missing.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createRouteSupabase();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    redirect("/auth/login");
  }

  const { row } = await fetchDbAuthRow(supabase, authUser.id);

  if (!row) {
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
