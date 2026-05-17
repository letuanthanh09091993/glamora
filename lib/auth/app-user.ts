import type { AccountStatus, UserAccount, UserRole } from "@/lib/auth-types";
import { ROLE_META } from "@/lib/role-meta";

/** Row shape from `public.users` used for authorization (never auth metadata). */
export type AppUserPrincipal = {
  id: string;
  username: string;
  role: UserRole;
  accountStatus: AccountStatus;
  phoneNumber: string;
  isPublicProfile: boolean;
  authLoginEmail?: string;
  contactEmail?: string;
  createdAt?: string;
};

export function isActiveAdminUser(
  user: Pick<UserAccount, "role" | "accountStatus"> | AppUserPrincipal | null | undefined,
): boolean {
  if (!user || user.role !== "admin") return false;
  const status = "accountStatus" in user ? user.accountStatus : (user as UserAccount).accountStatus;
  return (status ?? "active") === "active";
}

export function dashboardPathForRole(role: UserRole): string {
  return ROLE_META[role].dashboardPath;
}

export function accountFromPrincipal(row: AppUserPrincipal): UserAccount {
  return {
    id: row.id,
    username: row.username,
    phoneNumber: row.phoneNumber,
    email: row.contactEmail,
    role: row.role,
    isPublicProfile: row.isPublicProfile,
    createdAt: row.createdAt,
    accountStatus: row.accountStatus,
    authLoginEmail: row.authLoginEmail,
  };
}
