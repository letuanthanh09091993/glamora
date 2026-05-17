"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useState, useTransition } from "react";
import { AdminSectionHeader } from "@/components/admin/admin-section-header";
import type { AdminUsersListRow } from "@/lib/admin/fetch-admin-users";
import { USER_ROLES, type UserRole } from "@/lib/auth-types";
import { RoleBadge } from "@/components/ui/role-badge";
import { AppRoutes } from "@/lib/app-routes";
import { getRoleLabel } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/language-provider";

type Props = {
  rows: AdminUsersListRow[];
  total: number;
  page: number;
  pageSize: number;
  initialQuery: string;
  initialRole: string;
  fetchError: string | null;
  authUserId: string;
};

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function statusBadgeClass(status: string) {
  return status === "active"
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : "bg-slate-100 text-slate-600 ring-slate-200";
}

export function AdminUsersManager({
  rows,
  total,
  page,
  pageSize,
  initialQuery,
  initialRole,
  fetchError,
  authUserId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState(initialRole);
  const [actionError, setActionError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pushFilters = useCallback(
    (next: { q?: string; role?: string; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString());
      const q = next.q ?? query;
      const r = next.role ?? role;
      const p = next.page ?? 1;

      if (q.trim()) params.set("q", q.trim());
      else params.delete("q");

      if (r && r !== "all") params.set("role", r);
      else params.delete("role");

      if (p > 1) params.set("page", String(p));
      else params.delete("page");

      startTransition(() => {
        router.push(`${AppRoutes.dashboardAdminUsers}?${params.toString()}`);
      });
    },
    [query, role, router, searchParams],
  );

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    pushFilters({ page: 1 });
  }

  async function toggleStatus(user: AdminUsersListRow) {
    setActionError(null);
    const next = user.account_status === "active" ? "suspended" : "active";

    const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_status: next }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setActionError(body?.error ?? t("authMessages.networkError"));
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title={t("dashboard.adminNav.users")}
        subtitle={t("dashboard.adminUsers.subtitle")}
      />

      <form
        onSubmit={onSearchSubmit}
        className="flex flex-col gap-3 rounded-2xl border border-rose-100/80 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
      >
        <label className="min-w-0 flex-1">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            {t("dashboard.adminUsers.search")}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("dashboard.adminUsers.searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none ring-rose-200 focus:border-rose-300 focus:ring-2"
          />
        </label>
        <label className="w-full sm:w-44">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            {t("dashboard.adminUsers.filterRole")}
          </span>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              pushFilters({ role: e.target.value, page: 1 });
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          >
            <option value="all">{t("dashboard.adminUsers.allRoles")}</option>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {getRoleLabel(language, r)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {t("dashboard.adminUsers.searchButton")}
        </button>
      </form>

      {fetchError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {fetchError}
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-rose-100/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-gradient-to-r from-rose-50/80 to-white text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <th className="px-4 py-3">{t("dashboard.adminUsers.colAvatar")}</th>
                <th className="px-4 py-3">{t("dashboard.adminUsers.colEmail")}</th>
                <th className="px-4 py-3">{t("dashboard.adminUsers.colRole")}</th>
                <th className="px-4 py-3">{t("dashboard.adminUsers.colStatus")}</th>
                <th className="px-4 py-3">{t("dashboard.adminUsers.colCreated")}</th>
                <th className="px-4 py-3 text-right">{t("dashboard.adminUsers.colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {t("dashboard.adminUsers.empty")}
                  </td>
                </tr>
              ) : (
                rows.map((user) => {
                  const isSelf = user.id === authUserId;
                  const created = new Date(user.created_at).toLocaleString(
                    language === "VN" ? "vi-VN" : "en-US",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    },
                  );

                  return (
                    <tr key={user.id} className="transition hover:bg-rose-50/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-rose-100"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                              {initials(user.username)}
                            </div>
                          )}
                          <span className="font-medium text-slate-900">@{user.username}</span>
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-700">
                        {user.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role as UserRole} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(user.account_status)}`}
                        >
                          {user.account_status === "active"
                            ? t("dashboard.adminUsers.statusActive")
                            : t("dashboard.adminUsers.statusSuspended")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{created}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={pending || isSelf}
                          onClick={() => void toggleStatus(user)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            user.account_status === "active"
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                          title={isSelf ? t("dashboard.adminUsers.cannotChangeSelf") : undefined}
                        >
                          {user.account_status === "active"
                            ? t("dashboard.adminUsers.deactivate")
                            : t("dashboard.adminUsers.reactivate")}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <p>
          {t("dashboard.adminUsers.showing")
            .replace("{from}", String(total === 0 ? 0 : (page - 1) * pageSize + 1))
            .replace("{to}", String(Math.min(page * pageSize, total)))
            .replace("{total}", String(total))}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending || page <= 1}
            onClick={() => pushFilters({ page: page - 1 })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-40"
          >
            {t("dashboard.adminUsers.prev")}
          </button>
          <span className="px-2 text-xs font-medium text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={pending || page >= totalPages}
            onClick={() => pushFilters({ page: page + 1 })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:opacity-40"
          >
            {t("dashboard.adminUsers.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
