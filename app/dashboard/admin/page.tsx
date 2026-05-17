"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AdminAuthDebugPanel } from "@/components/admin/admin-auth-debug-panel";
import { AdminConsoleShell } from "@/components/admin/admin-console-shell";
import { AdminClientGate } from "@/components/auth/admin-client-gate";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { AppButton } from "@/components/ui/app-button";
import { AppInput } from "@/components/ui/app-input";
import { Notice } from "@/components/ui/notice";
import { USER_ROLES, type UserAccount, type UserRole } from "@/lib/auth-types";
import {
  adminDeleteUser,
  adminSetUserPassword,
  adminUpdateUserAccount,
  getUsers,
  type AdminUserPatch,
} from "@/lib/auth-storage";
import { getRoleLabel } from "@/lib/i18n";

function formatJoined(iso: string | undefined, locale: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function shortId(id: string) {
  return `${id.slice(0, 8)}…`;
}

function verificationLabel(t: (key: string) => string, v?: string) {
  switch (v) {
    case "pending":
      return t("dashboard.adminAccounts.vfyPending");
    case "verified":
      return t("dashboard.adminAccounts.vfyVerified");
    case "rejected":
      return t("dashboard.adminAccounts.vfyRejected");
    case "none":
    default:
      return t("dashboard.adminAccounts.vfyNone");
  }
}

type AdminAnalytics = {
  totalUsers: number;
  totalArtists: number;
  totalBookings: number;
  pendingVerifications: number;
  activeUsers30d: number;
};

export default function AdminAccountsPage() {
  const { t, language } = useLanguage();
  const { user, refreshUser } = useAuth();
  const [version, setVersion] = useState(0);
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [form, setForm] = useState({
    username: "",
    phoneNumber: "",
    email: "",
    displayName: "",
    role: "customer" as UserRole,
    isPublicProfile: true,
    accountStatus: "active" as NonNullable<UserAccount["accountStatus"]>,
    artistVerificationStatus: "none" as NonNullable<UserAccount["artistVerificationStatus"]>,
    artistVerificationNote: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const locale = language === "VN" ? "vi-VN" : "en-US";

  const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);

  useEffect(() => {
    void getUsers().then(setAllUsers);
  }, [version]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    void fetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.totalUsers === "number") setAnalytics(d as AdminAnalytics);
      })
      .catch(() => setAnalytics(null));
  }, [user, version]);

  const rows = useMemo(() => {
    const list = allUsers.slice();
    list.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta || a.username.localeCompare(b.username);
    });
    return list;
  }, [allUsers]);

  const stats = useMemo(() => {
    const list = allUsers;
    const byRole = USER_ROLES.map((role) => ({
      role,
      count: list.filter((u) => u.role === role).length,
    }));
    return { total: list.length, byRole };
  }, [allUsers]);

  function openEdit(u: UserAccount) {
    setEditing(u);
    setForm({
      username: u.username,
      phoneNumber: u.phoneNumber,
      email: u.email ?? "",
      displayName: u.displayName ?? "",
      role: u.role,
      isPublicProfile: u.isPublicProfile,
      accountStatus: u.accountStatus ?? "active",
      artistVerificationStatus: u.artistVerificationStatus ?? "none",
      artistVerificationNote: u.artistVerificationNote ?? "",
    });
    setNewPassword("");
    setConfirmPassword("");
    setNotice(null);
  }

  function closeEdit() {
    setEditing(null);
    setNewPassword("");
    setConfirmPassword("");
    setNotice(null);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!user || !editing) return;

    const pwd = newPassword.trim();
    const pwd2 = confirmPassword.trim();
    if (pwd || pwd2) {
      if (pwd.length < 6) {
        setNotice({ type: "error", message: t("authMessages.adminPasswordTooShort") });
        return;
      }
      if (pwd !== pwd2) {
        setNotice({ type: "error", message: t("authMessages.adminPasswordMismatch") });
        return;
      }
    }

    const patch: AdminUserPatch = {
      username: form.username.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim(),
      displayName: form.displayName.trim(),
      role: form.role,
      isPublicProfile: form.isPublicProfile,
      accountStatus: form.accountStatus,
      artistVerificationStatus: form.artistVerificationStatus,
      artistVerificationNote: form.artistVerificationNote,
    };

    const result = await adminUpdateUserAccount(user.id, editing.id, patch);
    if (!result.ok) {
      setNotice({ type: "error", message: t(result.messageKey) });
      return;
    }

    if (pwd) {
      const pr = await adminSetUserPassword(user.id, editing.id, pwd);
      if (!pr.ok) {
        setNotice({ type: "error", message: t(pr.messageKey) });
        return;
      }
      setNotice({
        type: "success",
        message: t("authMessages.adminSaveSuccessCombined"),
      });
    } else {
      setNotice({ type: "success", message: t(result.messageKey) });
    }

    refreshUser();
    setVersion((v) => v + 1);
    closeEdit();
  }

  async function handleDelete(target: UserAccount) {
    if (!user) return;
    const confirmed = window.confirm(
      t("dashboard.adminAccounts.deleteConfirm").replace("{name}", target.username),
    );
    if (!confirmed) return;
    const result = await adminDeleteUser(user.id, target.id);
    setNotice({ type: result.ok ? "success" : "error", message: t(result.messageKey) });
    if (result.ok) {
      refreshUser();
      setVersion((v) => v + 1);
      if (editing?.id === target.id) closeEdit();
    }
  }

  return (
    <AdminClientGate>
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px]">
        <AdminAuthDebugPanel />
      </div>
      <AdminConsoleShell>
        {notice ? (
          <div className="mb-6">
            <Notice type={notice.type} message={notice.message} />
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
            {t("dashboard.adminAccounts.environmentBadge")}
          </span>
        </div>

        {analytics ? (
          <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ["totalUsers", analytics.totalUsers],
                ["totalArtists", analytics.totalArtists],
                ["totalBookings", analytics.totalBookings],
                ["pendingVerifications", analytics.pendingVerifications],
                ["activeUsers30d", analytics.activeUsers30d],
              ] as const
            ).map(([key, val]) => (
              <div
                key={key}
                className="rounded-xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/80 p-4 shadow-sm ring-1 ring-rose-100/60"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-900/70">
                  {t(`dashboard.adminAnalytics.${key}`)}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{val}</p>
              </div>
            ))}
          </section>
        ) : null}

        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            {t("dashboard.adminAccounts.sectionOperations")}
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: t("dashboard.adminAccounts.opDirectoryTitle"),
                body: t("dashboard.adminAccounts.opDirectoryBody"),
              },
              {
                title: t("dashboard.adminAccounts.opRolesTitle"),
                body: t("dashboard.adminAccounts.opRolesBody"),
              },
              {
                title: t("dashboard.adminAccounts.opPasswordTitle"),
                body: t("dashboard.adminAccounts.opPasswordBody"),
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-black/[0.02]"
              >
                <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {t("dashboard.adminAccounts.statsTotalLabel")}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{stats.total}</p>
          </div>
          {stats.byRole.map(({ role, count }) => (
            <div key={role} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {t("dashboard.adminAccounts.statsByRoleLabel")}
              </p>
              <p className="mt-1 truncate text-xs font-medium text-slate-800">{getRoleLabel(language, role)}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{count}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">{t("dashboard.adminAccounts.sectionDirectoryTitle")}</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colInternalId")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colUsername")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colDisplayName")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colRole")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colPhone")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colEmail")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colAuthEmail")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colEmailVerified")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colLastLogin")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colAccountStatus")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colArtistVerification")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colPublic")}</th>
                    <th className="px-3 py-2.5">{t("dashboard.adminAccounts.colJoined")}</th>
                    <th className="px-3 py-2.5 text-right">{t("dashboard.adminAccounts.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-700" title={u.id}>
                        {shortId(u.id)}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-950">{u.username}</td>
                      <td className="max-w-[120px] px-3 py-2.5 text-slate-700">
                        <span className="line-clamp-2">{u.displayName?.trim() || "—"}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-slate-800">{getRoleLabel(language, u.role)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-800">{u.phoneNumber}</td>
                      <td className="max-w-[140px] px-3 py-2.5 text-slate-700">
                        <span className="line-clamp-2 break-all">{u.email?.trim() || "—"}</span>
                      </td>
                      <td className="max-w-[140px] px-3 py-2.5 text-slate-700">
                        <span className="line-clamp-2 break-all">{u.authLoginEmail?.trim() || "—"}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-700">
                        {u.emailVerifiedAt
                          ? t("dashboard.adminAccounts.statusEmailVerified")
                          : t("dashboard.adminAccounts.statusEmailUnverified")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-600">
                        {formatJoined(u.lastLoginAt, locale)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-800">
                        {u.accountStatus === "suspended"
                          ? t("dashboard.adminAccounts.statusSuspended")
                          : t("dashboard.adminAccounts.statusActive")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-800">
                        {verificationLabel(t, u.artistVerificationStatus)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">
                        {u.isPublicProfile ? t("dashboard.adminAccounts.yes") : t("dashboard.adminAccounts.no")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-600">
                        {formatJoined(u.createdAt, locale)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-right">
                        <div className="flex justify-end gap-2">
                          <AppButton size="sm" variant="secondary" type="button" onClick={() => openEdit(u)}>
                            {t("dashboard.adminAccounts.manageAccount")}
                          </AppButton>
                          <AppButton
                            size="sm"
                            variant="secondary"
                            type="button"
                            className="border-rose-200 text-rose-900 hover:bg-rose-50"
                            onClick={() => handleDelete(u)}
                          >
                            {t("dashboard.adminAccounts.suspendAccess")}
                          </AppButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {editing ? (
          <div className="mt-8 rounded-xl border border-slate-300 bg-white p-5 shadow-md sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("dashboard.adminAccounts.editTitle")}
                </p>
                <p className="mt-1 font-mono text-sm text-slate-900">
                  {editing.username}{" "}
                  <span className="text-slate-400">·</span>{" "}
                  <span className="text-xs text-slate-600" title={editing.id}>
                    {editing.id}
                  </span>
                </p>
              </div>
              <AppButton type="button" variant="secondary" size="sm" onClick={closeEdit}>
                {t("dashboard.adminAccounts.cancel")}
              </AppButton>
            </div>

            <form className="mt-6 space-y-8" onSubmit={handleSave}>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{t("dashboard.adminAccounts.sectionIdentity")}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <AppInput
                    label={t("dashboard.adminAccounts.colUsername")}
                    value={form.username}
                    onChange={(value) => setForm((f) => ({ ...f, username: value }))}
                  />
                  <AppInput
                    label={t("dashboard.adminAccounts.colDisplayName")}
                    value={form.displayName}
                    onChange={(value) => setForm((f) => ({ ...f, displayName: value }))}
                  />
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="admin-role">
                      {t("dashboard.adminAccounts.colRole")}
                    </label>
                    <select
                      id="admin-role"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {getRoleLabel(language, r)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <AppInput
                    label={t("dashboard.adminAccounts.colPhone")}
                    value={form.phoneNumber}
                    onChange={(value) => setForm((f) => ({ ...f, phoneNumber: value }))}
                  />
                  <AppInput
                    label={t("dashboard.adminAccounts.colEmail")}
                    type="email"
                    value={form.email}
                    onChange={(value) => setForm((f) => ({ ...f, email: value }))}
                  />
                  <label className="flex items-center gap-2 sm:col-span-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      checked={form.isPublicProfile}
                      onChange={(e) => setForm((f) => ({ ...f, isPublicProfile: e.target.checked }))}
                    />
                    <span className="text-sm text-slate-800">{t("dashboard.adminAccounts.publicProfile")}</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-900">{t("dashboard.adminAccounts.sectionAccess")}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="admin-account-status">
                      {t("dashboard.adminAccounts.accountStatusLabel")}
                    </label>
                    <select
                      id="admin-account-status"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      value={form.accountStatus}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          accountStatus: e.target.value as NonNullable<UserAccount["accountStatus"]>,
                        }))
                      }
                    >
                      <option value="active">{t("dashboard.adminAccounts.statusActive")}</option>
                      <option value="suspended">{t("dashboard.adminAccounts.statusSuspended")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="admin-artist-vfy">
                      {t("dashboard.adminAccounts.artistVerificationLabel")}
                    </label>
                    <select
                      id="admin-artist-vfy"
                      disabled={form.role !== "makeup_artist"}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                      value={form.artistVerificationStatus}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          artistVerificationStatus: e.target.value as NonNullable<
                            UserAccount["artistVerificationStatus"]
                          >,
                        }))
                      }
                    >
                      <option value="none">{t("dashboard.adminAccounts.vfyNone")}</option>
                      <option value="pending">{t("dashboard.adminAccounts.vfyPending")}</option>
                      <option value="verified">{t("dashboard.adminAccounts.vfyVerified")}</option>
                      <option value="rejected">{t("dashboard.adminAccounts.vfyRejected")}</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="admin-artist-note">
                      {t("dashboard.adminAccounts.artistVerificationNoteLabel")}
                    </label>
                    <textarea
                      id="admin-artist-note"
                      rows={3}
                      disabled={form.role !== "makeup_artist"}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                      value={form.artistVerificationNote}
                      onChange={(e) => setForm((f) => ({ ...f, artistVerificationNote: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-900">{t("dashboard.adminAccounts.sectionSecurity")}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{t("dashboard.adminAccounts.securityHint")}</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <AppInput
                    label={t("dashboard.adminAccounts.newPasswordLabel")}
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                  />
                  <AppInput
                    label={t("dashboard.adminAccounts.confirmPasswordLabel")}
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-6">
                <AppButton type="submit">{t("dashboard.adminAccounts.saveAll")}</AppButton>
                <AppButton type="button" variant="secondary" onClick={closeEdit}>
                  {t("dashboard.adminAccounts.cancel")}
                </AppButton>
              </div>
            </form>
          </div>
        ) : null}

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-slate-500">{t("dashboard.adminAccounts.auditFootnote")}</p>
      </AdminConsoleShell>
    </div>
    </AdminClientGate>
  );
}
