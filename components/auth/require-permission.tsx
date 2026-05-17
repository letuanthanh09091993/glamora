"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { isActiveAdminUser, dashboardPathForRole } from "@/lib/auth/app-user";
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
      router.replace(dashboardPathForRole(user.role));
      return;
    }
    if (permission === "canAccessAdmin" && !isActiveAdminUser(user)) {
      redirectingRef.current = true;
      router.replace(dashboardPathForRole(user.role));
    }
  }, [isReady, permission, router, user]);

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
