"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ADMIN_DENIAL_LABELS,
  getAdminAccessDenialReason,
  type AdminAccessDenialReason,
} from "@/lib/auth/admin-access-debug";
import { isActiveAdminUser } from "@/lib/auth/app-user";
import type { UserAccount } from "@/lib/auth-types";
import { fetchAppUserPrincipalById } from "@/lib/supabase/users-repository";
import { getBrowserSupabase } from "@/lib/supabase/browser-client";

type DebugRow = {
  authUserId: string | null;
  dbRole: string | null;
  dbAccountStatus: string | null;
  dbFetchError: string | null;
  emailConfirmedAt: string | null;
};

export function AdminAuthDebugPanel() {
  const { user, isReady, isEmailVerified } = useAuth();
  const [row, setRow] = useState<DebugRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const sb = getBrowserSupabase();
        await sb.auth.initialize();
        const {
          data: { user: authUser },
          error: authError,
        } = await sb.auth.getUser();

        if (cancelled) return;

        if (authError || !authUser) {
          setRow({
            authUserId: null,
            dbRole: null,
            dbAccountStatus: null,
            dbFetchError: authError?.message ?? "No auth user",
            emailConfirmedAt: null,
          });
          return;
        }

        const principal = await fetchAppUserPrincipalById(sb, authUser.id);
        if (cancelled) return;

        setRow({
          authUserId: authUser.id,
          dbRole: principal?.role ?? null,
          dbAccountStatus: principal?.accountStatus ?? null,
          dbFetchError: principal ? null : "fetchAppUserPrincipalById returned null",
          emailConfirmedAt: authUser.email_confirmed_at ?? null,
        });
      } catch (e) {
        if (!cancelled) {
          setRow({
            authUserId: null,
            dbRole: null,
            dbAccountStatus: null,
            dbFetchError: e instanceof Error ? e.message : "Debug fetch failed",
            emailConfirmedAt: null,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id, isReady]);

  const denialReason: AdminAccessDenialReason = useMemo(
    () =>
      getAdminAccessDenialReason({
        isReady,
        authUserId: row?.authUserId ?? null,
        dbRole: row?.dbRole ?? null,
        dbAccountStatus: row?.dbAccountStatus ?? null,
        isEmailVerified,
        clientUser: user,
      }),
    [isEmailVerified, isReady, row, user],
  );

  const denied = denialReason !== "allowed";
  const activeAdmin = isActiveAdminUser(
    row?.dbRole
      ? { role: row.dbRole as UserAccount["role"], accountStatus: (row.dbAccountStatus as UserAccount["accountStatus"]) ?? "active" }
      : user,
  );

  return (
    <section
      className={`mb-6 rounded-xl border p-4 font-mono text-xs shadow-sm ${
        denied
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-emerald-300 bg-emerald-50 text-emerald-950"
      }`}
      aria-label="Admin authorization debug"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide">Admin auth debug</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
            denied ? "bg-amber-200 text-amber-900" : "bg-emerald-200 text-emerald-900"
          }`}
        >
          {loading ? "Loading…" : denied ? "Denied" : "Allowed"}
        </span>
      </div>

      <dl className="grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] uppercase text-black/50">Auth user id</dt>
          <dd className="mt-0.5 break-all font-semibold">{row?.authUserId ?? (loading ? "…" : "—")}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-black/50">DB role (public.users)</dt>
          <dd className="mt-0.5 font-semibold">{row?.dbRole ?? (loading ? "…" : "—")}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-black/50">DB account_status</dt>
          <dd className="mt-0.5 font-semibold">{row?.dbAccountStatus ?? (loading ? "…" : "—")}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-black/50">Client user.role</dt>
          <dd className="mt-0.5 font-semibold">{user?.role ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-black/50">Client account_status</dt>
          <dd className="mt-0.5 font-semibold">{user?.accountStatus ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-black/50">isActiveAdminUser</dt>
          <dd className="mt-0.5 font-semibold">{loading ? "…" : activeAdmin ? "true" : "false"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-black/50">Email verified</dt>
          <dd className="mt-0.5 font-semibold">{isEmailVerified ? "true" : "false"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-black/50">Auth provider ready</dt>
          <dd className="mt-0.5 font-semibold">{isReady ? "true" : "false"}</dd>
        </div>
      </dl>

      {row?.dbFetchError ? (
        <p className="mt-3 rounded-lg bg-black/5 px-3 py-2 text-[11px]">
          <span className="font-semibold">DB fetch: </span>
          {row.dbFetchError}
        </p>
      ) : null}

      <p className="mt-3 rounded-lg bg-black/5 px-3 py-2 text-[11px] leading-relaxed">
        <span className="font-semibold">Redirect reason if denied: </span>
        {loading ? "…" : ADMIN_DENIAL_LABELS[denialReason]}
        {denied ? (
          <span className="mt-1 block text-[10px] text-black/60">code: {denialReason}</span>
        ) : null}
      </p>
    </section>
  );
}
