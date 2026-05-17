"use client";

import { ReactNode, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { isActiveAdminUser, dashboardPathForRole } from "@/lib/auth/app-user";
import { isAdminDashboardPath } from "@/lib/auth/rbac";
import type { Permission } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";

export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const redirectingRef = useRef(false);

  const allowed =
    Boolean(user) &&
    hasPermission(user!.role, permission) &&
    (permission !== "canAccessAdmin" || isActiveAdminUser(user));

  useEffect(() => {
    if (!isReady || !user || redirectingRef.current) return;

    if (!hasPermission(user.role, permission)) {
      redirectingRef.current = true;
      const dest = dashboardPathForRole(user.role);
      if (permission === "canAccessAdmin" && isAdminDashboardPath(pathname)) {
        console.log("[glamora-admin-auth-client]", {
          step: "redirect",
          pathname,
          reason: "insufficient_permission",
          fetchedDbRole: user.role,
          redirectTo: dest,
        });
      }
      router.replace(dest);
      return;
    }

    if (permission === "canAccessAdmin" && !isActiveAdminUser(user)) {
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
    }
  }, [isReady, pathname, permission, router, user]);

  useEffect(() => {
    redirectingRef.current = false;
  }, [permission, user?.id]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        {t("gate.loadingSession")}
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        {t("gate.loadingSession")}
      </div>
    );
  }

  return <>{children}</>;
}
