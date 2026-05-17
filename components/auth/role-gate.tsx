"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ROLE_META } from "@/lib/role-meta";
import { useLanguage } from "@/components/providers/language-provider";
import { isActiveAdminUser, dashboardPathForRole } from "@/lib/auth/app-user";
import {
  allowsSessionWithoutVerifiedEmail,
  allowsUnverifiedEmailForDashboard,
  AuthRoutes,
  isAdminDashboardPath,
} from "@/lib/auth/rbac";

function GateLoading({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-sm text-gray-500">
      <p>{message}</p>
    </div>
  );
}

export function RoleGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady, isEmailVerified } = useAuth();
  const { t } = useLanguage();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (!isReady || redirectingRef.current) return;

    if (!user) {
      redirectingRef.current = true;
      if (isAdminDashboardPath(pathname)) {
        console.log("[glamora-admin-auth-client]", {
          step: "redirect",
          pathname,
          reason: "not_logged_in",
        });
      }
      router.replace(`${AuthRoutes.login}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user.accountStatus === "suspended" && !pathname.startsWith(AuthRoutes.accountSuspended)) {
      redirectingRef.current = true;
      router.replace(AuthRoutes.accountSuspended);
      return;
    }

    const activeAdmin = isActiveAdminUser(user);

    if (isAdminDashboardPath(pathname) && !activeAdmin) {
      redirectingRef.current = true;
      const dest = dashboardPathForRole(user.role);
      console.log("[glamora-admin-auth-client]", {
        step: "redirect",
        pathname,
        reason: user.role !== "admin" ? "not_admin" : "inactive_account",
        fetchedDbRole: user.role,
        fetchedAccountStatus: user.accountStatus,
        redirectTo: dest,
      });
      router.replace(dest);
      return;
    }

    const needsEmailForThisShell =
      (pathname.startsWith("/dashboard") || pathname.startsWith("/account")) &&
      !allowsSessionWithoutVerifiedEmail(pathname) &&
      !allowsUnverifiedEmailForDashboard(pathname, activeAdmin);

    if (!isEmailVerified && needsEmailForThisShell) {
      redirectingRef.current = true;
      router.replace(AuthRoutes.verifyEmail);
      return;
    }

    if (pathname === "/dashboard") {
      redirectingRef.current = true;
      const dest = ROLE_META[user.role].dashboardPath;
      if (dest !== pathname) {
        router.replace(dest);
      }
    }
  }, [isEmailVerified, isReady, pathname, router, user]);

  useEffect(() => {
    redirectingRef.current = false;
  }, [pathname, user?.id]);

  if (!isReady) {
    return <GateLoading message={t("gate.loadingSession")} />;
  }

  if (!user) {
    return <GateLoading message={t("gate.loadingSession")} />;
  }

  if (isAdminDashboardPath(pathname) && !isActiveAdminUser(user)) {
    return <GateLoading message={t("gate.loadingSession")} />;
  }

  const activeAdmin = isActiveAdminUser(user);
  const needsEmailForThisShell =
    (pathname.startsWith("/dashboard") || pathname.startsWith("/account")) &&
    !allowsSessionWithoutVerifiedEmail(pathname) &&
    !allowsUnverifiedEmailForDashboard(pathname, activeAdmin);

  if (!isEmailVerified && needsEmailForThisShell) {
    return <GateLoading message={t("gate.loadingSession")} />;
  }

  return <>{children}</>;
}
