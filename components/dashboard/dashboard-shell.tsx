"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AppButton } from "@/components/ui/app-button";
import { useLanguage } from "@/components/providers/language-provider";
import { getRoleLabel } from "@/lib/i18n";
import { AppRoutes } from "@/lib/app-routes";

function maskPhoneDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `•••• ${digits.slice(-4)}`;
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

export function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();

  if (!user) return null;

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
            {user.role === "customer" ? (
              <Link
                className="rounded-full px-4 py-2 text-sm hover:bg-black/5"
                href="/dashboard/customer/bookings"
              >
                {t("booking.navLink")}
              </Link>
            ) : null}
            {user.role === "makeup_artist" ? (
              <Link
                className="rounded-full px-4 py-2 text-sm hover:bg-black/5"
                href="/dashboard/makeup-artist/bookings"
              >
                {t("booking.navLink")}
              </Link>
            ) : null}
            <AppButton variant="secondary" onClick={logout}>
              {t("common.logout")}
            </AppButton>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 overflow-hidden rounded-3xl border border-pink-100/90 bg-gradient-to-br from-white via-pink-50/40 to-rose-50/25 p-6 shadow-md ring-1 ring-black/[0.04]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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
                <h2 className="mt-1 truncate text-2xl font-bold tracking-tight text-black sm:text-3xl">
                  {user.username}
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
                    {maskPhoneDigits(user.phoneNumber)}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href={AppRoutes.account}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-black/15 bg-white px-5 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-black hover:text-white"
              >
                {t("dashboard.profileCard.editProfile")}
              </Link>
              <Link
                href={AppRoutes.legacyProfile(user.username)}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-black px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-90"
              >
                {t("dashboard.profileCard.viewProfile")}
              </Link>
            </div>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
