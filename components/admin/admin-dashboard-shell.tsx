"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import { AppRoutes } from "@/lib/app-routes";
import {
  ADMIN_NAV_ITEMS,
  getActiveAdminNavItem,
  isAdminNavItemActive,
  normalizeAdminPathname,
} from "@/lib/admin/admin-nav";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
      {children}
    </span>
  );
}

function OverviewIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ArtistsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.5 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3z" />
    </svg>
  );
}

function BookingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-6" />
    </svg>
  );
}

const NAV_ICONS: Record<(typeof ADMIN_NAV_ITEMS)[number]["id"], ReactNode> = {
  overview: <OverviewIcon />,
  users: <UsersIcon />,
  artists: <ArtistsIcon />,
  bookings: <BookingsIcon />,
  reports: <ReportsIcon />,
};

export function AdminDashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const normalizedPath = useMemo(() => normalizeAdminPathname(pathname), [pathname]);
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav: NavItem[] = useMemo(
    () =>
      ADMIN_NAV_ITEMS.map((item) => ({
        href: item.href,
        label: t(item.labelKey),
        icon: NAV_ICONS[item.id],
      })),
    [t],
  );

  const activeConfig = getActiveAdminNavItem(normalizedPath);
  const active = nav.find((item) => item.href === activeConfig.href) ?? nav[0];
  const displayName = user?.displayName || user?.username || user?.email || "Admin";

  async function handleLogout() {
    await signOut();
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <ul className="space-y-1.5">
        {nav.map((item) => {
          const isActive = isAdminNavItemActive(normalizedPath, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-rose-500/25 to-pink-500/10 text-white shadow-inner ring-1 ring-rose-400/30"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {isActive ? (
                  <span
                    className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-rose-300 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.55)]"
                    aria-hidden
                  />
                ) : null}
                <NavIcon>{item.icon}</NavIcon>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3f0] text-slate-900">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          aria-label={t("dashboard.adminShell.closeMenu")}
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(100%,280px)] flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-5">
          <div>
            <p className="font-[family-name:var(--font-glamora-mark)] text-lg font-semibold tracking-tight">
              {t("dashboard.adminShell.brand")}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-rose-300/90">
              {t("dashboard.adminShell.tagline")}
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl p-2 text-slate-300 ring-1 ring-white/10 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <NavLinks onNavigate={() => setMobileOpen(false)} />
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            href={AppRoutes.home}
            className="mb-3 flex w-full items-center justify-center rounded-2xl border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
          >
            {t("dashboard.adminAccounts.exitToSite")}
          </Link>
          <p className="truncate text-center text-[11px] text-slate-400">{displayName}</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-[280px]">
        <header className="sticky top-0 z-30 border-b border-rose-100/80 bg-white/85 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                {t("dashboard.adminShell.menu")}
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-rose-400">
                  {active.label}
                </p>
                <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden rounded-2xl border border-rose-100 bg-rose-50/50 px-3 py-1.5 text-xs text-slate-600 sm:block">
                <span className="text-slate-400">{t("dashboard.adminAccounts.operatorLabel")} </span>
                <span className="font-semibold text-slate-900">{user?.username ?? "—"}</span>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-rose-600"
              >
                {t("common.logout")}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
