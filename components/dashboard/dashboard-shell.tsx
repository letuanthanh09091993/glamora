"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AppButton } from "@/components/ui/app-button";
import { useLanguage } from "@/components/providers/language-provider";
import { getArtistDeliveredSessionStats } from "@/lib/booking-storage";
import { getRoleLabel } from "@/lib/i18n";
import { AppRoutes } from "@/lib/app-routes";
import { hasPermission } from "@/lib/permissions";

function IconShowsProvided(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconCustomers(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function userInitials(username: string): string {
  const cleaned = username.trim().replace(/[@._-]+/g, " ");
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    const pair = `${a}${b}`.toUpperCase();
    return pair || "?";
  }
  const two = cleaned.slice(0, 2).toUpperCase();
  return two || "?";
}

export function DashboardShell({
  title,
  children,
  hideProfileCard,
}: {
  title: string;
  children: ReactNode;
  /** Ẩn thẻ hồ sơ / hoạt động phía trên (vd. trang đăng ảnh & video). */
  hideProfileCard?: boolean;
}) {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();
  const pathname = usePathname();

  if (!user) return null;

  const displayNameTrimmed = user.displayName?.trim() ?? "";
  const headlineName = displayNameTrimmed || user.username;
  const showUsernameHandle = Boolean(displayNameTrimmed);

  const [artistStats, setArtistStats] = useState<{
    sessionsDelivered: number;
    uniqueCustomers: number;
  } | null>(null);

  useEffect(() => {
    if (user.role !== "makeup_artist") {
      setArtistStats(null);
      return;
    }
    void getArtistDeliveredSessionStats(user.id).then(setArtistStats);
  }, [user.id, user.role, pathname]);

  return (
    <main className="min-h-screen bg-[#fdf8f6]">
      <header className="border-b border-black/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-pink-500">{t("dashboard.eyebrow")}</p>
            <h1 className="text-xl font-semibold text-black">{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className="rounded-full px-4 py-2 text-sm hover:bg-black/5" href="/">
              {t("dashboard.navHome")}
            </Link>
            {hasPermission(user.role, "canAccessAdmin") ? (
              <Link
                className="rounded-full px-4 py-2 text-sm hover:bg-black/5"
                href={AppRoutes.dashboardAdmin}
              >
                {t("dashboard.adminAccounts.navLink")}
              </Link>
            ) : null}
            {user.role === "makeup_artist" ? (
              <>
                <Link
                  className="rounded-full px-4 py-2 text-sm hover:bg-black/5"
                  href={AppRoutes.dashboardMakeupArtistBookings}
                >
                  {t("booking.navLink")}
                </Link>
                <Link
                  className="rounded-full px-4 py-2 text-sm hover:bg-black/5"
                  href={AppRoutes.dashboardMakeupArtistModelBookings}
                >
                  {t("booking.withModel")}
                </Link>
              </>
            ) : null}
            {user.role === "model" ? (
              <Link
                className="rounded-full px-4 py-2 text-sm hover:bg-black/5"
                href={AppRoutes.dashboardModelBookings}
              >
                {t("booking.navLink")}
              </Link>
            ) : null}
            <AppButton variant="secondary" onClick={() => void logout()}>
              {t("common.logout")}
            </AppButton>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {!hideProfileCard ? (
        <div className="mb-6 overflow-hidden rounded-3xl border border-pink-100/90 bg-gradient-to-br from-white via-pink-50/40 to-rose-50/25 p-6 shadow-md ring-1 ring-black/[0.04]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8">
            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-pink-200 via-rose-100 to-fuchsia-100 shadow-inner ring-2 ring-white">
                {user.avatarUrl ? (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${user.avatarUrl})` }}
                    aria-hidden
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl font-bold tracking-tight text-pink-950">
                    {userInitials(user.username)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-pink-600">
                  {t("dashboard.signedInAs")}
                </p>
                <h2 className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1 text-2xl font-bold tracking-tight text-black sm:text-3xl">
                  <span className="min-w-0 truncate">{headlineName}</span>
                  {showUsernameHandle ? (
                    <span className="shrink-0 text-base font-normal tracking-normal text-gray-400 sm:text-lg">
                      @{user.username}
                    </span>
                  ) : null}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                    {getRoleLabel(language, user.role)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${
                      user.isPublicProfile
                        ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                        : "bg-gray-100 text-gray-700 ring-gray-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        user.isPublicProfile ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                      aria-hidden
                    />
                    {user.isPublicProfile
                      ? t("dashboard.profileCard.visibilityPublic")
                      : t("dashboard.profileCard.visibilityPrivate")}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  <span className="font-medium text-gray-800">{t("dashboard.profileCard.phoneLabel")}:</span>{" "}
                  <span className="select-all font-mono text-[13px] tabular-nums tracking-wide text-gray-900">
                    {user.phoneNumber.trim()}
                  </span>
                </p>
              </div>
            </div>

            {user.role === "makeup_artist" && artistStats ? (
              <div className="flex shrink-0 flex-col justify-center rounded-2xl border border-black/[0.06] bg-white/70 px-5 py-4 shadow-sm ring-1 ring-black/[0.03] sm:px-6 lg:min-w-[260px]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                  {t("dashboard.profileCard.statsEyebrow")}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 via-rose-50 to-white ring-1 ring-pink-200/70">
                      <IconShowsProvided className="text-rose-700" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-3xl font-bold tabular-nums tracking-tight text-black">
                        {artistStats.sessionsDelivered}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-gray-600">
                        {t("dashboard.profileCard.sessionsDelivered")}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-0 gap-3 border-l border-black/10 pl-4 sm:pl-6">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 via-rose-50 to-white ring-1 ring-pink-200/70">
                      <IconCustomers className="text-rose-700" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-3xl font-bold tabular-nums tracking-tight text-black">
                        {artistStats.uniqueCustomers}
                      </p>
                      <p className="mt-1 text-xs leading-snug text-gray-600">
                        {t("dashboard.profileCard.uniqueCustomers")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {user.role === "makeup_artist" ? (
              <div className="flex shrink-0 flex-col justify-center gap-2 lg:max-w-[28rem] lg:items-end">
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <Link
                  href={AppRoutes.account}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-dashed border-black/25 bg-white px-5 py-2.5 text-center text-sm font-semibold text-gray-800 transition hover:border-black/40 hover:bg-black/5"
                >
                  {t("dashboard.profileCard.updatePersonalInfo")}
                </Link>
                <Link
                  href={AppRoutes.dashboardMakeupArtistPostFresh}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/15 bg-gradient-to-r from-pink-50 to-white px-5 py-2.5 text-center text-sm font-semibold text-black ring-1 ring-pink-200/80 transition hover:ring-pink-400"
                >
                  {t("dashboard.profileCard.createPost")}
                </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        ) : null}
        {children}
      </section>
    </main>
  );
}
