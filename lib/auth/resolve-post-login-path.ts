import { dashboardPathForRole } from "@/lib/auth/app-user";
import { AppRoutes } from "@/lib/app-routes";
import type { UserRole } from "@/lib/auth-types";

/** Safe post-login destination: honors ?next=, otherwise role dashboard (never silent homepage for admins). */
export function resolvePostLoginPath(nextParam: string | null, role: UserRole | null | undefined): string {
  const next = nextParam?.trim();
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  if (role) {
    return dashboardPathForRole(role);
  }
  return AppRoutes.home;
}
