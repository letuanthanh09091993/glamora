/**
 * Central RBAC entry for Glamora (browser + server + future mobile clients).
 * Re-exports the permission model; add route helpers here instead of scattering strings.
 */

export {
  capabilitiesFromLegacyRole,
  hasPermission,
  permissionsFromCapabilities,
  permissionsFromLegacyRole,
  type Capability,
  type Permission,
} from "@/lib/permissions";
import { AppRoutes } from "@/lib/app-routes";

const AUTH_EMAIL_RELAXED_PREFIXES = [
  "/auth/login",
  "/auth/signup",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
  "/auth/account-suspended",
] as const;

export function isDashboardOrAccountPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard") || pathname.startsWith("/account");
}

export function isAdminDashboardPath(pathname: string): boolean {
  return pathname.startsWith("/dashboard/admin");
}

/** Paths under /auth that must stay reachable before email is confirmed. */
export function isAuthShellPath(pathname: string): boolean {
  return pathname.startsWith("/auth/");
}

export function allowsSessionWithoutVerifiedEmail(pathname: string): boolean {
  return AUTH_EMAIL_RELAXED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Active admins may use dashboard surfaces before email confirmation (role from `public.users`). */
export function allowsUnverifiedEmailForDashboard(
  pathname: string,
  isActiveAdmin: boolean,
): boolean {
  if (!isActiveAdmin) return false;
  return isDashboardOrAccountPath(pathname);
}

export const AuthRoutes = {
  login: AppRoutes.login,
  signup: AppRoutes.signup,
  verifyEmail: "/auth/verify-email",
  forgotPassword: "/auth/forgot-password",
  resetPassword: "/auth/reset-password",
  callback: "/auth/callback",
  accountSuspended: "/auth/account-suspended",
} as const;
