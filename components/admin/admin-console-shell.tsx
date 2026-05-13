"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { AppButton } from "@/components/ui/app-button";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";

export function AdminConsoleShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
              {t("dashboard.adminAccounts.consoleEyebrow")}
            </p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
              {t("dashboard.adminAccounts.consoleTitle")}
            </h1>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-600">
              {t("dashboard.adminAccounts.consoleSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <div
              className="max-w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-800 sm:text-xs"
              title={user.id}
            >
              <span className="text-slate-500">{t("dashboard.adminAccounts.operatorLabel")} </span>
              <span className="font-semibold text-slate-950">{user.username}</span>
              <span className="text-slate-400"> · </span>
              <span className="select-all">{user.id.slice(0, 8)}…</span>
            </div>
            <Link
              href="/"
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-900 hover:text-white hover:ring-slate-900"
            >
              {t("dashboard.adminAccounts.exitToSite")}
            </Link>
            <AppButton type="button" variant="secondary" size="sm" onClick={logout}>
              {t("common.logout")}
            </AppButton>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
