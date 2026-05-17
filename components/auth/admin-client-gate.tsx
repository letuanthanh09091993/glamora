"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { isActiveAdminUser, dashboardPathForRole } from "@/lib/auth/app-user";
import { AuthRoutes } from "@/lib/auth/rbac";
import { useLanguage } from "@/components/providers/language-provider";

export function AdminClientGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { user, isReady, hasAuthSession, refreshUser } = useAuth();
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const redirectingRef = useRef(false);

  const loading = !isReady || (hasAuthSession && !user);
  const role = user?.role ?? null;
  const accountStatus = user?.accountStatus ?? null;
  const isAdmin = isActiveAdminUser(user);

  useEffect(() => {
    console.log("[ADMIN CLIENT]", {
      loading,
      user: user ? { id: user.id, username: user.username } : null,
      role,
      accountStatus,
      pathname,
      isReady,
      hasAuthSession,
      isAdmin,
      bootstrapAttempt,
    });
  }, [
    accountStatus,
    bootstrapAttempt,
    hasAuthSession,
    isAdmin,
    isReady,
    loading,
    pathname,
    role,
    user,
  ]);

  useEffect(() => {
    if (!isReady || redirectingRef.current) return;

    if (!hasAuthSession) {
      redirectingRef.current = true;
      console.log("[ADMIN CLIENT REDIRECT]", { reason: "not_logged_in", pathname });
      router.replace(`${AuthRoutes.login}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!user) return;

    if (!isAdmin) {
      redirectingRef.current = true;
      const dest = dashboardPathForRole(user.role);
      console.log("[ADMIN CLIENT REDIRECT]", {
        reason: role !== "admin" ? "not_admin" : "inactive_account",
        role,
        accountStatus,
        redirectTo: dest,
        pathname,
      });
      router.replace(dest);
    }
  }, [accountStatus, hasAuthSession, isAdmin, isReady, pathname, role, router, user]);

  useEffect(() => {
    redirectingRef.current = false;
  }, [pathname, user?.id, user?.role, user?.accountStatus]);

  useEffect(() => {
    if (!isReady || !hasAuthSession || user || bootstrapAttempt >= 3) return;

    const timer = window.setTimeout(() => {
      setBootstrapAttempt((n) => n + 1);
      void refreshUser();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [bootstrapAttempt, hasAuthSession, isReady, refreshUser, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-100 p-6 text-sm text-slate-600">
        <p>{t("gate.loadingSession")}</p>
        <p className="font-mono text-xs text-slate-400">[ADMIN CLIENT] loading profile…</p>
      </div>
    );
  }

  if (!hasAuthSession || !user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-100 p-6 text-sm text-slate-600">
        <p>{t("gate.loadingSession")}</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="sticky top-0 z-50 border-b-2 border-emerald-500 bg-emerald-600 px-4 py-2 text-center text-sm font-bold tracking-wide text-white"
        role="status"
      >
        ADMIN ACCESS OK
      </div>
      {children}
    </>
  );
}
