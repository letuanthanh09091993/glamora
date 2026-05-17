import { isActiveAdminUser } from "@/lib/auth/app-user";
import type { AccountStatus, UserAccount, UserRole } from "@/lib/auth-types";
import { hasPermission } from "@/lib/permissions";

export type AdminAccessDenialReason =
  | "allowed"
  | "session_loading"
  | "not_authenticated"
  | "users_row_missing"
  | "role_not_admin"
  | "account_suspended"
  | "email_not_verified"
  | "insufficient_permission";

export const ADMIN_DENIAL_LABELS: Record<AdminAccessDenialReason, string> = {
  allowed: "Access granted",
  session_loading: "Session still loading — wait before redirect",
  not_authenticated: "No Supabase auth session",
  users_row_missing: "No row in public.users for auth user id",
  role_not_admin: "public.users.role is not admin",
  account_suspended: "public.users.account_status is not active",
  email_not_verified: "Email not verified (non-admin dashboard rule)",
  insufficient_permission: "Missing canAccessAdmin permission for role",
};

export function getAdminAccessDenialReason(input: {
  isReady: boolean;
  authUserId: string | null;
  dbRole: string | null;
  dbAccountStatus: string | null;
  isEmailVerified: boolean;
  clientUser: UserAccount | null;
}): AdminAccessDenialReason {
  if (!input.isReady) return "session_loading";
  if (!input.authUserId) return "not_authenticated";
  if (!input.dbRole) return "users_row_missing";

  const principal = {
    role: input.dbRole as UserRole,
    accountStatus: (input.dbAccountStatus as AccountStatus | null) ?? "active",
  };

  if (principal.accountStatus === "suspended") return "account_suspended";
  if (principal.role !== "admin") return "role_not_admin";
  if (!hasPermission(principal.role, "canAccessAdmin")) return "insufficient_permission";
  if (!isActiveAdminUser(principal)) {
    if (principal.accountStatus !== "active") return "account_suspended";
    return "role_not_admin";
  }

  if (input.clientUser && !isActiveAdminUser(input.clientUser)) {
    if (input.clientUser.accountStatus === "suspended") return "account_suspended";
    if (input.clientUser.role !== "admin") return "role_not_admin";
  }

  return "allowed";
}
