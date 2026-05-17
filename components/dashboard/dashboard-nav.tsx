"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/lib/auth-types";
import { AppRoutes } from "@/lib/app-routes";
import { glamora } from "@/lib/ui/design-tokens";
import { hasPermission } from "@/lib/permissions";

type NavItem = { href: string; label: string };

function itemsForRole(role: UserRole, t: (key: string) => string): NavItem[] {
  const base: NavItem[] = [{ href: "/", label: t("dashboard.navHome") }];

  if (hasPermission(role, "canAccessAdmin")) {
    base.push({ href: AppRoutes.dashboardAdmin, label: t("dashboard.adminAccounts.navLink") });
  }

  if (role === "makeup_artist") {
    base.push(
      { href: AppRoutes.dashboardMakeupArtistBookings, label: t("booking.navLink") },
      { href: AppRoutes.dashboardMakeupArtistModelBookings, label: t("booking.withModel") },
    );
  }

  if (role === "customer") {
    base.push({ href: AppRoutes.dashboardCustomerBookings, label: t("booking.navLink") });
  }

  if (role === "model") {
    base.push({ href: AppRoutes.dashboardModelBookings, label: t("booking.navLink") });
  }

  return base;
}

export function DashboardNav({ role, t }: { role: UserRole; t: (key: string) => string }) {
  const pathname = usePathname();
  const items = itemsForRole(role, t);

  return (
    <nav
      className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Dashboard"
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? glamora.navLinkActive : glamora.navLink}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
