"use client";

import { ReactNode, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { UserRole } from "@/lib/auth-types";
import { isActiveAdminUser, dashboardPathForRole } from "@/lib/auth/app-user";
import { isAdminDashboardPath } from "@/lib/auth/rbac";

export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { user, isReady, hasAuthSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const redirectingRef = useRef(false);

  const loading = !isReady || (hasAuthSession && !user);
  const skipOnAdminRoute = role === "admin" && isAdminDashboardPath(pathname);

  const allowed =
    !loading &&
    Boolean(user) &&
    user!.role === role &&
    (role !== "admin" || isActiveAdminUser(user));

  useEffect(() => {
    if (skipOnAdminRoute) return;
    if (loading || !user || redirectingRef.current) return;

    if (user.role !== role) {
      redirectingRef.current = true;
      router.replace(dashboardPathForRole(user.role));
      return;
    }

    if (role === "admin" && !isActiveAdminUser(user)) {
      redirectingRef.current = true;
      router.replace(dashboardPathForRole(user.role));
    }
  }, [loading, pathname, role, router, skipOnAdminRoute, user]);

  useEffect(() => {
    redirectingRef.current = false;
  }, [role, user?.id]);

  if (skipOnAdminRoute) {
    return <>{children}</>;
  }

  if (loading || !allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        {t("gate.loadingSession")}
      </div>
    );
  }

  return <>{children}</>;
}
