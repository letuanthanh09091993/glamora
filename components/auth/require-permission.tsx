"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ROLE_META } from "@/lib/role-meta";
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

  useEffect(() => {
    if (!isReady || !user) return;
    if (!hasPermission(user.role, permission)) {
      router.replace(ROLE_META[user.role].dashboardPath);
    }
  }, [isReady, permission, router, user]);

  if (!user || !hasPermission(user.role, permission)) return null;

  return <>{children}</>;
}
