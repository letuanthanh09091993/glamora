"use client";

import { ReactNode, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { UserRole } from "@/lib/auth-types";
import { isActiveAdminUser, dashboardPathForRole } from "@/lib/auth/app-user";

export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { user, isReady } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const redirectingRef = useRef(false);

  const allowed =
    Boolean(user) &&
    user!.role === role &&
    (role !== "admin" || isActiveAdminUser(user));

  useEffect(() => {
    if (!isReady || !user || redirectingRef.current) return;
    if (user.role !== role) {
      redirectingRef.current = true;
      router.replace(dashboardPathForRole(user.role));
      return;
    }
    if (role === "admin" && !isActiveAdminUser(user)) {
      redirectingRef.current = true;
      router.replace(dashboardPathForRole(user.role));
    }
  }, [isReady, role, router, user]);

  useEffect(() => {
    redirectingRef.current = false;
  }, [role, user?.id]);

  if (!isReady || !user || !allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        {t("gate.loadingSession")}
      </div>
    );
  }

  return <>{children}</>;
}
