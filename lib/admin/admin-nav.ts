import { AppRoutes } from "@/lib/app-routes";

export type AdminNavId = "overview" | "users" | "artists" | "bookings" | "reports";

export type AdminNavItemConfig = {
  id: AdminNavId;
  href: string;
  labelKey:
    | "dashboard.adminNav.overview"
    | "dashboard.adminNav.users"
    | "dashboard.adminNav.artists"
    | "dashboard.adminNav.bookings"
    | "dashboard.adminNav.reports";
};

/** Canonical admin sidebar routes (single source of truth). */
export const ADMIN_NAV_ITEMS: readonly AdminNavItemConfig[] = [
  { id: "overview", href: AppRoutes.dashboardAdmin, labelKey: "dashboard.adminNav.overview" },
  { id: "users", href: AppRoutes.dashboardAdminUsers, labelKey: "dashboard.adminNav.users" },
  { id: "artists", href: AppRoutes.dashboardAdminArtists, labelKey: "dashboard.adminNav.artists" },
  { id: "bookings", href: AppRoutes.dashboardAdminBookings, labelKey: "dashboard.adminNav.bookings" },
  { id: "reports", href: AppRoutes.dashboardAdminReports, labelKey: "dashboard.adminNav.reports" },
] as const;

export function normalizeAdminPathname(pathname: string | null): string {
  if (!pathname) return "";
  const path = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

/** True when this nav item should show as the current section. */
export function isAdminNavItemActive(pathname: string, href: string): boolean {
  const p = normalizeAdminPathname(pathname);

  if (href === AppRoutes.dashboardAdmin) {
    return p === AppRoutes.dashboardAdmin;
  }

  return p === href || p.startsWith(`${href}/`);
}

export function getActiveAdminNavItem(pathname: string): AdminNavItemConfig {
  return (
    ADMIN_NAV_ITEMS.find((item) => isAdminNavItemActive(pathname, item.href)) ?? ADMIN_NAV_ITEMS[0]
  );
}
