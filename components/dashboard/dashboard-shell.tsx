"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { AppButton } from "@/components/ui/app-button";
import { useLanguage } from "@/components/providers/language-provider";
import { getRoleLabel } from "@/lib/i18n";

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
              {t("home.navExplore")}
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
            <Link className="rounded-full px-4 py-2 text-sm hover:bg-black/5" href="/account">
              {t("common.account")}
            </Link>
            <Link className="rounded-full px-4 py-2 text-sm hover:bg-black/5" href={`/profile/${user.username}`}>
              {t("common.publicProfile")}
            </Link>
            <AppButton variant="secondary" onClick={logout}>
              {t("common.logout")}
            </AppButton>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">{t("dashboard.signedInAs")}</p>
          <p className="text-lg font-semibold text-black">{user.username}</p>
          <p className="text-sm text-gray-600">{getRoleLabel(language, user.role)}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
