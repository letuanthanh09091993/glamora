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
  const { user, isReady, hasAuthSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const redirectingRef = useRef(false);

  const loading = !isReady || (hasAuthSession && !user);
  const onAdminRoute = isAdminDashboardPath(pathname);
  const skipAdminEnforcement = permission === "canAccessAdmin" && onAdminRoute;

  const allowed =
    !loading &&
    Boolean(user) &&
    hasPermission(user!.role, permission) &&
    (permission !== "canAccessAdmin" || isActiveAdminUser(user));

  useEffect(() => {
    if (skipAdminEnforcement) return;
    if (loading || redirectingRef.current) return;
    if (!user) return;

    if (!hasPermission(user.role, permission)) {
      redirectingRef.current = true;
      router.replace(dashboardPathForRole(user.role));
      return;
    }

    if (permission === "canAccessAdmin" && !isActiveAdminUser(user)) {
      redirectingRef.current = true;
      router.replace(dashboardPathForRole(user.role));
    }
  }, [loading, permission, router, skipAdminEnforcement, user]);

  useEffect(() => {
    redirectingRef.current = false;
  }, [permission, user?.id]);

  if (skipAdminEnforcement) {
    return <>{children}</>;
  }

  if (loading) {
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
