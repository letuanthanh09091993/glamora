import { AppRoutes } from "@/lib/app-routes";
import type { UserRole } from "@/lib/auth-types";

/** After login: admin dashboard or default customer dashboard. */
export function postLoginPathForRole(role: UserRole | null | undefined): string {
  if (role === "admin") {
    return AppRoutes.dashboardAdmin;
  }
  return AppRoutes.dashboardCustomer;
}
