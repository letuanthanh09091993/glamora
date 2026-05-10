"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { UserRole } from "@/lib/auth-types";
import { ROLE_META } from "@/lib/role-meta";

export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady || !user) return;
    if (user.role !== role) {
      router.replace(ROLE_META[user.role].dashboardPath);
    }
  }, [isReady, role, router, user]);

  if (!user || user.role !== role) return null;

  return <>{children}</>;
}
