import type { DbAuthRow } from "@/lib/auth/fetch-db-auth-row";
import type { UserAccount } from "@/lib/auth-types";

/** Minimal app user from `public.users` auth row + Supabase Auth session. */
export function accountFromDbAuthRow(
  row: DbAuthRow,
  auth: { email?: string | null },
): UserAccount {
  return {
    id: row.id,
    username: `user-${row.id.slice(0, 8)}`,
    phoneNumber: "",
    email: auth.email?.trim() || undefined,
    authLoginEmail: auth.email?.trim() || undefined,
    role: row.role,
    isPublicProfile: false,
    accountStatus: row.account_status,
  };
}
