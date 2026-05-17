import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { UserAccount } from "@/lib/auth-types";
import { accountFromDbAuthRow } from "@/lib/auth/account-from-db-row";
import { accountFromPrincipal } from "@/lib/auth/app-user";
import { fetchDbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import {
  fetchAppUserPrincipalById,
  fetchUserAccountById,
} from "@/lib/supabase/users-repository";

export type ProfileSyncResult = {
  user: UserAccount | null;
  hasAuthSession: boolean;
  isEmailVerified: boolean;
};

/** Load app user from `public.users` — never drops session when profile fetch is slow. */
export async function syncProfileFromSession(
  supabase: SupabaseClient,
  session: Session | null,
): Promise<ProfileSyncResult> {
  if (!session?.user) {
    return { user: null, hasAuthSession: false, isEmailVerified: false };
  }

  const authUser = session.user;
  const isEmailVerified = Boolean(authUser.email_confirmed_at);

  const dbFetch = await fetchDbAuthRow(supabase, authUser.id);

  if (dbFetch.row && dbFetch.row.id === authUser.id) {
    const acc = await fetchUserAccountById(supabase, authUser.id);
    if (acc) {
      return {
        hasAuthSession: true,
        isEmailVerified,
        user: { ...acc, role: dbFetch.row.role, accountStatus: dbFetch.row.account_status },
      };
    }

    const principal = await fetchAppUserPrincipalById(supabase, authUser.id);
    if (principal && principal.id === authUser.id) {
      return {
        hasAuthSession: true,
        isEmailVerified,
        user: {
          ...accountFromPrincipal(principal),
          role: dbFetch.row.role,
          accountStatus: dbFetch.row.account_status,
        },
      };
    }

    return {
      hasAuthSession: true,
      isEmailVerified,
      user: accountFromDbAuthRow(dbFetch.row, authUser),
    };
  }

  const principal = await fetchAppUserPrincipalById(supabase, authUser.id);
  if (principal && principal.id === authUser.id) {
    const acc = await fetchUserAccountById(supabase, authUser.id);
    return {
      hasAuthSession: true,
      isEmailVerified,
      user: acc
        ? { ...acc, role: principal.role, accountStatus: principal.accountStatus }
        : accountFromPrincipal(principal),
    };
  }

  console.log("[AUTH PROVIDER] session active but public.users profile missing", {
    authUserId: authUser.id,
    dbError: dbFetch.error,
  });

  return {
    hasAuthSession: true,
    isEmailVerified,
    user: null,
  };
}
