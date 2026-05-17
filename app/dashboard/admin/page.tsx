"use client";

import Link from "next/link";
import { AdminOverviewStatCard } from "@/components/admin/admin-overview-stat-card";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import { AppRoutes } from "@/lib/app-routes";
import { MOCK_ADMIN_OVERVIEW_STATS } from "@/lib/admin/mock-overview-stats";
import { useLanguage } from "@/components/providers/language-provider";

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ArtistsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.5 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3z" />
    </svg>
  );
}

function BookingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ApprovalsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

const MOCK_TRENDS = {
  totalUsers: "+8.2%",
  totalArtists: "+3.1%",
  totalBookings: "+14.6%",
  pendingApprovals: "−2 today",
} as const;

const MOCK_ACTIVITY = [
  { key: "activityArtist", time: "12m" },
  { key: "activityBooking", time: "34m" },
  { key: "activityUser", time: "1h" },
] as const;

export default function AdminOverviewPage() {
  const { t } = useLanguage();
  const stats = MOCK_ADMIN_OVERVIEW_STATS;

  const cards = [
    {
      label: t("dashboard.adminAnalytics.totalUsers"),
      value: formatCount(stats.totalUsers),
      hint: `${MOCK_TRENDS.totalUsers} ${t("dashboard.adminOverview.vsLastMonth")}`,
      icon: <UsersIcon />,
      accentClass: "ring-rose-100/80",
    },
    {
      label: t("dashboard.adminAnalytics.totalArtists"),
      value: formatCount(stats.totalArtists),
      hint: `${MOCK_TRENDS.totalArtists} ${t("dashboard.adminOverview.vsLastMonth")}`,
      icon: <ArtistsIcon />,
      accentClass: "ring-rose-200/90",
    },
    {
      label: t("dashboard.adminAnalytics.totalBookings"),
      value: formatCount(stats.totalBookings),
      hint: `${MOCK_TRENDS.totalBookings} ${t("dashboard.adminOverview.vsLastMonth")}`,
      icon: <BookingsIcon />,
      accentClass: "ring-slate-200/80",
    },
    {
      label: t("dashboard.adminAnalytics.pendingApprovals"),
      value: formatCount(stats.pendingApprovals),
      hint: MOCK_TRENDS.pendingApprovals,
      icon: <ApprovalsIcon />,
      accentClass: "ring-amber-200/80",
    },
  ];

  const quickLinks = [
    { href: AppRoutes.dashboardAdminUsers, label: t("dashboard.adminNav.users") },
    { href: AppRoutes.dashboardAdminArtists, label: t("dashboard.adminNav.artists") },
    { href: AppRoutes.dashboardAdminBookings, label: t("dashboard.adminNav.bookings") },
    { href: AppRoutes.dashboardAdminReports, label: t("dashboard.adminNav.reports") },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminSectionHeader
          title={t("dashboard.adminNav.overview")}
          subtitle={t("dashboard.adminOverview.subtitle")}
        />
        <span className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
          {t("dashboard.adminOverview.mockBadge")}
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <AdminOverviewStatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3 rounded-[1.75rem] border border-rose-100/80 bg-gradient-to-br from-white via-rose-50/40 to-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">{t("dashboard.adminNav.overview")}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            {t("dashboard.adminAccounts.consoleSubtitle")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-rose-600 hover:shadow-rose-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2 rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">{t("dashboard.adminOverview.recentActivity")}</h2>
          <ul className="mt-5 space-y-4">
            {MOCK_ACTIVITY.map((item) => (
              <li
                key={item.key}
                className="flex items-start gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              >
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-800">
                    {t(`dashboard.adminOverview.${item.key}`)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
